import type { SensitivityResult } from '../domain/contracts';
import { fingerprint } from './canonical.ts';
import { evaluateComparison, weightSimplex, type ComparisonInput } from './decision.ts';
import { requireCondition } from '../data/ingestion/validation.ts';

/** Recompute every sampled preference with identical evidence, references and eligibility.
 * Edges are neighboring grid points, not estimated continuous decision boundaries.
 */
export async function preferenceSensitivity(input: ComparisonInput, linkedDecisionFingerprint: string): Promise<SensitivityResult> {
  const grid=weightSimplex(input.weights.map(w=>w.indicator));
  const sampledConfigurations=await Promise.all(grid.map(async(weights,i)=>{
    const hash=await fingerprint({input,weights,protocol:'simplex-five-percent-v1'});
    const decision=evaluateComparison({...input,weights,fingerprint:hash});
    requireCondition(decision.state==='evaluated','Invalid preference sweep configuration');
    return {id:`weight-${i}`,description:weights.map(w=>`${w.indicator}=${Math.round(w.weight*100)}%`).join('; '),decision:decision.result};
  }));
  const observedReversals:{fromId:string;toId:string;distance:number}[]=[];
  for(let i=0;i<grid.length;i++)for(let j=i+1;j<grid.length;j++){
    const distance=grid[i]!.reduce((sum,w,k)=>sum+Math.abs(w.weight-grid[j]![k]!.weight),0);
    if(Math.abs(distance-.1)>1e-10)continue;
    const a=sampledConfigurations[i]!,b=sampledConfigurations[j]!;
    if(!a.decision.computation||!b.decision.computation)continue;
    if(JSON.stringify([...a.decision.preferredSet].sort())!==JSON.stringify([...b.decision.preferredSet].sort()))observedReversals.push({fromId:a.id,toId:b.id,distance:Math.round(distance*100)/100});
  }
  return {axis:'preference',sampledConfigurations,gridResolution:`5 percentage-point simplex; ${grid.length} sampled weights`,distanceMetric:'L1 distance between complete weight vectors; adjacent transfer of 5 percentage points has distance 0.10',observedReversals,untestedDomainNotice:'Preferred-set changes only between tested neighboring weights; ties remain sets. No continuous boundary or probability claim. Missing evidence remains a refusal at every weight; zero weight does not silently waive the declared evidence domain.',linkedDecisionFingerprint};
}
