# Deployment and submission preparation

## Actual readiness

The static application builds locally and has no backend, API key or NASA-login
dependency at runtime. `vercel.json` builds only after the complete `npm run check`
pipeline passes and publishes `dist`. It adds standard response headers. No public
deployment is claimed: there is no linked Vercel project or verified public demo URL.

Create a **new Inversis-only** Vercel project connected only to
`alexia-dragomir/Inversis`, using the verified checkpoint branch `stage-1/evidence`.
Do not attach this workspace to another project's hosting configuration. No environment
variables are required. Never upload `.local`, credentials or temporary signed URLs.
The four hash routes need no history fallback rewrite. After deployment, check all
four routes, NASA source archives, combined/fallback controls and downloaded certificate.
Run `npm run certificate:verify -- EXPORT.json` against the download.

The user-supplied deadline is November 15, 2026, 23:59 Europe/Bucharest. A public
demo link and final submission form are still outstanding. Check the live form and
terms at submission; no form has been submitted by this agent. See SUBMISSION_RULES.md
for the earlier official-guide review. Do not claim that source publication equals
submission or public application deployment.

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

**Links still required:** verified public application URL; final project/submission
page; public demonstration asset in the format accepted by the live form.
