# Validation record

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
