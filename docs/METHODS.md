# Implemented scientific methods

Two explicit models share the same engine: `inversis-fixed-start-rainfall-heat-v1`
and the preserved `inversis-fixed-start-heat-v1` fallback. The combined model requires
separately validated historical IMERG evidence; unavailable or invalid rainfall never
silently becomes zero or a heat-only calculation. These are provisional historical
exposure comparisons, not crop recommendations or predictions.

## Physical exposures and common scenarios

NASA POWER UTC daily maximum T2M_MAX is in °C. Heat exposure is the fraction of
complete crop-window days with maximum temperature >=35°C. IMERG Final V07B daily
precipitation is in mm/day; dry exposure is the longest consecutive run strictly
below 1 mm/day. Require all 48 valid half-hours for every IMERG day. This is an
author quality policy, not a claim that sample count proves geophysical accuracy.
Valid zero rainfall is preserved. Missing/partial/invalid support invalidates the
whole crop-window metric; no interpolation, gap breaking or substitute observation.

Handoff windows, inclusive: wheat May 1–June 30; maize July 1–August 31; sunflower
June 20–August 10; soybean June 15–August 31. Thresholds and windows are illustrative,
not locally calibrated phenology, vulnerability or damage functions. Longer windows
can admit longer dry runs. Neither indicator is a field water balance.

Three ordered five-year plans use the supplied crop sequences. Their shared scenario
domain is 2015–2019 through 2020–2024. If any active candidate lacks an indicator's
complete crop window, exclude that scenario for every candidate. At least two common
scenarios are required by author convention. The six windows overlap: they are not
independent samples or probability estimates. Fixed-start is primary; cyclic phases
are separate diagnostics. Eligibility exclusions occur before minima and regret.
All field suitability remains conditional; interface prohibitions are hypothetical.

## Fixed normalization and decision

Each indicator has its own candidate-independent reference population: all four
unshifted crop windows in each of ten years, 40 crop-years. Bounds are computed from
validated physical exposures, never from candidate scores. They remain fixed across
weights, eligibility exclusions, shifted windows and phases. Normalize
`(x-low)/(high-low)`, clip to [0,1], then average five crop-year values equally.
Reference width <=1e-12 refuses comparison. Exact observed bounds are retained in
both evidence artifacts and the independent raw-data oracle.

```
L(r,s,w) = sum_k w_k E_k(r,s)
R(r,s,w) = L(r,s,w) - min_eligible_q L(q,s,w)
M(r,w) = max_s R(r,s,w)
preferred = all eligible r within 1e-10 of min_eligible_q M(q,w)
```

The average-loss benchmark uses the identical loss matrix. A sole candidate's zero
regret means absence of competition. Empty eligibility and insufficient evidence
have distinct states. Heat-only has weight 1. Combined default weights are 0.5/0.5,
explicit illustrative preferences over normalized swings, not farmer preferences or
crop sensitivities. Even a zero-weight indicator must satisfy the declared evidence
domain; changing weight cannot conceal missingness.

## Stability and Next Evidence

The combined preference landscape recomputes 21 weights at 5-percentage-point steps.
It retains ties as sets and reports adjacent preferred-set changes. A five-point
transfer has L1 distance 0.10 across the two complete weight vectors. The displayed
nearest changed sample is not an interpolated continuous boundary. Heat-only has
one preference point and no invented preference landscape.

Five calendar shifts (-14,-7,0,+7,+14 days) recompute actual exposures; five cyclic
phases recompute separate ordered assignments. Their distances are absolute days
and minimum circular phase distance, respectively. These are methodological
sensitivities, not preference reversals, robustness probabilities or confidence.

Soybean/sunflower permission questions recompute permitted/prohibited hypothetical
branches. A combined-model preference question recomputes five declared answers
(0/25/50/75/100% heat). Classifications distinguish preferred-set changes, eligibility
only, unchanged tested cases and unresolved evidence. Margin-only change is explicit.
The five-answer question and 21-point landscape have different declared sample domains.
Soil/disease questions cannot produce quantitative consequences without validated
local evidence and rules. Unknown field facts remain unknown.

## Independent validation and audit

Original POWER JSON and every original daily IMERG NetCDF are retained. Annual
USTAR/gzip archives preserve the daily bytes; manifests retain exact source URLs,
SHA-256, units, coordinates, counts and acquisition receipts. Independent h5py/HDF5
and h5wasm readers must agree on every daily extraction. A separate Python program
reads all original sources and recomputes physical metrics and 29 model configurations
without importing TypeScript. Agreement verifies implementation arithmetic, not
independent human scientific or agronomic review.

Certificates include manifests, physical exposures, common scenarios, both references,
weights, matrices, assumptions, diagnostics, counterfactuals and limitations. Sorted
JSON canonicalization preserves array order, finite numbers and normalized -0, then
hashes UTF-8 with SHA-256. Only top-level fingerprint and generation timestamp are
excluded. Verify with `npm run certificate:verify -- PATH`. Integrity does not imply
NASA endorsement, field validation or agricultural certification.

## Phase 2 interpretation and secondary diagnostics

The primary min/max model is unchanged. A separate nearest-rank empirical P10/P90
normalization uses sorted positions 4 and 36 of each fixed forty-member unshifted
reference population, with clipping and the same refusal policy. It never interpolates
observations. Its bounds and outputs are retained alongside the primary result in
the certificate. Replay omission removes one complete scenario for every active plan,
keeps references fixed, and enforces the same minimum common-scenario count.

The interpretation layer distinguishes missing evidence, sole eligibility, identical
scenario–indicator exposures, minimax ties, pointwise exposure dominance and sampled
preferred-set invariance/change. Scenario-best sets, pairwise exposure counts, and
second-lowest minus lowest worst-regret margins come directly from the current
comparison. No threshold translates a score gap into agricultural confidence.

Independent tests cover all 105 preference/calendar pairs under each of two reference
protocols and six nominal replay omissions. The UI shows 21 weights at the currently
selected calendar; its separate five-shift table uses the current preference. Phases
remain separate. Certificates also carry the exact processing-code hashes.
