import type { Observation } from '../../domain/contracts.ts';
import { dayUTC, finite, record, requireCondition, text } from './validation.ts';

/** Validates an extracted cell; this interface is not proof of acquisition by itself. */
export function validateImergCell(input: unknown): Observation<'mm/day'> & { readonly validHalfHourlySamples: number; readonly qualityPolicy: string } {
  const cell = record(input, 'IMERG cell');
  requireCondition(cell.collection === 'GPM_3IMERGDF' && cell.version === '07', 'Expected IMERG Final DAILY V07, no substitution');
  requireCondition(cell.variable === 'precipitation' && cell.countVariable === 'precipitation_cnt', 'Expected combined precipitation and matching count');
  requireCondition(cell.unit === 'mm/day', 'IMERG daily rate must retain mm/day units');
  requireCondition(cell.timeStandard === 'UTC', 'IMERG UTC convention required');
  const day = text(cell.day, 'IMERG day');
  const start = dayUTC(day);
  requireCondition(cell.timeStartUTC === new Date(start).toISOString() && cell.timeEndUTC === new Date(start + 86400000).toISOString(), 'IMERG must span exactly one UTC day (exclusive end)');
  const lat = finite(cell.latitude, 'IMERG latitude');
  const lon = finite(cell.longitude, 'IMERG longitude');
  requireCondition(Math.abs(lat - 44.565) <= 0.050001 && Math.abs(lon - 27.335) <= 0.050001, 'Selected IMERG grid cell does not contain the demonstration point');
  const count = finite(cell.validHalfHourlySamples, 'IMERG count');
  requireCondition(Number.isInteger(count) && count >= 0 && count <= 48, 'Invalid IMERG half-hourly count');
  const fill = finite(cell.fillValue, 'IMERG fill');
  requireCondition(fill < 0, 'IMERG fill must be explicitly negative');
  const value = cell.value === null ? null : finite(cell.value, 'IMERG precipitation');
  const missing = value === null || value === fill;
  if (!missing) requireCondition(value >= 0, 'Negative non-fill precipitation');
  return {
    id: `IMERG.precipitation.UTC.${day}`,
    provenanceId: text(cell.provenanceId, 'IMERG provenance reference'),
    timeStartUTC: new Date(start).toISOString(), timeEndUTC: new Date(start + 86400000).toISOString(),
    rawValue: value,
    validHalfHourlySamples: count,
    qualityPolicy: 'inversis-full-day-support-v1: require 48 valid half-hours; author QC convention, not a NASA validity rule',
    measurement: missing || count === 0
      ? { status: 'missing', reason: 'Declared fill/null or zero valid half-hourly samples' }
      : count < 48
        ? { status: 'unverified', reason: 'Partial daily support; rate retained raw but not admitted for complete-day exposure' }
        : { status: 'valid', quantity: { value, unit: 'mm/day' }, flags: ['full-48-sample-support', 'daily-mean-rate-not-automatically-accumulation'] },
  };
}
