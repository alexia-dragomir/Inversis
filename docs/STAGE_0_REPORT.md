# Stage 0 execution report

Date: 2026-11-14, Europe/Bucharest. Scope: Stage 0 only. Owner review is required
before Stage 1. Full Master Handoff v6 body, tables and footer were read, including
Addendum J. Its historical sections are reconciled in `LIMITATIONS.md`.

## Implemented

Strict React/TypeScript/Vite application, Vitest, ESLint, four hash routes, methodology
disclosure, ivory/teal/green responsive styles, and explicit evidence-pending states.
Shared G/H/I contracts preserve source lineage, physical units, quality/unknown states,
agronomic ledger, decision refusals/ties, average-loss benchmark, sensitivity,
counterfactual consequence classes and certificate inputs. Scientific engine and
evidence acquisition are intentionally unimplemented. Pure engine/data/agronomy
boundaries are reserved without unnecessary dependencies or empty executable stubs.

Runtime dependency footprint: React and React DOM (plus transitive Scheduler).
No backend, database, authentication, paid service or runtime AI. Documentation and
CI are initialized. Proposed crop plans are configuration, not findings.

## Commands and outcomes

- `Get-ChildItem -Force`: workspace initially empty; no local Git repository.
- DOCX ZIP/XML extraction: first attempt failed on XML namespace overload, corrected
  extraction succeeded. All text read in chunks; raw extraction is ignored locally
  and is not committed or published.
- `node --version`: bundled PATH runtime v24.22.1. npm absent from PATH initially.
- Explicit installed npm: v11.20.0. Checks use the installed Node runtime after adding
  `C:\Program Files\nodejs` to this process PATH (installed Node v26.13.1); no global settings were changed.
- `git config --get user.name` / `user.email`: existing author identity available;
  no global Git config or credentials changed.
- `git ls-remote https://github.com/alexia-dragomir/Inversis.git`: sandbox DNS failed;
  elevated retry succeeded with no refs. GitHub connector confirmed the public,
  empty Inversis repository and push permission.
- `git init -b stage-0/foundation`: succeeded in this workspace only.
- `git remote add origin ...`: sandbox denied `.git/config`; elevated retry succeeded.
- `npm install --save-exact react react-dom`: initial network sandbox failure;
  elevated retry installed successfully.
- `npm install --save-dev --save-exact typescript vite @vitejs/plugin-react vitest
  @types/react @types/react-dom @types/node eslint @eslint/js typescript-eslint
  eslint-plugin-react-hooks`: succeeded; seven moderate development audit entries.
- `npm run check`: lint, typecheck, 12 tests and build passed. Production output was
  approximately 230.70 kB JS (72.27 kB gzip) and 7.15 kB CSS (2.19 kB gzip).
- `npm audit --json`: inspected; single underlying minimatch lint-tooling advisory.
- `npm audit --omit=dev`: passed, zero production vulnerabilities.
- `npm install --package-lock-only --offline --ignore-scripts`: updated the minimum
  Node engine to 22.13 in the lockfile. Its offline audit is not a fresh advisory check.
- `npm run dev -- --port 5173 --strictPort`: started in sandbox; browser inaccessible.
  Outside-sandbox retry on 5174 served HTTP 200 and supported browser checks.
- `git diff --check`: passed at initial review.

See `VALIDATION.md` for exact scope and dependency caveats.

Final clean-install verification: `npm ci --offline` initially hit sandbox EPERM
filesystem errors. The elevated retry restored all 176 packages from the lockfile.
The subsequent `npm run check` passed lint, strict typecheck, all 12 tests and build.
Offline npm
audit output does not supersede the live development advisory described above.

Git review branch: `stage-0/foundation`. Origin:
`https://github.com/alexia-dragomir/Inversis.git`. The remote had no existing commits,
so no PR base exists. This checkpoint is prepared as an initial review-branch commit;
the final response records the actual commit ID and push outcome. Use `git log -1`
to identify this checkout's checkpoint. No force push or history replacement is used.

Both temporary preview processes were stopped after browser verification. Restart
with `npm run dev`. No hosted URL or remote CI success is claimed.

## Deployment and manual work

Vercel is not configured or verified. The app is a deployable static Vite skeleton.
Create a new, separate Inversis Vercel project and authorize only the Inversis GitHub
repository; use build `npm run build`, output `dist`, no secrets. No other project,
repository, domain, database, credential store or deployment was accessed or modified.
Supply the original approved logo before final visual release; text wordmark used now.

## Acceptance and next step

Local Stage 0 acceptance is met, subject to the recorded development-dependency
advisory and limited browser QA scope. Deployment is explicitly separate and pending,
as permitted by the current request. No empirical or agronomic claims are validated.

Next: owner reviews this checkpoint. On authorization, Stage 1 retrieves a tiny real
POWER T2M_MAX UTC sample and validates source metadata, units, temporal/spatial support,
fills, QC and hash; then a small IMERG subset. Expand only after that gate toward
the earliest evidence → comparison → counterfactual → certificate vertical slice.
One observation alone cannot support the five-year comparison.

## Exact created-file inventory

All tracked files are new; the workspace was empty. Generated `node_modules`, `dist`,
ignored extraction and local Git metadata are not source deliverables.

```text
.gitattributes
.github/workflows/ci.yml
.gitignore
LICENSE
README.md
THIRD_PARTY_NOTICES.md
docs/AI_USE.md
docs/CONTRACTS.md
docs/DATA_SOURCES.md
docs/LIMITATIONS.md
docs/METHODS.md
docs/STAGE_0_REPORT.md
docs/SUBMISSION_RULES.md
docs/VALIDATION.md
eslint.config.js
index.html
package-lock.json
package.json
public/evidence/README.md
src/App.tsx
src/agronomy/README.md
src/components/Methodology.tsx
src/data/foundation.ts
src/domain/contracts.ts
src/engine/README.md
src/main.tsx
src/pages/ContextPage.tsx
src/pages/PendingPage.tsx
src/styles.css
tests/contracts.typecheck.ts
tests/foundation.test.tsx
tsconfig.json
vite.config.ts
```
