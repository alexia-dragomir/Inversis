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
    <div className="section-heading"><div><p className="eyebrow">Why this result</p><h2>Smallest worst missed opportunity.</h2></div><span className="status">{result.validScenarioIds.length} shared replays</span></div>
    <p>Each replay compares every eligible plan against the lowest exposure available in that same replay. The selected set minimizes its largest gap to that comparator. A plan can win this comparison without being best in every year sequence.</p>
    {info.margin!==null&&<div className="assurance-metrics"><article><span>Gap to the next minimax score</span><strong>{number(info.margin)}</strong><small>Normalized exposure units · not confidence</small></article><article><span>Different scenario-best sets</span><strong>{new Set(info.scenarioBest.map(s=>labels(s.preferred))).size}</strong><small>The historical replays can favor different plans</small></article></div>}
    <div className="table-scroll"><table className="replay-chart"><caption>Actual weighted losses by historical replay · lower is better · shared 0–1 scale</caption><thead><tr><th>Replay</th>{result.activeCandidateIds.map(id=><th key={id}>{names[id]}</th>)}<th>Lowest loss</th></tr></thead><tbody>{info.scenarioBest.map(s=><tr key={s.id}><th>{s.id.replace('fixed-','').replace('-', '–')}</th>{result.activeCandidateIds.map(id=><td key={id}><div className={`loss-bar plan-${id}`} style={{width:`${c.lossMatrix[id]![s.id]!*100}%`}} aria-hidden="true"/><span>{number(c.lossMatrix[id]![s.id]!)}</span></td>)}<td>{labels(s.preferred)}</td></tr>)}</tbody></table></div>
    <aside className="interpretation-note"><h3>Exposure allocation, not a rotation-benefit model</h3><p>Baseline contains two wheat years; A and B replace one with soybean and change the crop/year allocation. Earlier wheat windows encounter less heat in this record. Soybean's longer window contains the maize and sunflower windows, so its dry run cannot be shorter than theirs in the same year. These calendar effects can favor a plan without proving a biological rotation advantage.</p><p>The model does not represent yield, crop-specific damage, soil-water balance, nitrogen carry-over, disease or management. All plans remain conditional on field evidence.</p></aside>
  </section>;
}

export function StabilityExplanation({analysis,preference}:{analysis:Analysis;preference:SensitivityResult}){
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
  const [title,description]=descriptions[info.kind];
  const valid=preference.sampledConfigurations.filter(p=>p.decision.computation);
  const active=info.decision?.activeCandidateIds??[];
  const max=Math.max(.01,...valid.flatMap(p=>Object.values(p.decision.computation!.worstRegrets)));
  const hasRain=analysis.options.mode==='heat-and-rainfall';
  return <section className="section assurance-panel"><p className="eyebrow">Interpretation / {info.kind.replaceAll('-',' ')}</p><h2>{title}</h2><p>{description}</p>
    <p className="small-note">{hasRain?'Two validated indicators → 21 weights. The 231-state simplex requires three validated indicators; SMAP moisture is not included.':'One indicator → one preference point. This fallback is a limited diagnostic.'} No frequency of grid wins is a probability.</p>
    {valid.length>1&&<figure className="regret-figure"><figcaption>Preference profile <span>Worst regret, lower is better</span></figcaption><svg viewBox="0 0 700 250" role="img" aria-label="Worst regret for each eligible plan across the tested heat preferences. Exact values are available in the table below.">
      {[0,.5,1].map(f=><g key={f}><line x1="55" y1={195-155*f} x2="650" y2={195-155*f} className="chart-grid"/><text x="46" y={199-155*f} textAnchor="end">{(max*f).toFixed(2)}</text></g>)}
      {active.map(id=><g key={id}><polyline className={`line-${id}`} points={valid.map(p=>{const w=p.decision.weights.find(w=>w.indicator==='heat-fraction')!.weight;return `${55+595*w},${195-155*p.decision.computation!.worstRegrets[id]!/max}`;}).join(' ')} fill="none" strokeWidth="3"/>{valid.map(p=><circle key={p.id} className={`dot-${id}`} cx={55+595*p.decision.weights.find(w=>w.indicator==='heat-fraction')!.weight} cy={195-155*p.decision.computation!.worstRegrets[id]!/max} r="3"/>)}</g>)}
      <text x="55" y="224">0% heat</text><text x="650" y="224" textAnchor="end">100% heat</text>
    </svg><div className="chart-legend">{active.map(id=><span key={id}><i className={`dot-${id}`}/>{names[id]}</span>)}</div><p className="small-note">Dots are tested weights. Lines connect samples for reading only; they do not identify exact decision boundaries.</p>
    <details className="methodology"><summary>Exact sampled scores and margins</summary><div className="table-scroll"><table><caption>Worst regrets at each tested preference; margin is second-lowest minus lowest score</caption><thead><tr><th>Heat / dry</th>{active.map(id=><th key={id}>{names[id]}</th>)}<th>Margin</th></tr></thead><tbody>{valid.map(p=>{const scores=Object.values(p.decision.computation!.worstRegrets).sort((a,b)=>a-b);const h=p.decision.weights.find(w=>w.indicator==='heat-fraction')!.weight;return <tr key={p.id}><th>{Math.round(h*100)} / {Math.round((1-h)*100)}%</th>{active.map(id=><td key={id}>{number(p.decision.computation!.worstRegrets[id]!)}</td>)}<td>{scores.length>1?number(scores[1]!-scores[0]!):'No competitor'}</td></tr>;})}</tbody></table></div></details></figure>}
    {info.pairs.length>0&&<details className="methodology"><summary>Are the candidates actually different?</summary><div className="method-content"><p>Compare normalized exposure separately for each indicator in each shared replay, before applying preferences. Pointwise dominance requires no worse exposure in every such pair.</p><div className="table-scroll"><table><caption>First plan versus second plan · counts of scenario–indicator pairs</caption><thead><tr><th>Comparison</th><th>Lower</th><th>Equal</th><th>Higher</th></tr></thead><tbody>{info.pairs.map(p=><tr key={`${p.a}-${p.b}`}><th>{names[p.a]} vs {names[p.b]}</th><td>{p.lower}</td><td>{p.equal}</td><td>{p.higher}</td></tr>)}</tbody></table></div><p>No close/separated threshold is calibrated for agriculture. Use the exact margins, trade-offs and assumptions rather than a confidence label.</p></div></details>}
  </section>;
}

export function MethodDiagnostics({normalization,omission,analysis}:{normalization:SensitivityResult;omission:SensitivityResult;analysis:Analysis}){
  const base=analysis.evaluation.state==='evaluated'?analysis.evaluation.result:null;
  return <section className="section"><p className="eyebrow">Method / Historical influence</p><h2>Challenge the calculation, not just the weights.</h2><p>These are separate methodological tests. They do not replace the primary fixed-start result or add independent historical evidence.</p>
    {[normalization,omission].map(test=><details className="methodology" key={test.axis}><summary>{test.axis==='normalization'?'Does another reference scale change the set?':'Does omitting one replay change the set?'}</summary><div className="method-content"><p>{test.untestedDomainNotice}</p><div className="table-scroll"><table><caption>{test.gridResolution}</caption><thead><tr><th>Test</th><th>Preferred set</th><th>Compared with primary</th></tr></thead><tbody>{test.sampledConfigurations.map(p=><tr key={p.id}><th>{p.description}</th><td>{labels(p.decision.preferredSet)}</td><td>{!base?.computation||!p.decision.computation?'Not established':samePreferred(base,p.decision)?'Same set':'Changed set'}</td></tr>)}</tbody></table></div>{test.axis==='normalization'&&test.sampledConfigurations.map(p=><p className="small-note" key={p.id}>{p.description}: {p.decision.normalization.map(r=>`${r.indicator} ${r.lower.value.toFixed(4)}–${r.upper.value.toFixed(4)} ${r.lower.unit}`).join('; ')}</p>)}</div></details>)}
    <aside className="interpretation-note"><h3>Evidence that still needs to come from the field</h3><p>Actual sowing/flowering dates could revise the provisional windows. Farmer permissions change eligibility. Previous crops, disease history, drainage, soil and management require locally applicable evidence before effects can be quantified. This app cannot assign a numerical value to those unknowns.</p></aside>
  </section>;
}
