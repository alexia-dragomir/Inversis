import { describe, expect, it } from 'vitest';
import { validateImergCell } from '../src/data/ingestion/imerg';

// Explicitly SYNTHETIC parser/QC fixtures. These are not NASA observations.
const synthetic = {
  collection: 'GPM_3IMERGDF', version: '07', variable: 'precipitation', countVariable: 'precipitation_cnt',
  unit: 'mm/day', timeStandard: 'UTC', day: '2024-01-01',
  timeStartUTC: '2024-01-01T00:00:00.000Z', timeEndUTC: '2024-01-02T00:00:00.000Z',
  latitude: 44.55, longitude: 27.35, validHalfHourlySamples: 48, fillValue: -9999.900390625,
  value: 0, provenanceId: 'synthetic-test-only',
};
describe('IMERG daily cell contract (synthetic tests only)', () => {
  it('preserves true zero as valid daily precipitation rate', () => {
    expect(validateImergCell(synthetic).measurement).toMatchObject({ status: 'valid', quantity: { value: 0, unit: 'mm/day' } });
  });
  it.each([0, 1, 47])('withholds incomplete daily support: %s', count => {
    expect(validateImergCell({ ...synthetic, validHalfHourlySamples: count }).measurement.status).toBe(count === 0 ? 'missing' : 'unverified');
  });
  it.each([null, -9999.900390625])('retains missing precipitation without replacing it with zero: %s', value => {
    const output = validateImergCell({ ...synthetic, value });
    expect(output.rawValue).toBe(value);
    expect(output.measurement.status).toBe('missing');
    expect(output.measurement).not.toHaveProperty('quantity');
  });
  it.each([
    { collection: 'GPM_3IMERGDE' }, { version: '06' }, { variable: 'MWprecipitation' },
    { unit: 'mm/hr' }, { timeStandard: 'LST' }, { value: -2 }, { value: NaN },
    { validHalfHourlySamples: 49 }, { validHalfHourlySamples: 47.5 },
    { latitude: 45 }, { timeEndUTC: '2024-01-01T23:59:59.999Z' }, { day: '2024-02-30' },
  ])('refuses incorrect metadata or invalid data: %o', change => {
    expect(() => validateImergCell({ ...synthetic, ...change })).toThrow();
  });
});
