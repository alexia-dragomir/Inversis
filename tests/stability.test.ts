import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { analyze, validateAnalysisEvidence } from '../src/engine/analysis';
import { preferenceSensitivity } from '../src/engine/stability';
import { numericalPolicy } from '../src/engine/decision';
import type { NormalizationReference, Scenario } from '../src/domain/contracts';

const evidence=validateAnalysisEvidence(JSON.parse(readFileSync('public/evidence/history/analysis-input.json','utf8')));
it('real heat-only preference domain is exactly one computed point, with no invented boundary',async()=>{
  const a=await analyze(evidence,{mode:'heat-only',shift:0,forbidden:[]});
  const sweep=await preferenceSensitivity({...a,references:evidence.references,...numericalPolicy,fingerprint:a.inputFingerprint},a.analysisFingerprint);
  expect(sweep.sampledConfigurations).toHaveLength(1);
  expect(sweep.observedReversals).toEqual([]);
  expect(sweep.sampledConfigurations[0]!.decision.preferredSet).toEqual(['baseline']);
});
it('synthetic two-indicator oracle locates the 50/50 tie and adjacent changes without altering common evidence',async()=>{
  // Explicit synthetic mathematics fixture; never published as NASA observations.
  const a=await analyze(evidence,{mode:'heat-only',shift:0,forbidden:['soybean']});
  const candidates=[{...a.candidates[0]!,id:'x'},{...a.candidates[0]!,id:'y'}];
  const scenarios:Scenario[]=a.scenarios.slice(0,2).map(s=>({...s,cropYearExposureByCandidate:Object.fromEntries(candidates.map((c,i)=>[c.id,s.cropYearExposureByCandidate.baseline!.flatMap(e=>[
    {...e,candidateId:c.id,physical:{status:'valid',quantity:{value:i?.8:.2,unit:'fraction'},flags:['synthetic-test']}},
    {...e,candidateId:c.id,indicator:'dry-spell',physical:{status:'valid',quantity:{value:i?2:8,unit:'days'},flags:['synthetic-test']}}
  ])]))}));
  const references:NormalizationReference[]=[{...evidence.references[0]!,lower:{value:0,unit:'fraction'},upper:{value:1,unit:'fraction'}},{...evidence.references[0]!,id:'synthetic-dry-reference',indicator:'dry-spell',lower:{value:0,unit:'days'},upper:{value:10,unit:'days'}}];
  const sweep=await preferenceSensitivity({candidates,scenarios,references,weights:[{indicator:'heat-fraction',weight:.5},{indicator:'dry-spell',weight:.5}],...numericalPolicy,fingerprint:a.inputFingerprint},a.analysisFingerprint);
  expect(sweep.sampledConfigurations).toHaveLength(21);
  expect(sweep.sampledConfigurations[0]!.decision.preferredSet).toEqual(['y']);
  expect(sweep.sampledConfigurations[10]!.decision.preferredSet).toEqual(['x','y']);
  expect(sweep.sampledConfigurations[20]!.decision.preferredSet).toEqual(['x']);
  expect(sweep.observedReversals).toEqual([{fromId:'weight-9',toId:'weight-10',distance:.1},{fromId:'weight-10',toId:'weight-11',distance:.1}]);
});
it('missing rainfall stays unresolved at all 21 weights, including zero rainfall weight',async()=>{
  const a=await analyze(evidence,{mode:'heat-and-rainfall',shift:0,forbidden:[]});
  const sweep=await preferenceSensitivity({...a,references:evidence.references,...numericalPolicy,fingerprint:a.inputFingerprint},a.analysisFingerprint);
  expect(sweep.sampledConfigurations).toHaveLength(21);
  expect(sweep.sampledConfigurations.every(p=>p.decision.status==='INSUFFICIENT_EVIDENCE')).toBe(true);
  expect(sweep.observedReversals).toEqual([]);
});
