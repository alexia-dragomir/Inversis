# Data sources and acquisition status

**Current checkpoint (2026-11-14):** 3,653/3,653 POWER daily maximum temperatures
and 3,653/3,653 IMERG Final V07B daily selected-cell precipitation values, January 1,
2015 through December 31, 2024. Both use explicit UTC days. IMERG has no missing
selected values and all 48 half-hours on every day; two independent readers agree.
See [combined checkpoint](COMBINED_CHECKPOINT.md) and [reproduction](REPRODUCE_IMERG.md).
Older access samples and reports remain historical evidence, not the coverage limit.
SMAP remains optional and unacquired.

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

Historical IMERG is retained in ten annual original-byte NetCDF archives under
`public/evidence/history/imerg`, each with a daily manifest. The files preserve
precipitation, counts, native axes, UTC time/bounds and NASA source history. The
containing cell is 44.55° N, 27.350000381469727° E, with native 0.1° support; the 3×3
subset is archived without spatial averaging or interpolation. The exact requests,
HTTP receipts and byte hashes are retained. For the seven original browser samples,
exact retrieval time was not captured and remains null; registration time is not
misrepresented as download completion. Later bearer-authenticated HTTP captures
retain observed completion times and status 200.

NASA CMR collection: `C2723754864-GES_DISC`; product `GPM_3IMERGDF/07`;
science version V07B; DOI `10.5067/GPM/IMERGDF/DAY/07`. Original numeric inclusive
day bounds are retained and mapped explicitly to an exclusive next-midnight end.
The daily source fill is -9999.900390625; valid zero is never treated as missing.

`imerg-analysis-input.json` contains 200 physical dry-spell records and fixed bounds
5–27 days from the predeclared 40 unshifted crop-years. The heat reference is
0–41/62. Neither reference depends on candidate exclusion or preferences. The
independent combined oracle reparses all original archives and checks the arithmetic.
Earlier Harmony outputs were not ingested; successful DAP4 access is a separate,
authorized route. See the exact earlier blocker in HISTORICAL_RETRIEVAL.md.
