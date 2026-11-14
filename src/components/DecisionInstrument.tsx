import { useState } from 'react';
import type { Analysis } from '../engine/analysis';
import { displayScore, planLabel, planNames, replayRows } from './display';

export function DecisionInstrument({analysis}:{analysis:Analysis}) {
  const [selected,setSelected]=useState('');
  const r=analysis.evaluation.state==='evaluated'?analysis.evaluation.result:null;
  if(!r?.computation)return null;
  const c=r.computation;
  const scenario=r.validScenarioIds.includes(selected)?selected:r.validScenarioIds[0]!;
  const rows=replayRows(r,scenario);
  const max=Math.max(.01,...Object.values(c.worstRegrets));
  return <section className="decision-instrument" aria-label="Interactive minimax regret comparison">
    <div className="instrument-summary"><p className="eyebrow">01 / Compare the worst missed opportunity</p><h2>A plan need not win every replay.</h2><p>The minimax choice has the smallest <strong>maximum regret</strong>: its largest gap to the best eligible plan in any shared replay.</p>
      <div className="ranked-scores">{r.activeCandidateIds.map(id=><div className={`ranked-score candidate-${id}`} key={id}><div><span className="plan-key"/>{planNames[id]}{r.preferredSet.includes(id)&&<small>Selected set</small>}</div><strong>{displayScore(c.worstRegrets[id])}</strong><div className="score-track"><span style={{width:`${100*c.worstRegrets[id]!/max}%`}}/></div></div>)}</div>
      <p className="small-note">Normalized exposure units, lower is better. Bars share a scale ending at {displayScore(max)}. These are neither probabilities nor agricultural outcomes.</p>
    </div>
    <div className="replay-lab"><p className="eyebrow">02 / Inspect the historical trade-off</p><h2>Change the replay.</h2><div className="replay-tabs" aria-label="Choose historical replay">{r.validScenarioIds.map(id=>{const s=analysis.scenarios.find(s=>s.id===id)!;return <button key={id} aria-pressed={id===scenario} onClick={()=>setSelected(id)}>{s.fiveYearStart}<span>–{s.fiveYearEnd}</span></button>;})}</div>
      <div className="replay-selection" aria-live="polite"><span>Lowest exposure in this replay</span><strong>{planLabel(rows.filter(row=>row.regret<=1e-10).map(row=>row.id))}</strong></div>
      <div className="loss-axis"><span>Weighted exposure</span><span>0 → 1</span></div>
      {rows.map(row=><div className={`replay-loss candidate-${row.id}`} key={row.id}><div><span><i className="plan-key"/>{planNames[row.id]}</span><strong>{displayScore(row.loss)}</strong></div><div className="loss-track"><span className="minimum-segment" style={{width:`${Math.min(...rows.map(r=>r.loss))*100}%`}}/><span className="regret-segment" style={{left:`${Math.min(...rows.map(r=>r.loss))*100}%`,width:`${row.regret*100}%`}}/></div><small>Regret <b>{displayScore(row.regret)}</b>{row.regret<=1e-10?' · replay comparator':''}</small></div>)}
      <p className="small-note"><span className="legend-minimum"/> Lowest eligible loss <span className="legend-regret"/> Additional loss = regret</p>
      <details className="methodology"><summary>Exact values for this replay</summary><div className="table-scroll"><table><thead><tr><th>Plan</th><th>Loss</th><th>Regret</th><th>Worst regret</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><th>{planNames[row.id]}</th><td>{row.loss.toPrecision(12)}</td><td>{row.regret.toPrecision(12)}</td><td>{row.worst.toPrecision(12)}</td></tr>)}</tbody></table></div></details>
    </div>
  </section>;
}
