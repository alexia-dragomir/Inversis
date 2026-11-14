# Stage 0 validation

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
