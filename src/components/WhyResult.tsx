import { useId } from 'react';
import type { Analysis } from '../engine/analysis';
import { displayScore, planLabel, scoreSummary } from './display';

/** Explain existing engine outputs; never calculate a second decision. */
export function resultRationale(analysis: Analysis) {
  const domain = analysis.options.mode === 'heat-only'
    ? 'Reduced heat-only evidence model; rainfall is not included.'
    : 'Combined rainfall-and-heat evidence model.';
  const assumptions = `${domain} Crop-window shift: ${analysis.options.shift} days. ${analysis.weights.map(w => `${Math.round(w.weight * 100)}% ${w.indicator === 'heat-fraction' ? 'heat' : 'dry spell'}`).join(' / ')}. Crop exclusions are hypothetical.`;
  const scope = 'Field suitability, yield, and future performance are not established.';
  if (analysis.evaluation.state !== 'evaluated') return { headline: 'A comparison cannot be issued.', statements: ['The current inputs did not pass validation.', assumptions, scope] };
  const r = analysis.evaluation.result;
  if (r.status === 'NO_ELIGIBLE_ROTATION') return { headline: 'No candidate satisfies the current eligibility constraints.', statements: ['The model cannot issue a selection. It does not invent a replacement recommendation.', assumptions, scope] };
  if (r.status === 'INSUFFICIENT_EVIDENCE') return { headline: 'Shared evidence is insufficient for selection.', statements: [`The declared minimum common-scenario requirement is not met: ${r.validScenarioIds.length} shared complete historical replays. No minimax winner is established.`, assumptions, scope] };
  const summary = scoreSummary(r)!;
  if (r.activeCandidateIds.length === 1) return { headline: `${planLabel(r.preferredSet)} is the only eligible candidate.`, statements: ['Only one candidate remains eligible under the current hypothetical exclusions. No competitive superiority or second-best margin can be established.', assumptions, scope] };
  if (r.status === 'TIED_PREFERENCE') return { headline: `${planLabel(r.preferredSet)} share the preferred set.`, statements: [`The engine retains all tied candidates under its numerical tolerance (${r.computation.tieTolerance}). Their maximum regrets are ${r.preferredSet.map(id => `${planLabel([id])}: ${displayScore(r.computation.worstRegrets[id])}`).join('; ')}. No positive separation is established between them.`, 'This is a conditional minimax tie across the shared historical replays.', assumptions, scope] };
  return { headline: `${planLabel(r.preferredSet)} limits the largest missed opportunity.`, statements: [`Across ${r.validScenarioIds.length} shared historical replays, ${planLabel(r.preferredSet)}’s maximum regret is ${displayScore(summary.best.value)}, compared with ${displayScore(summary.next!.value)} for the next-ranked candidate (${planLabel([summary.next!.id])}). The difference is ${displayScore(summary.margin!)} normalized exposure units.`, 'This is a conditional minimax result. Another plan can have lower exposure in an individual replay.', assumptions, scope] };
}

export function WhyResult({ analysis }: { analysis: Analysis }) {
  const titleId = useId();
  const rationale = resultRationale(analysis);
  return <section className="why-result" aria-labelledby={titleId}>
    <h2 id={titleId}>Why this result?</h2>
    <h3>{rationale.headline}</h3>
    <p className="rationale-evidence">{rationale.statements[0]}</p>
    {rationale.statements.slice(1).map(text => <p className="small-note" key={text}>{text}</p>)}
  </section>;
}
