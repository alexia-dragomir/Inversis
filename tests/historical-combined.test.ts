import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { analyze, validateAnalysisEvidence, validatePrecipitationEvidence } from '../src/engine/analysis';
import { preferenceSensitivity } from '../src/engine/stability';

const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const digest=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
const root='public/evidence/history';
const rain=validatePrecipitationEvidence(read(`${root}/imerg-analysis-input.json`));
const evidence=validateAnalysisEvidence({...read(`${root}/analysis-input.json`),precipitation:rain});
interface OracleCase { heatWeight:number;shift:number;phase:number;lossMatrix:Record<string,Record<string,number>>;regretMatrix:Record<string,Record<string,number>>;worstRegrets:Record<string,number>;averageLoss:Record<string,number>;preferredSet:string[] }
const oracle=read(`${root}/combined-independent-oracle.json`) as {sourceHashes:Record<string,string>;oracleCodeSha256:string;referenceBounds:Record<'heat'|'dry',{lower:number;upper:number}>;dailyCoverage:{expected:number;rainValid:number;heatValid:number};physical:{crop:string;year:number;shift:number;heat:number;dry:number|null;hotDays:number;expectedDays:number}[];cases:OracleCase[]};

it('independent oracle is bound to all twenty retained source archives/responses and its own code',()=>{
  expect(oracle.oracleCodeSha256).toBe(digest('scripts/independent-combined-oracle.py'));
  for(let year=2015;year<=2024;year++){
    expect(oracle.sourceHashes[`power-${year}`]).toBe(digest(`${root}/power/${year}.json`));
    expect(oracle.sourceHashes[`imerg-${year}`]).toBe(digest(`${root}/imerg/${year}.tar.gz`));
  }
  expect(oracle.dailyCoverage).toEqual({expected:3653,rainValid:rain.dailyCoverage.valid,heatValid:evidence.dailyCoverage.valid});
});

it('all 200 actual crop/year/shift exposures and fixed forty-member reference bounds agree independently',()=>{
  expect(oracle.physical).toHaveLength(200);
  for(const row of oracle.physical){
    for(const [indicator,rows,value,unit] of [['heat',evidence.cropYearExposures,row.heat,'fraction'],['dry',rain.cropYearExposures,row.dry,'days']] as const){
      const actual=rows.find(e=>e.crop===row.crop&&e.assignedYear===row.year&&e.calendarShiftDays===row.shift)!;
      expect(actual.coverage.expectedDays).toBe(row.expectedDays);
      if(value===null)expect(actual.physical.status).not.toBe('valid');
      else expect(actual.physical).toMatchObject({status:'valid',quantity:{value,unit}});
      const ref=indicator==='heat'?evidence.references[0]!:rain.references[0]!;
      expect(ref.lower.value).toBe(oracle.referenceBounds[indicator].lower);
      expect(ref.upper.value).toBe(oracle.referenceBounds[indicator].upper);
    }
  }
});

it('matches independent raw-data arithmetic at all 21 preferences, five calendar shifts and five cyclic phases',async()=>{
  expect(oracle.cases).toHaveLength(29);
  for(const expected of oracle.cases){
    const a=await analyze(evidence,{mode:'heat-and-rainfall',forbidden:[],shift:expected.shift,phase:expected.phase,heatWeight:expected.heatWeight});
    if(a.evaluation.state!=='evaluated'||!a.evaluation.result.computation)throw new Error('Actual historical comparison must be computed');
    const actual=a.evaluation.result;
    expect(actual.preferredSet).toEqual(expected.preferredSet);
    for(const [candidate,scenarios] of Object.entries(expected.lossMatrix)){
      for(const [scenario,value] of Object.entries(scenarios)){
        expect(actual.computation!.lossMatrix[candidate]?.[scenario]).toBeCloseTo(value,12);
        expect(actual.computation!.regretMatrix[candidate]?.[scenario]).toBeCloseTo(expected.regretMatrix[candidate]![scenario]!,12);
      }
      expect(actual.computation!.worstRegrets[candidate]).toBeCloseTo(expected.worstRegrets[candidate]!,12);
      expect(actual.computation!.averageLossBenchmark.meanLossByCandidate[candidate]).toBeCloseTo(expected.averageLoss[candidate]!,12);
    }
  }
});

it('actual preference-grid changes match independently computed neighboring sets and retain the heat fallback',async()=>{
  const a=await analyze(evidence,{mode:'heat-and-rainfall',forbidden:[],shift:0,heatWeight:.5});
  const grid=await preferenceSensitivity({candidates:a.candidates,scenarios:a.scenarios,references:a.references,weights:a.weights,minimumScenarios:2,tieTolerance:1e-10,fingerprint:a.inputFingerprint},a.analysisFingerprint);
  expect(grid.sampledConfigurations).toHaveLength(21);
  for(const point of grid.sampledConfigurations){
    const heat=point.decision.weights.find(w=>w.indicator==='heat-fraction')!.weight;
    expect(point.decision.preferredSet).toEqual(oracle.cases.find(c=>Math.abs(c.heatWeight-heat)<1e-10&&c.shift===0&&c.phase===0)!.preferredSet);
  }
  const expectedChanges=oracle.cases.slice(1,21).filter((c,i)=>JSON.stringify(c.preferredSet)!==JSON.stringify(oracle.cases[i]!.preferredSet));
  expect(grid.observedReversals).toHaveLength(expectedChanges.length);
  expect(grid.observedReversals.every(r=>r.distance===.1)).toBe(true);
  const fallback=await analyze(evidence,{mode:'heat-only',forbidden:[],shift:0});
  const heatOnly=await analyze(validateAnalysisEvidence(read(`${root}/analysis-input.json`)),{mode:'heat-only',forbidden:[],shift:0});
  expect(fallback.evaluation).toEqual(heatOnly.evaluation);
  expect(fallback.inputFingerprint).toBe(heatOnly.inputFingerprint);
});
