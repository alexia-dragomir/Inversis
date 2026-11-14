# Technical handoff for submission materials

## Transferable claims

Inversis compares three ordered five-year crop plans through four screens:
Context → Decision → Stability → Certificate. Its contribution is an auditable
chain from original NASA bytes to physical exposures, shared historical comparisons,
explicit assumption tests and a reproducible record. It does not establish the best
agronomic rotation for a farm.

- Site: Bărăgan demonstration point, 44.565° N, 27.335° E, not a measured farm.
- NASA evidence: 3,653 POWER T2M_MAX daily maxima (°C) and 3,653 IMERG Final V07B
  daily precipitation cells (mm/day), 2015–2024 UTC. Zero missing selected values;
  every IMERG day has 48 valid half-hours. All original data and receipts retained.
- Sources: POWER/MERRA2 modeled temperature; IMERG satellite/gauge precipitation,
  DOI 10.5067/GPM/IMERGDF/DAY/07, collection C2723754864-GES_DISC. The IMERG containing
  native 0.1° cell center is 44.55° N, 27.350000381469727° E. No SMAP is used.
- Exposures: fraction of crop-window days ≥35°C; longest run <1 mm/day. Thresholds
  and windows are illustrative. No interpolation or silent missing-value replacement.
- Scenarios: six shared overlapping five-year replays, not independent samples.
- Primary equal-weight worst regrets: Baseline **0.0481152993**, A **0.1364489169**,
  B **0.1711827623**. Mean losses: **0.3196773738**, **0.3747280420**, **0.3771012108**.
- Baseline is selected, but A has the lowest loss in 2015–2019 and B in 2018–2022.
  Baseline is not pointwise dominant across all twelve scenario–indicator pairs.
- Nominal 21-weight preference grid has no preferred-set change; minimum score
  gap is **0.0727272727**, not confidence. Independent tests cover all 105 weight ×
  calendar combinations under both primary and P10/P90 references. All select Baseline.
  Five cyclic phases and six single-replay omissions also preserve it in their
  declared tests. No continuous boundary, probability or invented reversal is claimed.
- P10/P90 is a secondary methodology test, not a replacement chosen to improve
  a story. Soybean exclusion is hypothetical eligibility-only change; sunflower
  exclusion leaves no eligible plan. New field evidence remains necessary.

## Interpretation to retain in the narrative

This model allocates historical weather to provisional crop windows; it does not
model biological rotation interactions. Baseline's additional wheat year encounters
less heat, while soybean's longer window cannot have shorter dry runs than its
contained maize/sunflower windows in the same year. An unchanged selected set is
therefore bounded evidence about this model, not universal robustness or field
superiority. Exact comparisons and the audit rationale are in PHASE_2_FINDINGS.md.

Do not claim yield forecasts, calibrated crop damage, soil-health improvement,
disease reduction, causal rotation benefits, NASA endorsement, users, awards or
independent human scientific validation. Both arithmetic implementations were
AI-assisted; their independence is computational. The app has no runtime AI.

## Evidence and verification links

- Live application: https://alexia-dragomir.github.io/Inversis/
- Repository: https://github.com/alexia-dragomir/Inversis/tree/stage-1/evidence
- Scientific findings: https://github.com/alexia-dragomir/Inversis/blob/stage-1/evidence/docs/PHASE_2_FINDINGS.md
- Methods: https://github.com/alexia-dragomir/Inversis/blob/stage-1/evidence/docs/METHODS.md
- NASA provenance: https://github.com/alexia-dragomir/Inversis/blob/stage-1/evidence/docs/DATA_SOURCES.md
- AI disclosure: https://github.com/alexia-dragomir/Inversis/blob/stage-1/evidence/docs/AI_USE.md
- License: Apache-2.0 for original code; THIRD_PARTY_NOTICES.md records dependencies.
- Phase 2 runtime checkpoint: b538001e0cefe7e77e8c6fd86c0c3176d0b0c4f4.
- Local full verification: **107 tests in 14 files**, lint, TypeScript, original-byte
  verifiers, independent numerical diagnostics and production build passed.
- Remote scientific check and deployment passed in run 43595682592 for `ff3527e`.
  Public desktop and 390px checks passed all four screens, controls, heat-only
  fallback, exclusions, reset, evidence loading and certificate export. No horizontal
  page overflow or console warnings/errors were observed. Direct routes and refresh
  work; refresh resets assumptions to defaults.
- Public export at heat 20%, dry spell 80%, +7-day windows and no exclusions:
  `0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15`.
  Canonical hash verified; entire exported decision and weights matched fresh local
  recomputation using the retained evidence. See VALIDATION.md.

## Suggested live evidence sequence

1. Context: show complete coverage, source location and unknown field facts.
2. Decision: compare all six replay losses. Explain why A/B can win a replay while
   Baseline has the lowest worst regret. Open the physical crop-window audit.
3. Stability: show regret profiles, exact margins and scenario–indicator trade-offs.
   Change preferences and distinguish unchanged selection from unchanged scores.
   Open alternate normalization and omitted-replay diagnostics.
4. Explore hypothetical soybean/sunflower permissions; distinguish eligibility from
   preference. Name field questions the model cannot quantify.
5. Certificate: download the actual current state and verify its SHA-256 with
   `npm run certificate:verify -- PATH`. Source-code hashes and diagnostic records
   travel with the export; the hash is integrity, not agricultural certification.

## Separate submission work

The slides/video, final project-page narrative, team details and final submission
form remain the separate workstream's responsibility. Recheck the live guide/form
for current asset limits and terms before submitting. No final form has been
submitted here. User-supplied deadline: November 15, 2026, 23:59 Europe/Bucharest.
The approved original logo is still absent; the app uses its text wordmark without
inventing a replacement or modifying NASA branding.
