import type { Coverage, Observation, PhysicalUnit } from '../../domain/contracts.ts';

export function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function record(value: unknown, label: string): Record<string, unknown> {
  requireCondition(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  return value as Record<string, unknown>;
}

export function finite(value: unknown, label: string): number {
  requireCondition(typeof value === 'number' && Number.isFinite(value), `${label}: expected finite number`);
  return value;
}

export function text(value: unknown, label: string): string {
  requireCondition(typeof value === 'string' && value.length > 0, `${label}: expected nonempty string`);
  return value;
}

/** JSON.parse alone silently overwrites duplicate dates/metadata keys. Reject them. */
export function parseStrictJson(raw: string): unknown {
  const objects: Set<string>[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '{') objects.push(new Set());
    else if (raw[i] === '}') objects.pop();
    else if (raw[i] === '"') {
      const start = i++;
      while (i < raw.length && raw[i] !== '"') {
        if (raw[i] === '\\') i++;
        i++;
      }
      const token: unknown = JSON.parse(raw.slice(start, i + 1));
      let next = i + 1;
      while (/\s/.test(raw[next] ?? '') && next < raw.length) next++;
      if (raw[next] === ':') {
        const keys = objects.at(-1);
        requireCondition(keys && typeof token === 'string', 'Malformed JSON object key');
        requireCondition(!keys.has(token), `Duplicate JSON key: ${token}`);
        keys.add(token);
      }
    }
  }
  return JSON.parse(raw) as unknown;
}

export function dayUTC(day: string): number {
  requireCondition(/^\d{4}-\d{2}-\d{2}$/.test(day), `Invalid calendar date: ${day}`);
  const ms = Date.parse(`${day}T00:00:00.000Z`);
  requireCondition(Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === day, `Invalid calendar date: ${day}`);
  return ms;
}

export function daysInclusive(start: string, end: string): readonly string[] {
  const first = dayUTC(start);
  const last = dayUTC(end);
  requireCondition(last >= first && last - first < 31 * 86400000, 'Stage 1 requests must cover 1–31 days');
  return Array.from({ length: (last - first) / 86400000 + 1 }, (_, index) => new Date(first + index * 86400000).toISOString().slice(0, 10));
}

export function utcTimestamp(value: unknown, label: string): string {
  const timestamp = text(value, label);
  requireCondition(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp), `${label}: explicit canonical UTC required`);
  const ms = Date.parse(timestamp);
  requireCondition(Number.isFinite(ms) && new Date(ms).toISOString() === timestamp, `${label}: invalid timestamp`);
  return timestamp;
}

export function completeDailyCoverage<U extends PhysicalUnit>(observations: readonly Observation<U>[], start: string, end: string): Coverage {
  const expected = daysInclusive(start, end);
  const seen = new Map<string, Observation<U>>();
  for (const observation of observations) {
    const time = utcTimestamp(observation.timeStartUTC, 'Observation start');
    const stop = utcTimestamp(observation.timeEndUTC, 'Observation end');
    const day = time.slice(0, 10);
    requireCondition(time === `${day}T00:00:00.000Z` && Date.parse(stop) - Date.parse(time) === 86400000, 'Expected a full UTC day with exclusive end');
    requireCondition(expected.includes(day), `Unexpected observation day: ${day}`);
    requireCondition(!seen.has(day), `Duplicate observation day: ${day}`);
    seen.set(day, observation);
  }
  let validDays = 0;
  let gap = 0;
  let longestGapDays = 0;
  for (const day of expected) {
    if (seen.get(day)?.measurement.status === 'valid') { validDays++; gap = 0; }
    else { gap++; longestGapDays = Math.max(longestGapDays, gap); }
  }
  const missingDays = expected.length - validDays;
  return {
    expectedDays: expected.length, validDays, missingDays, longestGapDays,
    policyId: 'stage1-complete-daily-sample-v1', status: missingDays === 0 ? 'passed' : 'failed',
    reasons: missingDays === 0 ? [] : [`${missingDays} expected days are absent, missing, invalid or unverified.`],
  };
}
