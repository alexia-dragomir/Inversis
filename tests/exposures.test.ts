import { expect, it } from 'vitest';
import type { Crop, Observation } from '../src/domain/contracts';
import { candidates } from '../src/data/foundation';
import { commonScenarios, cropExposure, windowDates } from '../src/engine/exposures';

/** Explicit synthetic fixtures for independent arithmetic checks; never NASA evidence. */
function series(crop: Crop, year: number, unit: 'mm/day' | 'degC', values: readonly number[]): Observation[] {
  return windowDates(crop, year).map((day, i) => ({
    id: `synthetic-${unit}-${day}`, provenanceId: 'synthetic-unit-test-only',
    timeStartUTC: `${day}T00:00:00.000Z`, timeEndUTC: new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString(),
    rawValue: values[i] ?? 2,
    measurement: { status: 'valid', quantity: { value: values[i] ?? 2, unit }, flags: unit === 'mm/day' ? ['full-48-sample-support'] : [] },
  }));
}

it('uses declared inclusive crop windows and separate phenology shifts', () => {
  expect(windowDates('wheat', 2024)).toHaveLength(61);
  expect(windowDates('maize', 2024)).toHaveLength(62);
  expect(windowDates('sunflower', 2024)).toHaveLength(52);
  expect(windowDates('soybean', 2024)).toHaveLength(78);
  expect(windowDates('wheat', 2024, -14)[0]).toBe('2024-04-17');
  expect(windowDates('maize', 2024, 14).at(-1)).toBe('2024-09-14');
  expect(() => windowDates('wheat', 2024, 1)).toThrow();
});

it('independent dry-run oracle: strictly below 1, zero valid, runs 2 then 3 => 3 days', () => {
  const e = cropExposure('baseline', 'wheat', 2024, 'dry-spell', series('wheat', 2024, 'mm/day', [0, 0.9, 1, 0, 0, 0, 2]));
  expect(e.physical).toMatchObject({ status: 'valid', quantity: { value: 3, unit: 'days' } });
  expect(e.coverage).toMatchObject({ expectedDays: 61, validDays: 61, missingDays: 0 });
  expect(e.sourceRefs).toEqual(['synthetic-unit-test-only']);
});

it('independent heat oracle: 35 and 36 count; 34.9 does not, so 2/61', () => {
  const e = cropExposure('baseline', 'wheat', 2024, 'heat-fraction', series('wheat', 2024, 'degC', [35, 36, 34.9]));
  expect(e.physical).toMatchObject({ status: 'valid', quantity: { value: 2 / 61, unit: 'fraction' } });
});

it.each(['missing', 'invalid', 'unverified'] as const)('refuses the entire window when a day is %s', status => {
  const data = series('wheat', 2024, 'mm/day', [0, 0, 0]);
  data[1] = { ...data[1]!, measurement: { status, reason: 'synthetic gap' } };
  const e = cropExposure('baseline', 'wheat', 2024, 'dry-spell', data);
  expect(e.physical.status).toBe('missing');
  expect(e.physical).not.toHaveProperty('quantity');
  expect(e.coverage).toMatchObject({ validDays: 60, missingDays: 1, longestGapDays: 1 });
});

it('counts absent consecutive days without fabricating observation lineage', () => {
  const e = cropExposure('baseline', 'wheat', 2024, 'heat-fraction', []);
  expect(e.coverage).toMatchObject({ validDays: 0, missingDays: 61, longestGapDays: 61 });
  expect(e.contributingObservationIds).toEqual([]);
  expect(e.sourceRefs).toEqual([]);
});

it('rejects duplicate days, wrong units, invalid physical values and missing count support', () => {
  const data = series('wheat', 2024, 'mm/day', [0]);
  expect(() => cropExposure('x', 'wheat', 2024, 'dry-spell', [...data, data[0]!])).toThrow('Duplicate');
  expect(() => cropExposure('x', 'wheat', 2024, 'heat-fraction', data)).toThrow('unit');
  for (const value of [NaN, -1]) expect(() => cropExposure('x', 'wheat', 2024, 'dry-spell', series('wheat', 2024, 'mm/day', [value]))).toThrow('physical');
  data[0] = { ...data[0]!, measurement: { status: 'valid', quantity: { value: 0, unit: 'mm/day' }, flags: [] } };
  expect(() => cropExposure('x', 'wheat', 2024, 'dry-spell', data)).toThrow('support');
});

it('derives six possible shared windows but excludes all when historical evidence is absent', () => {
  const scenarios = commonScenarios(candidates, 2015, 2024, { 'dry-spell': [], 'heat-fraction': [] });
  expect(scenarios).toHaveLength(6);
  expect(scenarios.every(s => s.validity === 'excluded' && s.exclusionReasons.length === 30)).toBe(true);
  expect(scenarios[0]?.fiveYearEnd).toBe(2019);
  expect(scenarios.at(-1)?.fiveYearStart).toBe(2020);
});

it('keeps fixed crop order and removes a failing scenario for every active candidate', () => {
  const all: Observation[] = [];
  for (let year = 2020; year <= 2024; year++) {
    const unique = new Map<string, Observation>();
    for (const crop of ['wheat', 'maize', 'sunflower', 'soybean'] as const) for (const o of series(crop, year, 'degC', [])) unique.set(o.id, o);
    all.push(...unique.values());
  }
  const ready = commonScenarios(candidates, 2020, 2024, { 'dry-spell': [], 'heat-fraction': all }, ['heat-fraction']);
  expect(ready[0]?.validity).toBe('valid');
  expect(ready[0]?.cropYearExposureByCandidate.a?.map(e => e.crop)).toEqual(['wheat', 'soybean', 'maize', 'sunflower', 'maize']);
  const partial = all.filter(o => !o.timeStartUTC.startsWith('2020-05-01'));
  expect(commonScenarios(candidates, 2020, 2024, { 'dry-spell': [], 'heat-fraction': partial }, ['heat-fraction'])[0]?.validity).toBe('excluded');
  const excludedBaseline = candidates.map(c => c.id === 'baseline' ? { ...c, agronomicScreening: 'EXCLUDED' as const } : c);
  expect(commonScenarios(excludedBaseline, 2020, 2024, { 'dry-spell': [], 'heat-fraction': all }, ['heat-fraction'])[0]?.cropYearExposureByCandidate).not.toHaveProperty('baseline');
});
