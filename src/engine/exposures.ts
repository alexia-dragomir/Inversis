import type { Candidate, Crop, CropSensitiveWindow, CropYearExposure, Observation, Scenario } from '../domain/contracts';
import { dayUTC, requireCondition, utcTimestamp } from '../data/ingestion/validation.ts';

export type ValidatedIndicator = 'dry-spell' | 'heat-fraction';
/** Provisional illustrative windows from the handoff, not calibrated phenology. */
export const cropWindows: readonly CropSensitiveWindow[] = [
  { crop: 'wheat', startMonthDay: '05-01', endMonthDay: '06-30', assumptionId: 'provisional-wheat-window' },
  { crop: 'maize', startMonthDay: '07-01', endMonthDay: '08-31', assumptionId: 'provisional-maize-window' },
  { crop: 'sunflower', startMonthDay: '06-20', endMonthDay: '08-10', assumptionId: 'provisional-sunflower-window' },
  { crop: 'soybean', startMonthDay: '06-15', endMonthDay: '08-31', assumptionId: 'provisional-soybean-window' },
];
const DAY = 86400000;

export function windowDates(crop: Crop, year: number, shiftDays = 0) {
  requireCondition(Number.isInteger(year) && year >= 1900 && year <= 2100, 'Invalid crop year');
  requireCondition([0, -7, 7, -14, 14].includes(shiftDays), 'Unsupported phenology shift');
  const window = cropWindows.find(w => w.crop === crop);
  requireCondition(window, 'Unknown crop');
  const start = dayUTC(`${year}-${window.startMonthDay}`) + shiftDays * DAY;
  const end = dayUTC(`${year}-${window.endMonthDay}`) + shiftDays * DAY;
  return Array.from({ length: (end - start) / DAY + 1 }, (_, i) => new Date(start + i * DAY).toISOString().slice(0, 10));
}

/** Strict daily inputs: invalid observations remain gaps and cannot break a dry run. */
export function cropExposure(candidateId: string, crop: Crop, year: number, indicator: ValidatedIndicator, observations: readonly Observation[], shiftDays = 0): CropYearExposure {
  requireCondition(candidateId.length > 0, 'Candidate identity required');
  requireCondition(indicator === 'dry-spell' || indicator === 'heat-fraction', 'Unsupported or unvalidated source indicator');
  const days = windowDates(crop, year, shiftDays);
  const selected = new Map<string, Observation>();
  const seen = new Set<string>();
  for (const o of observations) {
    const start = utcTimestamp(o.timeStartUTC, 'observation start');
    const end = utcTimestamp(o.timeEndUTC, 'observation end');
    requireCondition(start.endsWith('T00:00:00.000Z') && Date.parse(end) - Date.parse(start) === DAY, 'Expected full UTC day');
    requireCondition(!seen.has(start), 'Duplicate daily observation'); seen.add(start);
    if (!days.includes(start.slice(0, 10))) continue;
    requireCondition(o.id.length > 0 && o.provenanceId.length > 0, 'Observation lineage required');
    if (o.measurement.status === 'valid') {
      const q = o.measurement.quantity;
      requireCondition(q.unit === (indicator === 'dry-spell' ? 'mm/day' : 'degC'), 'Indicator unit mismatch');
      requireCondition(Number.isFinite(q.value) && q.value >= (indicator === 'dry-spell' ? 0 : -273.15), 'Invalid physical observation');
      if (indicator === 'dry-spell') requireCondition(o.measurement.flags.includes('full-48-sample-support'), 'Precipitation needs validated full-day support');
    }
    selected.set(start.slice(0, 10), o);
  }
  let validDays = 0, gap = 0, longestGapDays = 0, dry = 0, longestDry = 0, hot = 0;
  const invalidDays: string[] = [];
  for (const day of days) {
    const m = selected.get(day)?.measurement;
    if (m?.status !== 'valid') { gap++; longestGapDays = Math.max(longestGapDays, gap); invalidDays.push(day); continue; }
    validDays++; gap = 0;
    if (m.quantity.value < 1) { dry++; longestDry = Math.max(longestDry, dry); } else dry = 0;
    if (m.quantity.value >= 35) hot++;
  }
  const complete = validDays === days.length;
  return {
    candidateId, crop, assignedYear: year, indicator,
    windowStartUTC: `${days[0]}T00:00:00.000Z`, windowEndUTC: new Date(dayUTC(days.at(-1)!) + DAY).toISOString(),
    calendarShiftDays: shiftDays,
    physical: complete ? { status: 'valid', quantity: { value: indicator === 'dry-spell' ? longestDry : hot / days.length, unit: indicator === 'dry-spell' ? 'days' : 'fraction' }, flags: ['provisional-window', 'illustrative-threshold', 'complete-daily-window'] }
      : { status: 'missing', reason: `Incomplete crop window: ${invalidDays.join(', ')}` },
    coverage: { expectedDays: days.length, validDays, missingDays: days.length - validDays, longestGapDays, policyId: 'full-crop-window-v1', status: complete ? 'passed' : 'failed', reasons: complete ? [] : [`Missing/unverified/invalid days: ${invalidDays.join(', ')}`] },
    sourceRefs: [...new Set([...selected.values()].map(o => o.provenanceId))].sort(),
    contributingObservationIds: [...selected.values()].map(o => o.id).sort(), normalizationRef: null,
  };
}

export function commonScenarios(candidates: readonly Candidate[], firstYear: number, lastYear: number, evidence: Readonly<Record<ValidatedIndicator, readonly Observation[]>>, indicators: readonly ValidatedIndicator[] = ['dry-spell', 'heat-fraction']): readonly Scenario[] {
  requireCondition(Number.isInteger(firstYear) && Number.isInteger(lastYear) && lastYear >= firstYear + 4 && lastYear - firstYear <= 50, 'Expected bounded five-year historical range');
  requireCondition(indicators.length > 0 && new Set(indicators).size === indicators.length, 'Unique explicit indicators required');
  requireCondition(new Set(candidates.map(c => c.id)).size === candidates.length, 'Duplicate candidates');
  const active = candidates.filter(c => c.agronomicScreening !== 'EXCLUDED');
  return Array.from({ length: lastYear - firstYear - 3 }, (_, i) => {
    const start = firstYear + i;
    const exposures: Record<string, CropYearExposure[]> = {};
    const reasons: string[] = active.length ? [] : ['No eligible candidates'];
    for (const c of active) {
      requireCondition(c.fiveYearOrderedCrops.length === 5, 'Expected exactly five ordered crop years');
      exposures[c.id] = c.fiveYearOrderedCrops.flatMap((crop, position) => indicators.map(indicator => cropExposure(c.id, crop, start + position, indicator, evidence[indicator])));
      for (const e of exposures[c.id]!) if (e.physical.status !== 'valid') reasons.push(`${c.id}/${e.crop}/${e.assignedYear}/${e.indicator}: ${e.physical.reason}`);
    }
    return { id: `fixed-${start}-${start + 4}`, fiveYearStart: start, fiveYearEnd: start + 4, cropYearExposureByCandidate: exposures, validity: reasons.length === 0 ? 'valid' : 'excluded', exclusionReasons: reasons };
  });
}
