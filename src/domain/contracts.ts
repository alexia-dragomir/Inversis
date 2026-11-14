/** Shared Stage 0 contracts. No scientific calculation or runtime validation is implied. */
export type NonEmpty<T> = readonly [T, ...T[]];
export type Crop = 'wheat' | 'maize' | 'sunflower' | 'soybean';
export type FiveYearCrops = readonly [Crop, Crop, Crop, Crop, Crop];
export type IndicatorId = 'dry-spell' | 'root-zone-moisture' | 'heat-fraction';
export type PhysicalUnit = 'mm' | 'mm/day' | 'degC' | 'm3/m3' | 'dS/m' | 'days' | 'fraction';
export type Eligibility = 'SCREENED' | 'CONDITIONAL' | 'EXCLUDED';
export type EvidenceOrigin = 'observation-derived' | 'model-derived' | 'model-assimilated';
export type Fact<T> =
  | { readonly status: 'unknown'; readonly reason: string }
  | { readonly status: 'supplied'; readonly value: T; readonly suppliedBy: string; readonly suppliedAt: string; readonly sourceRefs: readonly string[] };
export interface Quantity<U extends PhysicalUnit = PhysicalUnit> {
  readonly value: number;
  readonly unit: U;
}
export interface Assumption {
  readonly id: string;
  readonly statement: string;
  readonly basis: 'author-convention' | 'illustrative-threshold' | 'source-informed';
  readonly sourceRefs: readonly string[];
  readonly limitation: string;
}
export interface Site {
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly role: 'demonstration-location' | 'farmer-supplied-location';
}
export interface SpatialSupport {
  readonly requestedCoordinates: { readonly latitude: number; readonly longitude: number };
  readonly selectedCoordinates: { readonly latitude: number; readonly longitude: number };
  readonly footprint: string;
  readonly nativeResolution: string;
  readonly extractionMethod: string;
}
export interface ProvenanceRecord {
  readonly id: string;
  readonly sourceId: string;
  readonly productFamily: string;
  readonly collectionVersion: string;
  readonly scienceVersion: string | null;
  readonly variablePath: string;
  readonly sourceType: EvidenceOrigin;
  readonly sourceUrl: string;
  readonly doi: string | null;
  readonly queryOrGranule: string;
  readonly retrievalTimeUTC: string;
  readonly sourceTimeStandard: 'UTC' | 'LST' | 'other';
  readonly utcAlignment: string;
  readonly temporalSupport: string;
  readonly spatialSupport: SpatialSupport;
  readonly rawUnit: string;
  readonly fillValues: readonly (number | string)[];
  readonly processingVersion: string;
  readonly transformations: readonly string[];
  readonly sha256: string;
  readonly dependenceNotes: readonly string[];
}
export type QualityValue<U extends PhysicalUnit> =
  | { readonly status: 'valid'; readonly quantity: Quantity<U>; readonly flags: readonly string[] }
  | { readonly status: 'missing' | 'invalid' | 'unverified'; readonly reason: string; readonly quantity?: never };
export interface Observation<U extends PhysicalUnit = PhysicalUnit> {
  readonly id: string;
  readonly provenanceId: string;
  readonly timeStartUTC: string;
  readonly timeEndUTC: string;
  readonly rawValue: number | string | null;
  readonly measurement: QualityValue<U>;
}
export interface Coverage {
  readonly expectedDays: number;
  readonly validDays: number;
  readonly missingDays: number;
  readonly longestGapDays: number;
  readonly policyId: string;
  readonly status: 'passed' | 'failed' | 'unverified';
  readonly reasons: readonly string[];
}
export interface CropSensitiveWindow {
  readonly crop: Crop;
  readonly startMonthDay: string;
  readonly endMonthDay: string;
  readonly assumptionId: string;
}
export interface IndicatorSpec {
  readonly id: IndicatorId;
  readonly physicalUnit: PhysicalUnit;
  readonly direction: 'higher-is-worse' | 'lower-is-worse';
  readonly sourceIds: NonEmpty<string>;
  readonly assumptionIds: readonly string[];
}
export interface CropYearExposure {
  readonly crop: Crop;
  readonly candidateId: string;
  readonly assignedYear: number;
  readonly indicator: IndicatorId;
  readonly windowStartUTC: string;
  readonly windowEndUTC: string;
  readonly calendarShiftDays: number;
  readonly physical: QualityValue<PhysicalUnit>;
  readonly coverage: Coverage;
  readonly sourceRefs: NonEmpty<string>;
  readonly contributingObservationIds: NonEmpty<string>;
  readonly normalizationRef: string | null;
}
export interface FarmerConstraint {
  readonly id: string;
  readonly crop: Crop;
  readonly permission: 'permitted' | 'prohibited';
  readonly suppliedBy: string;
  readonly suppliedAt: string;
  readonly explanation: string;
}
export interface AgronomicFacts {
  readonly previousCrop: Fact<Crop>;
  readonly diseaseHistory: Fact<string>;
  readonly soilPH: Fact<number>;
  readonly salinity: Fact<Quantity<'dS/m'>>;
  readonly texture: Fact<string>;
  readonly drainage: Fact<string>;
  readonly organicMatter: Fact<string>;
  readonly irrigation: Fact<string>;
  readonly management: Fact<string>;
}
export interface AgronomicRule {
  readonly id: string;
  readonly sourceRefs: NonEmpty<string>;
  readonly sourceStatement: string;
  readonly applicability: string;
  readonly crops: NonEmpty<Crop>;
  readonly severity: 'advisory-caution' | 'documented-hard-constraint';
  readonly requiredFacts: readonly (keyof AgronomicFacts)[];
  readonly limitation: string;
}
export interface LedgerEntry {
  readonly id: string;
  readonly category: 'environmental-evidence' | 'literature-caution' | 'farmer-constraint' | 'unknown-field-fact';
  readonly status: 'pass' | 'caution' | 'violation' | 'unknown';
  readonly ruleIds: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly explanation: string;
  readonly scope: 'fixed-start' | 'cyclic-diagnostic';
}
export interface Candidate {
  readonly id: string;
  readonly name: string;
  readonly fiveYearOrderedCrops: FiveYearCrops;
  readonly farmerRestrictions: readonly FarmerConstraint[];
  readonly agronomicScreening: Eligibility;
  readonly fieldSuitability: 'not-established' | 'supported-by-required-checks';
  readonly ledger: readonly LedgerEntry[];
}
export interface Scenario {
  readonly id: string;
  readonly fiveYearStart: number;
  readonly fiveYearEnd: number;
  readonly cropYearExposureByCandidate: Readonly<Record<string, readonly CropYearExposure[]>>;
  readonly validity: 'valid' | 'excluded' | 'unverified';
  readonly exclusionReasons: readonly string[];
}
export interface NormalizationReference {
  readonly id: string;
  readonly indicator: IndicatorId;
  readonly lower: Quantity;
  readonly upper: Quantity;
  readonly direction: 'higher-is-worse' | 'lower-is-worse';
  readonly populationDefinition: string;
  readonly sourceRefs: NonEmpty<string>;
  readonly candidateIndependent: true;
  readonly processingVersion: string;
}
export interface PreferenceWeight { readonly indicator: IndicatorId; readonly weight: number }
export interface Context {
  readonly site: Site;
  readonly historicalPeriod: { readonly startYear: number; readonly endYear: number; readonly status: 'requested' | 'validated' };
  readonly candidates: readonly Candidate[];
  readonly cropWindows: readonly CropSensitiveWindow[];
  readonly indicatorSpecs: readonly IndicatorSpec[];
  readonly qualityPolicy: { readonly id: string; readonly rules: readonly Assumption[] };
  readonly normalizationPolicy: { readonly id: string; readonly referenceProtocol: string; readonly constantIndicatorPolicy: string };
  readonly preferenceWeights: readonly PreferenceWeight[];
  readonly agronomicFacts: AgronomicFacts;
  readonly ruleRegistryVersion: string;
  readonly scenarioPolicy: { readonly primary: 'fixed-start'; readonly minimumCompleteScenarios: number; readonly justification: string };
  readonly assumptions: readonly Assumption[];
}
export type DecisionStatus = 'NO_ELIGIBLE_ROTATION' | 'INSUFFICIENT_EVIDENCE' | 'TIED_PREFERENCE' | 'PREFERRED_UNDER_TESTED_ASSUMPTIONS';
export interface DecisionBasis {
  readonly provisional: boolean;
  readonly constraintDependent: boolean;
  readonly activeCandidateIds: readonly string[];
  readonly confirmedCandidateIds: readonly string[];
  readonly validScenarioIds: readonly string[];
  readonly indicatorIds: readonly IndicatorId[];
  readonly weights: readonly PreferenceWeight[];
  readonly normalization: readonly NormalizationReference[];
  readonly warnings: readonly string[];
}
/** Matrices are [candidateId][scenarioId]; consumers must check missing keys. */
export type DecisionMatrix = Readonly<Record<string, Readonly<Record<string, number>>>>;
export interface ComputedComparison {
  readonly lossMatrix: DecisionMatrix;
  readonly regretMatrix: DecisionMatrix;
  readonly worstRegrets: Readonly<Record<string, number>>;
  readonly tieTolerance: number;
  readonly provenanceFingerprint: string;
  readonly comparisonScope: 'competitive' | 'only-eligible-candidate';
  readonly averageLossBenchmark: {
    readonly meanLossByCandidate: Readonly<Record<string, number>>;
    readonly preferredSet: NonEmpty<string>;
    readonly relationToMinimax: 'agree' | 'diverge' | 'tie-involved';
    readonly sharedLossMatrix: true;
  };
}
export type DecisionResult = DecisionBasis & (
  | { readonly status: 'NO_ELIGIBLE_ROTATION' | 'INSUFFICIENT_EVIDENCE'; readonly reasons: NonEmpty<string>; readonly preferredSet: readonly []; readonly computation?: never }
  | { readonly status: 'TIED_PREFERENCE'; readonly preferredSet: readonly [string, string, ...string[]]; readonly computation: ComputedComparison }
  | { readonly status: 'PREFERRED_UNDER_TESTED_ASSUMPTIONS'; readonly preferredSet: readonly [string]; readonly computation: ComputedComparison }
);
/** Invalid configuration is refused before invoking the scientific decision engine. */
export type DecisionEvaluation =
  | { readonly state: 'invalid-input'; readonly issues: NonEmpty<string> }
  | { readonly state: 'evaluated'; readonly result: DecisionResult };
export type SensitivityAxis = 'preference' | 'eligibility' | 'crop-window' | 'normalization' | 'indicator-omission' | 'cyclic-phase';
export interface SensitivityResult {
  readonly axis: SensitivityAxis;
  readonly sampledConfigurations: readonly { readonly id: string; readonly description: string; readonly decision: DecisionResult }[];
  readonly gridResolution: string;
  readonly distanceMetric: string;
  readonly observedReversals: readonly { readonly fromId: string; readonly toId: string; readonly distance: number }[];
  readonly untestedDomainNotice: string;
  readonly linkedDecisionFingerprint: string;
}
export type DecisionConsequence = 'DECISION_CHANGING' | 'ELIGIBILITY_CHANGING_ONLY' | 'NOT_DECISION_CHANGING_IN_TESTED_CASES' | 'UNRESOLVED';
export interface CounterfactualAnswer {
  readonly id: string;
  readonly label: string;
  readonly provenance: 'hypothetical' | 'farmer-supplied' | 'source-backed';
  readonly sourceRefs: readonly string[];
  readonly modification: string;
}
export interface NextEvidenceItem {
  readonly questionId: string;
  readonly questionText: string;
  readonly unknownFact: string;
  readonly questionCategory: 'eligibility-evidence' | 'preference-clarification' | 'methodological-sensitivity' | 'field-soil-information';
  readonly answerOptions: NonEmpty<CounterfactualAnswer>;
  readonly evidenceBasis: string;
  readonly baselineStatus: DecisionStatus;
  readonly baselineFingerprint: string;
  readonly outcomesByAnswer: readonly { readonly answerId: string; readonly result: DecisionEvaluation; readonly fingerprint: string | null }[];
  readonly consequence: DecisionConsequence;
  readonly eligibilityChanged: boolean;
  readonly preferredSetChanged: boolean;
  readonly statusChanged: boolean;
  readonly marginOnlyChanged: boolean;
  readonly affectedCandidateIds: readonly string[];
  readonly supportingRuleIds: readonly string[];
  readonly interpretation: string;
  readonly limitations: NonEmpty<string>;
  readonly sourceRefs: readonly string[];
  readonly computationalVersion: string;
  readonly actionText: string;
}
export interface DecisionCertificate {
  readonly schemaVersion: string;
  readonly modelVersion: string;
  readonly dataRevision: string;
  readonly context: Context;
  readonly sourceManifest: readonly ProvenanceRecord[];
  readonly scenarios: readonly Scenario[];
  readonly decision: DecisionResult;
  readonly sensitivity: readonly SensitivityResult[];
  readonly nextEvidence: readonly NextEvidenceItem[];
  readonly limitations: NonEmpty<string>;
  readonly canonicalizationVersion: string;
  readonly fingerprint: string;
  /** Presentation metadata; exclude from deterministic analysis fingerprint. */
  readonly generatedAtUTC: string;
}
