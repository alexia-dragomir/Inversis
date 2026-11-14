# Working reduced-model checkpoint — 2026-11-14

The accepted Stage 0 and published Stage 1 (`faed3f0`) were preserved. Work continued
on `stage-1/evidence` in the isolated Inversis repository; no unrelated project was
modified. The latest user request explicitly permits a coherent reduced model when
an indicator is unavailable. This checkpoint implements that vertical slice rather
than claiming the full precipitation-based plan is complete.

## Completed and verified

- Authentic POWER T2M_MAX: 2015-01-01–2024-12-31, 3,653/3,653 UTC daily maxima,
  °C, zero missing; annual raw responses, receipts and SHA-256 retained.
- Stage 1 IMERG: one Final V07B daily native cell, January 1, 2024, 0 mm/day,
  count 48, containing the demonstration coordinates. Original/repeat binaries agree.
- 200 physical crop/year/shift heat records; 40 unshifted records define fixed,
  candidate-independent reference bounds. Six common complete five-year scenarios.
- Pure engine: complete-window heat and dry-spell calculation, common scenarios,
  eligibility, normalization, weighted loss, minimax regret, ties, average benchmark,
  refusal states, canonical fingerprints and 5% weight-simplex generation.
- Functional Context → Decision → Stability → Certificate workflow. Controls
  recompute hypothetical crop exclusions, crop-window shifts and model selection.
  Five cyclic phases remain separate diagnostics. Next Evidence branches recompute
  the decision; certificate export carries provenance, assumptions and limitations.
- 84 tests, lint, types, both evidence integrity pipelines, production build,
  independent Python arithmetic, browser interactions and downloaded certificate hash.

## Actual reduced-model output

Default: zero calendar shift, no hypothetical exclusions, heat weight 1. All plans
remain conditional because field suitability is unknown. These are normalized heat
exposure scores, not crop performance, yield or agricultural recommendations.

| Plan | Worst regret | Average exposure |
| --- | ---: | ---: |
| Baseline | 0.00187617260788 | 0.26965777791448 |
| Alternative A | 0.09481950809420 | 0.33430456877078 |
| Alternative B | 0.11928972000943 | 0.33753575492880 |

Both methods select Baseline under these tested assumptions. The independent oracle
agrees. No preference reversal is invented: a one-indicator simplex has one point.
All five tested calendar shifts retain Baseline in the observed default UI.
Forbidding soybean hypothetically removes A/B and leaves Baseline alone; zero regret
then reflects lack of competitors. Forbidding sunflower removes all three plans.
The rainfall+heat model has zero admissible scenarios and returns insufficient evidence.

## Partial and blocked

Harmony successfully produced seven reported NetCDF results but no result binary was
downloaded and admitted. Automatic browser approval rejected the download because
it could not verify origin/context. The prepared resumable downloader is not a proven
historical ingestion path. Exact endpoints, failures and recovery are documented in
[HISTORICAL_RETRIEVAL.md](HISTORICAL_RETRIEVAL.md). Full 2015–2024 IMERG coverage,
real dry-spell analysis, broader preference landscapes and optional SMAP remain pending.

Field agronomic screening has unknown facts and explicit hypothetical permissions,
not validated local soil/disease hard exclusions. Human agronomic/scientific review
remains necessary. Mobile viewport override failed to take effect during this audit;
current desktop rendering is verified, current mobile rendering is not.

Vercel/public deployment is not configured or verified. The local app is functional
and `dist` builds successfully. Deploy only as a new dedicated Inversis project;
no environment variables are required. This report does not claim a public demo URL.

## Changed file groups and reproduction

- `scripts/acquire-power-history.ts`, `build-analysis-evidence.ts`,
  `download-harmony.ts`, `independent-oracle.py`, `verify-certificate.ts`.
- `src/engine/{exposures,decision,canonical,analysis}.ts`, shared contracts,
  parameterized POWER/date validation and `src/data/analysis-contract.ts`.
- `src/components/AnalysisWorkspace.tsx`, `src/App.tsx`, `src/styles.css`.
- `public/evidence/history` and regenerated Stage 1 processing-hash manifests.
- Three new engine test files, package scripts and current method/data/validation docs.

Run `npm run check` offline after dependency installation. `npm run history:build`
regenerates analysis evidence from verified raw captures; `npm run history:verify`
checks equality. `npm run dev` launches the interactive app. Verify a browser export
with `npm run certificate:verify -- path/to/export.json`. Re-execute the independent
Python oracle and `npm test` for a separate arithmetic check against retained bytes.

No secrets, cookies, signed download URLs, fabricated NASA observations or unverified
precipitation outputs are part of the checkpoint. Source quality validation establishes
the declared processing contract, not independent geophysical accuracy.
