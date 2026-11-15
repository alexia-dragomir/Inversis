# Inversis

**Know what would change the decision.**

**[Open the live application](https://alexia-dragomir.github.io/Inversis/)** ·
[Submission technical handoff](docs/SUBMISSION_TECHNICAL_HANDOFF.md)

Choosing a crop rotation from environmental data requires more than naming a winner:
the decision must explain its assumptions, alternatives and unresolved field evidence.
Inversis is a working, reproducible historical-exposure decision-assurance prototype
for NASA Space Apps 2026, *Field Shift: Adapting Farms with NASA Data*.

**NASA evidence → physical exposure metrics → historical comparison → minimax regret
→ assumption and eligibility challenges → traceable decision record.**

Its contribution is this transparent workflow, not a new mathematical algorithm or
a universally best crop rotation. It shows what the evidence supports, which
assumptions affect the comparison, what remains unknown and when selection must be refused.

## Project Creator & Lead

**Alexia Maria Dragomir** conceived and led Inversis, defining its vision, scientific methodology, decision framework, and product architecture. She directed the project's development, NASA data integration, analytical validation, interface design, and implementation of its evidence-to-decision workflow.

Alexia oversaw the project from initial concept through technical verification and public deployment, and was responsible for its research direction, documentation, presentation, and final competition submission.

## Explore Inversis in 90 seconds

Open the [live Context screen](https://alexia-dragomir.github.io/Inversis/#context)
and select **Explore the guided demo**. Its existing five steps show:

1. Validated NASA evidence and the historical comparison's limits.
2. The default minimax decision and maximum regrets.
3. The 2018–2022 replay where Alternative B leads.
4. Hypothetical soybean and sunflower restrictions: sole eligibility or refusal.
5. The downloadable certificate, source provenance and reproducible fingerprint.

Use **Next**, **Back**, **Restart demo** or **Exit demo**. The demonstration preserves
your ordinary analysis settings and field notes. Then explore preferences, calendar
shifts and Next Evidence independently across the four screens.

## Verified historical results

NASA POWER T2M_MAX and GPM IMERG Final V07B supply **3,653 valid daily values each**
for **2015–2024 UTC**. Three fixed five-year crop sequences are compared across
six overlapping five-year replays. Default equal-weight maximum regrets are:

| Candidate | Maximum regret |
| --- | ---: |
| Baseline | 0.0481 |
| Alternative A | 0.1364 |
| Alternative B | 0.1712 |

Alternative A has the lowest modeled exposure in 2015–2019; Alternative B leads
in 2018–2022. Baseline minimizes maximum regret across all six replays but does not
win every replay. **210 tested configurations** across preference weights, calendar
shifts and two normalization methods retain Baseline. These are bounded tests,
not proof of universal robustness; overlapping replays are not independent samples.

Hypothetical restrictions can leave a sole eligible candidate or no eligible candidate.
Missing rainfall refuses the combined comparison; an explicit heat-only fallback remains.
[Field Evidence & Readiness](docs/FIELD_EVIDENCE.md) records optional session-only
soil, management and crop-history notes with supplied provenance. These unverified
notes never change eligibility, scientific calculations or the canonical certificate.

These findings describe historical environmental exposure, not validated agricultural
suitability, yield forecasts or future performance. Read the [empirical findings](docs/PHASE_2_FINDINGS.md),
[methods](docs/METHODS.md) and [limitations](docs/LIMITATIONS.md).

## Verification and reproducibility

The current automated suite contains **142 tests across 20 files**, supplemented by
independent Python readers/arithmetic and isolated browser checks. See the
[current validation record](docs/VALIDATION.md) for release status and historical checkpoints.
Original evidence, receipts, UTC conventions, units and missingness handling are retained;
see [NASA access reproduction](docs/REPRODUCE_IMERG.md) and [data provenance](docs/DATA_SOURCES.md).

Download **certificate JSON** for a machine-readable audit record, open it in a text
editor, or use **Print record** for the human-readable printing/PDF route. Verify an
export with `npm run certificate:verify -- PATH_TO_JSON`. The fingerprint excludes
only the generation timestamp and checks record integrity, not agronomic validity.
The default SHA-256 is:

`4b62215c9f6885d3f558ab1eb65f62c01c826d722c2f73bd62c1faaf06ca8194`

The public application is deployed; the competition submission itself has not yet
been completed. [AI assistance](docs/AI_USE.md) is documented separately.

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
crop/disease history and management default to unknown. Users can record supplied,
unverified notes; agronomic suitability remains unestablished. A and B share crop composition.

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
