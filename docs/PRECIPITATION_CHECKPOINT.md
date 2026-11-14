> Historical seven-day checkpoint, commit 6391a80. Superseded for current coverage
> by [the complete combined checkpoint](COMBINED_CHECKPOINT.md); original evidence is preserved.

# Independently validated IMERG sample checkpoint

Work resumed from clean commit `fc80643` on `stage-1/evidence`. No later changes
were found at inspection; all prior implementation and the heat-only fallback were
preserved. This checkpoint advances access recovery, sample validation, preference
sensitivity and deployment preparation. It does **not** complete historical rainfall.

## Verified observations

NASA CMR identified seven Final daily V07B granules. The previously successful
authenticated OPeNDAP DAP4 route was reused for January 2–7; January 1 was reused
from the retained original. Every file was parsed as actual NetCDF4, with DOI,
version, UTC day/bounds, native coordinates, dimension order, units, fill value,
48 source half-hour references and per-cell valid counts checked.

| UTC day | Precipitation, mm/day (rounded) | Valid half-hours |
| --- | ---: | ---: |
| 2024-01-01 | 0.00 | 48 |
| 2024-01-02 | 3.08 | 48 |
| 2024-01-03 | 5.65 | 48 |
| 2024-01-04 | 0.03 | 48 |
| 2024-01-05 | 0.00 | 48 |
| 2024-01-06 | 0.01 | 48 |
| 2024-01-07 | 15.74 | 48 |

Selected containing cell: 44.55 N, 27.350000381469727 E. No interpolation, spatial
averaging or implicit accumulation conversion. Unrounded float32 values, daily
boundaries, original bytes, SHA-256, import receipts and source metadata are retained
under `public/evidence/imerg-dap4`. Unknown browser retrieval completion times remain
null; registration times are explicitly separate. CMR discovery bytes/receipt and
the original pre-download plan are retained in `discovery`.

Independent h5py extraction agrees exactly on values, valid counts and coordinates.
This verifies extraction, not independent rainfall accuracy. The seven-day sample is
complete; the requested 2015–2024 history has **7/3,653 validated daily cells** and no
complete crop-window precipitation scenario. The combined model remains unavailable.
POWER remains complete at 3,653/3,653 days, with the unchanged tested heat-only result.

## Implementation and validation

- Added bounded, cached CMR planning and a prepared sequential token-authenticated
  DAP4 downloader with origin checks, safe cache reuse, retry limits and QC.
- Added import receipts, deterministic series verification and independent Python
  NetCDF validation; no secrets or signed URLs are published.
- Added a real preference-sweep engine: recomputes all 5% grid points, preserves
  ties and refusals, and identifies neighboring tested preferred-set changes using
  L1 weight distance. It never extrapolates a continuous boundary or probability.
- Integrated the actual seven values in Context and preference diagnostics in
  exported certificates. The original 84-test heat-only implementation remains intact.
- Added dedicated Vercel build configuration, Python validation requirements,
  CI oracle execution and deployment/submission preparation text.
- Passed 89 tests, lint, strict TypeScript, all offline evidence integrity checks,
  production build, browser source display/refusal checks and export hash verification.

## Remaining access and submission work

Harmony's browser-origin restriction remains unresolved. It was not bypassed; a
separately authorized existing NASA OPeNDAP route supplied the successful sample.
See HISTORICAL_RETRIEVAL.md for exact endpoints and error history.

The owner agreed to save an Earthdata token in ignored `.local/earthdata-token.txt`.
No file was present at the latest inspection. The terminal download path therefore
remains unverified. After it is available, test one uncached historical day, validate
through both readers, then expand in bounded monthly batches with coverage auditing.
Do not infer full coverage from a generated job, successful authentication or plan.

Full rainfall+heat integration and multi-indicator stability results require those
measurements and candidate-independent precipitation reference bounds. Locally valid
agronomic screening, current mobile rendering, public deployment and final submission
are also outstanding. DEPLOYMENT_AND_SUBMISSION.md contains a truthful current-scope
draft and dedicated-project deployment instructions; no public demo URL is claimed.
