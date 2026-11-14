# Data sources and acquisition status

**Current checkpoint:** POWER has 3,653 validated daily values for 2015–2024,
in addition to the retained seven-day access sample. IMERG has a validated
January 1, 2024 native-cell sample: 0 mm/day with 48 valid half-hours; an authenticated
repeat reproduced its value/count/grid. SMAP remains optional and unacquired.
See [the Stage 1 report](STAGE_1_REPORT.md) for raw captures, receipts and remaining gaps.

| Target | Intended role | Verification required |
| --- | --- | --- |
| [NASA POWER daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) · T2M_MAX | Daily maximum 2 m air temperature | UTC requested/returned, °C, source/service version, fills, grid support, dates and quality |
| [GPM IMERG Final daily V07](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary) | Precipitation and dry spells | Actual collection/variable, rate versus full-day accumulation, sample counts, cloud route, UTC and coverage |
| [SMAP SPL4SMGP V008](https://nsidc.org/data/spl4smgp/versions/8) | Optional model-assimilated root-zone moisture | Exact variable path rather than assumed RZMC alias, 3-hourly temporal meaning, daily aggregation, m³/m³, QC and science version |

Proposed site: 44.565° N, 27.335° E. POWER history: 2015–2024, 3,653/3,653 days,
zero missing values, six complete common five-year heat scenarios. Annual response
bytes and URL/retrieval/hash receipts are in `public/evidence/history/power`.
`analysis-input.json` records 200 crop/year/shift exposures, all observation lineage,
fixed normalization references and processing-code hashes. POWER/MERRA2 is modeled
gridded evidence; daily availability does not establish independent physical accuracy.
The API echoes the requested point but does not expose the native cell center.
The handoff's preflight values are not copied into the application or presented as
newly retrieved evidence. Actual January 2 POWER temperature is +8.07 °C, which
differs from the handoff's −8.07 °C; the captured NASA response is preserved.

NASA's [Final daily V07 catalog](https://www.earthdata.nasa.gov/data/catalog/ges-disc-gpm-3imergdf-07)
describes `precipitation` as mean valid half-hourly rate multiplied by 24, in mm/day.
`precipitation_cnt` records valid half-hours. Inversis requires all 48 samples for
complete-day exposure admission, an author QC policy rather than NASA's general
validity rule. Partial-day rates remain unverified and never silently become daily
accumulations. The validator's synthetic test cases are not NASA observations.

Preserve original responses/granules when redistribution permits, retrieval/query
references, checksums, extraction footprint and processing version. Remove secrets
from request references before publication. Field measurements and gridded evidence
must remain distinct. SMAP L4 is assimilated/model-derived; precipitation forcing may
overlap with IMERG. Validate dependency details and test indicator omission later.

External sources inspected in Stage 0 were software documentation and official
competition guides only; see `SUBMISSION_RULES.md` and `THIRD_PARTY_NOTICES.md`.

Historical IMERG acquisition is **not complete**. Harmony generated seven NetCDF
outputs preserving precipitation and counts, but those binaries were not downloaded
or scientifically validated. See [retrieval and recovery](HISTORICAL_RETRIEVAL.md).
