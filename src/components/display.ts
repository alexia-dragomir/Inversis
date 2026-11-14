import type { DecisionResult } from '../domain/contracts';

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
