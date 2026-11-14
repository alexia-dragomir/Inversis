import type { AnalysisEvidence } from '../data/analysis-contract';
import { candidates as proposedCandidates } from '../data/foundation.ts';
import type { Candidate, Crop, DecisionCertificate, DecisionConsequence, DecisionEvaluation, NextEvidenceItem, Scenario, SensitivityResult } from '../domain/contracts';
import { evaluateComparison, numericalPolicy } from './decision.ts';
import { fingerprint } from './canonical.ts';
import { cropWindows } from './exposures.ts';
import { record, requireCondition, utcTimestamp } from '../data/ingestion/validation.ts';

export type ModelMode = 'heat-only' | 'heat-and-rainfall';
export interface AnalysisOptions { readonly mode: ModelMode; readonly shift: number; readonly forbidden: readonly Crop[]; readonly phase?: number }
export const modelVersion = 'inversis-fixed-start-heat-v1';

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
  }
  requireCondition(Array.isArray(data.references) && data.references.length === 1, 'Expected predeclared heat reference');
  const reference = record(data.references[0], 'reference');
  requireCondition(reference.indicator === 'heat-fraction' && reference.candidateIndependent === true, 'Expected candidate-independent heat reference');
  record(data.processingHashes, 'processing hashes');
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
      requireCondition(e, 'Missing crop-year evidence'); return {...e,candidateId:c.id};
    })]));
    const reasons = options.mode === 'heat-and-rainfall' ? ['Historical IMERG precipitation/count coverage has not been validated. Excluded from every candidate.'] : active.length ? [] : ['No eligible candidate'];
    return {id:`fixed-${start}-${start+4}`,fiveYearStart:start,fiveYearEnd:start+4,cropYearExposureByCandidate:rows,validity:reasons.length?'excluded':'valid',exclusionReasons:reasons};
  });
  return {candidates,scenarios};
}

export async function analyze(evidence: AnalysisEvidence, options: AnalysisOptions) {
  const domain = scenarioDomain(evidence, options);
  const weights = options.mode === 'heat-only' ? [{indicator:'heat-fraction' as const,weight:1}] : [{indicator:'heat-fraction' as const,weight:.5},{indicator:'dry-spell' as const,weight:.5}];
  const basis = {modelVersion,canonicalizationVersion:'sorted-json-v1',options:{...options,forbidden:[...new Set(options.forbidden)].sort(),phase:options.phase??0},sourceManifest:evidence.sourceManifest,processingHashes:evidence.processingHashes,references:evidence.references,weights,numericalPolicy,...domain};
  const inputFingerprint = await fingerprint(basis);
  const evaluation = evaluateComparison({...domain,references:evidence.references,weights,...numericalPolicy,fingerprint:inputFingerprint});
  const analysisFingerprint = await fingerprint({basis,evaluation});
  return {...domain,options,weights,evaluation,inputFingerprint,analysisFingerprint};
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
  return Promise.all((['soybean','sunflower'] as const).map(async crop => {
    const allowed = await analyze(evidence,{...baseline.options,forbidden:baseline.options.forbidden.filter(c=>c!==crop)});
    const forbidden = await analyze(evidence,{...baseline.options,forbidden:[...new Set([...baseline.options.forbidden,crop])]});
    const label = consequence(allowed.evaluation,forbidden.evaluation);
    const a = allowed.evaluation.state === 'evaluated' ? allowed.evaluation.result : null;
    const b = forbidden.evaluation.state === 'evaluated' ? forbidden.evaluation.result : null;
    const changed = (key: 'activeCandidateIds'|'preferredSet') => Boolean(a && b && JSON.stringify([...a[key]].sort()) !== JSON.stringify([...b[key]].sort()));
    return {questionId:`permission-${crop}`,questionText:`Would the farmer permit ${crop} in this plan?`,unknownFact:`Farmer permission for ${crop}`,questionCategory:'eligibility-evidence',answerOptions:[{id:'allowed',label:'Permitted',provenance:'hypothetical',sourceRefs:[],modification:`Remove hypothetical ${crop} prohibition`},{id:'forbidden',label:'Prohibited',provenance:'hypothetical',sourceRefs:[],modification:`Exclude every candidate containing ${crop}`}],evidenceBasis:'Finite hypothetical farmer-constraint branches; not measured field suitability.',baselineStatus:baseline.evaluation.state==='evaluated'?baseline.evaluation.result.status:'INSUFFICIENT_EVIDENCE',baselineFingerprint:baseline.analysisFingerprint,outcomesByAnswer:[{answerId:'allowed',result:allowed.evaluation,fingerprint:allowed.analysisFingerprint},{answerId:'forbidden',result:forbidden.evaluation,fingerprint:forbidden.analysisFingerprint}],consequence:label,eligibilityChanged:changed('activeCandidateIds'),preferredSetChanged:changed('preferredSet'),statusChanged:Boolean(a&&b&&a.status!==b.status),marginOnlyChanged:false,affectedCandidateIds:proposedCandidates.filter(c=>c.fiveYearOrderedCrops.includes(crop)).map(c=>c.id),supportingRuleIds:[],interpretation:'Every branch recomputes eligibility, common scenarios, minima and regret. A sole remaining candidate is not a competitive recommendation.',limitations:['Answers are hypothetical until supplied by the farmer.','Only the declared reduced model is evaluated; precipitation and field agronomy could change conclusions.'],sourceRefs:evidence.sourceManifest.map(s=>s.id),computationalVersion:modelVersion,actionText:`Ask the farmer whether ${crop} is permitted; do not infer the answer from climate data.`};
  }));
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
      const distance=axis==='crop-window'?Math.abs(evaluated[i]!.options.shift-evaluated[j]!.options.shift):Math.min(j-i,5-(j-i));
      changes.push({fromId:a.id,toId:b.id,distance});
    }
  }
  return {axis,sampledConfigurations:configurations,gridResolution:axis==='crop-window'?'Five shifts: -14, -7, 0, +7, +14 days':'Five separate ordered-sequence phases',distanceMetric:axis==='crop-window'?'Absolute calendar-day difference':'Minimum circular phase distance',observedReversals:changes,untestedDomainNotice:'Methodological changes only; not preference reversals or probabilities. No conclusions outside the tested configurations. Cyclic phases are not pooled into primary scenarios.',linkedDecisionFingerprint:baseline.analysisFingerprint};
}

export async function certificate(evidence: AnalysisEvidence, analysis: Analysis, next: readonly NextEvidenceItem[], sensitivity: readonly SensitivityResult[] = []): Promise<DecisionCertificate> {
  requireCondition(analysis.evaluation.state === 'evaluated', 'Cannot certify invalid configuration');
  const unknown = {status:'unknown' as const,reason:'Not supplied by farmer or field measurement'};
  const output: DecisionCertificate = {schemaVersion:'inversis-certificate-v1',modelVersion,dataRevision:'power-2015-2024-retrieved-2026-11-14',context:{site:{name:'Bărăgan Plain, Romania',latitude:44.565,longitude:27.335,role:'demonstration-location'},historicalPeriod:{startYear:2015,endYear:2024,status:analysis.options.mode==='heat-only'?'validated':'requested'},candidates:analysis.candidates,cropWindows,indicatorSpecs:analysis.weights.map(w=>({id:w.indicator,physicalUnit:w.indicator==='heat-fraction'?'fraction':'days',direction:'higher-is-worse',sourceIds:[w.indicator==='heat-fraction'?'NASA-POWER/T2M_MAX/MERRA2':'GPM_3IMERGDF/07'],assumptionIds:['illustrative-thresholds','provisional-windows']})),qualityPolicy:{id:'full-crop-window-v1',rules:[{id:'complete-window',statement:'Every daily value must be valid; no interpolation.',basis:'author-convention',sourceRefs:[],limitation:'Availability does not independently establish geophysical accuracy.'}]},normalizationPolicy:{id:evidence.references[0]!.id,referenceProtocol:evidence.references[0]!.populationDefinition,constantIndicatorPolicy:'Refuse near-constant bounds with width <=1e-12'},preferenceWeights:analysis.weights,agronomicFacts:{previousCrop:unknown,diseaseHistory:unknown,soilPH:unknown,salinity:unknown,texture:unknown,drainage:unknown,organicMatter:unknown,irrigation:unknown,management:unknown},ruleRegistryVersion:'unvalidated-field-rules; explicit-hypothetical-crop-permissions-only',scenarioPolicy:{primary:'fixed-start',minimumCompleteScenarios:2,justification:'Author comparison convention requiring multiple historical replays; not a confidence claim.'},assumptions:[{id:'illustrative-thresholds',statement:'Daily maximum temperature >=35°C is counted as heat exposure; dry threshold <1 mm/day only when valid precipitation exists.',basis:'illustrative-threshold',sourceRefs:[],limitation:'Not calibrated crop damage.'},{id:'provisional-windows',statement:`Handoff crop windows shifted by ${analysis.options.shift} days; primary fixed-start plan.`,basis:'author-convention',sourceRefs:[],limitation:'No local phenology measurements.'},{id:'hypothetical-constraints',statement:`Hypothetical prohibited crops: ${analysis.options.forbidden.join(', ')||'none'}.`,basis:'author-convention',sourceRefs:[],limitation:'Not confirmed farmer constraints.'}]},sourceManifest:evidence.sourceManifest,scenarios:analysis.scenarios,decision:analysis.evaluation.result,sensitivity,nextEvidence:next,limitations:['Certificate fingerprint identifies integrity; not NASA endorsement or agricultural certification.',...evidence.limitations],canonicalizationVersion:'sorted-json-v1',fingerprint:analysis.analysisFingerprint,generatedAtUTC:new Date().toISOString()};
  const {fingerprint:priorHash,generatedAtUTC:timestamp,...body} = output;
  void priorHash; void timestamp;
  return {...output,fingerprint:await fingerprint(body)};
}
