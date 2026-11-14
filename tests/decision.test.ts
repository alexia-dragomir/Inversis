import { expect, it } from 'vitest';
import { compareLosses, evaluateComparison, weightSimplex } from '../src/engine/decision';
import { canonicalize, fingerprint } from '../src/engine/canonical';
import { candidates } from '../src/data/foundation';
const hash = '0'.repeat(64);
const golden = { baseline: { s1: .2, s2: .8 }, a: { s1: .4, s2: .4 }, b: { s1: .7, s2: .3 } };

it('reproduces independent hand-calculated minimax oracle and same-matrix average baseline', () => {
  const r = compareLosses(golden, ['baseline','a','b'], ['s1','s2'], 1e-10, hash);
  expect(r.regretMatrix.a?.s1).toBeCloseTo(.2); expect(r.regretMatrix.a?.s2).toBeCloseTo(.1);
  expect(r.worstRegrets.baseline).toBeCloseTo(.5); expect(r.worstRegrets.a).toBeCloseTo(.2); expect(r.worstRegrets.b).toBeCloseTo(.5);
  expect(r.averageLossBenchmark.preferredSet).toEqual(['a']);
  expect(r.averageLossBenchmark.sharedLossMatrix).toBe(true);
});
it('recomputes scenario minima after excluding a winner and never includes inactive candidates', () => {
  const r = compareLosses(golden, ['baseline','b'], ['s1','s2'], 1e-10, hash);
  expect(r.worstRegrets.baseline).toBeCloseTo(.5); expect(r.worstRegrets.b).toBeCloseTo(.5);
  expect(r.regretMatrix).not.toHaveProperty('a');
  expect(r.averageLossBenchmark.relationToMinimax).toBe('tie-involved');
});
it('handles one candidate with explicit scope, ties and permutation determinism', () => {
  expect(compareLosses(golden, ['baseline'], ['s1','s2'], 1e-10, hash)).toMatchObject({ comparisonScope: 'only-eligible-candidate', worstRegrets: { baseline: 0 } });
  const a = compareLosses(golden, ['a','b','baseline'], ['s2','s1'], 1e-10, hash);
  expect(a.worstRegrets).toEqual(compareLosses(golden,['baseline','a','b'],['s1','s2'],1e-10,hash).worstRegrets);
  expect(compareLosses({a:{s1:.5}, b:{s1:.5}},['a','b'],['s1'],1e-10,hash).averageLossBenchmark.preferredSet).toEqual(['a','b']);
});
it('rejects incomplete/invalid losses and duplicate domains', () => {
  expect(() => compareLosses(golden,['a','a'],['s1'],0,hash)).toThrow();
  expect(() => compareLosses(golden,['a'],['absent'],0,hash)).toThrow();
  expect(() => compareLosses({a:{s:NaN}},['a'],['s'],0,hash)).toThrow();
});
it('preserves no-eligible precedence, missing-evidence refusal, and weight validation', () => {
  const input = { candidates, scenarios: [], references: [], weights: [{ indicator:'heat-fraction' as const, weight:1 }], minimumScenarios:2, tieTolerance:1e-10, fingerprint:hash };
  expect(evaluateComparison(input)).toMatchObject({state:'evaluated', result:{status:'INSUFFICIENT_EVIDENCE',preferredSet:[]}});
  expect(evaluateComparison({...input,candidates:candidates.map(c=>({...c,agronomicScreening:'EXCLUDED' as const}))})).toMatchObject({state:'evaluated',result:{status:'NO_ELIGIBLE_ROTATION'}});
  expect(evaluateComparison({...input,weights:[{indicator:'heat-fraction',weight:-1}]}).state).toBe('invalid-input');
});
it('generates the complete 231-point 3D simplex, 21-point 2D sweep and singleton heat-only domain', () => {
  const weights = weightSimplex(['dry-spell','root-zone-moisture','heat-fraction']);
  expect(weights).toHaveLength(231);
  expect(weights.every(w=>Math.abs(w.reduce((s,p)=>s+p.weight,0)-1)<1e-12)).toBe(true);
  expect(new Set(weights.map(w=>JSON.stringify(w))).size).toBe(231);
  expect(weightSimplex(['dry-spell','heat-fraction'])).toHaveLength(21);
  expect(weightSimplex(['heat-fraction'])).toEqual([[{indicator:'heat-fraction',weight:1}]]);
});
it('canonical fingerprints are stable under key order, preserve array order and reject nonfinite input', async () => {
  expect(await fingerprint({b:2,a:1})).toBe(await fingerprint({a:1,b:2}));
  expect(await fingerprint([1,2])).not.toBe(await fingerprint([2,1]));
  expect(()=>canonicalize({a:undefined})).toThrow();
  expect(()=>canonicalize(NaN)).toThrow();
});
