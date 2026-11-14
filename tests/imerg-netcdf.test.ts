import { expect, it } from 'vitest';
import { readImerg } from '../scripts/read-imerg';

it('extracts the actual downloaded NetCDF cell, preserves physical zero and validates full-day counts', async () => {
  const result = await readImerg('public/evidence/stage1/raw/imerg-20240101.nc4', '2024-01-01');
  expect(result.sha256).toBe('f305cb218e5cdccf45b3cc0c8b1d1c34e1a957c82ff565959d2b1cd599be372f');
  expect(result.observation.measurement).toMatchObject({ status: 'valid', quantity: { value: 0, unit: 'mm/day' } });
  expect(result.observation.validHalfHourlySamples).toBe(48);
  expect(result.spatialSupport.selected).toEqual({ latitude: 44.55, longitude: 27.350000381469727 });
  expect(result.temporalSupport.rawEndMarkerUTC).toBe('2024-01-01T23:59:59.000Z');
  expect(result.observation.timeEndUTC).toBe('2024-01-02T00:00:00.000Z');
  expect(result.eligibleForCropComparison).toBe(false);
});

it('independent authenticated repeat has the same actual observation, count and grid', async () => {
  const original = await readImerg('public/evidence/stage1/raw/imerg-20240101.nc4', '2024-01-01');
  const repeat = await readImerg('public/evidence/stage1/raw/imerg-20240101-repeat.nc4', '2024-01-01');
  expect(repeat.observation.measurement).toEqual(original.observation.measurement);
  expect(repeat.observation.validHalfHourlySamples).toBe(original.observation.validHalfHourlySamples);
  expect(repeat.spatialSupport).toEqual(original.spatialSupport);
});

it('rejects mismatched requested day and a non-NetCDF response', async () => {
  await expect(readImerg('public/evidence/stage1/raw/imerg-20240101.nc4', '2024-01-02')).rejects.toThrow('day');
  await expect(readImerg('public/evidence/stage1/raw/power.json', '2024-01-01')).rejects.toThrow('NetCDF4');
});
