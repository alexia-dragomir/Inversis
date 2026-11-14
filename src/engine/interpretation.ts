import type { AnalysisEvidence } from '../data/analysis-contract';
import type { DecisionResult, NormalizationReference, SensitivityResult } from '../domain/contracts';
import type { Analysis } from './analysis';
import { evaluateComparison, numericalPolicy } from './decision.ts';
import { fingerprint } from './canonical.ts';

/** Diagnostic only: nearest-rank empirical P10/P90 of the SAME forty unshifted
 * crop-years. No interpolation of observations; no change to primary bounds. */
export function percentileEvidence(evidence: AnalysisEvidence, includePrecipitation = true): AnalysisEvidence {
  const references=(rows:AnalysisEvidence['cropYearExposures'],refs:readonly NormalizationReference[])=>refs.map(ref=>{
    const values=rows.filter(e=>e.calendarShiftDays===0&&e.indicator===ref.indicator&&e.physical.status==='valid').map(e=>e.physical.status==='valid'?e.physical.quantity.value:NaN).sort((a,b)=>a-b);
    if(values.length!==40||values.some(v=>!Number.isFinite(v)))throw new Error('Percentile diagnostic requires the fixed forty complete crop-years');
    return {...ref,id:`${ref.id}-nearest-rank-p10-p90`,lower:{...ref.lower,value:values[3]!},upper:{...ref.upper,value:values[35]!},populationDefinition:`${ref.populationDefinition} Diagnostic nearest-rank P10/P90: sorted positions 4 and 36 of 40; fixed under exclusions and shifts.`,processingVersion:'nearest-rank-p10-p90-v1'};
  });
  return {...evidence,references:references(evidence.cropYearExposures,evidence.references),...(includePrecipitation&&evidence.precipitation?{precipitation:{...evidence.precipitation,references:references(evidence.precipitation.cropYearExposures,evidence.precipitation.references)}}:{})};
}

export function interpretation(analysis:Analysis, preference:SensitivityResult){
  const decision=analysis.evaluation.state==='evaluated'?analysis.evaluation.result:null;
  if(!decision?.computation)return {kind:'unresolved' as const,decision,margin:null,scenarioBest:[],pairs:[],indicatorLosses:[],identical:false};
  const ids=decision.activeCandidateIds,scenarios=decision.validScenarioIds;
  const indicatorLosses=analysis.weights.map(w=>{
    const result=evaluateComparison({...analysis,...numericalPolicy,fingerprint:analysis.inputFingerprint,weights:analysis.weights.map(x=>({...x,weight:x.indicator===w.indicator?1:0}))});
    if(result.state!=='evaluated'||!result.result.computation)throw new Error('Cannot decompose an incomplete comparison');
    return {indicator:w.indicator,loss:result.result.computation.lossMatrix};
  });
  const pairs=ids.flatMap((a,i)=>ids.slice(i+1).map(b=>{
    const differences=indicatorLosses.flatMap(e=>scenarios.map(s=>e.loss[a]![s]!-e.loss[b]![s]!));
    return {a,b,lower:differences.filter(v=>v < -numericalPolicy.tieTolerance).length,equal:differences.filter(v=>Math.abs(v)<=numericalPolicy.tieTolerance).length,higher:differences.filter(v=>v > numericalPolicy.tieTolerance).length,total:differences.length};
  }));
  const identical=pairs.length>0&&pairs.every(p=>p.equal===p.total);
  const dominant=ids.find(id=>ids.filter(other=>other!==id).every(other=>indicatorLosses.every(e=>scenarios.every(s=>e.loss[id]![s]!<=e.loss[other]![s]!+numericalPolicy.tieTolerance))));
  const scores=Object.values(decision.computation.worstRegrets).sort((a,b)=>a-b);
  const currentSet=JSON.stringify([...decision.preferredSet].sort());
  const changed=preference.sampledConfigurations.some(p=>p.decision.computation&&JSON.stringify([...p.decision.preferredSet].sort())!==currentSet);
  const kind=ids.length===1?'single-candidate':identical?'identical-exposures':decision.preferredSet.length>1?'tied':dominant?'pointwise-dominance':changed?'sampled-change':'sampled-invariance';
  const scenarioBest=scenarios.map(id=>{
    const values=ids.map(c=>decision.computation!.lossMatrix[c]![id]!);const min=Math.min(...values);
    return {id,preferred:ids.filter(c=>decision.computation!.lossMatrix[c]![id]!-min<=numericalPolicy.tieTolerance),spread:Math.max(...values)-min};
  });
  return {kind,decision,margin:scores.length>1?scores[1]!-scores[0]!:null,scenarioBest,pairs,indicatorLosses,identical} as const;
}

export async function omitReplaySensitivity(analysis:Analysis):Promise<SensitivityResult>{
  const sampledConfigurations=await Promise.all(analysis.scenarios.filter(s=>s.validity==='valid').map(async omitted=>{
    const scenarios=analysis.scenarios.map(s=>s.id===omitted.id?{...s,validity:'excluded' as const,exclusionReasons:['Diagnostic omission of one historical replay; not a source quality failure.']}:s);
    const result=evaluateComparison({...analysis,...numericalPolicy,scenarios,fingerprint:await fingerprint({input:analysis.inputFingerprint,omitted:omitted.id})});
    if(result.state!=='evaluated')throw new Error('Invalid replay omission diagnostic');
    return {id:`omit-${omitted.id}`,description:`Omit ${omitted.fiveYearStart}–${omitted.fiveYearEnd}`,decision:result.result};
  }));
  const base=analysis.evaluation.state==='evaluated'?analysis.evaluation.result:null;
  const observedReversals=base?.computation?sampledConfigurations.filter(p=>p.decision.computation&&!samePreferred(base,p.decision)).map(p=>({fromId:'all-replays',toId:p.id,distance:1})):[];
  return {axis:'historical-replay',sampledConfigurations:[...(base?[{id:'all-replays',description:'Primary · all complete replays',decision:base}]:[]),...sampledConfigurations],gridResolution:'Omit one complete five-year replay at a time',distanceMetric:'One omitted replay; overlapping years remain in other replays',observedReversals,untestedDomainNotice:'Influence diagnostic, not resampling confidence or independent validation. At least two shared scenarios still required.',linkedDecisionFingerprint:analysis.analysisFingerprint};
}

export function samePreferred(a:DecisionResult,b:DecisionResult){return Boolean(a.computation&&b.computation)&&JSON.stringify([...a.preferredSet].sort())===JSON.stringify([...b.preferredSet].sort());}
