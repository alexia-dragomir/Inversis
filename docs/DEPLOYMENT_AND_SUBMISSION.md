# Deployment and submission preparation

## Actual readiness

The static Vite/React application has no backend, runtime NASA login, API key or
new hosting dependency. GitHub Pages is selected for the existing public Inversis
repository. The owner enabled GitHub Actions as the Pages source. Workflow
`.github/workflows/ci.yml` runs all independent readers/arithmetic and `npm run check`,
uploads only `dist`, then deploys through a dependent Pages job. The deploy job has
only Pages-write and OIDC permissions; source access remains read-only. No NASA
credential is available or needed in CI or the deployed app.

**Live application: https://alexia-dragomir.github.io/Inversis/**

Scientific check and Pages deployment passed in
[run 43595682592](https://github.com/alexia-dragomir/Inversis/actions/runs/43595682592)
for `ff3527e`; runtime implementation is `b538001`. The initial deployment was
blocked by the environment branch rule. The owner permitted `stage-1/evidence`
while preserving other protections. A normal documentation push triggered the
successful workflow; no security checks were bypassed.

Relative asset/evidence URLs and four hash routes support the repository subpath,
refresh and direct links without server rewrites. Local desktop/mobile (390px)
checks passed, including settings keyboard activation, source coverage, charts and
heat-only fallback. Public desktop and 390px checks passed all four screens,
controls, exclusions, reset, evidence loading and certificate export. Direct routes
and refresh worked; refresh restores default assumptions. There was no horizontal
page overflow or captured console warning/error. Seven public assets matched the
production build byte for byte; twenty annual archive/manifest URLs returned HTTP 200.
The exported 20% heat / 80% dry-spell, +7-day decision exactly matched fresh
recomputation. See VALIDATION.md for its hash and numerical validation.
Verify exports with `npm run certificate:verify -- EXPORT.json`.

The retained `vercel.json` is an unused alternative configuration, not a second
hosting project. No Vercel account/project was created. No other repository was
accessed or modified. Never upload `.local`, credentials or signed URLs.

The user-supplied deadline is November 15, 2026, 23:59 Europe/Bucharest. Final
submission and separate demo materials remain outstanding. Recheck the live form
and terms at submission; no form has been submitted here. See SUBMISSION_RULES.md
for the earlier official-guide review, and SUBMISSION_TECHNICAL_HANDOFF.md for
transferable numerical results and claims.

## Submission text draft — current verified scope

**Name:** Inversis

**Tagline:** Know what would change the decision.

**Summary:** Inversis turns historical NASA environmental evidence into an auditable
comparison of ordered five-year crop plans. It shows which assumptions and farmer
constraints change a conditional decision, preserves ties and missing-evidence
refusals, and exports the evidence and computation behind each result.

**What works:** The interactive Context → Decision → Stability → Certificate workflow
uses 3,653 real NASA POWER daily maximum temperatures and 3,653 IMERG Final V07B daily
precipitation cells for 2015–2024. Six common five-year replays support a provisional
rainfall-and-heat comparison. A 21-point preference grid, calendar/phase diagnostics,
hypothetical crop exclusions and recomputed Next Evidence expose the assumptions.
Phase 2 adds exact replay-loss charts, regret-margin profiles, pointwise-dominance
checks, alternate normalization and historical replay-omission diagnostics.
The explicit heat-only fallback remains available. The certificate includes source
hashes, physical exposures, references, matrices, diagnostics and limitations.

**NASA data:** POWER T2M_MAX/MERRA2, UTC daily maxima in °C; IMERG Final daily V07B,
containing native 0.1° cell in mm/day, with all 48 valid half-hours on every day.
Every original daily NetCDF is retained, independently read with two implementations,
and traceable through original receipts. No observations were fabricated, filled or
silently substituted. SMAP is not used. See DATA_SOURCES.md and the annual manifests.

**Verified result:** At illustrative equal weights, Baseline minimizes worst regret
(0.0481153) and average weighted exposure. The preferred set remains unchanged across
all declared preference, calendar and phase tests. We report **no observed reversal**,
not an invented boundary or a universal robustness claim. Farmer permission branches
can alter eligibility or leave no eligible candidate; these are explicitly hypothetical.

**Scientific scope:** These are conditional historical environmental-exposure
comparisons. They do not predict yield, disease, soil health, future climate or
field suitability. The 35°C threshold and crop windows are illustrative assumptions.
Farmer constraints are hypothetical until supplied. All plans remain conditional.

**AI disclosure:** OpenAI Codex assisted code, tests, documentation and the two
independent arithmetic/reader implementations. NASA observations were retrieved,
not generated. The deployed app contains no runtime AI. Human scientific and
agronomic review remains necessary; see AI_USE.md.

**Demonstration sequence:** Context: show both complete historical coverage counts and
retained source archives. Decision: trace the 2015 wheat window to 1/61 hot days and
16 consecutive dry days, then inspect normalization and common-scenario regret.
Stability: change heat/dry preference, explain the observed unchanged preferred set,
inspect calendar/phase diagnostics and hypothetical soybean/sunflower exclusions.
Switch to the preserved heat-only model to demonstrate the explicit fallback.
Certificate: download and verify its SHA-256, source records and diagnostic samples.
Do not imply stable sampled sets prove future performance or field suitability.

**Links still required:** final project/submission page and public demonstration
asset in the format accepted by the live form. The application URL above is verified.
