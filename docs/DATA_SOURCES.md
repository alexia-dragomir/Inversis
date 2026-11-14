# Data sources and acquisition status

**No NASA data is used by the Stage 0 application.** Product names below are handoff
acquisition targets, not independently validated collections in this codebase.

| Target | Intended role | Verification required |
| --- | --- | --- |
| [NASA POWER daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) · T2M_MAX | Daily maximum 2 m air temperature | UTC requested/returned, °C, source/service version, fills, grid support, dates and quality |
| [GPM IMERG Final daily V07](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary) | Precipitation and dry spells | Actual collection/variable, rate versus full-day accumulation, sample counts, cloud route, UTC and coverage |
| [SMAP SPL4SMGP V008](https://nsidc.org/data/spl4smgp/versions/8) | Optional model-assimilated root-zone moisture | Exact variable path rather than assumed RZMC alias, 3-hourly temporal meaning, daily aggregation, m³/m³, QC and science version |

Proposed site: 44.565° N, 27.335° E. Requested period: 2015–2024. No source coverage
or admissible scenario count has been established. The handoff's preflight values
are not copied into the application or presented as newly retrieved evidence.

Preserve original responses/granules when redistribution permits, retrieval/query
references, checksums, extraction footprint and processing version. Remove secrets
from request references before publication. Field measurements and gridded evidence
must remain distinct. SMAP L4 is assimilated/model-derived; precipitation forcing may
overlap with IMERG. Validate dependency details and test indicator omission later.

External sources inspected in Stage 0 were software documentation and official
competition guides only; see `SUBMISSION_RULES.md` and `THIRD_PARTY_NOTICES.md`.
