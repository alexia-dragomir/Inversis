# Product design checkpoint — 2026-11-14

The subsequent controlled refinement and final verification are recorded in
[FINAL_PRODUCT_REPORT.md](FINAL_PRODUCT_REPORT.md). This earlier checkpoint remains
the historical record of the initial redesign.

Recovery checkpoint: `5de673ace3db75c88de1c3da0afe08d93c6446d2`.
Public application: https://alexia-dragomir.github.io/Inversis/.

## Protected boundary

Only presentation components, styles, original branding and presentation tests were
changed. `src/engine`, `src/data`, scientific scripts and `public/evidence` have no
Git changes. Original NASA bytes, candidates, windows, eligibility, normalization,
scenario minima, minimax regret, diagnostics, fallback and certificate canonicalization
remain unchanged. No NASA requests, credentials or new dependencies were needed.

## Implemented experience

- Original logo in navigation and certificate, clipped through an SVG viewport without
  altering pixels or aspect ratio. Both supplied originals and SHA-256 are retained in
  `public/brand`. Context uses one cropped banner corner, away from data and controls.
- Decision: interactive six-replay comparison, exact loss/regret values, aligned
  minimum-loss and additional-regret segments, and scaled worst-regret bars. The
  comparator can change by replay while the minimax set remains unchanged.
- Stability: exact 21-state range control, selected-state chart marker, candidate scores
  and live minimax margin; hover titles and a full exact-value table. Lines do not
  establish continuous boundaries. Keyboard focus survives recomputation; previous
  values are dimmed and labeled while work is pending, and export is disabled then.
- Calendar shifts expose numerical margins; alternative normalization and omitted-replay
  diagnostics retain exact disclosures and now show margins. Next Evidence uses the
  existing recomputed branches, with explicit no-eligible outcomes and margin readouts.
  Exploring an answer does not silently apply it as a farmer fact.
- Context: containing-cell coordinate schematic (not a basemap or farm boundary),
  crop-selectable ten-year physical heat/dry-spell history, visual five-year crop
  sequences, and the original seven-day table inside an audit disclosure. History
  values come directly from validated crop-year records at the current calendar shift.
- Certificate: branded record with assumptions, model, scenarios, preferences,
  fingerprint and export. Limitations are grouped without removing any distinct
  disclosure; all original limitations remain intact in exported JSON.

## Verification

Full `npm run check` passed: **109 tests in 15 files**, lint, TypeScript, source/history
validation and production build. All 107 prior tests remain. Two additional tests
compare presentation values with independent Python results across all 105 primary
preference/calendar combinations, and exercise no-competitor/no-eligible outcomes.
All four independent Python verification scripts were rerun successfully. Regenerated
scientific artifacts remain unchanged. Production JS: 355.08 kB (98.26 kB gzip);
CSS: 32.20 kB (7.23 kB gzip), plus supplied original brand images.

Local browser checks covered desktop and 390px layouts, all four routes, replay
selection, keyboard preference exploration, crop history selection, hypothetical
soybean/sunflower exclusions, reset, and heat-only fallback. No horizontal page
overflow or captured console warnings/errors. A focus-loss issue was found and fixed.
Header and chart labels, candidate patterns, legends, source units and progressive
disclosures were visually inspected. This is targeted accessibility checking, not
a claim of comprehensive assistive-technology certification.

Downloaded redesigned export at heat 20% / dry spell 80%, +7 days, no exclusions:
`0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15`.
Canonical verification passed. **The entire JSON record equals the pre-redesign
verified export, excluding only generation timestamp**, including all matrices,
source provenance, diagnostic branches, assumptions and limitations.

## Verified public release

Presentation implementation: `6103347b3aab4d383b1a39698c9d13ff6232d020`.
[GitHub Actions run 43600238875](https://github.com/alexia-dragomir/Inversis/actions/runs/43600238875)
passed both scientific check and Pages deployment. The actual public application was
then tested on desktop and at 390px: all four routes, source coverage, crop history,
replay selection, keyboard preference changes, hypothetical sunflower branch,
heat-only fallback, reset, certificate download and refresh. No captured console
warnings/errors or horizontal page overflow. Refresh resets assumptions to defaults.

Seven public assets (HTML, JS, CSS, both historical inputs, sample NetCDF and one
annual archive) matched the production build byte for byte. All twenty annual
archive/manifest links returned HTTP 200. The public export at the configuration
above verified successfully and matched the entire pre-redesign certificate except
generation timestamp. The supplied branding rendered successfully on desktop/mobile.

The original scientific interpretation and all submission qualifications in
PHASE_2_FINDINGS.md remain applicable. Final slides/video and submission remain the
separate submission-materials workstream; no submission form was sent here.
