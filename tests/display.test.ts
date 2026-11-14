import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {analyze,validateAnalysisEvidence} from '../src/engine/analysis';
import {replayRows,scoreMargin} from '../src/components/display';

const read=(p:string)=>JSON.parse(readFileSync(`public/evidence/history/${p}`,'utf8'));
const evidence=validateAnalysisEvidence({...read('analysis-input.json'),precipitation:read('imerg-analysis-input.json')});

it('presentation rows and margins match the independently calculated full preference/calendar grid',async()=>{
  const oracle=read('interpretation-oracle.json');
  for(const expected of oracle.primaryCalendarGrid){
    const a=await analyze(evidence,{mode:'heat-and-rainfall',shift:expected.shift,heatWeight:expected.heatWeight,forbidden:[]});
    if(a.evaluation.state!=='evaluated')throw new Error('Unevaluated');
    const result=a.evaluation.result;
    for(const scenario of result.validScenarioIds)for(const row of replayRows(result,scenario)){
      expect(row.loss).toBeCloseTo(expected.lossMatrix[row.id][scenario],12);
      expect(row.regret).toBeCloseTo(expected.regretMatrix[row.id][scenario],12);
      expect(row.worst).toBeCloseTo(expected.worstRegrets[row.id],12);
    }
    const scores=Object.values(expected.worstRegrets as Record<string,number>).sort((a,b)=>a-b);
    expect(scoreMargin(result)).toBeCloseTo(scores[1]!-scores[0]!,12);
  }
},20000);

it('presentation preserves no-competitor and no-eligible outcomes instead of inventing margins',async()=>{
  for(const forbidden of [['soybean'] as const,['sunflower'] as const]){
    const a=await analyze(evidence,{mode:'heat-and-rainfall',shift:0,heatWeight:.5,forbidden});
    if(a.evaluation.state!=='evaluated')throw new Error('Unevaluated');
    expect(scoreMargin(a.evaluation.result)).toBeNull();
    expect(replayRows(a.evaluation.result,'unknown')).toEqual([]);
    if(forbidden[0]==='sunflower')expect(replayRows(a.evaluation.result,'fixed-2015-2019')).toEqual([]);
  }
});
