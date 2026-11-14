# Stage 1 evidence checkpoint

Date: 2026-11-14. Stage 0 was reviewed and accepted by the owner. This checkpoint
preserves the four screens and shared scientific contracts. **Small-sample ingestion
succeeded for POWER and IMERG.** Historical coverage is not established. The first
IMERG subset was downloaded by the owner through GES DISC Transform Data after
accepting the agreement; an agent-observed authenticated repeat succeeded too.

## Actual retained NASA evidence

Site: Bărăgan demonstration, 44.565° N, 27.335° E. No field measurement is asserted.
Raw responses and capture receipts are in `public/evidence/stage1/raw/`. Derived
`power.sample.json` and `imerg.discovery.json` contain processing-file SHA-256 hashes.
`npm run evidence:verify` checks raw length/hash, request URL, response status/MIME,
retrieval timestamp, parsing and exact deterministic regeneration, without network.
Receipts record the local acquisition clock and observed HTTP metadata; hashes prove
retained-byte integrity, not independent NASA signatures or geophysical accuracy.

| Capture | UTC retrieval time | Bytes | Actual content |
| --- | --- | ---: | --- |
| power.json | 2026-11-14T07:39:47.233Z | 604 | Seven T2M_MAX values, MERRA2/POWER, Daily API v2.10.3 |
| imerg-collections.json | 2026-11-14T07:44:36.686Z | 47178 | C2723754864-GES_DISC, GPM_3IMERGDF version 07 |
| imerg-granules.json | 2026-11-14T07:45:41.027Z | 2357 | G3087510500-GES_DISC, January 1 daily V07B granule |

SHA-256 values, respectively:

```text
8f5fc2e10b48670040482041d59e0eb172c20eb570c950fde31770737cee14a9
9c9bf1c92cf8ae2acb8abe008ba57e57236000d2765d8484f6a9fbfd52b4d41e
89b656a962cdb517d854f4fc77e0560eca87a1c5801bf8defffd127cfff3728d
```

POWER values in °C, January 1 through 7 respectively:
**10.16, 8.07, 8.27, 12.41, 14.32, 13.25, 12.43**.
January 2 is positive **+8.07**, differing from the handoff preflight's −8.07.
No manual correction was applied. These are daily maximum 2 m modeled temperatures,
not instantaneous values, crop findings, or field observations.

Both the request and returned header explicitly specify UTC. Each date is represented
as midnight-inclusive to next-midnight-exclusive UTC. Expected/present/valid: 7/7/7;
missing: 0; longest gap: 0 days. Native unit `C` maps to `degC` without numeric change.
The declared −999 fill, null and absent days become explicit missingness. Invalid
numbers, dates, units, source metadata and ambiguous JSON fail validation. No
interpolation or substitution occurs. Zero and physically valid negative values survive.
There are no returned per-day quality flags or subdaily completeness counts. The
response echoes the requested coordinates; the native cell center/bounds, numeric
resolution and underlying collection/science versions are explicitly unknown. API
v2.10.3 is retained separately and is not mislabeled a collection version.

## Actual IMERG sample and reproducible extraction

The two retained NetCDF4 subsets are each 39,155 bytes. The original is
`raw/imerg-20240101.nc4`, SHA-256
`f305cb218e5cdccf45b3cc0c8b1d1c34e1a957c82ff565959d2b1cd599be372f`.
The independent browser repeat is `raw/imerg-20240101-repeat.nc4`, SHA-256
`0b2d3fd487ebdc954a9925704b7d47473693a62a0cae1788e26f3a4b4b244aa8`.
Their service transformation histories differ; actual values, counts and grid agree.
Import receipts distinguish the owner-provided and agent-observed acquisition modes.
The exact download completion time was not captured, so retrievalTimeUTC is null;
registration timestamps and embedded service transformation time are retained separately.

NetCDF metadata validates Final daily GPM_3IMERGDF version 07, science V07B, DOI
10.5067/GPM/IMERGDF/DAY/07; 48 distinct V07B half-hour input references; native 0.1°
grid; dimensions `time,lon,lat`; physical units; float32 fill −9999.900390625; UTC
day and numeric time bounds. The subset has longitude centers 27.25/27.350000381469727/
27.450000762939453 and latitude centers 44.45/44.55/44.64999999999999. Every tile
value is 0 mm/day and count 48; extraction selects the containing middle cell only,
without interpolation or spatial averaging. Its actual precipitation estimate is
**0 mm/day, 48/48 valid half-hours, one valid day out of one requested day**.

Raw `time=16066`, units `days since 1980-01-06 00:00:00Z`; numeric end bound
16066.999988426236 resolves to 23:59:59.000Z, while global EndTime is 23:59:59.999Z.
Both are retained as inclusive end-of-day markers and represented internally by the
exclusive next midnight. This is a declared time-label normalization, not interpolation.
The daily rate is not silently changed to mm accumulation. Counts measure support,
not independent precipitation accuracy. One day cannot establish crop-window history.

`scripts/read-imerg.ts` reads real NetCDF4 with pinned development-only h5wasm 0.10.3.
It verifies dimension scales, metadata, native coordinates, time, count and fill before
calling the cell validator. `npm run evidence:build` regenerates `imerg.sample.json`;
`npm run evidence:verify` independently reopens both binary inputs and checks receipts,
hashes, repeated observations and deterministic output. Source-file and lockfile hashes
record the extractor and dependency versions.

The exact successful request is retained in the NetCDF history and JSON manifest:
the CMR OPeNDAP granule URL plus `.dap.nc4`, with `dap4.ce` selecting
`/lon[2072:2074];/time;/precipitation_cnt[][2072:2074][1344:1346];/time_bnds;/lat[1344:1346];/precipitation[][2072:2074][1344:1346]`.
This is a reproducible authenticated route, not a guessed legacy endpoint. Repeat
download was exercised successfully after the agreement was accepted.

## Access attempt history and recovery

The actual CMR discovery identifies this exact daily Final granule:
`GPM_3IMERGDF.07:3B-DAY.MS.MRG.3IMERG.20240101-S000000-E235959.V07B.nc4`.
CMR reports 2024-01-01T00:00:00.000Z through 23:59:59.999Z inclusive.
This establishes the granule's catalog period, not valid precipitation coverage.

Attempted catalog-supplied routes:

```text
https://opendap.earthdata.nasa.gov/collections/C2723754864-GES_DISC/granules/GPM_3IMERGDF.07%3A3B-DAY.MS.MRG.3IMERG.20240101-S000000-E235959.V07B.nc4.dds
https://data.gesdisc.earthdata.nasa.gov/data/GPM_L3/GPM_3IMERGDF.07/2024/01/3B-DAY.MS.MRG.3IMERG.20240101-S000000-E235959.V07B.nc4
```

| Attempt | Observed result |
| --- | --- |
| Unauthenticated OPeNDAP DDS GET, 07:47:54.479Z | HTTP 302 to official OPeNDAP `/login/urs`; no metadata body acquired |
| HTTPS HEAD, 07:47:55.155Z | HTTP 303 to archive delivery service; HEAD is not data ingestion |
| HTTPS GET following redirects, 07:51:05.458Z | HTTP 401, text/html, 27-byte body; not retained as scientific data |
| Official Earthdata browser sign-in | User reported successful sign-in; authentication material remains outside repository |
| Authenticated OPeNDAP browser page | Rendered DAP error code 403: failed to read DMR++ from archive `.nc4.dmrpp` URL; this was a displayed service error, not a recorded outer HTTP status |
| Browser HTTPS fallback | Reached NASA GESDISC DATA ARCHIVE EULA; owner subsequently accepted and downloaded the subset |
| DDS retry after agreement | Rendered DAP error code 400: DAP2 cannot represent Int8 count variables; use DAP4/NetCDF4 |
| DAP4 `.dap.nc4` repeat | Download succeeded; binary metadata, values, counts and grid revalidated |

The earlier 401/403/agreement issues no longer block this browser sample. DDS/DAP2 is
incompatible with the count types. Use the successful DAP4 route. Historical coverage
beyond January 1 remains unknown; sample zero rainfall does not fill any missing day.

Reproducible recovery:

1. Run `node scripts/probe-nasa.mjs imerg-collections` then
   `node scripts/probe-nasa.mjs imerg-granules`. Successful captures are reused only
   when their stored request/hash matches. `--refresh` intentionally reacquires.
2. Open the exact catalog-supplied HTTPS URL above in the official browser flow.
   Sign in to Earthdata and review the archive agreement. The owner must authorize
   acceptance; do not copy passwords, cookies, tokens or OAuth callback URLs into
   source files, receipts, chat or Git.
3. Use the exact DAP4 URL in `imerg.sample.json`, not DDS/DAP2. Download NetCDF4 and
   run the extractor to verify actual dimensions, units, fills, coordinates, time/bounds
   and `precipitation_cnt`. Retain original bytes/hash and extraction instructions.
4. Confirm collection 07/science V07B, `precipitation` in mm/day, actual UTC day and
   spatial footprint. Retain matching `precipitation_cnt`; require 48 valid half-hours
   for complete-day admission. Counts 1–47 are unverified for this purpose, 0/fill/null
   missing. Zero rain with complete support is valid. Do not silently convert a partial
   daily mean rate into an accumulated depth. These admission rules are author QC.
5. If DMR++ still returns 403 after archive authorization, retain the new attempt's
   timestamp and report the exact public granule/DDS URL to NASA GES DISC support.
   Do not change product/version or claim success based on a login page or CMR result.
6. Add actual raw subset/extraction provenance and empirical tests, regenerate the
   manifest, run `npm run check`, and review before changing IMERG UI status.

The credential-free probe intentionally cannot reuse a browser session in the terminal.
Its unauthenticated 401 is not evidence that the user's browser login failed.

## Validation and implementation scope

58 tests passed, including authentic POWER/IMERG values and CMR identities, duplicate JSON
keys, leap/impossible dates, strict UTC intervals, physical units, zero/negative
temperature, fill/null/absent handling, consecutive gaps, unexpected metadata,
tampered provenance, unsafe catalog access URLs, and IMERG count/rate QC boundaries.
IMERG cell unit tests are explicitly synthetic adversarial fixtures; separate NetCDF
integration tests extract the real original and independently downloaded repeat.
Lint, strict type checking, offline evidence verification and production build passed.

Implemented: `scripts/probe-nasa.mjs`, deterministic build/receipt verification;
`src/data/ingestion/` POWER, CMR and extracted-cell validators; raw/derived evidence;
tests; nullable unknown metadata in shared contracts; source-status text and provenance
links in the existing four screens; package check scripts and supporting documentation.
No runtime dependency, backend, product authentication flow or scientific engine added.
h5wasm is a development-only extraction dependency and is not bundled into the app.

Remaining: automated historical retrieval and verified full common history,
crop windows/indicators, agronomic rules, field facts, normalization, decision engine,
sensitivity/counterfactual computation and certificates. No rankings, regret scores,
reversals or certificates are emitted. Seven winter days cannot support a five-year
crop comparison. The owner has authorized proceeding to later implementation stages;
their scientific claims remain gated by validated evidence and computation.
