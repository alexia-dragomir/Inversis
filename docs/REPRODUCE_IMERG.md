# Reproducing historical IMERG access

This route reuses the official source behind the successful GES DISC Transform Data
NetCDF download. It does not use Harmony output URLs, transferred browser cookies,
redirect-following authentication or any security-check workaround.

## Authorized acquisition

1. Sign in to NASA Earthdata and accept any applicable GES DISC agreement yourself.
2. Create a bearer token through the official Earthdata account service. Save it in
   an owner-controlled file **outside this repository**. Never paste it in chat,
   commit it, upload it to a deployment, or put it in a URL.
3. Set only the token file's path in the process environment. The owner's actual
   file is in the separate `Inversis.local` sibling folder, not repo `.local`.
4. Run the bounded monthly driver from the Inversis repository root:

```powershell
$env:INVERSIS_EARTHDATA_TOKEN_FILE = 'C:\Users\Admin\Documents\Inversis.local\earthdata-token.txt'
node scripts/acquire-imerg-history.mjs
```

The driver requests 2015-01-01 through 2024-12-31 with two monthly workers and one
sequential daily request per worker. Existing valid daily captures, including the
seven public access-sample days, are reused. `plan-imerg-dap4.ts START END` makes a
public CMR UMM-JSON request for collection `C2723754864-GES_DISC`, exact dates and
point `27.335,44.565`; each month must contain exactly one V07B granule per day.
Each request URL derives from its actual CMR `OPENDAP DATA` link.

The exact constraint retains `/lon[2072:2074]`, `/lat[1344:1346]`, `/time`,
`/time_bnds`, `/precipitation[][2072:2074][1344:1346]` and
`/precipitation_cnt[][2072:2074][1344:1346]`. These are native indices for the
specified demonstration point only, not a general arbitrary-coordinate API.
Every output is checked again for actual coordinates, dimension order and metadata.

Only `https://opendap.earthdata.nasa.gov` receives the bearer header. Redirects
are refused. Requests have time/size bounds and limited 429/502/503/504 retries;
a longer Retry-After stops the batch. HTTP status, content type, actual completion
time, source URL, bytes and SHA-256 are recorded. No token is logged. A transport,
metadata, hash or quality failure is not silently substituted or repaired.

## Validation and publication

The acquisition cache is ignored under `.local/imerg-dap4`. Preserve it for resume.
After acquisition finishes, run:

```powershell
python scripts/build-imerg-history.py
npm run imerg:history:build
python scripts/independent-combined-oracle.py
npm run history:build
npm run check
```

Python needs the pinned `requirements-validation.txt` packages. Annual builds read
original files and original receipts; they never generate measurements. The first
reader (h5py/HDF5) creates deterministic annual archives and daily manifests. The
second reader (h5wasm) reparses every archived NetCDF and requires exact independent
value/count/status/cell/URL agreement before constructing historical exposures.
The separate Python arithmetic oracle reads original archives and POWER responses.

For a fresh checkout, no NASA token or local acquisition cache is needed to verify:

```sh
npm ci
python -m pip install -r requirements-validation.txt
python scripts/independent-oracle.py
python scripts/independent-imerg-oracle.py
python scripts/independent-combined-oracle.py
npm run check
```

`imerg:history:verify` checks retained original bytes and deterministically rebuilds
the evidence artifact without network. The independent oracle's JSON reader-version
metadata may reflect the platform's actual HDF5 build; numerical/source comparisons
are exact or use the declared 12-decimal arithmetic tolerance.

## Recovery boundaries

For HTTP 401/403 or an authentication redirect, verify the token's validity and
GES DISC agreement through NASA's official account flow, then resume the same
command. Do not print credentials or change the allowed origin. A service timeout
can be retried by resuming; completed byte/receipt pairs are validated and reused.
If interruption leaves a binary without its receipt, stop and preserve that file
for inspection: the downloader refuses to overwrite it. Resolve incomplete capture
registration explicitly rather than inventing an HTTP timestamp.

The earlier Harmony download was blocked by automatic browser origin/context
approval review. That restriction was not bypassed. Its exact job and endpoint
history remain in HISTORICAL_RETRIEVAL.md. Successful DAP4 retrieval does not establish
that Harmony downloads now work. Never treat a server-side Harmony job's success
as proof that its measurements were downloaded or validated.
