import type { DecisionResult } from '../domain/contracts';
import type { CropYearExposure, NextEvidenceItem, Crop } from '../domain/contracts';
import type { AnalysisOptions } from '../engine/analysis';
import { numericalPolicy } from '../engine/decision';

export const planNames:Record<string,string>={baseline:'Baseline',a:'Alternative A',b:'Alternative B'};
export const planLabel=(ids:readonly string[])=>ids.map(id=>planNames[id]??id).join(' + ')||'None';
export const displayScore=(value:number|undefined)=>value===undefined?'—':value.toFixed(4);
/** Presentation projection only. Read the engine matrices; never reconstruct regret. */
export function replayRows(result:DecisionResult, scenarioId:string){
  const c=result.computation;
  if(!c||!result.validScenarioIds.includes(scenarioId))return [];
  return result.activeCandidateIds.map(id=>({id,loss:c.lossMatrix[id]![scenarioId]!,regret:c.regretMatrix[id]![scenarioId]!,worst:c.worstRegrets[id]!}));
}
export function scoreMargin(result:DecisionResult):number|null {
  if(!result.computation)return null;
  const scores=result.activeCandidateIds.map(id=>result.computation!.worstRegrets[id]!).sort((a,b)=>a-b);
  return scores.length>1?scores[1]!-scores[0]!:null;
}

export function scoreSummary(result:DecisionResult){
  if(!result.computation)return null;
  const sorted=result.activeCandidateIds.map(id=>({id,value:result.computation!.worstRegrets[id]!})).sort((a,b)=>a.value-b.value||a.id.localeCompare(b.id));
  return {best:sorted[0]!,next:sorted[1]??null,margin:scoreMargin(result)};
}
export function replayLeaders(result:DecisionResult,scenarioId:string){
  return replayRows(result,scenarioId).filter(row=>row.regret<=numericalPolicy.tieTolerance).map(row=>row.id);
}
export function highestHeat(rows:readonly CropYearExposure[]){
  const valid=rows.filter(r=>r.indicator==='heat-fraction'&&r.physical.status==='valid');
  if(!valid.length)return null;
  const maximum=Math.max(...valid.map(r=>r.physical.status==='valid'?r.physical.quantity.value:-Infinity));
  return {value:maximum,years:valid.filter(r=>r.physical.status==='valid'&&r.physical.quantity.value===maximum).map(r=>r.assignedYear).sort((a,b)=>a-b)};
}
export function branchEffect(before:DecisionResult|null,after:DecisionResult|null){
  if(after?.status==='NO_ELIGIBLE_ROTATION')return 'No eligible decision.';
  if(!before?.computation||!after?.computation)return 'Comparison availability changed or unresolved.';
  const same=(a:readonly string[],b:readonly string[])=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
  if(!same(before.preferredSet,after.preferredSet))return 'Preferred set changed.';
  if(!same(before.activeCandidateIds,after.activeCandidateIds))return 'Eligibility changed.';
  const a=scoreMargin(before),b=scoreMargin(after);
  if(a!==null&&b!==null&&Math.abs(a-b)>numericalPolicy.tieTolerance)return 'Margin changed; preferred candidate unchanged.';
  return 'No change in the displayed decision state.';
}
/** Map an existing declared answer onto the authoritative shared options. */
export function applyPreview(options:AnalysisOptions,item:NextEvidenceItem,answerId:string):AnalysisOptions {
  if(!item.answerOptions.some(a=>a.id===answerId))throw new Error('Undeclared preview answer');
  if(item.questionId==='relative-exposure-preference'){
    const heatWeight=Number(answerId.slice('heat-'.length));
    if(![0,.25,.5,.75,1].includes(heatWeight))throw new Error('Invalid preference answer');
    return {...options,heatWeight};
  }
  const crop:Crop|null=item.questionId==='permission-soybean'?'soybean':item.questionId==='permission-sunflower'?'sunflower':null;
  if(!crop||!['allowed','forbidden'].includes(answerId))throw new Error('Unsupported preview');
  return {...options,forbidden:answerId==='allowed'?options.forbidden.filter(c=>c!==crop):[...new Set([...options.forbidden,crop])]};
}
