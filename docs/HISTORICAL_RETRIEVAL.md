# Historical NASA retrieval and recovery

## Current update: complete authorized DAP4 history

The external owner-supplied token path was resolved without moving the token into
the repository. The official bearer-authenticated OPeNDAP route succeeded for all
2015–2024 daily granules. Seven existing browser captures were reused; 3,646 further
daily files were retained locally, yielding 3,653 complete daily observations.
Every selected cell has 48 valid half-hours, and h5py/h5wasm agree exactly. Ten
original-byte archives and receipts are published with the checkpoint. No Harmony
security check was bypassed and no Harmony output is claimed as ingested.

See [exact reproducible steps](REPRODUCE_IMERG.md) and
[the combined checkpoint](COMBINED_CHECKPOINT.md). The sections below retain
**earlier checkpoint states**, including the original token-path and Harmony blockers;
their incomplete-coverage statements are historical, not the current state.

## Update after fc80643: successful DAP4 recovery

On 2026-11-14 the owner authorized investigating reuse of the successful original
route. Public CMR metadata confirmed each January 1–7 granule and its OPeNDAP URL.
Six additional official DAP4 browser downloads succeeded, without contacting the
rejected Harmony download endpoint or using signed-URL workarounds. Navigation
reported `ERR_ABORTED` because the response initiated a download; completion paths
and actual NetCDF bytes were verified separately. No repeated request was needed.

All seven daily cells passed the existing NetCDF parser and an independently
executed h5py 3.15.1 reader. Rounded daily rates in mm/day: 0, 3.08, 5.65, 0.03, 0,
0.01, 15.74. Every count is 48. Native center is 44.55 N, 27.350000381469727 E.
Raw files, import receipts, exact float32 values, time bounds, source history and
hashes are in `public/evidence/imerg-dap4`. The independent oracle retains reader
versions and its code/source hashes. `npm run imerg:verify` reparses all actual bytes.
Seven winter days still support no historical crop-window rainfall comparison.

`scripts/plan-imerg-dap4.ts START END` discovers a bounded (maximum 31-day) set of
actual CMR granules, caches metadata with receipt/hash, and generates exact transforms
using the validated native subset. It refuses incomplete/ambiguous source coverage.
`scripts/download-imerg-dap4.ts PLAN.json` is prepared for an owner-supplied local
Earthdata token: one request at a time, cache/hash validation, bounded retries for
429/502/503/504, Retry-After handling, size limits and NetCDF validation. It sends
the token only to the exact approved OPeNDAP origin and refuses redirects. Terminal
authentication and historical throughput are **not yet verified**. The owner agreed
to save the token locally; no token was present at the latest checkpoint inspection.

For history, validate one uncached 2015 day first, then use monthly CMR plans and
resume verified daily captures. Do not recreate the already retained seven days.
Monitor NASA limits and service latency before choosing the historical batch size.
Promote new measurements only after receipts and independent extraction agree; build
the full date/quality manifest before enabling rainfall scenarios. If DAP4 throughput
is inadequate, a separately authorized official Harmony client can be evaluated;
the browser-origin restriction must still not be bypassed.

The following sections retain the earlier Harmony investigation and exact blocker.

## Actual state on 2026-11-14

POWER: ten annual responses, 3,653/3,653 daily maxima, 2015-01-01 through 2024-12-31,
UTC, °C, zero missing. Raw bytes, exact URLs, acquisition timestamps, byte counts,
SHA-256 and coverage are retained under `public/evidence/history/power`.
Reproduce/verify without network with `npm run history:verify`.
`node --experimental-strip-types scripts/acquire-power-history.ts` verifies existing
captures and retrieves only missing years sequentially. It does not silently repair
a hash mismatch. Annual requests preserve the explicit `time-standard=UTC` convention.

IMERG: only 2024-01-01 is a validated measurement. Original and authenticated-repeat
DAP4 NetCDF files agree on the selected native cell, 0 mm/day, count 48. See the
Stage 1 report for exact URLs, SHA-256, dimensions, fill values and UTC bounds.
No seven-day or historical ingestion is claimed.

## Supported route investigated

Official documentation: [NASA Harmony](https://harmony.earthdata.nasa.gov/docs) and
[NASA GES DISC tutorial](https://github.com/nasa/gesdisc-tutorials/blob/main/notebooks/How_to_Subset_and_Download_L234_Data_Using_Python.ipynb).
Collection `C2723754864-GES_DISC` is Final daily V07 (`GPM_3IMERGDF.07`); the inspected
source granules are V07B. Use a geographic subset containing 44.565 N, 27.335 E and
retain `precipitation,precipitation_cnt,time,time_bnds,lat,lon` together.

The authenticated Harmony request below successfully generated seven NetCDF outputs
(job `5564d3e6-3640-4085-95a1-95dc5f33461d`, successful 2026-11-14T08:54:27.867Z,
267.57 KiB reported output size). Job success is processing metadata, not ingestion.

```
https://harmony.earthdata.nasa.gov/C2723754864-GES_DISC/ogc-api-coverages/1.0.0/collections/precipitation,precipitation_cnt,time,time_bnds,lat,lon/coverage/rangeset?subset=lon%2827.3%3A27.4%29&subset=lat%2844.5%3A44.6%29&subset=time%28%222024-01-01T00%3A00%3A00Z%22%3A%222024-01-07T23%3A59%3A59Z%22%29&format=application%2Fnetcdf&forceAsync=true&maxResults=7&ignoreErrors=false&label=inversis-netcdf-method-test
```

Public STAC catalog: `https://harmony.earthdata.nasa.gov/stac/5564d3e6-3640-4085-95a1-95dc5f33461d/`.
Item links identify result objects; no signed query string is retained in the repository.
The first observed result endpoint was:

```
https://harmony.earthdata.nasa.gov/service-results/harmony-prod-staging/public/5564d3e6-3640-4085-95a1-95dc5f33461d/463538844/GPM_3IMERGDF.07_3B-DAY.MS.MRG.3IMERG.20240101-S000000-E235959.V07B_subsetted.nc4
```

## Exact blockers and unsuccessful alternatives

- Unauthenticated service-result requests returned login redirects (237-byte bodies),
  not NetCDF. Anonymous staging S3 returned HTTP 403 XML (263 bytes), not data.
- Authenticated browser result download first failed because its paused download
  response was unavailable. Automatic browser approval then rejected the download
  because it could not verify origin/context. This must not be bypassed with a
  signed-URL or alternate-tool workaround. No seven Harmony binaries were admitted.
- Giovanni CSV job `718f6786-9331-4d53-9e92-7f85db04609d` failed: adapter v1.1.14 does
  not accept `precipitation_cnt` as a data field. Precipitation-only CSV cannot meet
  the complete-day quality contract. Precipitation CSV job
  `34348265-40e8-4de2-aa39-0f1de1fb00de` was last observed running; its output was not
  admitted or used. Further endpoint probing was stopped in favor of independent work.
- DAP2 DDS previously returned HTTP 400 (Int8 type not representable). The actual
  one-day download used DAP4 `.dap.nc4`; earlier 401/403 access issues were resolved
  after the owner accepted GES DISC's agreement.

## Reproducible recovery sequence

1. Resolve the browser download approval problem, or have the owner obtain the
   seven results through NASA's official interface. Do not bypass the denial.
2. Retain each original NetCDF and STAC item, capture a stable request reference,
   SHA-256, bytes and retrieval time when observed. Unknown download time stays null.
3. Inspect Harmony metadata rather than assuming it equals DAP4 history. The current
   NetCDF parser validates DAP4 files; Harmony history may require a reviewed adapter.
4. Check seven unique UTC dates, native cell containment, dimensions, DOI/version,
   mm/day, fill values, time bounds and valid half-hour counts. Require count 48 for
   complete-day use. A valid zero remains zero; missing/partial days refuse exposure.
5. Only after this sample passes, submit nonoverlapping monthly batches for
   2015-01-01 through 2024-12-31, same variables/footprint, `ignoreErrors=false` and
   `maxResults` equal to the month's days. Run one batch at a time. Respect NASA
   rate-limit/Retry-After responses; resume verified cache entries and pause on errors.
6. Validate every daily binary, then assemble a deduplicated 3,653-day coverage
   manifest including missing/partial dates. Never infer coverage from job success.
   Recompute common crop windows and candidate-independent precipitation references
   before enabling the combined model.

`scripts/download-harmony.ts` is a prepared resumable downloader, **not a verified
end-to-end historical ingestion path**. `--catalog-only` inspects public STAC without
credentials. Actual downloads need separately authorized terminal access and an
owner-provided token in ignored `.local/earthdata-token.txt`; do not put secrets in
chat or Git. It was not used to bypass the browser rejection. It validates collection,
requested dates, filenames, hashes and HDF magic, but intentionally marks scientific
measurement validation pending. Redirect hosts are narrowly allowed and tokens are
sent only to Harmony. Unsupported redirects fail closed. Scientific admission is a
separate step; do not treat this script's output as validated observations.
