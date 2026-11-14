import type { AnalysisEvidence, PrecipitationEvidence } from '../data/analysis-contract';
import { candidates as proposedCandidates } from '../data/foundation.ts';
import type { Candidate, Crop, DecisionCertificate, DecisionConsequence, DecisionEvaluation, NextEvidenceItem, Scenario, SensitivityResult } from '../domain/contracts';
import { evaluateComparison, numericalPolicy } from './decision.ts';
import { fingerprint } from './canonical.ts';
import { cropWindows, windowDates } from './exposures.ts';
import { record, requireCondition, utcTimestamp } from '../data/ingestion/validation.ts';

export type ModelMode = 'heat-only' | 'heat-and-rainfall';
export interface AnalysisOptions { readonly mode: ModelMode; readonly shift: number; readonly forbidden: readonly Crop[]; readonly phase?: number; readonly heatWeight?: number }
export const modelVersion = 'inversis-fixed-start-heat-v1';

export function validatePrecipitationEvidence(input: unknown): PrecipitationEvidence {
  const data=record(input,'precipitation evidence');
  requireCondition(data.schemaVersion==='inversis-precipitation-history-v1','Unsupported precipitation evidence');
  const coverage=record(data.dailyCoverage,'precipitation coverage');
  requireCondition(coverage.expected===3653&&coverage.available===3653&&typeof coverage.valid==='number'&&typeof coverage.missing==='number'&&Number.isInteger(coverage.valid)&&Number.isInteger(coverage.missing)&&coverage.valid>=0&&coverage.missing>=0&&coverage.valid+coverage.missing===3653,'Incomplete precipitation date coverage');
  requireCondition(Array.isArray(data.sourceManifest)&&data.sourceManifest.length===10&&Array.isArray(data.cropYearExposures)&&data.cropYearExposures.length===200,'Incomplete precipitation source/crop domain');
  const ids=new Set<string>();
  for(const value of data.sourceManifest){
    const s=record(value,'precipitation source');
    requireCondition(typeof s.id==='string'&&!ids.has(s.id)&&s.rawUnit==='mm/day'&&s.sourceTimeStandard==='UTC'&&s.collectionVersion==='07'&&s.scienceVersion==='V07B'&&typeof s.sha256==='string'&&/^[a-f0-9]{64}$/.test(s.sha256),'Invalid precipitation provenance');ids.add(s.id);
  }
  const keys=new Set<string>();
  for(const value of data.cropYearExposures){
    const e=record(value,'precipitation crop-year');const p=record(e.physical,'physical');const c=record(e.coverage,'coverage');
    requireCondition(e.indicator==='dry-spell'&&cropWindows.some(w=>w.crop===e.crop)&&typeof e.assignedYear==='number'&&Number.isInteger(e.assignedYear)&&e.assignedYear>=2015&&e.assignedYear<=2024&&[0,-7,7,-14,14].includes(e.calendarShiftDays as number),'Unexpected precipitation crop/year/shift');
    const key=`${e.crop}/${e.assignedYear}/${e.calendarShiftDays}`;requireCondition(!keys.has(key),'Duplicate precipitation exposure');keys.add(key);
    const expected=windowDates(e.crop as Crop,e.assignedYear as number,e.calendarShiftDays as number);
    requireCondition(c.expectedDays===expected.length&&e.windowStartUTC===`${expected[0]}T00:00:00.000Z`&&Date.parse(String(e.windowEndUTC))===Date.parse(`${expected.at(-1)}T00:00:00.000Z`)+86400000,'Precipitation crop calendar mismatch');
    requireCondition(Array.isArray(e.sourceRefs)&&e.sourceRefs.every(id=>ids.has(id))&&Array.isArray(e.contributingObservationIds),'Invalid precipitation lineage');
    if(p.status==='valid'){
      const q=record(p.quantity,'dry-spell quantity');
      requireCondition(q.unit==='days'&&typeof q.value==='number'&&Number.isInteger(q.value)&&q.value>=0&&typeof c.expectedDays==='number'&&q.value<=c.expectedDays&&c.status==='passed'&&c.validDays===c.expectedDays&&c.missingDays===0&&e.sourceRefs.length>0&&e.contributingObservationIds.length===c.expectedDays,'Invalid dry-spell exposure');
    }else requireCondition(['missing','unverified','invalid'].includes(p.status as string)&&c.status!=='passed','Unexplained precipitation refusal');
  }
  requireCondition(Array.isArray(data.references)&&data.references.length===1,'Missing fixed precipitation reference');
  const ref=record(data.references[0],'precipitation reference');requireCondition(ref.indicator==='dry-spell'&&ref.candidateIndependent===true,'Invalid precipitation reference');
  record(data.processingHashes,'precipitation processing hashes');
  return input as PrecipitationEvidence;
}

export function validateAnalysisEvidence(input: unknown): AnalysisEvidence {
  const data = record(input, 'analysis evidence');
  requireCondition(data.schemaVersion === 'inversis-evidence-v1' && data.source === 'NASA POWER T2M_MAX', 'Unsupported evidence artifact');
  const coverage = record(data.dailyCoverage, 'coverage');
  requireCondition(coverage.expected === 3653 && coverage.valid === 3653 && coverage.missing === 0, 'Historical POWER coverage is incomplete');
  requireCondition(Array.isArray(data.sourceManifest) && data.sourceManifest.length === 10 && Array.isArray(data.cropYearExposures) && data.cropYearExposures.length === 200, 'Unexpected source/exposure domain');
  const ids = new Set<string>();
  for (const source of data.sourceManifest) {
    const s = record(source, 'source');
    requireCondition(typeof s.id === 'string' && !ids.has(s.id) && typeof s.sha256 === 'string' && /^[a-f0-9]{64}$/.test(s.sha256) && s.rawUnit === 'C' && s.sourceTimeStandard === 'UTC', 'Invalid source provenance');
    utcTimestamp(s.retrievalTimeUTC, 'POWER retrieval time'); ids.add(s.id);
  }
  const keys = new Set<string>();
  for (const value of data.cropYearExposures) {
    const e = record(value, 'exposure');
    const physical = record(e.physical, 'physical');
    const q = record(physical.quantity, 'quantity');
    const c = record(e.coverage, 'crop coverage');
    requireCondition(physical.status === 'valid' && q.unit === 'fraction' && typeof q.value === 'number' && Number.isFinite(q.value) && q.value >= 0 && q.value <= 1 && c.status === 'passed' && c.missingDays === 0 && c.validDays === c.expectedDays, 'Invalid physical heat exposure');
    requireCondition(e.indicator === 'heat-fraction' && cropWindows.some(w => w.crop === e.crop) && typeof e.assignedYear === 'number' && Number.isInteger(e.assignedYear) && e.assignedYear >= 2015 && e.assignedYear <= 2024 && [0,-7,7,-14,14].includes(e.calendarShiftDays as number), 'Unexpected crop-year/shift');
    requireCondition(Array.isArray(e.sourceRefs) && e.sourceRefs.length > 0 && e.sourceRefs.every(id => ids.has(id)) && Array.isArray(e.contributingObservationIds) && e.contributingObservationIds.length === c.expectedDays, 'Missing crop-year lineage');
    const key = `${e.crop}/${e.assignedYear}/${e.calendarShiftDays}`;
    requireCondition(!keys.has(key), 'Duplicate crop-year evidence'); keys.add(key);
    const expected=windowDates(e.crop as Crop,e.assignedYear as number,e.calendarShiftDays as number);
    requireCondition(c.expectedDays===expected.length&&e.windowStartUTC===`${expected[0]}T00:00:00.000Z`&&Date.parse(String(e.windowEndUTC))===Date.parse(`${expected.at(-1)}T00:00:00.000Z`)+86400000,'Heat crop calendar mismatch');
  }
  requireCondition(Array.isArray(data.references) && data.references.length === 1, 'Expected predeclared heat reference');
  const reference = record(data.references[0], 'reference');
  requireCondition(reference.indicator === 'heat-fraction' && reference.candidateIndependent === true, 'Expected candidate-independent heat reference');
  record(data.processingHashes, 'processing hashes');
  if(data.precipitation!==undefined)validatePrecipitationEvidence(data.precipitation);
  return input as AnalysisEvidence;
}

export function scenarioDomain(evidence: AnalysisEvidence, options: AnalysisOptions) {
  requireCondition([0,-7,7,-14,14].includes(options.shift) && ['heat-only','heat-and-rainfall'].includes(options.mode), 'Invalid analysis options');
  requireCondition(options.forbidden.every(c => cropWindows.some(w => w.crop === c)), 'Unknown constraint crop');
  const phase = options.phase ?? 0;
  requireCondition(Number.isInteger(phase) && phase >= 0 && phase < 5, 'Invalid secondary phase');
  const candidates: Candidate[] = proposedCandidates.map(c => ({
    ...c, fiveYearOrderedCrops: [...c.fiveYearOrderedCrops.slice(phase), ...c.fiveYearOrderedCrops.slice(0, phase)] as unknown as Candidate['fiveYearOrderedCrops'],
    agronomicScreening: c.fiveYearOrderedCrops.some(crop => options.forbidden.includes(crop)) ? 'EXCLUDED' : 'CONDITIONAL',
    ledger: [...c.ledger, ...c.fiveYearOrderedCrops.filter((crop,i,a) => options.forbidden.includes(crop) && a.indexOf(crop) === i).map(crop => ({ id:`${c.id}-hypothetical-${crop}`,category:'farmer-constraint' as const,status:'violation' as const,ruleIds:[],sourceRefs:[],scope:'fixed-start' as const,explanation:`Hypothetical interface constraint: exclude ${crop}. This is not a confirmed farmer fact or agronomic finding.` }))],
  }));
  const active = candidates.filter(c => c.agronomicScreening !== 'EXCLUDED');
  const scenarios: Scenario[] = Array.from({length:6},(_,i) => {
    const start = 2015+i;
    const rows = Object.fromEntries(active.map(c => [c.id, c.fiveYearOrderedCrops.map((crop,p) => {
      const e = evidence.cropYearExposures.find(e => e.crop === crop && e.assignedYear === start+p && e.calendarShiftDays === options.shift);
      requireCondition(e, 'Missing crop-year evidence');
      const rain=options.mode==='heat-and-rainfall'?evidence.precipitation?.cropYearExposures.find(r=>r.crop===crop&&r.assignedYear===start+p&&r.calendarShiftDays===options.shift):undefined;
      return [{...e,candidateId:c.id},...(rain?[{...rain,candidateId:c.id}]:[])];
    }).flat()]));
    const reasons:string[] = options.mode === 'heat-and-rainfall' && !evidence.precipitation ? ['Historical IMERG precipitation/count coverage has not been validated. Excluded from every candidate.'] : active.length ? [] : ['No eligible candidate'];
    for(const [id,exposures] of Object.entries(rows))if(exposures.length!==(options.mode==='heat-and-rainfall'?10:5)||exposures.some(e=>e.physical.status!=='valid'||e.coverage.status!=='passed'))reasons.push(`${id}: incomplete shared crop-window evidence`);
    return {id:`fixed-${start}-${start+4}`,fiveYearStart:start,fiveYearEnd:start+4,cropYearExposureByCandidate:rows,validity:reasons.length?'excluded':'valid',exclusionReasons:reasons};
  });
  return {candidates,scenarios};
}

export async function analyze(evidence: AnalysisEvidence, options: AnalysisOptions) {
  const domain = scenarioDomain(evidence, options);
  const heatWeight=options.heatWeight??.5;
  requireCondition(Number.isFinite(heatWeight)&&heatWeight>=0&&heatWeight<=1,'Invalid heat preference weight');
  const weights = options.mode === 'heat-only' ? [{indicator:'heat-fraction' as const,weight:1}] : [{indicator:'heat-fraction' as const,weight:heatWeight},{indicator:'dry-spell' as const,weight:1-heatWeight}];
  const rain=options.mode==='heat-and-rainfall'?evidence.precipitation:undefined;
  const references=[...evidence.references,...(rain?.references??[])];
  const sourceManifest=[...evidence.sourceManifest,...(rain?.sourceManifest??[])];
  const processingHashes={...evidence.processingHashes,...(rain?.processingHashes??{})};
  const selectedModelVersion=options.mode==='heat-only'?modelVersion:'inversis-fixed-start-rainfall-heat-v1';
  const basis = {modelVersion:selectedModelVersion,canonicalizationVersion:'sorted-json-v1',options:{...options,forbidden:[...new Set(options.forbidden)].sort(),phase:options.phase??0,heatWeight:options.mode==='heat-only'?1:heatWeight},sourceManifest,processingHashes,references,weights,numericalPolicy,...domain};
  const inputFingerprint = await fingerprint(basis);
  const evaluation = evaluateComparison({...domain,references,weights,...numericalPolicy,fingerprint:inputFingerprint});
  const analysisFingerprint = await fingerprint({basis,evaluation});
  return {...domain,modelVersion:selectedModelVersion,options,weights,references,sourceManifest,evaluation,inputFingerprint,analysisFingerprint};
}
export type Analysis = Awaited<ReturnType<typeof analyze>>;

export function consequence(a: DecisionEvaluation, b: DecisionEvaluation): DecisionConsequence {
  if(a.state !== 'evaluated' || b.state !== 'evaluated' || a.result.status === 'INSUFFICIENT_EVIDENCE' || b.result.status === 'INSUFFICIENT_EVIDENCE') return 'UNRESOLVED';
  const equal = (x: readonly string[],y: readonly string[]) => JSON.stringify([...x].sort()) === JSON.stringify([...y].sort());
  if(!equal(a.result.preferredSet,b.result.preferredSet)) return 'DECISION_CHANGING';
  if(!equal(a.result.activeCandidateIds,b.result.activeCandidateIds)) return 'ELIGIBILITY_CHANGING_ONLY';
  return 'NOT_DECISION_CHANGING_IN_TESTED_CASES';
}

export async function nextEvidence(evidence: AnalysisEvidence, baseline: Analysis): Promise<NextEvidenceItem[]> {
  const eligibility=await Promise.all((['soybean','sunflower'] as const).map(async (crop):Promise<NextEvidenceItem> => {
    const allowed = await analyze(evidence,{...baseline.options,forbidden:baseline.options.forbidden.filter(c=>c!==crop)});
    const forbidden = await analyze(evidence,{...baseline.options,forbidden:[...new Set([...baseline.options.forbidden,crop])]});
    const label = consequence(allowed.evaluation,forbidden.evaluation);
    const a = allowed.evaluation.state === 'evaluated' ? allowed.evaluation.result : null;
    const b = forbidden.evaluation.state === 'evaluated' ? forbidden.evaluation.result : null;
    const changed = (key: 'activeCandidateIds'|'preferredSet') => Boolean(a && b && JSON.stringify([...a[key]].sort()) !== JSON.stringify([...b[key]].sort()));
    return {questionId:`permission-${crop}`,questionText:`Would the farmer permit ${crop} in this plan?`,unknownFact:`Farmer permission for ${crop}`,questionCategory:'eligibility-evidence',answerOptions:[{id:'allowed',label:'Permitted',provenance:'hypothetical',sourceRefs:[],modification:`Remove hypothetical ${crop} prohibition`},{id:'forbidden',label:'Prohibited',provenance:'hypothetical',sourceRefs:[],modification:`Exclude every candidate containing ${crop}`}],evidenceBasis:'Finite hypothetical farmer-constraint branches; not measured field suitability.',baselineStatus:baseline.evaluation.state==='evaluated'?baseline.evaluation.result.status:'INSUFFICIENT_EVIDENCE',baselineFingerprint:baseline.analysisFingerprint,outcomesByAnswer:[{answerId:'allowed',result:allowed.evaluation,fingerprint:allowed.analysisFingerprint},{answerId:'forbidden',result:forbidden.evaluation,fingerprint:forbidden.analysisFingerprint}],consequence:label,eligibilityChanged:changed('activeCandidateIds'),preferredSetChanged:changed('preferredSet'),statusChanged:Boolean(a&&b&&a.status!==b.status),marginOnlyChanged:false,affectedCandidateIds:proposedCandidates.filter(c=>c.fiveYearOrderedCrops.includes(crop)).map(c=>c.id),supportingRuleIds:[],interpretation:'Every branch recomputes eligibility, common scenarios, minima and regret. A sole remaining candidate is not a competitive recommendation.',limitations:['Answers are hypothetical until supplied by the farmer.','Only the declared model is evaluated; omitted indicators and field agronomy could change conclusions.'],sourceRefs:baseline.sourceManifest.map(s=>s.id),computationalVersion:baseline.modelVersion,actionText:`Ask the farmer whether ${crop} is permitted; do not infer the answer from climate data.`};
  }));
  if(baseline.options.mode==='heat-only')return eligibility;
  const branches=await Promise.all([0,.25,.5,.75,1].map(async heatWeight=>({heatWeight,analysis:await analyze(evidence,{...baseline.options,heatWeight})})));
  const labels=branches.slice(1).map(b=>consequence(branches[0]!.analysis.evaluation,b.analysis.evaluation));
  const label:DecisionConsequence=labels.includes('UNRESOLVED')?'UNRESOLVED':labels.includes('DECISION_CHANGING')?'DECISION_CHANGING':'NOT_DECISION_CHANGING_IN_TESTED_CASES';
  const answers=branches.map(b=>({id:`heat-${b.heatWeight}`,label:`${b.heatWeight*100}% heat / ${(1-b.heatWeight)*100}% dry spell`,provenance:'hypothetical' as const,sourceRefs:[],modification:'Change only preference weights over the fixed normalized exposure swings'}));
  const evaluated=branches.map(b=>b.analysis.evaluation).filter(e=>e.state==='evaluated');
  const statusChanged=new Set(evaluated.map(e=>e.result.status)).size>1;
  const marginsChanged=new Set(evaluated.map(e=>JSON.stringify(e.result.computation?.worstRegrets??{}))).size>1;
  const preference:NextEvidenceItem={questionId:'relative-exposure-preference',questionText:'Which relative exposure swing matters more: heat or dry spells?',unknownFact:'Farmer preference over the declared normalized swings',questionCategory:'preference-clarification',answerOptions:[answers[0]!,...answers.slice(1)],evidenceBasis:'Five declared hypothetical preference answers, with identical source evidence, reference bounds, scenarios and eligibility.',baselineStatus:baseline.evaluation.state==='evaluated'?baseline.evaluation.result.status:'INSUFFICIENT_EVIDENCE',baselineFingerprint:baseline.analysisFingerprint,outcomesByAnswer:branches.map(b=>({answerId:`heat-${b.heatWeight}`,result:b.analysis.evaluation,fingerprint:b.analysis.analysisFingerprint})),consequence:label,eligibilityChanged:false,preferredSetChanged:label==='DECISION_CHANGING',statusChanged,marginOnlyChanged:label==='NOT_DECISION_CHANGING_IN_TESTED_CASES'&&marginsChanged,affectedCandidateIds:baseline.candidates.filter(c=>c.agronomicScreening!=='EXCLUDED').map(c=>c.id),supportingRuleIds:[],interpretation:'Preferences are hypothetical value judgments over normalized swings, not inferred biological sensitivities or probabilities.',limitations:['Only five declared answer branches are classified here; the separate preference grid samples 21 weights.','Local crop response and field suitability remain unresolved.'],sourceRefs:baseline.sourceManifest.map(s=>s.id),computationalVersion:baseline.modelVersion,actionText:'Ask the farmer which declared exposure swing matters more. Do not infer the preference from NASA data.'};
  return [...eligibility,preference];
}

export function diagnosticSensitivity(baseline: Analysis, analyses: readonly Analysis[], axis: 'crop-window'|'cyclic-phase'): SensitivityResult {
  const evaluated = analyses.filter(a => a.evaluation.state === 'evaluated');
  const configurations = evaluated.map((a,i) => {
    requireCondition(a.evaluation.state === 'evaluated', 'Expected evaluated diagnostic');
    return {id:`${axis}-${i}`,description:axis==='crop-window'?`${a.options.shift} day shift`:`Cyclic phase ${(a.options.phase??0)+1}`,decision:a.evaluation.result};
  });
  const changes: {fromId:string;toId:string;distance:number}[]=[];
  for(let i=0;i<configurations.length;i++)for(let j=i+1;j<configurations.length;j++){
    const a=configurations[i]!,b=configurations[j]!;
    if(!a.decision.computation||!b.decision.computation)continue;
    if(JSON.stringify([...a.decision.preferredSet].sort())!==JSON.stringify([...b.decision.preferredSet].sort())){
      const phaseDistance=Math.abs((evaluated[i]!.options.phase??0)-(evaluated[j]!.options.phase??0));
      const distance=axis==='crop-window'?Math.abs(evaluated[i]!.options.shift-evaluated[j]!.options.shift):Math.min(phaseDistance,5-phaseDistance);
      changes.push({fromId:a.id,toId:b.id,distance});
    }
  }
  return {axis,sampledConfigurations:configurations,gridResolution:axis==='crop-window'?'Five shifts: -14, -7, 0, +7, +14 days':'Five separate ordered-sequence phases',distanceMetric:axis==='crop-window'?'Absolute calendar-day difference':'Minimum circular phase distance',observedReversals:changes,untestedDomainNotice:'Methodological changes only; not preference reversals or probabilities. No conclusions outside the tested configurations. Cyclic phases are not pooled into primary scenarios.',linkedDecisionFingerprint:baseline.analysisFingerprint};
}

export async function certificate(evidence: AnalysisEvidence, analysis: Analysis, next: readonly NextEvidenceItem[], sensitivity: readonly SensitivityResult[] = []): Promise<DecisionCertificate> {
  requireCondition(analysis.evaluation.state === 'evaluated', 'Cannot certify invalid configuration');
  const unknown = {status:'unknown' as const,reason:'Not supplied by farmer or field measurement'};
  const output: DecisionCertificate = {processingHashes:{...evidence.processingHashes,...(analysis.options.mode==='heat-and-rainfall'?evidence.precipitation?.processingHashes??{}:{})},schemaVersion:'inversis-certificate-v1',modelVersion:analysis.modelVersion,dataRevision:analysis.options.mode==='heat-only'?'power-2015-2024-retrieved-2026-11-14':evidence.precipitation?'power-imerg-2015-2024-retrieved-2026-11-14':'power-2015-2024-imerg-unavailable',context:{site:{name:'Bărăgan Plain, Romania',latitude:44.565,longitude:27.335,role:'demonstration-location'},historicalPeriod:{startYear:2015,endYear:2024,status:analysis.options.mode==='heat-only'||evidence.precipitation?'validated':'requested'},candidates:analysis.candidates,cropWindows,indicatorSpecs:analysis.weights.map(w=>({id:w.indicator,physicalUnit:w.indicator==='heat-fraction'?'fraction':'days',direction:'higher-is-worse',sourceIds:[w.indicator==='heat-fraction'?'NASA-POWER/T2M_MAX/MERRA2':'GPM_3IMERGDF/07'],assumptionIds:['illustrative-thresholds','provisional-windows']})),qualityPolicy:{id:'full-crop-window-v1',rules:[{id:'complete-window',statement:'Every daily value must be valid; no interpolation.',basis:'author-convention',sourceRefs:[],limitation:'Availability does not independently establish geophysical accuracy.'}]},normalizationPolicy:{id:analysis.references.map(r=>r.id).join(';'),referenceProtocol:analysis.references.map(r=>r.populationDefinition).join('; '),constantIndicatorPolicy:'Refuse near-constant bounds with width <=1e-12'},preferenceWeights:analysis.weights,agronomicFacts:{previousCrop:unknown,diseaseHistory:unknown,soilPH:unknown,salinity:unknown,texture:unknown,drainage:unknown,organicMatter:unknown,irrigation:unknown,management:unknown},ruleRegistryVersion:'unvalidated-field-rules; explicit-hypothetical-crop-permissions-only',scenarioPolicy:{primary:'fixed-start',minimumCompleteScenarios:2,justification:'Author comparison convention requiring multiple historical replays; not a confidence claim.'},assumptions:[{id:'illustrative-thresholds',statement:'Daily maximum temperature >=35°C is counted as heat exposure; dry threshold <1 mm/day only when valid precipitation exists.',basis:'illustrative-threshold',sourceRefs:[],limitation:'Not calibrated crop damage.'},{id:'provisional-windows',statement:`Handoff crop windows shifted by ${analysis.options.shift} days; primary fixed-start plan.`,basis:'author-convention',sourceRefs:[],limitation:'No local phenology measurements.'},{id:'hypothetical-constraints',statement:`Hypothetical prohibited crops: ${analysis.options.forbidden.join(', ')||'none'}.`,basis:'author-convention',sourceRefs:[],limitation:'Not confirmed farmer constraints.'}]},sourceManifest:analysis.sourceManifest,scenarios:analysis.scenarios,decision:analysis.evaluation.result,sensitivity,nextEvidence:next,limitations:['Certificate fingerprint identifies integrity; not NASA endorsement or agricultural certification.',...(analysis.options.mode==='heat-and-rainfall'?[...evidence.limitations.filter(l=>!l.startsWith('Reduced heat-only model:')),...(evidence.precipitation?.limitations??['Historical precipitation is unavailable; combined comparison is refused.'])]:evidence.limitations)],canonicalizationVersion:'sorted-json-v1',fingerprint:analysis.analysisFingerprint,generatedAtUTC:new Date().toISOString()};
  const {fingerprint:priorHash,generatedAtUTC:timestamp,...body} = output;
  void priorHash; void timestamp;
  return {...output,fingerprint:await fingerprint(body)};
}
