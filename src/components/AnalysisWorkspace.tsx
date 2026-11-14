import { useEffect, useState } from 'react';
import type { Step } from '../App';
import type { AnalysisEvidence } from '../data/analysis-contract';
import type { Crop, DecisionCertificate, NextEvidenceItem, SensitivityResult } from '../domain/contracts';
import { analyze, certificate, diagnosticSensitivity, nextEvidence, validateAnalysisEvidence, validatePrecipitationEvidence, type Analysis, type AnalysisOptions } from '../engine/analysis';
import { precipitationSamples } from '../data/precipitation-summary';
import { preferenceSensitivity } from '../engine/stability';
import { numericalPolicy } from '../engine/decision';
import { percentileEvidence, omitReplaySensitivity, samePreferred } from '../engine/interpretation';
import { DecisionExplanation, StabilityExplanation, MethodDiagnostics } from './AssurancePanels';
import { DecisionInstrument } from './DecisionInstrument';
import { EvidenceAtlas } from './EvidenceAtlas';
import { EvidenceBranch } from './PreferenceInstrument';
import { AuditRecord } from './AuditRecord';
import { scoreMargin } from './display';

const cropNames: readonly Crop[] = ['wheat','maize','sunflower','soybean'];
const names: Record<string,string> = {baseline:'Baseline',a:'Alternative A',b:'Alternative B'};
const labelSet = (ids: readonly string[]) => ids.length ? ids.map(id=>names[id]??id).join(' + ') : 'None';
const percent = (n: number) => `${(n*100).toFixed(1)}%`;
const score = (n: number|undefined) => n === undefined ? '—' : n.toFixed(4);
interface Bundle { analysis: Analysis; shifts: readonly Analysis[]; phases: readonly Analysis[]; next: readonly NextEvidenceItem[]; preference: SensitivityResult; normalization: SensitivityResult; omission: SensitivityResult; certificate: DecisionCertificate }

export function AnalysisWorkspace({step}: {step: Step}) {
  const [evidence,setEvidence] = useState<AnalysisEvidence|null>(null);
  const [options,setOptions] = useState<AnalysisOptions>({mode:'heat-only',shift:0,forbidden:[]});
  const [bundle,setBundle] = useState<Bundle|null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(true);
  const [scenarioIndex,setScenarioIndex] = useState(0);
  const [rainfallNotice,setRainfallNotice]=useState('');
  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      const response=await fetch(`${import.meta.env.BASE_URL}evidence/history/analysis-input.json`);if(!response.ok)throw new Error('POWER evidence unavailable');
      let data=validateAnalysisEvidence(await response.json());
      try{
        const rain=await fetch(`${import.meta.env.BASE_URL}evidence/history/imerg-analysis-input.json`);
        if(!rain.ok)throw new Error('Historical rainfall artifact unavailable');
        const precipitation=validatePrecipitationEvidence(await rain.json());
        data=validateAnalysisEvidence({...data,precipitation});
      }catch{if(!cancelled)setRainfallNotice('Historical rainfall evidence is unavailable or did not pass validation. The labeled heat-only fallback remains available; combined results are refused.');}
      if(!cancelled){setEvidence(data);if(data.precipitation)setOptions({mode:'heat-and-rainfall',shift:0,forbidden:[],heatWeight:.5});}
    };
    load().catch(e=>{if(!cancelled){setError(String(e));setBusy(false);}});
    return()=>{cancelled=true;};
  },[]);
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
      const preference=await preferenceSensitivity({...analysis,...numericalPolicy,fingerprint:analysis.inputFingerprint},analysis.analysisFingerprint);
      const alt=await analyze(percentileEvidence(evidence,options.mode==='heat-and-rainfall'),options);
      if(alt.evaluation.state!=='evaluated'||analysis.evaluation.state!=='evaluated')throw new Error('Invalid normalization comparison');
      const normalization:SensitivityResult={axis:'normalization',sampledConfigurations:[{id:'primary-min-max',description:'Primary · pooled minimum/maximum',decision:analysis.evaluation.result},{id:'nearest-rank-p10-p90',description:'Diagnostic · pooled P10/P90',decision:alt.evaluation.result}],gridResolution:'Two fixed reference protocols on the same forty unshifted crop-years',distanceMetric:'Categorical methodological comparison',observedReversals:analysis.evaluation.result.computation&&alt.evaluation.result.computation&&!samePreferred(analysis.evaluation.result,alt.evaluation.result)?[{fromId:'primary-min-max',toId:'nearest-rank-p10-p90',distance:1}]:[],untestedDomainNotice:'Nearest-rank empirical percentiles (positions 4 and 36 of 40), clipped to [0,1]. No observation interpolation. The diagnostic does not replace primary bounds.',linkedDecisionFingerprint:analysis.analysisFingerprint};
      const omission=await omitReplaySensitivity(analysis);
      const audit=await certificate(evidence,analysis,next,[preference,normalization,omission,diagnosticSensitivity(analysis,shifts,'crop-window'),diagnosticSensitivity(analysis,phases,'cyclic-phase')]);
      if(!cancelled){setBundle({analysis,shifts,phases,next,preference,normalization,omission,certificate:audit});setBusy(false);}
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
  const exportCertificate=()=>{
    const blob=new Blob([JSON.stringify(bundle.certificate,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`inversis-${bundle.certificate.fingerprint.slice(0,12)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <>
    <section className={`analysis-heading heading-${step}`}><p className="eyebrow">{step} / Decision assurance</p><h1>{step==='context'?'Know what would change the decision.':step==='decision'?'A conditional comparison.':step==='stability'?'Test the assumptions.':'An answer you can trace.'}</h1><p className="lead">{options.mode==='heat-only'?'Reduced heat-only model · Real NASA POWER evidence · 2015–2024':evidence.precipitation?'Two-indicator rainfall + heat model · NASA POWER and IMERG · 2015–2024':'Combined heat + rainfall model · Historical precipitation evidence incomplete'}</p></section>
    <details className="analysis-settings"><summary>Analysis settings <span>{options.mode==='heat-only'?'Heat only':`Heat ${Math.round((options.heatWeight??.5)*100)}% · dry spell ${100-Math.round((options.heatWeight??.5)*100)}%`} · {options.shift===0?'provisional calendar':`${options.shift>0?'+':''}${options.shift} days`} · {options.forbidden.length} exclusions</span></summary><section className="control-panel" aria-label="Analysis controls">
      <label>Evidence model<select value={options.mode} onChange={e=>update({...options,mode:e.target.value as AnalysisOptions['mode']})}><option value="heat-only">Heat only · validated history</option><option value="heat-and-rainfall">{evidence.precipitation?'Heat + rainfall · validated history':'Heat + rainfall · insufficient evidence'}</option></select></label>
      <label>Crop-window shift<select value={options.shift} onChange={e=>update({...options,shift:Number(e.target.value)})}>{[-14,-7,0,7,14].map(shift=><option value={shift} key={shift}>{shift===0?'Provisional dates':`${shift>0?'+':''}${shift} days`}</option>)}</select></label>
      <fieldset><legend>What-if crop exclusions · hypothetical</legend><div className="check-row">{cropNames.map(crop=><label key={crop}><input type="checkbox" checked={options.forbidden.includes(crop)} onChange={()=>toggle(crop)}/>{crop}</label>)}</div></fieldset>
      <button className="text-button" onClick={()=>update({mode:evidence.precipitation?'heat-and-rainfall':'heat-only',shift:0,forbidden:[],heatWeight:.5})}>Reset assumptions</button>
    </section>
    {rainfallNotice&&<p className="small-note">{rainfallNotice}</p>}
    {options.mode==='heat-and-rainfall'&&<section className="weight-control"><label htmlFor="heat-weight">Illustrative preference · heat {Math.round((options.heatWeight??.5)*100)}% / dry spell {100-Math.round((options.heatWeight??.5)*100)}%</label><select id="heat-weight" value={Math.round((options.heatWeight??.5)*100)} onChange={e=>update({...options,heatWeight:Number(e.target.value)/100})}>{Array.from({length:21},(_,i)=>i*5).map(heat=><option key={heat} value={heat}>Heat {heat}% / dry spell {100-heat}%</option>)}</select><p className="small-note">Weights express preferences over the declared normalized swings. They are hypothetical choices, not estimated crop vulnerability or inferred farmer preferences.</p></section>}
    </details><p className="small-note">Historical exposure model · provisional windows and ≥35°C threshold · field suitability unverified.</p>
    <div role="status" aria-live="polite" className="calculation-status">{busy?'Recomputing from the selected assumptions…':`${result?.status.replaceAll('_',' ').toLowerCase()??'Invalid configuration'} · ${result?.validScenarioIds.length??0} common complete scenarios`}</div>
    <div aria-busy={busy} className={busy?'results-updating':''}>
    {step==='context'&&<>
      <div className="metric-grid"><article><span>POWER daily coverage</span><strong>{evidence.dailyCoverage.valid.toLocaleString()} / {evidence.dailyCoverage.expected.toLocaleString()}</strong><small>UTC daily maxima · °C · 0 missing days</small></article><article><span>IMERG validated coverage</span><strong>{evidence.precipitation?`${evidence.precipitation.dailyCoverage.valid.toLocaleString()} / 3,653`:`${precipitationSamples.length} days`}</strong><small>{evidence.precipitation?'2015–2024 UTC · independent extraction checks':'1–7 January 2024 UTC · 48 valid half-hours each'}</small></article><article><span>Common scenarios</span><strong>{result?.validScenarioIds.length??0} / 6</strong><small>{options.mode==='heat-only'?'Heat-only historical replays':computation?'Shared rainfall + heat replays':'Combined model withheld'}</small></article></div>
      <EvidenceAtlas evidence={evidence} analysis={analysis}/><details className="methodology"><summary>Original seven-day IMERG sample · inspect retained observations</summary><section className="method-content"><h2>Actual precipitation sample</h2><p>{evidence.precipitation?'The first independently validated sample is shown below. The full history is retained separately in annual source archives and manifests.':'Seven winter days establish access and validation, not historical crop-window coverage. Full rainfall-and-heat comparisons remain unavailable.'}</p><div className="table-scroll"><table><caption>IMERG Final V07B · containing native cell</caption><thead><tr><th>UTC day</th><th>Daily rate (mm/day)</th><th>Valid half-hours</th><th>Original evidence</th></tr></thead><tbody>{precipitationSamples.map(s=><tr key={s.day}><th>{s.day}</th><td>{s.value.toFixed(2)}</td><td>{s.count} / 48</td><td><a href={`.${s.rawPath}`}>NetCDF4</a></td></tr>)}</tbody></table></div><p className="small-note">Rounded display only; original float32 values, timestamps and SHA-256 are retained in the <a href="./evidence/imerg-dap4/manifest.json">validation manifest</a>. An independent Python/HDF5 reader agrees with every value.</p></section></details>
      <section className="section"><h2>Evidence and assumptions stay separate.</h2><div className="evidence-grid"><article><h3>NASA evidence</h3><p>Daily raw responses, units, coverage checks and hashes retained. {evidence.precipitation?'Both source histories have passed independent processing checks.':'The full rainfall history remains unavailable.'}</p></article><article><h3>Model assumptions</h3><p>Four provisional crop windows, a 35°C heat threshold, equal crop-year weight and fixed pooled reference bounds.</p></article><article><h3>Hypothetical constraints</h3><p>Crop exclusions above are exploratory answers. They are not asserted farmer facts or agronomic hard rules.</p></article><article><h3>Unknown field facts</h3><p>Soil, drainage, disease, previous crops, irrigation and management need independent assessment.</p></article></div></section>
      <a className="button" href="#decision">Inspect the comparison ↗</a>
    </>}
    {step==='decision'&&<>
      <ResultSummary analysis={analysis}/>
      <DecisionInstrument analysis={analysis}/><DecisionExplanation analysis={analysis} preference={bundle.preference}/>
      {computation&&<>
        <details className="methodology"><summary>Full minimax scores and average-loss benchmark</summary><div className="method-content"><div className="table-scroll"><table><caption>{options.mode==='heat-only'?'Relative heat exposure only':'Relative rainfall + heat exposure'} · normalized scores from 0 to 1</caption><thead><tr><th>Candidate</th><th>Worst regret ↓</th><th>Average weighted exposure ↓</th><th>Interpretation</th></tr></thead><tbody>{analysis.candidates.map(c=><tr key={c.id} className={result?.preferredSet.includes(c.id)?'preferred-row':''}><th>{c.name}</th><td>{score(computation.worstRegrets[c.id])}</td><td>{score(computation.averageLossBenchmark.meanLossByCandidate[c.id])}</td><td>{c.agronomicScreening==='EXCLUDED'?'Excluded by hypothetical constraint':result?.preferredSet.includes(c.id)?'In preferred set · provisional':'Conditional comparison candidate'}</td></tr>)}</tbody></table></div>
        <p>Average-loss benchmark: <strong>{labelSet(computation.averageLossBenchmark.preferredSet)}</strong>. The two methods {computation.averageLossBenchmark.relationToMinimax==='agree'?'agree':computation.averageLossBenchmark.relationToMinimax==='diverge'?'select different sets':'include a tie'}, using the same candidates and scenario loss matrix.</p></div></details>
        <details className="methodology"><summary>Trace every crop window and physical value</summary><div className="method-content"><ExposureAudit analysis={analysis} scenarioIndex={scenarioIndex} onScenarioChange={setScenarioIndex}/></div></details>
      </>}
      <details className="methodology"><summary>The calculation · mathematical definitions</summary><section className="method-content"><h2>The calculation</h2><p><code>L(r,s,w) = Σ wₖ Eₖ(r,s)</code><br/><code>R(r,s,w) = L(r,s,w) − min eligible L(q,s,w)</code></p><p>Minimize the worst scenario regret. Ties within 10⁻¹⁰ are retained. Eligibility is applied before every scenario minimum. The heat-only weight is fixed at 1; it is a mathematical property of the reduced model, not an inferred farmer preference.</p></section></details>
      <a className="button" href="#stability">Test what changes the result ↗</a>
    </>}
    {step==='stability'&&<>
      <StabilityExplanation analysis={analysis} preference={bundle.preference} onWeight={heatWeight=>update({...options,heatWeight})}/>
      <PreferenceLandscape sweep={bundle.preference} analysis={analysis}/>
      <section className="section"><h2>Crop-window sensitivity</h2><p>The same historical evidence and fixed normalization bounds are recomputed at five declared calendar shifts. A changed set here indicates dependence on crop-window assumptions, not a preference reversal.</p><div className="calendar-strip">{bundle.shifts.map(a=>{const r=a.evaluation.state==='evaluated'?a.evaluation.result:null;return <article key={a.options.shift}><span>{a.options.shift>0?'+':''}{a.options.shift} days</span><strong>{r?.computation?labelSet(r.preferredSet):'Unresolved'}</strong><small>Minimax margin</small><b>{r&&scoreMargin(r)!==null?score(scoreMargin(r)!):'—'}</b></article>;})}</div><details className="methodology"><summary>Exact calendar diagnostic states</summary><DiagnosticTable analyses={bundle.shifts} axis="shift"/></details></section>
      <MethodDiagnostics normalization={bundle.normalization} omission={bundle.omission} analysis={analysis}/>
      <section className="section"><h2>Next Evidence</h2><p>These finite hypothetical branches recompute eligibility, scenario minima and regret. They do not assign probabilities or predict agronomic outcomes.</p><div className="next-evidence-grid">{bundle.next.map(item=><EvidenceBranch key={item.questionId} item={item}/>)}</div><p>Field soil, drainage, disease and previous-crop questions remain <strong>unresolved</strong>: this model cannot defensibly quantify their effect. {evidence.precipitation?'Locally relevant phenology and farmer preferences are still needed to interpret the combined comparison.':'Historical IMERG data is the next source gap for a combined water-and-heat comparison.'}</p></section>
      <details className="methodology"><summary>Separate cyclic-phase diagnostic</summary><div className="method-content"><p>Five rotations of the candidate sequences are tested separately. They are not additional primary scenarios, and they do not alter the current fixed-start result.</p><DiagnosticTable analyses={bundle.phases} axis="phase"/></div></details>
      <a className="button" href="#certificate">Inspect the audit record ↗</a>
    </>}
    {step==='certificate'&&<>
      <AuditRecord audit={bundle.certificate} onExport={exportCertificate} busy={busy}/>
    </>}
    </div>
    <details className="methodology"><summary>Source evidence and provenance</summary><div className="method-content"><p><a href="./evidence/history/analysis-input.json">Reproducible analysis inputs</a> · <a href="./evidence/history/power/coverage.json">POWER coverage manifest</a> · <a href="./evidence/imerg-dap4/manifest.json">IMERG sample validation</a>{evidence.precipitation&&<> · <a href="./evidence/history/imerg-analysis-input.json">Historical IMERG evidence</a></>}</p><div className="table-scroll"><table><caption>Actual NASA POWER captures, retained without interpolation</caption><thead><tr><th>Year</th><th>Raw NASA response</th><th>SHA-256 prefix</th><th>UTC retrieval</th></tr></thead><tbody>{evidence.sourceManifest.map((s,i)=><tr key={s.id}><th>{2015+i}</th><td><a href={`./evidence/history/power/${2015+i}.json`}>JSON</a> · <a href={`./evidence/history/power/${2015+i}.receipt.json`}>receipt</a></td><td><code>{s.sha256.slice(0,16)}…</code></td><td>{s.retrievalTimeUTC}</td></tr>)}</tbody></table></div>{evidence.precipitation&&<div className="table-scroll"><table><caption>Independent historical IMERG source archives</caption><thead><tr><th>Year</th><th>Retained original daily bytes</th><th>Exact daily receipts</th></tr></thead><tbody>{evidence.precipitation.sourceManifest.map((s,i)=><tr key={s.id}><th>{2015+i}</th><td><a href={`./evidence/history/imerg/${2015+i}.tar.gz`}>NetCDF archive</a></td><td><a href={`./evidence/history/imerg/${2015+i}.manifest.json`}>Daily manifest</a></td></tr>)}</tbody></table></div>}<p>POWER API version is distinct from the unknown underlying collection/science version. IMERG is a satellite/gauge estimate; POWER is model-derived. No unverified SMAP moisture data is used.</p></div></details>
  </>;
}

function ResultSummary({analysis}:{analysis:Analysis}) {
  if(analysis.evaluation.state==='invalid-input')return <div role="alert" className="readiness-panel"><h2>Invalid analysis inputs</h2><p>{analysis.evaluation.issues.join(' ')}</p></div>;
  const r=analysis.evaluation.result;
  return <section className="result-panel"><p className="eyebrow">{r.status.replaceAll('_',' ')}</p><h2>{r.computation?labelSet(r.preferredSet):r.status==='NO_ELIGIBLE_ROTATION'?'No eligible rotation':'Insufficient evidence'}</h2>{r.computation?<><p>{r.computation.comparisonScope==='only-eligible-candidate'?'Only one eligible candidate remains. Zero regret reflects the absence of competitors; it is not proof of superiority.':`Preferred under the declared historical ${analysis.options.mode==='heat-only'?'heat':'rainfall-and-heat'} exposure model and tested assumptions. All field suitability remains provisional.`}</p><p className="small-note">No yield, soil-health, disease-risk or future-climate claim is made.</p></>:<p>{r.reasons.join(' ')}</p>}</section>;
}
function DiagnosticTable({analyses,axis}:{analyses:readonly Analysis[];axis:'shift'|'phase'}) {
  return <div className="table-scroll"><table><caption>{axis==='shift'?'Five tested crop-window shifts':'Five separate cyclic phases'}</caption><thead><tr><th>Tested configuration</th><th>Preferred set</th><th>Minimax margin</th><th>Status</th></tr></thead><tbody>{analyses.map(a=><tr key={axis==='shift'?a.options.shift:a.options.phase}><th>{axis==='shift'?`${a.options.shift>0?'+':''}${a.options.shift} days`:`Phase ${(a.options.phase??0)+1}`}</th><td>{a.evaluation.state==='evaluated'?labelSet(a.evaluation.result.preferredSet):'Unavailable'}</td><td>{a.evaluation.state==='evaluated'&&scoreMargin(a.evaluation.result)!==null?score(scoreMargin(a.evaluation.result)!):'No comparison'}</td><td>{a.evaluation.state==='evaluated'?a.evaluation.result.status.replaceAll('_',' ').toLowerCase():'Invalid'}</td></tr>)}</tbody></table></div>;
}

function ExposureAudit({analysis,scenarioIndex,onScenarioChange}:{analysis:Analysis;scenarioIndex:number;onScenarioChange:(index:number)=>void}) {
  const scenario=analysis.scenarios[scenarioIndex]!;
  return <section className="section">
    <div className="section-heading"><h2>From physical exposure to comparison</h2><label>Historical replay<select value={scenarioIndex} onChange={e=>onScenarioChange(Number(e.target.value))}>{analysis.scenarios.map((s,i)=><option key={s.id} value={i}>{s.fiveYearStart}–{s.fiveYearEnd}{s.validity==='excluded'?' · excluded':''}</option>)}</select></label></div>
    <div className="table-scroll"><table><caption>Actual complete-window physical exposures before normalization</caption><thead><tr><th>Plan</th><th>Crop / year</th><th>UTC crop window</th><th>Indicator</th><th>Physical exposure</th><th>Daily coverage</th></tr></thead><tbody>{Object.entries(scenario.cropYearExposureByCandidate).flatMap(([id,rows])=>rows.map(e=><tr key={`${id}-${e.assignedYear}-${e.indicator}`}><th>{names[id]}</th><td>{e.crop} · {e.assignedYear}</td><td>{e.windowStartUTC.slice(0,10)} to {new Date(Date.parse(e.windowEndUTC)-86400000).toISOString().slice(0,10)}</td><td>{e.indicator==='heat-fraction'?'Days ≥35°C / window':'Longest run <1 mm/day'}</td><td>{e.physical.status==='valid'?(e.indicator==='heat-fraction'?`${Math.round(e.physical.quantity.value*e.coverage.expectedDays)} hot days · ${percent(e.physical.quantity.value)}`:`${e.physical.quantity.value} consecutive days`):'Missing / unverified'}</td><td>{e.coverage.validDays} / {e.coverage.expectedDays}</td></tr>))}</tbody></table></div>
    {analysis.references.map(ref=><p className="small-note" key={ref.id}>{ref.indicator}: fixed pooled range {ref.lower.unit==='fraction'?percent(ref.lower.value):`${ref.lower.value} ${ref.lower.unit}`} to {ref.upper.unit==='fraction'?percent(ref.upper.value):`${ref.upper.value} ${ref.upper.unit}`}.</p>)}
    <p className="small-note">Normalize each crop-year against its fixed reference, clip to [0,1], average five crop-years, then apply preference weights. These relative scores do not imply equal biological vulnerability across crops.</p>
  </section>;
}

function PreferenceLandscape({sweep,analysis}:{sweep:SensitivityResult;analysis:Analysis}) {
  const points=sweep.sampledConfigurations;
  const current=analysis.evaluation.state==='evaluated'?analysis.evaluation.result:null;
  const different=points.filter(p=>p.decision.computation&&current?.computation&&JSON.stringify([...p.decision.preferredSet].sort())!==JSON.stringify([...current.preferredSet].sort()));
  const distance=(point:typeof points[number])=>point.decision.weights.reduce((sum,w)=>sum+Math.abs(w.weight-(analysis.weights.find(a=>a.indicator===w.indicator)?.weight??0)),0);
  const nearest=different.length?Math.min(...different.map(distance)):null;
  return <details className="methodology"><summary>Sampled preference domain and boundary interpretation</summary><div className="method-content">
    {analysis.options.mode==='heat-only'?<p>The heat-only domain contains one point: heat = 100%. A preference boundary cannot be inferred from one indicator. Select the combined model to explore the 21-point grid when its evidence is available.</p>:<>
      <p>{current?.computation?(nearest===null?'No different preferred set was observed on this sampled grid.':`Nearest sampled different preferred set requires transferring ${(nearest*50).toFixed(0)} percentage points between heat and dry-spell weights (L1 distance ${nearest.toFixed(2)}). This is not an exact continuous boundary.`):'Historical evidence is insufficient; no stability region or boundary is asserted.'}</p>
      <p className="small-note">{sweep.observedReversals.length} neighboring tested preferred-set changes, including transitions into or out of ties. Sampled configurations are not probability mass.</p>
    </>}
    <p className="small-note">{sweep.untestedDomainNotice}</p>
  </div></details>;
}
