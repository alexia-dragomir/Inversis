import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { analyze, validateAnalysisEvidence, type Analysis } from '../src/engine/analysis';
import { evaluateComparison, numericalPolicy } from '../src/engine/decision';
import { resultRationale, WhyResult } from '../src/components/WhyResult';
import { scoreSummary } from '../src/components/display';

const read = (name: string) => JSON.parse(readFileSync(`public/evidence/history/${name}`, 'utf8'));
const power = validateAnalysisEvidence(read('analysis-input.json'));
const full = validateAnalysisEvidence({ ...power, precipitation: read('imerg-analysis-input.json') });
const defaults = { mode: 'heat-and-rainfall' as const, shift: 0, heatWeight: .5, forbidden: [] };
const text = (a: Analysis) => JSON.stringify(resultRationale(a));

it('explains the actual default minimax evidence and scope', async () => {
  const a = await analyze(full, defaults);
  expect(text(a)).toContain('Baseline limits the largest missed opportunity');
  for (const s of ['0.0481', '0.1364', '0.0883', '6 shared', 'Another plan', 'not established']) expect(text(a)).toContain(s);
  expect(renderToStaticMarkup(<WhyResult analysis={a}/>)).toContain('Why this result?');
});

it('tracks engine scores across all preference weights and calendar shifts', async () => {
  for (const shift of [-14, -7, 0, 7, 14]) for (let i = 0; i <= 20; i++) {
    const a = await analyze(full, { ...defaults, shift, heatWeight: i / 20 });
    if (a.evaluation.state !== 'evaluated') throw new Error('Unevaluated');
    const summary = scoreSummary(a.evaluation.result)!;
    for (const n of [summary.best.value, summary.next!.value, summary.margin!]) expect(text(a)).toContain(n.toFixed(4));
    expect(text(a)).toContain(`shift: ${shift} days`);
    expect(text(a)).not.toMatch(/confidence|probability|yield benefit|predicts yield/i);
  }
}, 20000);

it('distinguishes sole candidate, no eligible candidate and missing rainfall', async () => {
  const sole = await analyze(full, { ...defaults, forbidden: ['soybean'] });
  expect(text(sole)).toContain('only eligible candidate');
  expect(text(sole)).toContain('No competitive superiority');
  expect(text(sole)).not.toContain('0.0000');
  const none = await analyze(full, { ...defaults, forbidden: ['sunflower'] });
  expect(text(none)).toContain('cannot issue a selection');
  const missing = await analyze(power, defaults);
  expect(text(missing)).toContain('minimum common-scenario requirement');
  expect(text(missing)).not.toContain('limits the largest');
});

it('identifies reduced evidence and uses its actual scores', async () => {
  const a = await analyze(power, { ...defaults, mode: 'heat-only' });
  expect(text(a)).toContain('Reduced heat-only');
  expect(text(a)).not.toContain('Combined rainfall');
  if (a.evaluation.state !== 'evaluated') throw new Error('Unevaluated');
  expect(text(a)).toContain(scoreSummary(a.evaluation.result)!.best.value.toFixed(4));
});

it('retains every tied candidate and never invents separation (explicit test fixture)', async () => {
  const a = await analyze(full, defaults);
  const scenarios = a.scenarios.map(s => ({ ...s, cropYearExposureByCandidate: Object.fromEntries(a.candidates.map(c => [c.id, s.cropYearExposureByCandidate.baseline!.map(e => ({ ...e, candidateId: c.id }))])) }));
  const evaluation = evaluateComparison({ ...a, candidates: a.candidates.map(c => ({ ...c, fiveYearOrderedCrops: a.candidates[0]!.fiveYearOrderedCrops })), scenarios, ...numericalPolicy, fingerprint: a.inputFingerprint });
  expect(evaluation.state === 'evaluated' && evaluation.result.status).toBe('TIED_PREFERENCE');
  const rationale = text({ ...a, evaluation });
  expect(rationale).toContain('Baseline + Alternative A + Alternative B');
  expect(rationale).toContain('No positive separation');
  expect(rationale).not.toContain('next-ranked');
});

it('refuses invalid configuration explanations', async () => {
  const a = await analyze(full, defaults);
  expect(text({ ...a, evaluation: { state: 'invalid-input', issues: ['Test invalid input'] } })).toContain('cannot be issued');
});

