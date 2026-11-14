# Method status and next implementation boundary

**Planned, not implemented:** deterministic conditional comparison of fixed-start,
ordered five-year crop plans using common historical weather windows. Cyclic phases
are separate diagnostics, not added primary scenarios.

Physical exposures: longest complete-window precipitation run below an illustrative
1 mm/day threshold; complete-window fraction of days at T2M_MAX ≥35 °C; optional mean
SMAP daily root-zone moisture after validated aggregation. These are environmental
proxies, not biological crop damage. Window dates and thresholds require explicit
assumptions. Missing precipitation/heat days invalidate the window; do not shorten
dry runs at gaps. The provisional SMAP ≥90% coverage / maximum 3-day gap rule is an
author convention, not a NASA standard.

Use predeclared candidate-independent physical reference bounds. Preserve raw units,
reference populations, clipping and near-constant behavior. Weights express preferences
over documented swings. Historical windows overlap and are not probability samples.

For each eligible candidate r and common scenario s:

```
L(r,s,w) = sum_k w_k E_k(r,s)
R(r,s,w) = L(r,s,w) - min_q L(q,s,w)
M(r,w) = max_s R(r,s,w)
preferred = all r within declared tolerance of min_q M(q,w)
```

Filter eligibility before scenario minima. Compare average historical weighted loss
on the identical matrix. Preserve ties, empty-set refusal, insufficient-evidence
refusal, provisional field suitability, and the single-candidate limitation.

Counterfactual questions require finite defensible answer branches and full
recomputation. Addendum I consequence classes distinguish changed preferred sets,
eligibility-only changes, unchanged tested cases and unresolved questions. Hypothetical
answers must stay hypothetical. There is no probability or expected-value claim.

## Stage 1 checkpoint recommendation

After owner review, implement only NASA source access and validation first: retrieve
a tiny POWER T2M_MAX UTC sample at the proposed coordinates, inspect actual metadata,
validate identity/units/time/quality/spatial support, cache the response and hash it.
Then try a small IMERG Final daily subset; SMAP is optional if it delays a reliable
two-indicator path. Do not request a decade until the small-sample gate passes.

The next vertical slice must expand to enough validated crop-window data and common
five-year scenarios before computing a comparison. A single authentic observation
proves access only; it cannot support a five-year decision. Connect this validated
comparison to one defensible counterfactual and a reproducible certificate before
broad feature expansion. Test an independent synthetic minimax reference separately
from NASA evidence. No Stage 1 acquisition was performed in this implementation.
