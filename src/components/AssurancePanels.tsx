import { MarginDiagnostic } from './MarginDiagnostic';
import { PreferenceInstrument } from './PreferenceInstrument';
import { scoreMargin } from './display';
import type { Analysis } from '../engine/analysis';
import { interpretation, samePreferred } from '../engine/interpretation';
import type { SensitivityResult } from '../domain/contracts';

const names:Record<string,string>={baseline:'Baseline',a:'Alternative A',b:'Alternative B'};
const number=(v:number)=>v.toFixed(4);
const labels=(ids:readonly string[])=>ids.map(id=>names[id]??id).join(' + ')||'None';

export function DecisionExplanation({analysis,preference}:{analysis:Analysis;preference:SensitivityResult}){
  const info=interpretation(analysis,preference);const result=info.decision;
  if(!result?.computation)return null;
  const c=result.computation;
  return <section className="section explanation">
    <details className="methodology"><summary>All six replay losses and scenario-best plans</summary><div className="table-scroll"><table className="replay-chart"><caption>Actual weighted losses by historical replay · lower is better · shared 0–1 scale</caption><thead><tr><th>Replay</th>{result.activeCandidateIds.map(id=><th key={id}>{names[id]}</th>)}<th>Lowest loss</th></tr></thead><tbody>{info.scenarioBest.map(s=><tr key={s.id}><th>{s.id.replace('fixed-','').replace('-', '–')}</th>{result.activeCandidateIds.map(id=><td key={id}><div className={`loss-bar plan-${id}`} style={{width:`${c.lossMatrix[id]![s.id]!*100}%`}} aria-hidden="true"/><span>{number(c.lossMatrix[id]![s.id]!)}</span></td>)}<td>{labels(s.preferred)}</td></tr>)}</tbody></table></div></details>
    <details className="methodology"><summary>Why crop calendars matter · model interpretation</summary><aside className="interpretation-note"><h3>Exposure allocation, not a rotation-benefit model</h3><p>Baseline contains two wheat years; A and B replace one with soybean and change the crop/year allocation. Earlier wheat windows encounter less heat in this record. Soybean's longer window contains the maize and sunflower windows, so its dry run cannot be shorter than theirs in the same year. These calendar effects can favor a plan without proving a biological rotation advantage.</p><p>The model does not represent yield, crop-specific damage, soil-water balance, nitrogen carry-over, disease or management. All plans remain conditional on field evidence.</p></aside></details>
  </section>;
}

export function StabilityExplanation({analysis,preference,onWeight}:{analysis:Analysis;preference:SensitivityResult;onWeight:(n:number)=>void}){
  const info=interpretation(analysis,preference);
  const descriptions={
    unresolved:['Evidence cannot establish a comparison.','No robustness region, margin or preferred boundary is asserted.'],
    'single-candidate':['Eligibility leaves no competition.','A sole candidate has zero regret by construction. This is not a robust competitive decision.'],
    'identical-exposures':['Structural invariance: identical scored exposures.','Every active plan has equal scenario–indicator exposure within tolerance. Unchanged outcomes here are not discriminative evidence.'],
    tied:['A tie remains a set.','The current minimax scores are tied within 10⁻¹⁰. The model cannot justify a unique choice.'],
    'pointwise-dominance':['Pointwise exposure dominance in this domain.','One candidate is no worse across every tested scenario–indicator pair. This is a mathematical property of the declared exposure model, not field superiority.'],
    'sampled-change':['Preferences change the tested preferred set.','The grid shows where sampled preferences select different sets. Between-grid boundaries remain untested.'],
    'sampled-invariance':['Stable on the grid. Not universally robust.','The same set is selected at the tested weights, but candidates trade places in some scenario–indicator comparisons. Invariance is neither identical evidence nor proof of field suitability.'],
  } as const;
  const [title,description]=info.decision?.status==='NO_ELIGIBLE_ROTATION'?['No eligible decision under these constraints.','All proposed plans are excluded. This is an eligibility refusal, not a finding that NASA observations are missing.']:descriptions[info.kind];
  const valid=preference.sampledConfigurations.filter(p=>p.decision.computation);
  const active=info.decision?.activeCandidateIds??[];
  const hasRain=analysis.options.mode==='heat-and-rainfall';
  return <section className="section assurance-panel"><PreferenceInstrument analysis={analysis} sweep={preference} onWeight={onWeight}/><p className="eyebrow">Interpretation / {info.kind.replaceAll('-',' ')}</p><h2>{title}</h2><p>{description}</p><div className="interpretation-triptych"><article><h3>Observed</h3><p>{info.decision?.computation?`${labels(info.decision.preferredSet)} is the current preferred set. ${info.kind==='sampled-change'?'Other tested preferences change the set.':'No different preferred set is observed on this tested preference grid.'}`:'The current evidence and eligibility do not establish a comparison.'}</p></article><article><h3>Not established</h3><p>Universal robustness across all assumptions or future conditions.</p></article><article><h3>Unresolved</h3><p>Field suitability and biological rotation effects.</p></article></div>
    <p className="small-note">{hasRain?'Two validated indicators → 21 weights. The 231-state simplex requires three validated indicators; SMAP moisture is not included.':'One indicator → one preference point. This fallback is a limited diagnostic.'} No frequency of grid wins is a probability.</p>
    {valid.length>1&&<>
    <details className="methodology"><summary>Exact sampled scores and margins</summary><div className="table-scroll"><table><caption>Worst regrets at each tested preference; margin is second-lowest minus lowest score</caption><thead><tr><th>Heat / dry</th>{active.map(id=><th key={id}>{names[id]}</th>)}<th>Margin</th></tr></thead><tbody>{valid.map(p=>{const scores=Object.values(p.decision.computation!.worstRegrets).sort((a,b)=>a-b);const h=p.decision.weights.find(w=>w.indicator==='heat-fraction')!.weight;return <tr key={p.id}><th>{Math.round(h*100)} / {Math.round((1-h)*100)}%</th>{active.map(id=><td key={id}>{number(p.decision.computation!.worstRegrets[id]!)}</td>)}<td>{scores.length>1?number(scores[1]!-scores[0]!):'No competitor'}</td></tr>;})}</tbody></table></div></details></>}
    {info.pairs.length>0&&<details className="methodology"><summary>Are the candidates actually different?</summary><div className="method-content"><p>Compare normalized exposure separately for each indicator in each shared replay, before applying preferences. Pointwise dominance requires no worse exposure in every such pair.</p><div className="table-scroll"><table><caption>First plan versus second plan · counts of scenario–indicator pairs</caption><thead><tr><th>Comparison</th><th>Lower</th><th>Equal</th><th>Higher</th></tr></thead><tbody>{info.pairs.map(p=><tr key={`${p.a}-${p.b}`}><th>{names[p.a]} vs {names[p.b]}</th><td>{p.lower}</td><td>{p.equal}</td><td>{p.higher}</td></tr>)}</tbody></table></div><p>No close/separated threshold is calibrated for agriculture. Use the exact margins, trade-offs and assumptions rather than a confidence label.</p></div></details>}
  </section>;
}

export function MethodDiagnostics({normalization,omission,analysis}:{normalization:SensitivityResult;omission:SensitivityResult;analysis:Analysis}){
  const base=analysis.evaluation.state==='evaluated'?analysis.evaluation.result:null;
  return <section className="section"><p className="eyebrow">Method / Historical influence</p><h2>Challenge the calculation, not just the weights.</h2><p>These are separate methodological tests. They do not replace the primary fixed-start result or add independent historical evidence.</p>
    <div className="method-margin-grid">{[normalization,omission].map(test=><div className="method-margin-column" key={test.axis}><MarginDiagnostic title={test.axis==='normalization'?'Reference protocol → margin':'Omitted replay → margin'} points={test.sampledConfigurations.map(p=>({id:p.id,label:p.description,result:p.decision}))}/>{test.axis==='normalization'&&<aside className="interpretation-note"><h3>Evidence that still needs to come from the field</h3><p>Actual sowing/flowering dates could revise the provisional windows. Farmer permissions change eligibility. Previous crops, disease history, drainage, soil and management require locally applicable evidence before effects can be quantified. This app cannot assign a numerical value to those unknowns.</p></aside>}</div>)}</div>
    {[normalization,omission].map(test=><details className="methodology" key={test.axis}><summary>{test.axis==='normalization'?'Does another reference scale change the set?':'Does omitting one replay change the set?'}</summary><div className="method-content"><p>{test.untestedDomainNotice}</p><div className="table-scroll"><table><caption>{test.gridResolution}</caption><thead><tr><th>Test</th><th>Preferred set</th><th>Compared with primary</th><th>Minimax margin</th></tr></thead><tbody>{test.sampledConfigurations.map(p=><tr key={p.id}><th>{p.description}</th><td>{labels(p.decision.preferredSet)}</td><td>{!base?.computation||!p.decision.computation?'Not established':samePreferred(base,p.decision)?'Same set':'Changed set'}</td><td>{scoreMargin(p.decision)===null?'No comparison':number(scoreMargin(p.decision)!)}</td></tr>)}</tbody></table></div>{test.axis==='normalization'&&test.sampledConfigurations.map(p=><p className="small-note" key={p.id}>{p.description}: {p.decision.normalization.map(r=>`${r.indicator} ${r.lower.value.toFixed(4)}–${r.upper.value.toFixed(4)} ${r.lower.unit}`).join('; ')}</p>)}</div></details>)}

  </section>;
}
