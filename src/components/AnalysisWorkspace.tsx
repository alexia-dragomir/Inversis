import { useEffect, useState } from 'react';
import type { Step } from '../App';
import type { AnalysisEvidence } from '../data/analysis-contract';
import type { Crop, DecisionCertificate, NextEvidenceItem } from '../domain/contracts';
import { analyze, certificate, diagnosticSensitivity, nextEvidence, validateAnalysisEvidence, type Analysis, type AnalysisOptions } from '../engine/analysis';

const cropNames: readonly Crop[] = ['wheat','maize','sunflower','soybean'];
const names: Record<string,string> = {baseline:'Baseline',a:'Alternative A',b:'Alternative B'};
const labelSet = (ids: readonly string[]) => ids.length ? ids.map(id=>names[id]??id).join(' + ') : 'None';
const percent = (n: number) => `${(n*100).toFixed(1)}%`;
const score = (n: number|undefined) => n === undefined ? '—' : n.toFixed(4);
interface Bundle { analysis: Analysis; shifts: readonly Analysis[]; phases: readonly Analysis[]; next: readonly NextEvidenceItem[]; certificate: DecisionCertificate }

export function AnalysisWorkspace({step}: {step: Step}) {
  const [evidence,setEvidence] = useState<AnalysisEvidence|null>(null);
  const [options,setOptions] = useState<AnalysisOptions>({mode:'heat-only',shift:0,forbidden:[]});
  const [bundle,setBundle] = useState<Bundle|null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(true);
  const [scenarioIndex,setScenarioIndex] = useState(0);
  useEffect(()=>{let cancelled=false; fetch('/evidence/history/analysis-input.json').then(r=>{if(!r.ok)throw new Error('Evidence file unavailable');return r.json() as Promise<unknown>;}).then(validateAnalysisEvidence).then(d=>{if(!cancelled)setEvidence(d);}).catch(e=>{if(!cancelled){setError(String(e));setBusy(false);}});return()=>{cancelled=true;};},[]);
  useEffect(()=>{
    if(!evidence)return;
    let cancelled=false;
    const run=async()=>{
      const analysis=await analyze(evidence,options);
      const [shifts,phases,next]=await Promise.all([
        Promise.all([-14,-7,0,7,14].map(shift=>analyze(evidence,{...options,shift}))),
        Promise.all([0,1,2,3,4].map(phase=>analyze(evidence,{...options,phase}))),
        nextEvidence(evidence,analysis),
      ]);
      const audit=await certificate(evidence,analysis,next,[diagnosticSensitivity(analysis,shifts,'crop-window'),diagnosticSensitivity(analysis,phases,'cyclic-phase')]);
      if(!cancelled){setBundle({analysis,shifts,phases,next,certificate:audit});setBusy(false);}
    };
    run().catch(e=>{if(!cancelled){setError(String(e));setBusy(false);}});
    return()=>{cancelled=true;};
  },[evidence,options]);
  const update=(next: AnalysisOptions)=>{setBusy(true);setError('');setOptions(next);};
  const toggle=(crop: Crop)=>update({...options,forbidden:options.forbidden.includes(crop)?options.forbidden.filter(c=>c!==crop):[...options.forbidden,crop]});
  if(error)return <section className="readiness-panel" role="alert"><h1>Evidence could not be verified.</h1><p>{error}</p><p>No comparison is displayed. Reload after checking the evidence files.</p></section>;
  if(!evidence||!bundle)return <section className="readiness-panel" role="status"><h1>Verifying the evidence…</h1><p>Loading source-backed crop-year records and recomputing the comparison.</p></section>;
  const {analysis}=bundle;
  const result=analysis.evaluation.state==='evaluated'?analysis.evaluation.result:null;
  const computation=result?.computation;
  const scenario=analysis.scenarios[scenarioIndex]!;
  const exportCertificate=()=>{
    const blob=new Blob([JSON.stringify(bundle.certificate,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`inversis-${bundle.certificate.fingerprint.slice(0,12)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <>
    <section className="analysis-heading"><p className="eyebrow">{step} / Decision assurance</p><h1>{step==='context'?'Start with what is known.':step==='decision'?'A conditional comparison.':step==='stability'?'Know what would change the decision.':'An answer you can trace.'}</h1><p className="lead">{options.mode==='heat-only'?'Reduced heat-only model · Real NASA POWER evidence · 2015–2024':'Combined heat + rainfall model · Historical precipitation evidence incomplete'}</p></section>
    <section className="control-panel" aria-label="Analysis controls">
      <label>Evidence model<select value={options.mode} onChange={e=>update({...options,mode:e.target.value as AnalysisOptions['mode']})}><option value="heat-only">Heat only · validated history</option><option value="heat-and-rainfall">Heat + rainfall · insufficient evidence</option></select></label>
      <label>Crop-window shift<select value={options.shift} onChange={e=>update({...options,shift:Number(e.target.value)})}>{[-14,-7,0,7,14].map(shift=><option value={shift} key={shift}>{shift===0?'Provisional dates':`${shift>0?'+':''}${shift} days`}</option>)}</select></label>
      <fieldset><legend>What-if crop exclusions · hypothetical</legend><div className="check-row">{cropNames.map(crop=><label key={crop}><input type="checkbox" checked={options.forbidden.includes(crop)} onChange={()=>toggle(crop)}/>{crop}</label>)}</div></fieldset>
      <button className="text-button" onClick={()=>update({mode:'heat-only',shift:0,forbidden:[]})}>Reset assumptions</button>
    </section>
    <p className="small-note">Threshold ≥35°C and crop windows are illustrative assumptions, not calibrated crop damage. No field soil, disease, crop history or farmer permissions are established.</p>
    <div role="status" aria-live="polite" className="calculation-status">{busy?'Recomputing from the selected assumptions…':`${result?.status.replaceAll('_',' ').toLowerCase()??'Invalid configuration'} · ${result?.validScenarioIds.length??0} common complete scenarios`}</div>
    <div aria-busy={busy} className={busy?'results-updating':''}>
    {!busy&&step==='context'&&<>
      <div className="metric-grid"><article><span>POWER daily coverage</span><strong>{evidence.dailyCoverage.valid.toLocaleString()} / {evidence.dailyCoverage.expected.toLocaleString()}</strong><small>UTC daily maxima · °C · 0 missing days</small></article><article><span>IMERG validated coverage</span><strong>1 day</strong><small>1 January 2024 · 0 mm/day · 48 valid half-hours</small></article><article><span>Common scenarios</span><strong>{result?.validScenarioIds.length??0} / 6</strong><small>{options.mode==='heat-only'?'Heat-only historical replays':'Combined model withheld'}</small></article></div>
      <section className="section"><h2>Bărăgan Plain, Romania</h2><p>44.565° N, 27.335° E is an extraction location, not a measured farm. POWER uses modeled gridded temperature; its native cell center is not returned. IMERG’s inspected native cell is centered at 44.55° N, 27.35000038° E (0.1° grid).</p><div className="table-scroll"><table><caption>Fixed-start five-year plans</caption><thead><tr><th>Plan</th>{[1,2,3,4,5].map(y=><th key={y}>Year {y}</th>)}<th>Eligibility</th></tr></thead><tbody>{analysis.candidates.map(c=><tr key={c.id}><th>{c.name}</th>{c.fiveYearOrderedCrops.map((crop,i)=><td key={i}>{crop}</td>)}<td>{c.agronomicScreening.toLowerCase()}</td></tr>)}</tbody></table></div><p className="small-note">A and B contain the same crops in different orders. Conditional means unresolved field evidence; it does not mean unsuitable or certified suitable.</p></section>
      <section className="section"><h2>Evidence and assumptions stay separate.</h2><div className="evidence-grid"><article><h3>NASA evidence</h3><p>Daily raw responses, units, coverage checks and hashes retained. The full rainfall history remains unavailable.</p></article><article><h3>Model assumptions</h3><p>Four provisional crop windows, a 35°C heat threshold, equal crop-year weight and fixed pooled reference bounds.</p></article><article><h3>Hypothetical constraints</h3><p>Crop exclusions above are exploratory answers. They are not asserted farmer facts or agronomic hard rules.</p></article><article><h3>Unknown field facts</h3><p>Soil, drainage, disease, previous crops, irrigation and management need independent assessment.</p></article></div></section>
      <a className="button" href="#decision">Inspect the comparison ↗</a>
    </>}
    {!busy&&step==='decision'&&<>
      <ResultSummary analysis={analysis}/>
      {computation&&<>
        <div className="table-scroll"><table><caption>Relative heat exposure only · normalized scores from 0 to 1</caption><thead><tr><th>Candidate</th><th>Worst regret ↓</th><th>Average weighted exposure ↓</th><th>Interpretation</th></tr></thead><tbody>{analysis.candidates.map(c=><tr key={c.id} className={result?.preferredSet.includes(c.id)?'preferred-row':''}><th>{c.name}</th><td>{score(computation.worstRegrets[c.id])}</td><td>{score(computation.averageLossBenchmark.meanLossByCandidate[c.id])}</td><td>{c.agronomicScreening==='EXCLUDED'?'Excluded by hypothetical constraint':result?.preferredSet.includes(c.id)?'In preferred set · provisional':'Conditional comparison candidate'}</td></tr>)}</tbody></table></div>
        <div className="score-bars" aria-label="Worst regret comparison">{Object.entries(computation.worstRegrets).map(([id,value])=><div key={id}><span>{names[id]}</span><div className="bar-track"><div style={{width:`${value*100}%`}}/></div><strong>{score(value)}</strong></div>)}</div>
        <p>Average-loss benchmark: <strong>{labelSet(computation.averageLossBenchmark.preferredSet)}</strong>. The two methods {computation.averageLossBenchmark.relationToMinimax==='agree'?'agree':computation.averageLossBenchmark.relationToMinimax==='diverge'?'select different sets':'include a tie'}, using the same candidates and scenario loss matrix.</p>
        <section className="section"><div className="section-heading"><h2>From physical exposure to comparison</h2><label>Historical replay<select value={scenarioIndex} onChange={e=>setScenarioIndex(Number(e.target.value))}>{analysis.scenarios.map((s,i)=><option key={s.id} value={i}>{s.fiveYearStart}–{s.fiveYearEnd}</option>)}</select></label></div><div className="table-scroll"><table><caption>Actual hot-day counts within the selected crop windows</caption><thead><tr><th>Plan</th><th>Crop / year</th><th>UTC crop window</th><th>Days ≥35°C</th><th>Heat fraction</th></tr></thead><tbody>{Object.entries(scenario.cropYearExposureByCandidate).flatMap(([id,rows])=>rows.map(e=><tr key={`${id}-${e.assignedYear}`}><th>{names[id]}</th><td>{e.crop} · {e.assignedYear}</td><td>{e.windowStartUTC.slice(0,10)} to {new Date(Date.parse(e.windowEndUTC)-86400000).toISOString().slice(0,10)}</td><td>{e.physical.status==='valid'?Math.round(e.physical.quantity.value*e.coverage.expectedDays):'—'} / {e.coverage.expectedDays}</td><td>{e.physical.status==='valid'?percent(e.physical.quantity.value):'Missing'}</td></tr>))}</tbody></table></div><p className="small-note">Normalize each crop-year against the fixed pooled range {percent(evidence.references[0]!.lower.value)}–{percent(evidence.references[0]!.upper.value)}, then average five crop-years. These relative scores do not imply equal biological vulnerability across crops.</p></section>
      </>}
      <section className="section"><h2>The calculation</h2><p><code>L(r,s,w) = Σ wₖ Eₖ(r,s)</code><br/><code>R(r,s,w) = L(r,s,w) − min eligible L(q,s,w)</code></p><p>Minimize the worst scenario regret. Ties within 10⁻¹⁰ are retained. Eligibility is applied before every scenario minimum. The heat-only weight is fixed at 1; it is a mathematical property of the reduced model, not an inferred farmer preference.</p></section>
      <a className="button" href="#stability">Test what changes the result ↗</a>
    </>}
    {!busy&&step==='stability'&&<>
      <ResultSummary analysis={analysis}/>
      <section className="section"><h2>Preference sensitivity</h2><p>The heat-only weight domain contains one point: heat = 100%. There is no meaningful preference boundary to estimate with one indicator. A two-indicator model uses a 21-point 5% sweep; three indicators use 231 weights. Those broader landscapes are withheld until their evidence is valid.</p></section>
      <section className="section"><h2>Crop-window sensitivity</h2><p>The same historical evidence and fixed normalization bounds are recomputed at five declared calendar shifts. A changed set here indicates dependence on crop-window assumptions, not a preference reversal.</p><DiagnosticTable analyses={bundle.shifts} axis="shift"/></section>
      <section className="section"><h2>Next Evidence</h2><p>These finite hypothetical branches recompute eligibility, scenario minima and regret. They do not assign probabilities or predict agronomic outcomes.</p><div className="next-evidence-grid">{bundle.next.map(item=><article className="readiness-panel" key={item.questionId}><p className="eyebrow">{item.consequence.replaceAll('_',' ')}</p><h3>{item.questionText}</h3>{item.outcomesByAnswer.map(branch=><p key={branch.answerId}><strong>{branch.answerId==='allowed'?'Permitted':'Prohibited'}:</strong> {branch.result.state==='evaluated'?labelSet(branch.result.result.preferredSet):'Unresolved'} <small>({branch.result.state==='evaluated'?branch.result.result.status.replaceAll('_',' ').toLowerCase():'invalid'})</small></p>)}<p>{item.actionText}</p><p className="small-note">Eligibility changed: {item.eligibilityChanged?'yes':'no'} · Preferred set changed: {item.preferredSetChanged?'yes':'no'}</p></article>)}</div><p>Field soil, drainage, disease and previous-crop questions remain <strong>unresolved</strong>: this model cannot defensibly quantify their effect. Historical IMERG data is the next source gap for a combined water-and-heat comparison.</p></section>
      <details className="methodology"><summary>Separate cyclic-phase diagnostic</summary><div className="method-content"><p>Five rotations of the candidate sequences are tested separately. They are not additional primary scenarios, and they do not alter the current fixed-start result.</p><DiagnosticTable analyses={bundle.phases} axis="phase"/></div></details>
      <a className="button" href="#certificate">Inspect the audit record ↗</a>
    </>}
    {!busy&&step==='certificate'&&<>
      <ResultSummary analysis={analysis}/><section className="readiness-panel"><p className="eyebrow">Reproducible decision record</p><h2>{options.mode==='heat-only'?'Reduced heat-only audit':'Insufficient-evidence audit'}</h2><p>Contains source manifests, raw units, exact crop windows, common scenarios, normalization, hypothetical exclusions, computed matrices or refusal, and Next Evidence branches.</p><button className="button" onClick={exportCertificate}>Download certificate JSON ↓</button><dl><div><dt>Model</dt><dd>{bundle.certificate.modelVersion}</dd></div><div><dt>Historical domain</dt><dd>2015–2024 · six overlapping five-year windows</dd></div><div><dt>Eligible scenarios</dt><dd>{result?.validScenarioIds.length??0}</dd></div><div><dt>Field suitability</dt><dd>Not established</dd></div></dl><p className="small-note">Canonical SHA-256 · generation timestamp excluded</p><code className="fingerprint">{bundle.certificate.fingerprint}</code><p className="small-note">This identifier supports integrity checks. It is not agricultural certification or NASA endorsement.</p></section><section className="section"><h2>Limits that travel with the result</h2><ul>{bundle.certificate.limitations.map(l=><li key={l}>{l}</li>)}</ul></section>
    </>}
    </div>
    <details className="methodology"><summary>Source evidence and provenance</summary><div className="method-content"><p><a href="/evidence/history/analysis-input.json">Reproducible analysis inputs</a> · <a href="/evidence/history/power/coverage.json">POWER coverage manifest</a> · <a href="/evidence/stage1/imerg.sample.json">IMERG one-day validation</a></p><div className="table-scroll"><table><caption>Actual NASA POWER captures, retained without interpolation</caption><thead><tr><th>Year</th><th>Raw NASA response</th><th>SHA-256 prefix</th><th>UTC retrieval</th></tr></thead><tbody>{evidence.sourceManifest.map((s,i)=><tr key={s.id}><th>{2015+i}</th><td><a href={`/evidence/history/power/${2015+i}.json`}>JSON</a> · <a href={`/evidence/history/power/${2015+i}.receipt.json`}>receipt</a></td><td><code>{s.sha256.slice(0,16)}…</code></td><td>{s.retrievalTimeUTC}</td></tr>)}</tbody></table></div><p>POWER API version is distinct from the unknown underlying collection/science version. IMERG is a satellite/gauge estimate; POWER is model-derived. No unverified SMAP moisture data is used.</p></div></details>
  </>;
}

function ResultSummary({analysis}:{analysis:Analysis}) {
  if(analysis.evaluation.state==='invalid-input')return <div role="alert" className="readiness-panel"><h2>Invalid analysis inputs</h2><p>{analysis.evaluation.issues.join(' ')}</p></div>;
  const r=analysis.evaluation.result;
  return <section className="result-panel"><p className="eyebrow">{r.status.replaceAll('_',' ')}</p><h2>{r.computation?labelSet(r.preferredSet):r.status==='NO_ELIGIBLE_ROTATION'?'No eligible rotation':'Insufficient evidence'}</h2>{r.computation?<><p>{r.computation.comparisonScope==='only-eligible-candidate'?'Only one eligible candidate remains. Zero regret reflects the absence of competitors; it is not proof of superiority.':'Preferred under the declared historical heat-exposure model and tested assumptions. All field suitability remains provisional.'}</p><p className="small-note">No yield, soil-health, disease-risk or future-climate claim is made.</p></>:<p>{r.reasons.join(' ')}</p>}</section>;
}
function DiagnosticTable({analyses,axis}:{analyses:readonly Analysis[];axis:'shift'|'phase'}) {
  return <div className="table-scroll"><table><caption>{axis==='shift'?'Five tested crop-window shifts':'Five separate cyclic phases'}</caption><thead><tr><th>Tested configuration</th><th>Preferred set</th><th>Status</th></tr></thead><tbody>{analyses.map(a=><tr key={axis==='shift'?a.options.shift:a.options.phase}><th>{axis==='shift'?`${a.options.shift>0?'+':''}${a.options.shift} days`:`Phase ${(a.options.phase??0)+1}`}</th><td>{a.evaluation.state==='evaluated'?labelSet(a.evaluation.result.preferredSet):'Unavailable'}</td><td>{a.evaluation.state==='evaluated'?a.evaluation.result.status.replaceAll('_',' ').toLowerCase():'Invalid'}</td></tr>)}</tbody></table></div>;
}
