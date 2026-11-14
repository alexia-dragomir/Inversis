import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { analyze, certificate, nextEvidence, diagnosticSensitivity, validateAnalysisEvidence, validatePrecipitationEvidence } from '../src/engine/analysis';
import type { PrecipitationEvidence } from '../src/data/analysis-contract';
import type { Crop } from '../src/domain/contracts';

const heat=validateAnalysisEvidence(JSON.parse(readFileSync('public/evidence/history/analysis-input.json','utf8')));
// Explicit synthetic rainfall fixture for model-contract tests, never shipped as observations.
const dry:Record<Crop,number>={wheat:2,maize:8,sunflower:5,soybean:7};
function syntheticRain():PrecipitationEvidence{
  const sourceManifest=heat.sourceManifest.map((s,i)=>({...s,id:`synthetic-rain-${2015+i}`,rawUnit:'mm/day',collectionVersion:'07',scienceVersion:'V07B',sha256:'a'.repeat(64)}));
  return {schemaVersion:'inversis-precipitation-history-v1',dailyCoverage:{expected:3653,available:3653,valid:3653,missing:0},sourceManifest,cropYearExposures:heat.cropYearExposures.map(e=>({...e,indicator:'dry-spell',sourceRefs:[`synthetic-rain-${e.assignedYear}`],contributingObservationIds:e.contributingObservationIds.map(id=>id.replace('POWER.T2M_MAX','IMERG.precipitation')),physical:{status:'valid',quantity:{value:dry[e.crop],unit:'days'},flags:['synthetic-test-only']}})),references:[{...heat.references[0]!,id:'synthetic-dry-reference',indicator:'dry-spell',lower:{value:0,unit:'days'},upper:{value:10,unit:'days'},sourceRefs:sourceManifest.map(s=>s.id) as [string,...string[]]}],processingHashes:{'synthetic-test':'a'.repeat(64)},limitations:['Synthetic test fixture only']};
}
it('adding separately validated rainfall leaves the heat-only fallback calculation and input fingerprint unchanged',async()=>{
  const evidence=validateAnalysisEvidence({...heat,precipitation:syntheticRain()});
  const options={mode:'heat-only' as const,shift:0,forbidden:[]};
  const a=await analyze(heat,options),b=await analyze(evidence,options);
  expect(b.evaluation).toEqual(a.evaluation);expect(b.inputFingerprint).toBe(a.inputFingerprint);
  expect(b.sourceManifest).toHaveLength(10);expect(b.references).toHaveLength(1);
});
it('combined model uses both physical indicators, same six scenarios and independently calculable weighted loss',async()=>{
  const evidence=validateAnalysisEvidence({...heat,precipitation:syntheticRain()});
  const a=await analyze(evidence,{mode:'heat-and-rainfall',shift:0,forbidden:[],heatWeight:.25});
  const h=await analyze(heat,{mode:'heat-only',shift:0,forbidden:[]});
  expect(a.sourceManifest).toHaveLength(20);expect(a.references).toHaveLength(2);
  if(a.evaluation.state!=='evaluated'||h.evaluation.state!=='evaluated'||!a.evaluation.result.computation||!h.evaluation.result.computation)throw new Error('Expected explicit synthetic comparisons');
  expect(a.evaluation.result.validScenarioIds).toHaveLength(6);
  const scenario='fixed-2015-2019';
  expect(a.evaluation.result.computation.lossMatrix.baseline![scenario]).toBeCloseTo(.25*h.evaluation.result.computation.lossMatrix.baseline![scenario]!+.75*.5,12);
  expect(Object.values(a.scenarios[0]!.cropYearExposureByCandidate).every(rows=>rows.length===10)).toBe(true);
  const audit=await certificate(evidence,a,[]);
  expect(audit.sourceManifest).toHaveLength(20);expect(audit.context.normalizationPolicy.id).toContain('synthetic-dry-reference');
  expect(audit.modelVersion).toBe('inversis-fixed-start-rainfall-heat-v1');
  expect(audit.limitations.some(l=>l.startsWith('Reduced heat-only'))).toBe(false);
});
it('one missing crop-window invalidates a shared scenario for every candidate; excluding affected candidates can restore it',async()=>{
  const rain=syntheticRain();
  const damaged={...rain,cropYearExposures:rain.cropYearExposures.map(e=>e.crop==='soybean'&&e.assignedYear===2018&&e.calendarShiftDays===0?{...e,physical:{status:'missing' as const,reason:'Synthetic missing daily support'},coverage:{...e.coverage,status:'failed' as const,validDays:e.coverage.expectedDays-1,missingDays:1}}:e)};
  const evidence=validateAnalysisEvidence({...heat,precipitation:damaged});
  const a=await analyze(evidence,{mode:'heat-and-rainfall',shift:0,forbidden:[]});
  const b=await analyze(evidence,{mode:'heat-and-rainfall',shift:0,forbidden:['soybean']});
  expect(a.scenarios.filter(s=>s.validity==='valid')).toHaveLength(4);
  expect(b.scenarios.filter(s=>s.validity==='valid')).toHaveLength(6);
  expect(b.references).toEqual(a.references);
});
it('rejects partial annual coverage, wrong units, invalid preference and tampered crop calendars',async()=>{
  const rain=syntheticRain();
  expect(()=>validatePrecipitationEvidence({...rain,dailyCoverage:{expected:3653,available:7,valid:7,missing:3646}})).toThrow('coverage');
  expect(()=>validatePrecipitationEvidence({...rain,sourceManifest:rain.sourceManifest.map(s=>({...s,rawUnit:'mm'}))})).toThrow('provenance');
  expect(()=>validatePrecipitationEvidence({...rain,cropYearExposures:rain.cropYearExposures.map((e,i)=>i?e:{...e,windowEndUTC:'2015-06-29T00:00:00.000Z'})})).toThrow('calendar');
  await expect(analyze(heat,{mode:'heat-and-rainfall',shift:0,forbidden:[],heatWeight:NaN})).rejects.toThrow('preference');
});

it('preference clarification recomputes all five declared branches and includes both source families',async()=>{
  const evidence=validateAnalysisEvidence({...heat,precipitation:syntheticRain()});
  const a=await analyze(evidence,{mode:'heat-and-rainfall',shift:0,forbidden:[],heatWeight:.5});
  const questions=await nextEvidence(evidence,a);
  const q=questions.find(q=>q.questionId==='relative-exposure-preference')!;
  expect(q.outcomesByAnswer).toHaveLength(5);expect(q.sourceRefs).toHaveLength(20);
  expect(q.answerOptions.every(a=>a.provenance==='hypothetical')).toBe(true);
  for(const branch of q.outcomesByAnswer){
    const independentCall=await analyze(evidence,{...a.options,heatWeight:Number(branch.answerId.replace('heat-',''))});
    expect(branch.result).toEqual(independentCall.evaluation);
    expect(branch.fingerprint).toBe(independentCall.analysisFingerprint);
  }
});

it('cyclic sensitivity distance depends on phases rather than the ordering of supplied diagnostic rows',async()=>{
  const a=await analyze(heat,{mode:'heat-only',shift:0,forbidden:[]});
  if(a.evaluation.state!=='evaluated'||!a.evaluation.result.computation)throw new Error('Expected evaluated baseline');
  const changed={...a,options:{...a.options,phase:4},evaluation:{state:'evaluated' as const,result:{...a.evaluation.result,status:'PREFERRED_UNDER_TESTED_ASSUMPTIONS' as const,preferredSet:['a'] as const}}};
  const middle={...a,options:{...a.options,phase:2}};
  const result=diagnosticSensitivity(a,[a,middle,changed],'cyclic-phase');
  expect(result.observedReversals.find(r=>r.fromId==='cyclic-phase-0'&&r.toId==='cyclic-phase-2')?.distance).toBe(1);
});
