import type { Candidate, DecisionResult, Site } from '../domain/contracts';

export const demoSite: Site = {
  name: 'Bărăgan Plain, Romania', latitude: 44.565, longitude: 27.335,
  role: 'demonstration-location',
};

/** Proposed plans from the handoff, not validated field recommendations. */
const proposedPlans = [
  { id: 'baseline', name: 'Baseline', fiveYearOrderedCrops: ['wheat', 'maize', 'sunflower', 'wheat', 'maize'] },
  { id: 'a', name: 'Alternative A', fiveYearOrderedCrops: ['wheat', 'soybean', 'maize', 'sunflower', 'maize'] },
  { id: 'b', name: 'Alternative B', fiveYearOrderedCrops: ['wheat', 'sunflower', 'maize', 'soybean', 'maize'] },
] as const satisfies readonly Pick<Candidate, 'id' | 'name' | 'fiveYearOrderedCrops'>[];

export const candidates: readonly Candidate[] = proposedPlans.map((plan) => ({
  ...plan,
  farmerRestrictions: [],
  agronomicScreening: 'CONDITIONAL',
  fieldSuitability: 'not-established',
  ledger: [{
    id: `${plan.id}-unknown-field`, category: 'unknown-field-fact', status: 'unknown',
    ruleIds: [], sourceRefs: [], scope: 'fixed-start',
    explanation: 'Field soil, previous crops, disease history and management have not been supplied. Agronomic rules have not yet been validated.',
  }],
}));

/** Explicit initial absence of a calculation; no zero-filled scientific results. */
export const initialDecision: DecisionResult = {
  status: 'INSUFFICIENT_EVIDENCE', provisional: true, constraintDependent: false,
  activeCandidateIds: candidates.map(({ id }) => id), confirmedCandidateIds: [],
  validScenarioIds: [], indicatorIds: [], weights: [], normalization: [], preferredSet: [],
  reasons: ['Seven POWER days and one IMERG day validate source access, not crop comparisons.', 'No complete common historical scenarios have been established.'],
  warnings: ['No rotation has established field-level suitability.'],
};

/** Stage 1 source status; access samples do not establish comparison readiness. */
export const plannedSources = [
  { name: 'NASA POWER', product: 'Daily T2M_MAX · 1–7 January 2024 UTC', role: 'Modeled maximum 2 m air temperature', unit: '°C · 7/7 days present', status: 'Access sample validated' },
  { name: 'GPM / IMERG', product: 'Final daily V07 / V07B · 1 January 2024 UTC', role: 'Satellite/gauge precipitation estimate · native cell', unit: 'mm/day · 48/48 half-hours present', status: 'One-day sample validated' },
  { name: 'SMAP L4', product: 'SPL4SMGP V008 · optional third source', role: 'Model-assimilated root-zone moisture', unit: 'm³/m³ · to verify', status: 'Not ingested' },
] as const;
