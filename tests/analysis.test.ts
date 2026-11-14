import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { analyze, certificate, consequence, diagnosticSensitivity, nextEvidence, validateAnalysisEvidence } from '../src/engine/analysis';
import { fingerprint } from '../src/engine/canonical';
import { evaluateComparison } from '../src/engine/decision';

const evidence = validateAnalysisEvidence(JSON.parse(readFileSync('public/evidence/history/analysis-input.json','utf8')));
const options = {mode:'heat-only' as const,shift:0,forbidden:[]};

it('matches independently executed Python arithmetic for every actual scenario loss and regret',async()=>{
  const oracle=JSON.parse(readFileSync('public/evidence/history/independent-oracle.json','utf8')) as {lossMatrix:Record<string,Record<string,number>>;regretMatrix:Record<string,Record<string,number>>;worstRegrets:Record<string,number>;preferredSet:string[];referenceBounds:{lower:number;upper:number};spotChecks:{crop:string;year:number;hotDays:number;expectedDays:number;fraction:number}[]};
  const a=await analyze(evidence,options);
  if(a.evaluation.state!=='evaluated'||!a.evaluation.result.computation)throw new Error('Expected computed reduced model');
  const result=a.evaluation.result;
  for(const [candidate,scenarios] of Object.entries(oracle.lossMatrix))for(const [scenario,value] of Object.entries(scenarios)){
    expect(result.computation!.lossMatrix[candidate]?.[scenario]).toBeCloseTo(value,12);
    expect(result.computation!.regretMatrix[candidate]?.[scenario]).toBeCloseTo(oracle.regretMatrix[candidate]![scenario]!,12);
  }
  expect(result.preferredSet).toEqual(oracle.preferredSet);
  expect(evidence.references[0]!.upper.value).toBe(oracle.referenceBounds.upper);
  for(const spot of oracle.spotChecks){
    const e=evidence.cropYearExposures.find(e=>e.crop===spot.crop&&e.assignedYear===spot.year&&e.calendarShiftDays===0)!;
    expect(e.physical).toMatchObject({status:'valid',quantity:{value:spot.fraction,unit:'fraction'}});
    expect(e.coverage.expectedDays).toBe(spot.expectedDays);
  }
});

it('real POWER history supports six common fixed-start heat scenarios, with provisional field suitability', async()=>{
  const a=await analyze(evidence,options);
  expect(a.scenarios.every(s=>s.validity==='valid')).toBe(true);
  expect(a.evaluation).toMatchObject({state:'evaluated',result:{provisional:true,validScenarioIds:expect.any(Array),indicatorIds:['heat-fraction']}});
  if(a.evaluation.state!=='evaluated')throw new Error('Expected evaluation');
  expect(a.evaluation.result.validScenarioIds).toHaveLength(6);
  expect(a.evaluation.result.computation).toBeDefined();
  for(const s of a.scenarios)expect(Object.values(s.cropYearExposureByCandidate).every(rows=>rows.length===5&&rows.every(e=>e.coverage.status==='passed'))).toBe(true);
});

it('never converts one IMERG winter day into historical rainfall coverage', async()=>{
  const a=await analyze(evidence,{...options,mode:'heat-and-rainfall'});
  expect(a.evaluation).toMatchObject({state:'evaluated',result:{status:'INSUFFICIENT_EVIDENCE',preferredSet:[],validScenarioIds:[]}});
  if(a.evaluation.state==='evaluated')expect(a.evaluation.result.computation).toBeUndefined();
  expect(a.scenarios.every(s=>s.validity==='excluded')).toBe(true);
});

it('checks no-eligible and sole-candidate outcomes without claiming competitive superiority',async()=>{
  const none=await analyze(evidence,{...options,forbidden:['maize']});
  expect(none.evaluation).toMatchObject({state:'evaluated',result:{status:'NO_ELIGIBLE_ROTATION',preferredSet:[]}});
  const one=await analyze(evidence,{...options,forbidden:['soybean']});
  expect(one.evaluation).toMatchObject({state:'evaluated',result:{activeCandidateIds:['baseline'],computation:{comparisonScope:'only-eligible-candidate',worstRegrets:{baseline:0}}}});
});

it('counterfactual branches recompute instead of hardcoding a reversal',async()=>{
  const baseline=await analyze(evidence,options);
  const next=await nextEvidence(evidence,baseline);
  for(const item of next){
    expect(item.answerOptions.every(a=>a.provenance==='hypothetical')).toBe(true);
    expect(item.consequence).toBe(consequence(item.outcomesByAnswer[0]!.result,item.outcomesByAnswer[1]!.result));
    expect(item.outcomesByAnswer.every(a=>a.fingerprint?.length===64)).toBe(true);
  }
  const full=await analyze(evidence,{...options,mode:'heat-and-rainfall'});
  expect((await nextEvidence(evidence,full)).every(i=>i.consequence==='UNRESOLVED')).toBe(true);
});

it('invalidates fingerprint for constraints, window shifts and secondary phases',async()=>{
  const base=await analyze(evidence,options);
  const other=await Promise.all([analyze(evidence,{...options,shift:7}),analyze(evidence,{...options,forbidden:['soybean']}),analyze(evidence,{...options,phase:1})]);
  expect(other.every(a=>a.analysisFingerprint!==base.analysisFingerprint)).toBe(true);
  expect((await analyze(evidence,options)).analysisFingerprint).toBe(base.analysisFingerprint);
});

it('certificate hash covers context, outputs, next evidence and diagnostics, excluding only presentation time',async()=>{
  const a=await analyze(evidence,options);
  const next=await nextEvidence(evidence,a);
  const diagnostics=[diagnosticSensitivity(a,[a,await analyze(evidence,{...options,shift:7})],'crop-window')];
  const cert=await certificate(evidence,a,next,diagnostics);
  const {fingerprint:hash,generatedAtUTC:timestamp,...body}=cert;
  expect(timestamp).toMatch(/Z$/); expect(hash).toBe(await fingerprint(body));
  expect((await certificate(evidence,a,next,diagnostics)).fingerprint).toBe(hash);
  expect(await fingerprint({...body,nextEvidence:[]})).not.toBe(hash);
  expect(cert.sensitivity).toHaveLength(1);
});

it('refuses degenerate normalization, wrong units and tampered complete-scenario rows',async()=>{
  const a=await analyze(evidence,options);
  const base={candidates:a.candidates,scenarios:a.scenarios,references:evidence.references,weights:a.weights,minimumScenarios:2,tieTolerance:1e-10,fingerprint:a.inputFingerprint};
  const ref=evidence.references[0]!;
  for(const changed of [{...ref,upper:ref.lower},{...ref,lower:{value:0,unit:'days' as const},upper:{value:1,unit:'days' as const}}]){
    expect(evaluateComparison({...base,references:[changed]})).toMatchObject({state:'evaluated',result:{status:'INSUFFICIENT_EVIDENCE'}});
  }
  const scenarios=structuredClone(a.scenarios);
  const first=scenarios[0]!;
  const modified={...first,cropYearExposureByCandidate:{...first.cropYearExposureByCandidate,baseline:first.cropYearExposureByCandidate.baseline!.slice(1)}};
  expect(evaluateComparison({...base,scenarios:[modified,...scenarios.slice(1)]})).toMatchObject({state:'evaluated',result:{status:'INSUFFICIENT_EVIDENCE'}});
});

it('rejects incomplete evidence manifests and duplicate crop-year records',()=>{
  expect(()=>validateAnalysisEvidence({...evidence,dailyCoverage:{expected:3653,valid:3652,missing:1}})).toThrow('coverage');
  expect(()=>validateAnalysisEvidence({...evidence,cropYearExposures:[evidence.cropYearExposures[0],...evidence.cropYearExposures.slice(0,-1)]})).toThrow('Duplicate');
});
