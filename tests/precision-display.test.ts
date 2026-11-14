import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {analyze,nextEvidence,validateAnalysisEvidence,type AnalysisOptions} from '../src/engine/analysis';
import {applyPreview,branchEffect,highestHeat,replayLeaders,scoreSummary} from '../src/components/display';

const read=(name:string)=>JSON.parse(readFileSync(`public/evidence/history/${name}`,'utf8'));
const evidence=validateAnalysisEvidence({...read('analysis-input.json'),precipitation:read('imerg-analysis-input.json')});
const defaults:AnalysisOptions={mode:'heat-and-rainfall',shift:0,heatWeight:.5,forbidden:[]};

it('every applied answer reproduces its existing engine preview, including refusal and heat fallback',async()=>{
  const options:AnalysisOptions[]=[defaults,{...defaults,shift:7,heatWeight:.2},{...defaults,forbidden:['soybean']},{...defaults,forbidden:['sunflower']},{...defaults,mode:'heat-only'}];
  for(const o of options){
    const baseline=await analyze(evidence,o);
    for(const item of await nextEvidence(evidence,baseline))for(const branch of item.outcomesByAnswer){
      const applied=await analyze(evidence,applyPreview(o,item,branch.answerId));
      expect(applied.evaluation).toEqual(branch.result);
      expect(applied.analysisFingerprint).toBe(branch.fingerprint);
      expect(()=>applyPreview(o,item,'undeclared')).toThrow('Undeclared');
    }
  }
});

it('classifies preview consequences against the current analysis, including no eligible decision',async()=>{
  const before=await analyze(evidence,defaults);
  if(before.evaluation.state!=='evaluated')throw new Error('Invalid');
  const next=await nextEvidence(evidence,before);
  const result=(question:string,answer:string)=>{
    const b=next.find(n=>n.questionId===question)!.outcomesByAnswer.find(b=>b.answerId===answer)!;
    if(b.result.state!=='evaluated')throw new Error('Invalid branch');return b.result.result;
  };
  expect(branchEffect(before.evaluation.result,result('permission-soybean','forbidden'))).toBe('Eligibility changed.');
  expect(branchEffect(before.evaluation.result,result('permission-sunflower','forbidden'))).toBe('No eligible decision.');
  expect(branchEffect(before.evaluation.result,result('relative-exposure-preference','heat-0'))).toBe('Margin changed; preferred candidate unchanged.');
  expect(branchEffect(before.evaluation.result,result('relative-exposure-preference','heat-0.5'))).toBe('No change in the displayed decision state.');
  expect(branchEffect(null,null)).toContain('unresolved');
});

it('reports all tied peak years in chronological order and refuses an empty heat series',()=>{
  const rows=evidence.cropYearExposures.filter(r=>r.crop==='maize'&&r.calendarShiftDays===0);
  const peak=highestHeat(rows)!;
  expect(peak.years).toEqual([2024]);expect(peak.value).toBeCloseTo(41/62,14);
  // Explicit synthetic tie fixture, never included in public evidence.
  const best=rows.find(r=>r.assignedYear===2024)!;
  expect(highestHeat([{...best,assignedYear:2024},{...best,assignedYear:2015}])?.years).toEqual([2015,2024]);
  expect(highestHeat([])).toBeNull();
});

it('narrative scores and replay leaders agree with the independent default calculation',async()=>{
  const a=await analyze(evidence,defaults);if(a.evaluation.state!=='evaluated')throw new Error('Invalid');
  const r=a.evaluation.result,summary=scoreSummary(r)!;
  const oracle=read('interpretation-oracle.json').primaryCalendarGrid.find((p:{heatWeight:number;shift:number})=>p.heatWeight===.5&&p.shift===0);
  expect(summary.best.value).toBeCloseTo(oracle.worstRegrets.baseline,12);
  expect(summary.next!.value).toBeCloseTo(oracle.worstRegrets.a,12);
  for(const scenario of r.validScenarioIds){
    const ids=Object.keys(oracle.worstRegrets);const min=Math.min(...ids.map(id=>oracle.lossMatrix[id][scenario]));
    expect(replayLeaders(r,scenario)).toEqual(ids.filter(id=>Math.abs(oracle.lossMatrix[id][scenario]-min)<=1e-10));
  }
});
