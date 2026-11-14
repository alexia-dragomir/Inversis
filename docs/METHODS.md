# Implemented scientific methods

Model `inversis-fixed-start-heat-v1` is a reduced, provisional historical heat-exposure
comparison, authorized by the current user request. It is not a crop recommendation.
All inputs derive from retained NASA POWER bytes; no interpolation or substitute observations.

## Physical exposures and common scenarios

UTC daily maximum T2M_MAX is in °C. Count days >=35°C and divide by the complete
crop-window length. The threshold is illustrative, not calibrated damage. Handoff
windows are wheat May 1–June 30, maize July 1–August 31, sunflower June 20–August 10,
soybean June 15–August 31, inclusive. All are provisional phenology assumptions.
Missing, duplicate, invalid-unit, unverified or nonphysical daily values refuse the
whole metric. Valid dry-spell code counts the longest consecutive run strictly below
1 mm/day, requiring 48 valid IMERG half-hours per day. It has test coverage but no
historical precipitation inputs, so no real dry-spell result is published.

Three fixed ordered five-year plans use the handoff crop sequences. Every plan must
have complete evidence on the same five-year replay. Temperature supports six windows:
2015–2019 through 2020–2024. They overlap and are not independent statistical samples.
Two complete common scenarios is an explicit author comparison minimum, not confidence.
Eligibility exclusions occur before minima and regret. Field suitability remains
conditional. Interface crop prohibitions are hypothetical, never inferred farmer facts.

## Normalization and decision

Fixed references pool all 40 crop/year combinations (four windows × ten years,
zero shift), independent of candidate order, eligibility and preferences. The
observed heat-fraction bounds are 0 and 41/62. Normalize `(x-low)/(high-low)`, clip
 to [0,1], then average five crop-year exposures with equal weight. Near-constant
reference width <=1e-12 refuses comparison. The same references remain fixed for
shift and phase diagnostics. Window durations and differing biological vulnerability
limit cross-crop interpretation; scores are relative environmental exposure only.

```
L(r,s,w) = sum_k w_k E_k(r,s)
R(r,s,w) = L(r,s,w) - min_eligible_q L(q,s,w)
M(r,w) = max_s R(r,s,w)
preferred = all eligible r within 1e-10 of min_eligible_q M(q,w)
```

The average-loss benchmark uses the identical loss matrix. Single-candidate zero
regret means absence of competition. Empty eligibility and insufficient evidence
have distinct refusal states. Heat-only weight is necessarily 1; it is not inferred
farmer preference. The generic 5% simplex produces 1, 21 or 231 points for one,
two or three indicators. Broader preference landscapes are withheld pending evidence.
The combined model is an explicit refusal, never a silent fallback to heat-only.

## Diagnostics, Next Evidence and audit

Five crop-window shifts (-14,-7,0,+7,+14 days) recompute exposures and comparisons.
Five cyclic phases are separate diagnostics, never pooled into primary scenarios.
Changed results on these axes indicate methodological sensitivity, not preference
reversals or probabilities. No claims extend beyond tested configurations.

Soybean/sunflower permission questions have permitted/prohibited hypothetical
branches. Each branch recomputes eligibility, minima, regret and preferred sets.
Classifications distinguish changed preferred sets, eligibility only, unchanged
tested cases and unresolved evidence. Soil/disease questions remain unresolved
because no validated quantitative or locally applicable exclusion rule is available.

Certificates include manifests, physical exposures, scenario matrices, references,
assumptions, diagnostics, counterfactuals and limitations. Canonicalization recursively
sorts object keys, preserves array order, uses finite JSON numbers, normalizes -0,
and hashes UTF-8 with SHA-256. Only top-level fingerprint and generation timestamp
are excluded from the certificate hash. Integrity is not endorsement or field validation.
Verify an export with `npm run certificate:verify -- PATH`.
