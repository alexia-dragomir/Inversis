import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsePower, powerRequest } from '../src/data/ingestion/power';
import { completeDailyCoverage, dayUTC, daysInclusive, parseStrictJson } from '../src/data/ingestion/validation';
import { sha256, verifyCapture } from '../scripts/verify-capture';
import type { Observation } from '../src/domain/contracts';

const raw = readFileSync('public/evidence/stage1/raw/power.json');
const receipt = JSON.parse(readFileSync('public/evidence/stage1/raw/power.receipt.json', 'utf8')) as Record<string, unknown>;
const capture = verifyCapture(raw, receipt, powerRequest.url);
// All mutations below are synthetic adversarial test cases, never published as NASA data.
function fixture() {
  return JSON.parse(raw.toString('utf8')) as {
    geometry: { coordinates: number[] };
    header: { time_standard: string; start: string; end: string; fill_value: number; sources: string[]; api: { name: string; version: string } };
    properties: { parameter: { T2M_MAX: Record<string, unknown> } };
    parameters: { T2M_MAX: { units: string; longname: string } };
    messages: string[];
  };
}

describe('real retained POWER response', () => {
  it('preserves all seven values, including positive January 2, with physical units', () => {
    const sample = parsePower(parseStrictJson(raw.toString('utf8')), capture);
    expect(sample.observations.map(o => o.rawValue)).toEqual([10.16, 8.07, 8.27, 12.41, 14.32, 13.25, 12.43]);
    expect(sample.coverage).toMatchObject({ validDays: 7, expectedDays: 7, missingDays: 0, longestGapDays: 0, status: 'passed' });
    expect(sample.observations[0]?.measurement).toMatchObject({ status: 'valid', quantity: { value: 10.16, unit: 'degC' } });
    expect(sample.observations[6]?.timeEndUTC).toBe('2024-01-08T00:00:00.000Z');
    expect(sample.eligibleForCropComparison).toBe(false);
    expect(sample.provenance.collectionVersion).toBeNull();
    expect(sample.provenance.serviceVersion).toBe('v2.10.3');
    expect(sample.provenance.spatialSupport.selectedCoordinates).toBeNull();
  });
  it('reproduces deterministically and links every observation to its raw hash', () => {
    const a = parsePower(fixture(), capture);
    expect(a).toEqual(parsePower(fixture(), capture));
    expect(a.provenance.sha256).toBe(sha256(raw));
    expect(a.observations.every(o => o.provenanceId === a.provenance.id)).toBe(true);
  });
});

describe('POWER refusal and missingness', () => {
  it.each([-999, null, undefined])('represents %s as missing without interpolation', value => {
    const f = fixture(); f.properties.parameter.T2M_MAX['20240102'] = value;
    const result = parsePower(f, capture);
    expect(result.observations[1]?.measurement.status).toBe('missing');
    expect(result.observations[1]?.measurement).not.toHaveProperty('quantity');
    expect(result.coverage).toMatchObject({ status: 'failed', validDays: 6, missingDays: 1 });
  });
  it('retains zero and negative physical temperatures', () => {
    const f = fixture(); f.properties.parameter.T2M_MAX['20240101'] = 0; f.properties.parameter.T2M_MAX['20240102'] = -8;
    const result = parsePower(f, capture);
    expect(result.coverage.status).toBe('passed');
    expect(result.observations.slice(0, 2).map(o => o.rawValue)).toEqual([0, -8]);
  });
  it.each([NaN, Infinity, '10.16', -300])('refuses invalid physical data %s', value => {
    const f = fixture(); f.properties.parameter.T2M_MAX['20240101'] = value;
    expect(() => parsePower(f, capture)).toThrow();
  });
  it.each(['K', 'F', 'degC', ''])('refuses unexpected raw unit %s', unit => {
    const f = fixture(); f.parameters.T2M_MAX.units = unit;
    expect(() => parsePower(f, capture)).toThrow('units');
  });
  it('refuses local solar time, wrong coordinates, source, date span or server warnings', () => {
    const changes: ((f: ReturnType<typeof fixture>) => void)[] = [
      f => { f.header.time_standard = 'LST'; },
      f => { f.geometry.coordinates[0] = 0; },
      f => { f.header.sources = ['unverified']; },
      f => { f.header.end = '20240106'; },
      f => { f.messages = ['Review required']; },
      f => { f.properties.parameter.T2M_MAX['20240132'] = 1; },
      f => { f.header.api.name = 'Different Service'; },
    ];
    for (const change of changes) { const f = fixture(); change(f); expect(() => parsePower(f, capture)).toThrow(); }
  });
});

describe('calendar and strict JSON boundaries', () => {
  it('handles leap dates and rejects impossible dates, reverse spans and oversized samples', () => {
    expect(daysInclusive('2024-02-28', '2024-03-01')).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
    expect(() => dayUTC('2023-02-29')).toThrow();
    expect(() => dayUTC('2024-13-01')).toThrow();
    expect(() => daysInclusive('2024-01-02', '2024-01-01')).toThrow();
    expect(() => daysInclusive('2024-01-01', '2024-02-01')).toThrow();
  });
  it('rejects duplicate daily keys including escaped-equivalent keys', () => {
    expect(() => parseStrictJson('{"20240101":1,"20240101":2}')).toThrow('Duplicate');
    expect(() => parseStrictJson('{"a":1,"\\u0061":2}')).toThrow('Duplicate');
    expect(parseStrictJson('{"left":{"a":1},"right":{"a":2},"text":"brace } and quote \\""}')).toBeTruthy();
  });
  it('rejects duplicate intervals and non-UTC timestamps; counts consecutive missing days', () => {
    const sample = parsePower(fixture(), capture);
    expect(() => completeDailyCoverage([...sample.observations, sample.observations[0]!], powerRequest.start, powerRequest.end)).toThrow('Duplicate');
    const nonUTC = { ...sample.observations[0]!, timeStartUTC: '2024-01-01T00:00:00+02:00' };
    expect(() => completeDailyCoverage([nonUTC], powerRequest.start, powerRequest.end)).toThrow('UTC');
    const missing: Observation<'degC'>[] = sample.observations.map((o, i) => i < 4 ? { ...o, measurement: { status: 'missing', reason: 'synthetic test gap' } } : o);
    expect(completeDailyCoverage(missing, powerRequest.start, powerRequest.end)).toMatchObject({ status: 'failed', missingDays: 4, longestGapDays: 4 });
  });
});

describe('raw provenance integrity', () => {
  it('rejects byte tampering, mismatched URL, non-200, HTML login and invalid retrieval time', () => {
    expect(() => verifyCapture(Buffer.concat([raw, Buffer.from(' ')]), receipt, powerRequest.url)).toThrow();
    for (const change of [{ sha256: '0'.repeat(64) }, { url: 'https://example.org' }, { status: 401 }, { contentType: 'text/html' }, { retrievedAt: 'not UTC' }]) {
      expect(() => verifyCapture(raw, { ...receipt, ...change }, powerRequest.url)).toThrow();
    }
  });
});
