# Inversis

**Know what would change the decision.**

A crop-rotation decision-assurance prototype for NASA Space Apps 2026,
*Field Shift: Adapting Farms with NASA Data*.

**Working reduced-model checkpoint.** All 3,653 NASA POWER T2M_MAX daily values for
2015–2024 are retained and validated in UTC and °C. The interactive four-screen
workflow computes a clearly labeled, provisional **heat-only** comparison across six
common historical five-year windows. It includes hypothetical crop exclusions,
window/phase sensitivity, recomputed Next Evidence and downloadable audit records.
IMERG Final V07B now has **seven independently validated days**, January 1–7, 2024,
each with 48 valid half-hours. Historical precipitation remains incomplete, and
the combined rainfall/heat model refuses to rank candidates.
See the [precipitation recovery checkpoint](docs/PRECIPITATION_CHECKPOINT.md),
[implementation checkpoint](docs/IMPLEMENTATION_CHECKPOINT.md) and historical
[Stage 1 evidence report](docs/STAGE_1_REPORT.md).

## Run locally

Use Node 24 LTS (at least 22.13) and npm. Dependencies are exactly pinned and locked.

```sh
npm ci
npm run dev
npm run check
```

On Windows, if npm is absent from PATH, add `C:\Program Files\nodejs` to the current
terminal's PATH, or invoke its `npm.cmd` explicitly. No global packages are required.
The `check` script runs lint, strict type checking, Vitest, deterministic evidence
integrity/reprocessing verification, and a production build.
`npm run preview` serves `dist` after a build. Four hash routes work on static hosts
without rewrite rules: `#context`, `#decision`, `#stability`, `#certificate`.

## Architecture

- `src/domain/contracts.ts`: one shared schema for evidence, assumptions, agronomy,
  decisions, counterfactual branches and reproducible certificates.
- `src/data`: explicit foundation state and runtime source validators. Source access
  samples are separated from comparison eligibility.
- `src/engine`: pure exposure, normalization, minimax-regret, sensitivity,
  counterfactual and certificate computation, independent of React.
- `src/agronomy`: reserved source-backed rule and eligibility boundary.
- `src/pages`, `src/components`, `src/App.tsx`: accessible presentation/navigation;
  no scientific ranking logic lives here.
- `public/evidence`: original public NASA JSON captures, receipts and reproducible
  validation/discovery outputs; no authentication material.
- `tests`: refusal-state, crop-order, rendering/navigation and compile-time contract checks.
- `docs`: methods, provenance requirements, limitations, compliance and execution state.

Only React and React DOM are direct runtime dependencies. No backend, database,
authentication, external font service, runtime AI or NASA API dependency is present.
The approved ivory/teal/green palette is used; the original logo was not supplied,
so the shell uses a text wordmark. Inter is preferred if available locally with a
system sans fallback; no font is downloaded.

## Demonstration context

Proposed location: Bărăgan Plain, Romania, 44.565° N, 27.335° E. This is not a measured
farm. Three fixed-start five-year crop sequences are configured, all conditional.
2015–2024 temperature coverage is validated; precipitation history is incomplete. Field soil,
crop/disease history and management remain unknown. A and B share crop composition.

## Documentation

- [Methods and Stage 1 boundary](docs/METHODS.md)
- [Shared data contracts](docs/CONTRACTS.md)
- [Data sources and provenance](docs/DATA_SOURCES.md)
- [Validation](docs/VALIDATION.md)
- [Limitations and specification reconciliation](docs/LIMITATIONS.md)
- [Stage 0 report and file inventory](docs/STAGE_0_REPORT.md)
- [Submission rules](docs/SUBMISSION_RULES.md)
- [AI assistance](docs/AI_USE.md)
- [Third-party software](THIRD_PARTY_NOTICES.md)

## Repository and deployment

The sole intended remote is https://github.com/alexia-dragomir/Inversis.
Vercel is not configured or verified. To deploy, create a **new Inversis project**,
authorize only this repository, select Vite, build with `npm run build`, and publish
`dist`. No environment variables are needed. See the execution report for actual
Git publication status. GitHub Actions is configured; local passing checks do not
imply that the remote workflow has run.

## Scope and license

Results are conditional historical heat-exposure comparisons, never yield,
soil-health, disease-probability or future-climate predictions. A certificate is an
audit record, not agricultural certification or NASA endorsement.

Original project code is licensed under [Apache-2.0](LICENSE). Third-party packages
retain their respective licenses. Codex assisted implementation and documentation;
see `docs/AI_USE.md`. Human scientific review remains required before later release.
