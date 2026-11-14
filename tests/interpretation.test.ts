import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect,it } from 'vitest';
import { analyze,certificate,validateAnalysisEvidence, type Analysis } from '../src/engine/analysis';
import { interpretation,omitReplaySensitivity,percentileEvidence } from '../src/engine/interpretation';
import { preferenceSensitivity } from '../src/engine/stability';
import { evaluateComparison,numericalPolicy } from '../src/engine/decision';

const root='public/evidence/history';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const evidence=validateAnalysisEvidence({...read(`${root}/analysis-input.json`),precipitation:read(`${root}/imerg-analysis-input.json`)});
const options={mode:'heat-and-rainfall' as const,shift:0,heatWeight:.5,forbidden:[]};
const sweep=(a:Analysis)=>preferenceSensitivity({...a,...numericalPolicy,fingerprint:a.inputFingerprint},a.analysisFingerprint);
type OracleCase={heatWeight:number;shift:number;omitted:string|null;preferredSet:string[];worstRegrets:Record<string,number>;lossMatrix:Record<string,Record<string,number>>;regretMatrix:Record<string,Record<string,number>>};
const oracle=read(`${root}/interpretation-oracle.json`) as {sourceOracleSha256:string;codeSha256:string;percentileBounds:Record<'heat'|'dry',{lower:number;upper:number}>;primaryCalendarGrid:OracleCase[];percentileCalendarGrid:OracleCase[];replayOmissions:OracleCase[]};
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');

it('binds independent interpretation diagnostics to its source oracle and code',()=>{
  expect(oracle.sourceOracleSha256).toBe(sha(`${root}/combined-independent-oracle.json`));
  expect(oracle.codeSha256).toBe(sha('scripts/independent-interpretation.py'));
});

it('heat-only normalization never depends on completeness of attached rainfall reference rows',async()=>{
  const rain=evidence.precipitation!;
  const damaged={...evidence,precipitation:{...rain,cropYearExposures:rain.cropYearExposures.map(e=>({...e,physical:{status:'missing' as const,reason:'Synthetic missing reference support'}}))}};
  expect(()=>percentileEvidence(damaged)).toThrow('forty complete');
  const actual=await analyze(percentileEvidence(damaged,false),{...options,mode:'heat-only'});
  const expected=await analyze(percentileEvidence(evidence,false),{...options,mode:'heat-only'});
  expect(actual.evaluation).toEqual(expected.evaluation);
});

it('distinguishes sampled invariance from pointwise dominance and reveals different replay comparators',async()=>{
  const a=await analyze(evidence,options),i=interpretation(a,await sweep(a));
  expect(i.kind).toBe('sampled-invariance');expect(i.margin).toBeCloseTo(.0883336176019103,12);
  expect(i.scenarioBest.map(s=>s.preferred)).toEqual([['a'],['baseline'],['baseline'],['b'],['baseline'],['baseline']]);
  expect(i.pairs).toContainEqual({a:'baseline',b:'a',lower:9,equal:0,higher:3,total:12});
  expect(i.pairs).toContainEqual({a:'baseline',b:'b',lower:9,equal:1,higher:2,total:12});
});

it('keeps ties, identical scored exposures, sole eligibility and refusal distinct',async()=>{
  const a=await analyze(evidence,options);
  const scenarios=a.scenarios.map(s=>({...s,cropYearExposureByCandidate:Object.fromEntries(Object.entries(s.cropYearExposureByCandidate).map(([id,rows])=>[id,rows.map(e=>({...e,physical:{status:'valid' as const,quantity:{value:e.indicator==='heat-fraction'?0:5,unit:e.indicator==='heat-fraction'?'fraction' as const:'days' as const},flags:['synthetic-test-only']}}))]))}));
  const tied={...a,scenarios,evaluation:evaluateComparison({...a,scenarios,...numericalPolicy,fingerprint:a.inputFingerprint})};
  expect(interpretation(tied,await sweep(tied)).kind).toBe('identical-exposures');
  const sole=await analyze(evidence,{...options,forbidden:['soybean']});
  expect(interpretation(sole,await sweep(sole)).kind).toBe('single-candidate');
  const missing=await analyze(validateAnalysisEvidence(read(`${root}/analysis-input.json`)),options);
  expect(interpretation(missing,await sweep(missing)).kind).toBe('unresolved');
  if(a.evaluation.state!=='evaluated'||!a.evaluation.result.computation)throw new Error('Expected actual computation');
  const scoreTie={...a,evaluation:{state:'evaluated' as const,result:{...a.evaluation.result,status:'TIED_PREFERENCE' as const,preferredSet:['baseline','a'] as const}}};
  expect(interpretation(scoreTie,await sweep(scoreTie)).kind).toBe('tied');
});

it('matches independent arithmetic for all 105 primary and 105 percentile weight/calendar configurations',async()=>{
  const alternative=percentileEvidence(evidence);
  expect(alternative.references[0]!.upper.value).toBe(oracle.percentileBounds.heat.upper);
  expect(alternative.precipitation!.references[0]!.lower.value).toBe(7);
  expect(alternative.precipitation!.references[0]!.upper.value).toBe(18);
  expect(evidence.precipitation!.references[0]!.upper.value).toBe(27);
  for(const [data,cases] of [[evidence,oracle.primaryCalendarGrid],[alternative,oracle.percentileCalendarGrid]] as const){
    expect(cases).toHaveLength(105);
    for(const expected of cases){
      const a=await analyze(data,{...options,shift:expected.shift,heatWeight:expected.heatWeight});
      if(a.evaluation.state!=='evaluated'||!a.evaluation.result.computation)throw new Error('Expected actual diagnostic');
      expect(a.evaluation.result.preferredSet).toEqual(expected.preferredSet);
      for(const [id,losses] of Object.entries(expected.lossMatrix))for(const [s,v] of Object.entries(losses)){
        expect(a.evaluation.result.computation.lossMatrix[id]![s]).toBeCloseTo(v,12);
        expect(a.evaluation.result.computation.regretMatrix[id]![s]).toBeCloseTo(expected.regretMatrix[id]![s]!,12);
      }
    }
  }
},20000);

it('replay omissions preserve common minima and fixed references and match independent influence calculations',async()=>{
  const a=await analyze(evidence,options),diagnostic=await omitReplaySensitivity(a);
  expect(diagnostic.sampledConfigurations).toHaveLength(7);
  for(const expected of oracle.replayOmissions){
    const actual=diagnostic.sampledConfigurations.find(p=>p.id===`omit-${expected.omitted}`)!.decision;
    expect(actual.validScenarioIds).toHaveLength(5);expect(actual.validScenarioIds).not.toContain(expected.omitted);
    expect(actual.normalization).toEqual(a.references);expect(actual.preferredSet).toEqual(expected.preferredSet);
    for(const [id,v] of Object.entries(expected.worstRegrets))expect(actual.computation!.worstRegrets[id]).toBeCloseTo(v,12);
  }
  const exported=await certificate(evidence,a,[],[diagnostic]);
  expect(exported.sensitivity).toEqual([diagnostic]);expect(exported.processingHashes['src/engine/analysis.ts']).toBeDefined();
});
