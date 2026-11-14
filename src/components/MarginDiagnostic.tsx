import type { DecisionResult } from '../domain/contracts';
import { displayScore, planLabel, scoreMargin } from './display';

export function MarginDiagnostic({title,points,selected,onSelect}:{title:string;points:readonly {id:string;label:string;result:DecisionResult}[];selected?:string;onSelect?:(id:string)=>void}) {
  const max=Math.max(.01,...points.map(p=>scoreMargin(p.result)??0));
  return <figure className="margin-diagnostic"><figcaption>{title}<small>Minimax margin · second-lowest minus lowest worst regret · not confidence</small></figcaption><div className="margin-scale"><span>0</span><span>{displayScore(max)}</span></div>{points.map(p=>{const margin=scoreMargin(p.result);const contents=<><span className="diagnostic-label">{p.label}</span><span className="diagnostic-track"><i style={{width:`${100*(margin??0)/max}%`}}/></span><strong>{margin===null?'—':displayScore(margin)}</strong><small>{!p.result.computation?p.result.status.replaceAll('_',' ').toLowerCase():`${planLabel(p.result.preferredSet)} · ${p.result.activeCandidateIds.length===1?'sole candidate':'conditional'}`}</small></>;
    return onSelect?<button className="diagnostic-point" key={p.id} aria-pressed={selected===p.id} onClick={()=>onSelect(p.id)}>{contents}</button>:<div className="diagnostic-point" key={p.id}>{contents}</div>;
  })}<p className="small-note">— means no competitive margin can be established. Ties have zero margin. Scales are local to each diagnostic; compare the printed values across panels.</p></figure>;
}
