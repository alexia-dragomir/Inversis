import type { Candidate, ComputedComparison, DecisionBasis, DecisionEvaluation, DecisionMatrix, IndicatorId, NormalizationReference, PreferenceWeight, Scenario } from '../domain/contracts';

export interface ComparisonInput {
  readonly candidates: readonly Candidate[];
  readonly scenarios: readonly Scenario[];
  readonly references: readonly NormalizationReference[];
  readonly weights: readonly PreferenceWeight[];
  readonly minimumScenarios: number;
  readonly tieTolerance: number;
  readonly fingerprint: string;
}
export const numericalPolicy = { minimumScenarios: 2, tieTolerance: 1e-10, nearConstantWidth: 1e-12 } as const;

export function evaluateComparison(input: ComparisonInput): DecisionEvaluation {
  const issues: string[] = [];
  if (!Number.isFinite(input.tieTolerance) || input.tieTolerance < 0 || input.tieTolerance > 1e-6) issues.push('Invalid numerical tie tolerance');
  if (!Number.isInteger(input.minimumScenarios) || input.minimumScenarios < 1) issues.push('Explicit positive minimum scenario count required');
  if (new Set(input.candidates.map(c => c.id)).size !== input.candidates.length) issues.push('Duplicate candidate IDs');
  if (new Set(input.scenarios.map(s => s.id)).size !== input.scenarios.length) issues.push('Duplicate scenario IDs');
  if (!input.weights.length || new Set(input.weights.map(w => w.indicator)).size !== input.weights.length || input.weights.some(w => !Number.isFinite(w.weight) || w.weight < 0) || Math.abs(input.weights.reduce((s,w) => s + w.weight, 0) - 1) > 1e-12) issues.push('Weights must be unique, finite, nonnegative and sum to 1');
  if (!/^[a-f0-9]{64}$/.test(input.fingerprint)) issues.push('Canonical SHA-256 fingerprint required');
  if (issues.length) return { state: 'invalid-input', issues: issues as [string, ...string[]] };
  const active = input.candidates.filter(c => c.agronomicScreening !== 'EXCLUDED');
  const valid = input.scenarios.filter(s => s.validity === 'valid');
  const basis: DecisionBasis = {
    provisional: active.some(c => c.fieldSuitability !== 'supported-by-required-checks'),
    constraintDependent: active.length !== input.candidates.length,
    activeCandidateIds: active.map(c => c.id), confirmedCandidateIds: active.filter(c => c.agronomicScreening === 'SCREENED' && c.fieldSuitability === 'supported-by-required-checks').map(c => c.id),
    validScenarioIds: valid.map(s => s.id), indicatorIds: input.weights.map(w => w.indicator), weights: input.weights, normalization: input.references,
    warnings: ['Conditional historical environmental-exposure comparison; not yield or crop-damage prediction.', 'Overlapping five-year windows are dependent historical replays.', 'No rotation has established field-level suitability.'],
  };
  const refuse = (reason: string): DecisionEvaluation => ({ state: 'evaluated', result: { ...basis, status: active.length ? 'INSUFFICIENT_EVIDENCE' : 'NO_ELIGIBLE_ROTATION', preferredSet: [], reasons: [reason] } });
  if (!active.length) return refuse('No candidate remains eligible under the explicit constraints.');
  if (valid.length < input.minimumScenarios) return refuse(`Need at least ${input.minimumScenarios} common complete scenarios; found ${valid.length}.`);
  const references = new Map<IndicatorId, NormalizationReference>();
  for (const ref of input.references) {
    if (references.has(ref.indicator) || !ref.candidateIndependent || !Number.isFinite(ref.lower.value) || !Number.isFinite(ref.upper.value) || ref.lower.unit !== ref.upper.unit || ref.upper.value < ref.lower.value || !ref.sourceRefs.length) return refuse('Invalid or non-independent normalization reference.');
    references.set(ref.indicator, ref);
  }
  for (const weight of input.weights) {
    const ref = references.get(weight.indicator);
    if (!ref || ref.upper.value - ref.lower.value <= numericalPolicy.nearConstantWidth) return refuse(`Unavailable or near-constant reference for ${weight.indicator}; no fabricated normalized contrast.`);
  }
  const loss: Record<string, Record<string, number>> = {};
  for (const c of active) {
    loss[c.id] = {};
    for (const s of valid) {
      if (s.fiveYearEnd !== s.fiveYearStart + 4) return refuse('Scenario must span exactly five ordered years.');
      const exposures = s.cropYearExposureByCandidate[c.id];
      if (!exposures) return refuse('Incomplete common candidate/scenario domain.');
      let total = 0;
      for (const w of input.weights) {
        const ref = references.get(w.indicator)!;
        const values = exposures.filter(e => e.indicator === w.indicator);
        if (values.length !== 5) return refuse('Each indicator requires exactly five crop-years.');
        let sum = 0;
        for (let position = 0; position < 5; position++) {
          const matches = values.filter(e => e.assignedYear === s.fiveYearStart + position);
          const e = matches[0];
          if (matches.length !== 1 || !e || e.candidateId !== c.id || e.crop !== c.fiveYearOrderedCrops[position] || e.physical.status !== 'valid' || e.coverage.status !== 'passed' || !e.sourceRefs.length || !e.contributingObservationIds.length) return refuse('Invalid/missing crop-year exposure or lineage.');
          const q = e.physical.quantity;
          if (q.unit !== ref.lower.unit || !Number.isFinite(q.value)) return refuse('Physical units/value disagree with reference.');
          const scaled = Math.max(0, Math.min(1, (q.value - ref.lower.value) / (ref.upper.value - ref.lower.value)));
          sum += ref.direction === 'higher-is-worse' ? scaled : 1 - scaled;
        }
        total += w.weight * sum / 5;
      }
      loss[c.id]![s.id] = total;
    }
  }
  const comparison = compareLosses(loss, active.map(c => c.id), valid.map(s => s.id), input.tieTolerance, input.fingerprint);
  const preferred = active.map(c => c.id).filter(id => comparison.worstRegrets[id]! - Math.min(...Object.values(comparison.worstRegrets)) <= input.tieTolerance);
  if (preferred.length === 1) return { state: 'evaluated', result: { ...basis, status: 'PREFERRED_UNDER_TESTED_ASSUMPTIONS', preferredSet: [preferred[0]!], computation: comparison } };
  return { state: 'evaluated', result: { ...basis, status: 'TIED_PREFERENCE', preferredSet: preferred as [string, string, ...string[]], computation: comparison } };
}

/** Independent loss-matrix boundary; exported for golden oracle tests. */
export function compareLosses(loss: DecisionMatrix, candidates: readonly string[], scenarios: readonly string[], tolerance: number, fingerprint: string): ComputedComparison {
  if (!candidates.length || !scenarios.length || new Set(candidates).size !== candidates.length || new Set(scenarios).size !== scenarios.length || !Number.isFinite(tolerance) || tolerance < 0) throw new Error('Invalid comparison domain');
  const regret: Record<string, Record<string, number>> = {};
  const worst: Record<string, number> = {};
  const average: Record<string, number> = {};
  for (const c of candidates) { regret[c] = {}; worst[c] = 0; average[c] = 0; }
  for (const s of scenarios) {
    const values = candidates.map(c => loss[c]?.[s]);
    if (values.some(v => v === undefined || !Number.isFinite(v) || v < 0 || v > 1)) throw new Error('Loss domain incomplete/invalid');
    const minimum = Math.min(...values as number[]);
    candidates.forEach((c, i) => {
      const value = values[i]!;
      regret[c]![s] = value - minimum;
      worst[c] = Math.max(worst[c]!, value - minimum);
      average[c] = average[c]! + value / scenarios.length;
    });
  }
  const preferred = candidates.filter(c => worst[c]! - Math.min(...Object.values(worst)) <= tolerance);
  const benchmark = candidates.filter(c => average[c]! - Math.min(...Object.values(average)) <= tolerance);
  const same = JSON.stringify([...preferred].sort()) === JSON.stringify([...benchmark].sort());
  return { lossMatrix: Object.fromEntries(candidates.map(c => [c, Object.fromEntries(scenarios.map(s => [s, loss[c]![s]!]))])), regretMatrix: regret, worstRegrets: worst, tieTolerance: tolerance, provenanceFingerprint: fingerprint, comparisonScope: candidates.length === 1 ? 'only-eligible-candidate' : 'competitive', averageLossBenchmark: { meanLossByCandidate: average, preferredSet: benchmark as [string, ...string[]], relationToMinimax: preferred.length > 1 || benchmark.length > 1 ? 'tie-involved' : same ? 'agree' : 'diverge', sharedLossMatrix: true } };
}

/** Exact integer-grid generation avoids floating-point step drift. */
export function weightSimplex(indicators: readonly IndicatorId[]): readonly PreferenceWeight[][] {
  if (!indicators.length || indicators.length > 3 || new Set(indicators).size !== indicators.length) throw new Error('Expected 1–3 unique indicators');
  const result: PreferenceWeight[][] = [];
  function walk(parts: number[], left: number) {
    if (parts.length === indicators.length - 1) { result.push([...parts, left].map((n,i) => ({ indicator: indicators[i]!, weight: n / 20 }))); return; }
    for (let i = 0; i <= left; i++) walk([...parts, i], left - i);
  }
  walk([], 20); return result;
}
