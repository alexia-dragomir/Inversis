# Combined rainfall-and-heat checkpoint — 2026-11-14

## Outcome and scope

The requested 2015–2024 two-indicator historical domain is complete for the Bărăgan
demonstration point (44.565° N, 27.335° E). The four-screen architecture remains
Context → Decision → Stability → Certificate. The combined model loads by default
only when separately validated rainfall exists; the explicit heat-only fallback
remains usable. Missing or invalid rainfall refuses combined comparison.

Existing work, including `scripts/probe-nasa.mjs`, was preserved. This checkpoint
extends `6391a80` (seven-day recovery), following `fc80643` (84-test heat-only model).
Only `alexia-dragomir/Inversis`, branch `stage-1/evidence`, is the publication target.
No other repository, deployment or project was modified.

## Actual source coverage

| Source | Date domain | Valid / expected | Physical unit and quality |
| --- | --- | --- | --- |
| NASA POWER T2M_MAX | 2015-01-01–2024-12-31 UTC | 3,653 / 3,653 | °C daily maximum; 0 missing |
| GPM IMERG Final daily V07B | Same UTC domain | 3,653 / 3,653 | mm/day; 48 valid half-hours every day; 0 missing |

IMERG collection `C2723754864-GES_DISC`, product `GPM_3IMERGDF/07`, DOI
`10.5067/GPM/IMERGDF/DAY/07`. The containing 0.1° cell is centered at 44.55° N,
27.350000381469727° E. Every original 3×3 native subset is preserved in one of ten
annual NetCDF archives. Exact URLs, receipt metadata, byte counts and SHA-256 are
in annual daily manifests. No interpolation, averaging to a different footprint,
missing-value filling, synthetic observation or source substitution occurred.

Seven existing browser captures were reused and 3,646 further daily files acquired
through the authorized NASA OPeNDAP bearer-token route. The credential stayed in
the separate owner-controlled `Inversis.local` folder outside the repository. It
was not displayed, moved, committed or copied to runtime configuration. Browser
samples retain null exact retrieval timestamps, with registration times separately
identified; later HTTP captures record observed status 200 and completion time.

Every day was independently parsed with h5py 3.15.1 / HDF5 1.14.6 / NumPy 2.3.5
and h5wasm 0.10.3. All value, count, status, cell and transform-URL comparisons agree.
Original inclusive day bounds remain in NetCDF; analysis uses exclusive next-midnight
UTC ends. Fill -9999.900390625 and valid zero are distinct.

## Actual conditional result

The predeclared pooled references contain 40 unshifted crop-years per indicator:
heat-fraction bounds **0–41/62**, dry-spell bounds **5–27 days**. References remain
fixed across preferences, eligibility and diagnostics. Full coverage supports all
six shared overlapping five-year scenarios, 2015–2019 through 2020–2024.

At illustrative 50% heat / 50% dry-spell preference, zero calendar shift:

| Plan | Worst regret | Average weighted exposure |
| --- | ---: | ---: |
| Baseline | 0.04811529933481151 | 0.3196773738057225 |
| Alternative A | 0.13644891693672181 | 0.37472804196114873 |
| Alternative B | 0.17118276232630497 | 0.37710121079773223 |

Both minimax regret and the same-matrix average benchmark prefer Baseline under
these assumptions. This is not a crop recommendation or evidence of field suitability.
For example, the unshifted 2015 wheat window has 1/61 hot days and a 16-day dry run;
the 2024 maize window has 41/62 hot days and a 12-day dry run.

The Baseline set remains unchanged at all 21 declared preference weights, all five
calendar shifts at equal weights, and all five separate cyclic phases at equal
weights. **No preferred-set reversal or continuous boundary was observed or invented.**
These finite tests do not establish robustness elsewhere. Preference branches change
regret margins only. Hypothetical soybean prohibition changes eligibility only;
sunflower prohibition leaves no eligible plan, a distinct decision consequence,
not a climate-driven reversal. Soil, disease and management effects remain unresolved.

## Verification performed

- `npm run check`: passed lint, strict TypeScript, **101 tests in 13 files**, all
  retained Stage 1/sample/history integrity checks, full 3,653-day IMERG regeneration,
  and production build. The original 84 tests remain passing.
- Independent Python arithmetic reads every original IMERG archive and POWER response,
  recomputes all 200 crop/year/shift metrics for both indicators and **29 distinct
  configurations** (21 weights plus four nonzero shifts plus four nondefault phases).
  All losses/regrets/means/preferred sets agree with TypeScript to 12 decimals.
- Tests include units, UTC/calendar bounds, fills versus zero, partial sample counts,
  complete-window refusal, shared scenarios, eligibility-before-minima, ties,
  normalization degeneracy, provenance/hash mismatches, archive corruption, and
  unchanged heat-only results when rainfall is attached.
- Browser: all four routes; full coverage; physical fraction/day tables; weight and
  shift controls; sole/no-eligible cases; reset; heat fallback; preference diagnostics;
  actual certificate download. No captured console warnings/errors. Desktop visual
  inspection passed. Current mobile rendering is not independently verified.
- Browser export `inversis-dadc84b99fe0.json` verifies SHA-256
  `dadc84b99fe032d45a78564e2fde14c345ac1584cdaa433e26ef176053bcee5f`.
  It contains 20 source records, both indicators, 21/5/5 diagnostic samples and all
  three Next Evidence questions. SHA-256 integrity is not independent agronomic review.
- Production JavaScript: 323.58 kB, 90.41 kB gzip. Original evidence archives are
  downloadable static assets, not parsed by the runtime browser. No NASA login or
  backend is required at runtime.

GitHub Actions is configured to run independent Python readers/arithmetic and the
complete npm checks. Remote workflow success is not asserted from local results.

## Changed file groups

- `scripts/acquire-imerg-history.mjs`, token-path changes in DAP4/Harmony downloaders:
  bounded authorized access, resume and explicit external credential location.
- `scripts/build-imerg-history.py`, `read-imerg-archive.ts`,
  `build-imerg-analysis-evidence.ts`, `independent-combined-oracle.py`: original-byte
  archives, independent daily validation, reproducible dry-spell evidence/arithmetic.
- `public/evidence/history/imerg/*`, `imerg-analysis-input.json`,
  `combined-independent-oracle.json`: actual sources, receipts and verified results.
  POWER analysis artifact refreshes processing hashes and fallback-scope wording.
- `src/data/analysis-contract.ts`, `src/engine/analysis.ts`: separately validated
  precipitation contract, shared combined scenarios, weights, source-aware certificates
  and preference counterfactuals. Core exposure/minimax algorithms remain intact.
- `src/components/AnalysisWorkspace.tsx`, `src/App.tsx`, `src/styles.css`: preserved
  four-screen UI, independent fallback, physical audit table and sampled preference grid.
- `tests/combined.test.ts`, `historical-combined.test.ts`, `imerg-archive.test.ts`,
  `analysis.test.ts`; package scripts and CI: scientific, refusal and provenance checks.
- README and methods/source/limitation/validation/retrieval/submission/AI documentation.

## Remaining boundaries and next actions

The prior Harmony browser-origin approval restriction remains unresolved; it was
not bypassed. The separately authorized, official DAP4 route completed the required
historical acquisition, so it is no longer an IMERG coverage blocker. Exact earlier
endpoints/blocker and recovery steps are in HISTORICAL_RETRIEVAL.md and REPRODUCE_IMERG.md.

No public deployment URL or final competition submission is claimed. Vercel build
configuration and updated submission text are ready for a new Inversis-only project.
Human review of local crop windows, thresholds, field constraints and the final
submission remains necessary. No SMAP, field soil/disease evidence, causal rotation
benefit, calibrated crop damage, yield, confidence probability or future forecast is
inferred. The user-supplied deadline is November 15, 2026, 23:59 Europe/Bucharest.
