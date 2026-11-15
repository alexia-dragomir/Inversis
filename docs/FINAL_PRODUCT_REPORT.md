# Final product refinement checkpoint

Historical checkpoint: this report describes the 2026-11-14 refinement below.
For the current 2026-11-15 release, 142-test suite, navigation fix and reviewer-facing
documentation, see [FINAL_RELEASE.md](FINAL_RELEASE.md). Earlier counts are retained
as historical records, not presented as current verification totals.

Date: 2026-11-14. Repository: `alexia-dragomir/Inversis`.
Branch: `stage-1/evidence`.
Starting/rollback checkpoint: `bd786d9fbad269ecb261e7972ca86562e264654a`.
Earlier scientific checkpoint: `5de673a`. Existing work was preserved throughout.

## Completed refinement

- Deterministic transparent original logo and original-symbol favicon; both source
  PNGs retained byte-identically. Shared contrast, candidate colors and focus styles.
- Context explanation, early comparison action, conceptual workflow and actual
  crop-history peak annotation.
- Decision rationale, six data-derived replay leaders, direct replay charts and
  naturally sized minimax panel.
- Linked 21-state preference chart/range control, scaled margin bracket, calendar
  and methodological margin views, and explicit interpretation boundaries.
- Next Evidence before/after previews and explicit application to existing shared
  analysis state, including sole-candidate and no-eligible refusals.
- Document-style certificate, rationale, fingerprint copying, complete grouped
  limitations and two-page A4 portrait printing. Canonical JSON is unchanged.

Changed presentation files: `index.html`, `src/main.tsx`, `src/precision.css`,
`src/components/{AnalysisWorkspace,AssurancePanels,AuditRecord,Brand,DecisionInstrument,
EvidenceAtlas,PreferenceInstrument,MarginDiagnostic}.tsx` and `display.ts`.
Added two brand derivatives and `scripts/prepare-brand.py`; updated the brand README.
Added `tests/precision-display.test.ts` and `tests/precision-refusal.test.tsx`.
Documentation: this report, DESIGN_SYSTEM, BRANDING_AUDIT and the product checkpoint.

## Verified locally before publication

`npm run check` passed: **114 tests in 17 files**, lint, TypeScript, production
build, POWER/source checks, sample IMERG checks and original-file historical IMERG
verification. All 3,653 IMERG daily binaries were cross-checked. Both actual source
histories retain 3,653 complete UTC days. All four independent Python scripts
passed again: heat, IMERG, combined and interpretation oracles.

Scientific engine, contracts, data, archives, normalization, scenarios and canonical
serialization have no content changes. Default scores remain 0.0481, 0.1364 and
0.1712; margin remains 0.0883. No probability, forecast, crop suitability, new
reversal or continuous preference boundary is inferred.

Isolated headless Chrome tested the production build with no visible windows or
desktop control. Twenty-two grouped checks covered all routes at 390/768/1440 px;
default and 20/80 preference; +7-day shift; 2015 and 2018 replay selection; linked
chart/slider keyboard operation and retained focus; soybean preview/application;
sunflower/no-eligible refusal; heat-only fallback; reset; clipboard; and changed,
default and refusal downloads. An intercepted HTTP 503 rainfall request verified
labeled heat-only fallback and explicit combined refusal. No observations were
substituted for that deliberate QA failure.

No horizontal page overflow or unloaded images occurred. Screenshots were
inspected. Representative certificate rendering at 1152 CSS pixels and device
scales 1.25 and 2 was checked, alongside scale-1 viewport checks. These are
device-scale equivalent checks, not changes to the user's browser zoom. All
buttons have names, images have alt text, disclosures start collapsed, and
reduced-motion mode has no running CSS animations. Skip-to-main, keyboard focus
outlines and focus retention passed programmatic checks. Selected contrast ratios
are recorded in DESIGN_SYSTEM.md. Full-page capture showed an offscreen skip-link
artifact; normal viewport capture and DOM coordinates confirmed it is hidden
until keyboard focus, with no actual header overlap.

Headless printing produced **two A4 portrait pages**, with backgrounds and 12 mm
margins, without browser headers/footers. Both pages were rendered to PNG and
inspected. Page one has rationale, assumptions, intact fingerprint and provenance.
Page two starts with the limitations heading and all disclosure groups. No blank
page, orphaned heading or clipping was found. No PDF dependency ships in the app.

Canonical verification passed for default, modified and refusal exports. At 20/80,
+7 days and no exclusions, the **entire JSON equals the prior validated export
except `generatedAtUTC`**, including matrices, diagnostics and provenance.

- Default: `4b62215c9f6885d3f558ab1eb65f62c01c826d722c2f73bd62c1faaf06ca8194`
- 20/80 +7: `0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15`

Brand/security audits found only original Inversis branding and its deterministic
derivatives, with factual NASA attribution retained. No credentials or unrelated
project files were found in the release. The Earthdata token was not read.

## Reproduction and limits

Run the four independent Python validators, `npm run check` and
`npm run certificate:verify -- FILE.json`. Headless scripts, result JSON, screenshots
and PDF remain in ignored `.local/verification/` on the development machine, as
requested. They use bundled Playwright and isolated headless Chrome; application
dependencies did not change.

No known blocking application defect remains from these checks. Automated and
agent screenshot review are not a complete WCAG audit or final human review;
the owner will inspect the deployed site. Other browser engines and native
printer drivers were not tested. METHODS, LIMITATIONS and PHASE_2_FINDINGS still
apply. Submission materials/form work is separate; no entry was submitted here.

## Release gate

The commit containing this report identifies the verified local refinement.
Publish through the existing Actions/Pages workflow, then verify its exact SHA,
live routes, exports, asset hashes and source links. The completion report records
the final commit and actual deployment run; local checks alone do not establish
deployment success.
