# Inversis

**Know what would change the decision.**

**[Open the live application](https://alexia-dragomir.github.io/Inversis/)** ·
[Submission technical handoff](docs/SUBMISSION_TECHNICAL_HANDOFF.md)

The [product design checkpoint](docs/PRODUCT_DESIGN_CHECKPOINT.md) adds the original
Inversis branding, interactive replay/regret comparison, a 21-state preference
explorer, physical crop-year history and a structured certificate. The scientific
engine and evidence remain unchanged; 109 tests cover the current implementation.

A crop-rotation decision-assurance prototype for NASA Space Apps 2026,
*Field Shift: Adapting Farms with NASA Data*.

**Validated rainfall + heat checkpoint.** All **3,653 NASA POWER T2M_MAX daily
values and 3,653 GPM IMERG Final V07B daily cells for 2015–2024** are retained and
validated in UTC. The four-screen workflow computes a conditional comparison across
six common five-year historical windows, with physical heat/dry-spell exposures,
21 sampled preferences, window/phase diagnostics, hypothetical exclusions, recomputed
Next Evidence and downloadable audit records. The explicit heat-only fallback remains
available and passes its original tests. Missing rainfall still refuses combined results.

The actual default result and every declared preference/shift/phase test retain the
Baseline preferred set. No reversal or continuous stability boundary is invented.
These are historical environmental-exposure comparisons, not field recommendations.
Phase 2 adds scenario-loss charts, regret profiles, exact margins, structural/dominance
interpretation, alternate-reference and replay-omission diagnostics. Read the
[empirical findings](docs/PHASE_2_FINDINGS.md) before interpreting unchanged results
as robustness.
See the [combined checkpoint](docs/COMBINED_CHECKPOINT.md),
[reproducible NASA access](docs/REPRODUCE_IMERG.md), and historical
[Stage 1 report](docs/STAGE_1_REPORT.md).

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
The approved ivory/teal/green palette and supplied original Inversis logo/banner
are used. Inter is preferred if available locally with a system sans fallback;
no font is downloaded. Only Inversis artwork supplies branding; see the
[branding restriction and asset audit](docs/BRANDING_AUDIT.md).

## Demonstration context

Proposed location: Bărăgan Plain, Romania, 44.565° N, 27.335° E. This is not a measured
farm. Three fixed-start five-year crop sequences are configured, all conditional.
2015–2024 temperature and precipitation coverage are validated. Field soil,
crop/disease history and management remain unknown. A and B share crop composition.

## Documentation

- [Implemented scientific methods](docs/METHODS.md)
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
GitHub Pages is the selected public static host. The owner enabled GitHub Actions
as its publishing source. The workflow deploys only after the complete scientific
verification job succeeds on `stage-1/evidence`. Relative asset/evidence URLs support
the repository subpath and all four hash routes. No runtime credentials, backend or
new dependencies are required. Public browser verification is recorded in
[deployment and submission readiness](docs/DEPLOYMENT_AND_SUBMISSION.md).

## Scope and license

Results are conditional historical rainfall-and-heat exposure comparisons, never yield,
soil-health, disease-probability or future-climate predictions. A certificate is an
audit record, not agricultural certification or NASA endorsement.

Original project code is licensed under [Apache-2.0](LICENSE). Third-party packages
retain their respective licenses. Codex assisted implementation and documentation;
see `docs/AI_USE.md`. Human scientific review remains required before later release.
