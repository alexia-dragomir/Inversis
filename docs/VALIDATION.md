# Validation record

## Phase 2 and public deployment, 2026-11-14

`npm run check` passed **107 tests in 14 files**, lint, TypeScript, source/history
verification, deterministic regeneration and production build. The original heat
fallback remains covered. Independent Python arithmetic matches 105 preference ×
calendar cases under each of two reference protocols (210 total) and six single-replay
omissions. Independence is computational, not independent human scientific review.
The audit is in PHASE_2_FINDINGS.md.

Public application: https://alexia-dragomir.github.io/Inversis/. Scientific check and
deployment succeeded in GitHub Actions run **43595682592**, commit `ff3527e`, with
runtime implementation `b538001`. All four public screens were checked on desktop
and at 390px viewport width; document width equaled client width (375px with scrollbar),
with no horizontal page overflow. Controls, hypothetical exclusions, reset, heat-only
fallback, preference selection, methodological disclosures, source coverage and
certificate export worked. Direct Stability navigation and Certificate refresh worked;
refresh restores default assumptions. No captured console warnings/errors.

Seven fetched public assets matched production SHA-256 exactly: HTML, JS, CSS,
both historical analysis inputs, the January 1 sample NetCDF and 2015 source archive.
All twenty annual archive/manifest URLs returned HTTP 200. No NASA request or token
was needed for these static deployment checks.

Downloaded public certificate `inversis-0e0f04011a61.json` used heat weight 0.2,
dry-spell weight 0.8, +7-day windows and no exclusions. Canonical SHA-256 verified:
`0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15`.
Its entire decision record (including loss/regret matrices) and weights exactly
matched fresh `analyze` output from retained source-backed inputs at those settings.
The export also recorded +7 days and no prohibited crops. Production JavaScript:
340.57 kB (94.96 kB gzip); CSS: 14.59 kB (3.82 kB gzip).

Earlier sections are historical checkpoint records, superseded where applicable.

## Complete rainfall-and-heat checkpoint, 2026-11-14

`npm run check` passed **101 tests in 13 files**, lint, strict TypeScript, every
source/sample/history verifier, deterministic full IMERG regeneration and production
build. Both source families have 3,653 valid UTC days. Independent h5py/h5wasm readers
agree on every IMERG cell/count/status/source URL. A separate raw-source Python oracle
agrees with all physical exposures and 29 distinct comparison configurations to 12
decimals. Tests explicitly preserve the heat fallback and refuse missing/shared-domain,
unit, calendar, provenance and archive-corruption failures.

Browser smoke checks passed all four routes, combined physical exposures, weight/shift
controls, sole/no-eligible outcomes, reset, heat fallback, 21-point preference grid,
Next Evidence and certificate download. No captured console warnings/errors. Export
SHA-256: `dadc84b99fe032d45a78564e2fde14c345ac1584cdaa433e26ef176053bcee5f`.
Desktop visual inspection passed; current mobile rendering remains unverified.
Production JavaScript is 323.58 kB (90.41 kB gzip). Remote CI success is not claimed.
See [full evidence, results and limitations](COMBINED_CHECKPOINT.md).

The sections below are historical checkpoints; their earlier acquisition blockers
and incomplete-rainfall states have been superseded by the complete DAP4 archive.

## Seven-day precipitation recovery checkpoint

After fc80643, `npm run check` passed **89 tests in ten files**, lint, TypeScript,
the POWER history verifier, both Stage 1 and seven-day IMERG byte/receipt/metadata
verifiers, and production build. The preserved original 84 tests continue to pass.
New tests compare every daily precipitation value, count, cell and source hash
against an independently executed h5py 3.15.1/HDF5 1.14.6 reader (NumPy 2.3.5).
The 5% preference sweep tests cover an independently specified synthetic 50/50 tie,
neighboring preferred-set changes, the singleton real heat-only domain, and refusal
at all 21 combined-model weights when historical precipitation is missing.

Browser smoke checks confirmed the seven actual values and source links in Context,
preserved missing-rainfall refusal, and successful audit download containing the
preference diagnostic. No browser console warnings/errors were reported. The downloaded
certificate passed `certificate:verify` with SHA-256
`ca396a1f293c699ad127ffea8d4e29404d4fe7b00a8dc32bc6f0d8070216abdf`.
Production JavaScript is 310.66 kB (87.35 kB gzip), including sample provenance.
Current mobile rendering remains unverified.

GitHub Actions now reruns both independent Python oracles before the complete npm
check; remote execution of the updated workflow is not implied by local success.
The token-authenticated downloader is prepared and type/lint checked, but no token
was available to validate its authenticated network path or historical throughput.

## Reduced-model checkpoint, 2026-11-14

`npm run check` passed lint, strict TypeScript, **84 tests in eight files**, retained
Stage 1 evidence verification, offline verification of all ten annual POWER captures,
deterministic regeneration of 200 crop/year/shift records and the production build.
The JavaScript bundle is 259.47 kB (80.82 kB gzip); no NASA login is required at runtime.

Tests cover physical units, strict UTC dates, missing/partial daily support, full
crop windows, dry-run and heat thresholds, shared scenario refusal, eligibility
before minima, ties, single-candidate interpretation, reference degeneracy, benchmark
consistency, 1/21/231-point weight grids, counterfactual classifications, fingerprints
and certificate scope. Synthetic arithmetic fixtures are confined to tests.

`scripts/independent-oracle.py` was executed using Python's standard library and the
retained raw POWER bytes. It imports no TypeScript computation. Its retained output
checks all default scenario losses/regrets and preferred set to 12 decimal places.
Spot checks: wheat 2015 has 1 hot day of 61; maize 2024 has 41 of 62. This is independent
arithmetic verification, not independent agronomic review. The oracle output retains
source and Python code hashes. Run it from the repository root with Python, then
`npm test` to compare again.

Browser checks passed all four routes, real coverage and physical-value tables,
soybean exclusion leaving one candidate, maize exclusion leaving none, reset,
combined-model insufficient-evidence refusal, window diagnostics and recomputed
Next Evidence. No console warnings/errors were reported. Certificate JSON downloaded
successfully and `npm run certificate:verify -- PATH` verified the exact browser
export hash `e0024eb6ae440a781b1549b2dc9028f31d0175f976e83ae569d83ad8993980a0`.
Visual inspection passed at the observed 1280-pixel viewport. A requested mobile
viewport override did not take effect; a new mobile render is **not verified**.
The earlier Stage 0 responsive audit does not establish current mobile correctness.

Harmony downloader is prepared, type/lint checked, but actual seven-day binaries,
its authentication/redirect path and historical scientific ingestion remain unverified.
GitHub Actions results are separate from these local checks.

## Stage 1 checkpoint

Executed 2026-11-14: `npm run check` passed lint, strict TypeScript, **58 tests in five
files**, offline byte/hash/metadata validation and deterministic evidence regeneration,
and the production build. Tests use the retained authentic POWER and CMR captures;
IMERG cell unit-test fixtures are synthetic and explicitly labeled. Separate integration
tests validate the real one-day NetCDF subset and repeated download, including
coordinate/dimension order, UTC bounds, native units, fill and half-hour counts.
See [Stage 1 report](STAGE_1_REPORT.md).

Browser smoke check confirmed all four routes, updated source status, persistent
insufficient-evidence messages, and expanded provenance links. No ranking or
certificate was rendered. This text-only UI update did not repeat the Stage 0
responsive/accessibility audit or claim a new exhaustive one.

## Historical Stage 0 validation

Executed 2026-11-14. These checks validate the foundation, not agronomic correctness
or NASA observations. No scientific engine exists yet.

| Check | Observed result |
| --- | --- |
| Dependency installation | React/React DOM and development packages installed; exact versions and lockfile recorded |
| Clean lockfile installation | `npm ci --offline` succeeded on elevated retry after sandbox EPERM; no dependencies changed |
| `npm run lint` | Passed, zero warnings |
| `npm run typecheck` | Passed strict TypeScript including compile-time negative contract cases |
| `npm test` | 12 tests passed in one Vitest test file |
| `npm run build` | Passed; static `dist` generated |
| Local `npm run dev` | Vite ready; outside-sandbox preview returned HTTP 200 |
| Browser navigation | Context → Decision → Stability → Certificate and return link verified |
| Provenance disclosure | Expanded by click, collapsed by keyboard Enter |
| Keyboard | Navigation Enter worked; Tab produced visible focus; main received focus after navigation |
| Responsive | Desktop, tablet 768px and mobile 390px overrides inspected; mobile/tablet DOM scrollWidth equalled clientWidth (375/753px after scrollbar) |
| Browser console | No captured warning/error entries during smoke check |

Tests verify absence of invented results, conditional initial eligibility, missing
versus zero values, specified crop order and equal A/B composition, four route mappings,
unknown-route fallback, context rendering and all three refusal screens. Type checks
reject missing observations with values, singleton ties, and refusal winners.

This is not a full accessibility audit or exhaustive browser/device test. Source
validation, all 47 scientific adversarial tests, independent numerical oracle,
counterfactual calculations and certificate integrity tests remain future-stage work.
GitHub Actions is configured but not claimed to have passed remotely.

## Dependency audit

The full install audit reported seven moderate advisory entries, all tracing to
`minimatch` 10.2.6 beneath `@typescript-eslint/typescript-estree`. Advisory:
https://github.com/advisories/GHSA-g3hv-75wg-m249 (glob-pattern denial of service).
This is development lint tooling, not bundled application code. npm's suggested
forced downgrade of typescript-eslint was not applied. Do not run lint on hostile
untrusted glob configuration. Track an upstream compatible fix before broader release.
`npm audit --omit=dev` reported zero production vulnerabilities. Offline install
messages are not treated as a fresh online advisory audit.
