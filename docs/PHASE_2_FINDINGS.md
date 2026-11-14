# Phase 2 empirical findings — 2026-11-14

## Interpretation

**Baseline is the unique minimax-regret selection in the declared model, not a
verified agronomic recommendation.** Its worst regret is 0.0481152993 versus
0.1364489169 for A and 0.1711827623 for B at illustrative equal heat/dry preferences.
The gap to the next score is 0.0883336176 normalized units, not a confidence level.
The average-loss benchmark also selects Baseline (means 0.3196773738, 0.3747280420,
0.3771012108 respectively).

This is scientifically informative as an auditable comparison of **weather allocated
to provisional crop windows**. It cannot establish causal rotation benefits, crop
vulnerability, yield, profitability, disease suppression or field suitability.
The exposure model is narrower than those agronomic questions.

## Actual common-scenario losses and regrets

All three candidates remain conditional and eligible; each row uses the same five
historical years and both complete source indicators. Values below are rounded to
six decimals; exact values remain in the independent source oracle.

| Replay | Baseline loss | A loss | B loss | Scenario comparator | Baseline regret | A regret | B regret |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| 2015–2019 | 0.409540 | 0.376784 | 0.420234 | A | 0.032756 | 0 | 0.043450 |
| 2016–2020 | 0.202214 | 0.276435 | 0.373396 | Baseline | 0 | 0.074222 | 0.171183 |
| 2017–2021 | 0.206055 | 0.342504 | 0.319174 | Baseline | 0 | 0.136449 | 0.113119 |
| 2018–2022 | 0.392112 | 0.432836 | 0.343996 | B | 0.048115 | 0.088840 | 0 |
| 2019–2023 | 0.296440 | 0.402940 | 0.379912 | Baseline | 0 | 0.106501 | 0.083472 |
| 2020–2024 | 0.411704 | 0.416868 | 0.425894 | Baseline | 0 | 0.005165 | 0.014190 |

The scenarios are discriminative: A and B each beat Baseline in a replay. Baseline
minimizes the largest missed opportunity, rather than winning every replay.
Worst cases occur in 2018–2022 for Baseline, 2017–2021 for A, and 2016–2020 for B.
The last replay's A/B regrets are relatively small; no agricultural closeness
threshold is calibrated. The windows overlap and are not independent samples.

## Structural effects and alignment audit

Baseline is **not pointwise dominant** across every scenario–indicator pair.
Across twelve pairs (six replays × two indicators), Baseline has lower exposure
than A in 9 and higher in 3; versus B it is lower in 9, equal in 1, higher in 2.
A versus B is lower in 5 and higher in 7. Thus unchanged preferred sets do not arise
from identical candidate values or universal exposure dominance.

There is nevertheless a consequential model structure:

| Crop | Unshifted window days | Mean heat fraction across ten years | Mean longest dry run (days) |
| --- | ---: | ---: | ---: |
| Wheat | 61 | 0.0557377049 | 11.4 |
| Maize | 62 | 0.3387096774 | 15.7 |
| Sunflower | 52 | 0.3057692308 | 12.2 |
| Soybean | 78 | 0.3051282051 | 16.5 |

Baseline has two wheat years; A/B replace one with soybean and reorder other
positions. Earlier wheat windows encounter much less heat here. Soybean's window
contains both maize and sunflower windows, so longest dry-run exposure cannot be
shorter than either in the same year. Normalization cannot remove this window-length
property or make normalized swings biologically equivalent. A/B share composition;
any difference between them comes from temporal allocation, not crop diversity.

Code and independent arithmetic agree that position `p` receives year `start+p`,
with its actual crop's window. For example, A's second crop is soybean in 2016 in
the 2015–2019 replay; Baseline receives maize in that position. All indicators use
complete daily windows. Eligibility is applied first, then a shared scenario domain,
then the minimum among active candidates **within each same scenario**. Cyclic
phases are distinct ordered assignments and never pooled as extra primary scenarios.
No arithmetic/alignment defect was detected in the tested domain; this does not
validate omitted agronomic processes.

## Preference scope and methodological challenge

The master handoff explicitly allows two validated indicators with 21 five-point
weights; 231 applies only to three validated indicators. SMAP remains absent and
is not silently replaced. The heat-only fallback has one preference point and
is a limited diagnostic. The combined model is explicitly labeled two-indicator.

At the nominal calendar all 21 preference states select Baseline, with score gap
0.0727272727–0.0942606174. No exact continuous boundary is inferred. Phase 2 extends
independent verification to **all 105 preference/calendar pairs** (21 × five shifts):
Baseline remains selected. Five cyclic phases at equal weights also retain Baseline,
as independently checked in Phase 1; phases are not part of the 105 count.

The handoff also requires an alternative-normalization diagnostic, absent from
Phase 1. It is now implemented without changing the primary model: nearest-rank
empirical P10/P90, sorted positions 4 and 36 of the same 40 unshifted crop-years,
fixed under all weights, exclusions and shifts, with clipping to [0,1]. No observation
is interpolated. Heat bounds become 0–0.5161290323; dry-run bounds become 7–18 days.
The primary bounds remain 0–0.6612903226 and 5–27 days.

All 105 P10/P90 preference/calendar pairs also select Baseline. Equal-weight worst
regrets become 0.0466564685, 0.1789255656 and 0.1893563233: numerical scores depend
on the reference scale even when the selected set does not. Omitting each one of
six shared replays separately also preserves Baseline. These are methodological
and influence checks, not probabilities, independent resampling or universal robustness.

## What could change the decision?

- **Demonstrated hypothetical eligibility effects:** soybean prohibition removes
  A/B but preserves Baseline; sunflower prohibition removes every plan. The latter
  changes decision status, not a climate-preference reversal.
- **Measured sensitivity with unchanged set:** declared preferences, calendar shifts,
  phases, alternate references and replay omissions above. Preference changes affect
  margins, not the preferred set in these tested cases.
- **New field evidence required:** measured phenology, permissions, previous crops,
  disease, soil/drainage, irrigation and management. Locally applicable rules or a
  validated response model could change admissibility or model structure; this app
  cannot defensibly quantify those unknown effects or assign their information value.

The UI distinguishes refusal, sole eligibility, ties, identical-exposure structural
invariance, pointwise dominance, sampled changes and sampled invariance. None is
presented as independent field assurance.

## Reproducible evidence

- [Original independent raw-data oracle](../public/evidence/history/combined-independent-oracle.json):
  source hashes, 200 physical crop/year/shift records and original comparison cases.
- [Phase 2 independent arithmetic](../public/evidence/history/interpretation-oracle.json):
  source-oracle/code hashes, 105 primary + 105 percentile cases and six omissions.
- [POWER inputs](../public/evidence/history/analysis-input.json) and
  [IMERG inputs](../public/evidence/history/imerg-analysis-input.json): full lineage,
  physical units, coverage, fixed reference populations and processing hashes.
- `scripts/independent-interpretation.py` and `tests/interpretation.test.ts`:
  separate Python arithmetic compared against TypeScript to 12 decimal places.
  Both implementations are AI-assisted; independence is computational, not human review.

No candidate, threshold, source observation or primary normalization was changed to
obtain a reversal. No NASA download or credential access was needed for this audit.
