# Guided demonstration and product completion — 2026-11-14

Starting checkpoint: `fc2c1645344516e7f8ac567093c9ba6969cac4dc`, clean, on `stage-1/evidence`.

## Features

- Context hero: secondary **Explore the guided demo** action; no automatic tour and no fifth navigation tab.
- Decision: **Why this result?**, directly after the conditional result and before the comparison instruments. It projects current engine outputs into a concise rationale, including unique selection, the full tied set, sole eligibility, no eligibility, insufficient evidence, invalid inputs and reduced heat-only scope. Preferences, calendar shifts, scenario counts and scores follow the applied analysis.
- Context: **From observation to decision.**, after coverage and before historical exploration. Observe → Measure → Compare → Challenge → Trace forms a five-column desktop sequence, a tablet grid and a vertical mobile sequence.

## Five-step guide and state boundaries

1. Context: validated coverage and evidence location; gridded evidence is distinguished from farm measurements.
2. Decision: actual default-reference minimax result, rationale and comparison.
3. Decision: the existing replay instrument opens at 2018–2022, where Alternative B has lowest exposure. A separate engine-derived reminder identifies the overall minimax result. Replay buttons remain interactive.
4. Stability: the existing Next Evidence workbench shows real-engine soybean and sunflower permission branches. Users can toggle permitted/prohibited and inspect the sole-candidate and no-eligible outcomes. No invented competitive margin or replacement recommendation is shown.
5. Certificate: the default-reference record retains canonical JSON download, fingerprint, provenance and print controls. The visible and printed record is labeled as a guided default reference. Completion restores the ordinary application; restart affects only the guide.

The user workspace stays mounted, hidden and inert while a second instance of the same workspace owns the demonstration's options, engine bundle and certificate. There is no second mathematical implementation and no temporary overwrite/restore of user options. The starting navigation is retained and restored. The demo's default settings are locked; its hypothetical previews have no Apply action. Exit from every step and completion discard the demonstration instance. Exit returns keyboard focus to the main content. Unique input IDs avoid conflicts between the two mounted workspaces.

Guide panels are placed in document flow beside the relevant content, with Back, Next, Exit and progress. No overlay covers charts. Keyboard focus moves to the step panel; no animation is introduced. Navigation links remain available and synchronize the guide to the destination screen. If the reference rainfall artifact is unavailable, the demo explicitly refuses to present combined reference results and allows exit back to the ordinary fallback.

## Verification

- Complete `npm run check` passed: lint, TypeScript, 124 tests in 19 files, sample/history evidence checks, verification of all 3,653 original IMERG daily binaries, and production build.
- Four independent Python validators passed: POWER decision oracle, IMERG sample extraction, combined rainfall/heat oracle and interpretation oracle. No scientific validation script changed.
- New rationale tests cover all 105 preference/calendar combinations against actual engine outputs, explicit tie fixtures, sole/no eligibility, insufficient evidence, heat-only and invalid configurations.
- New presentation tests verify exactly five guide stages, engine-produced permission previews without Apply, preserved ordinary Apply behavior and the five-stage semantic methodology list.
- `scripts/verify-guided-demo.mjs` passed: actual replay values, both eligibility outcomes, exit from every step, completion, restart, fixed reference controls, preference-preview fallback, keyboard entry/navigation/exit, missing-rainfall refusal, and certificate isolation.
- All five guide steps and methodology layouts were captured at 390, 768, 1024 and 1440 CSS pixels and visually reviewed. No horizontal page overflow. Additional existing checks cover 16 expanded-disclosure layouts, focus/skip-link behavior, reduced motion and representative 125%/200% viewport/DPR scaling.
- The existing 26-group browser regression passed, including ordinary interactions, reset, no-eligible refusal, heat-only fallback, HTTP 503 rainfall behavior, JSON and clipboard.
- Ordinary and demo reference print records remain two A4 pages. Page one contains the complete fingerprint; page two keeps all six limitation groups with their heading. Both were rendered and reviewed.
- The default fingerprint remains `4b62215c9f6885d3f558ab1eb65f62c01c826d722c2f73bd62c1faaf06ca8194`. The 20% heat / 80% dry-spell, +7-day user record remains `0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15`; complete JSON before/after the tour agrees excluding generation timestamp. The ordinary nondefault export also agrees with the retained prior checkpoint export.
- Engine, domain contracts, canonicalization, data, original evidence, validation scripts, dependencies and original branding are unchanged. No NASA visual branding or new image asset was added. Credential-pattern and release-file audits passed. Temporary artifacts remain under ignored `.local/verification/`.

## Changed files

`src/App.tsx`, `src/main.tsx`, `src/completion.css`; `src/components/AnalysisWorkspace.tsx`, `AssurancePanels.tsx`, `AuditRecord.tsx`, `DecisionInstrument.tsx`, `PreferenceInstrument.tsx`, `GuidedDemo.tsx`, `MethodOverview.tsx`, `WhyResult.tsx`; `tests/guided-presentation.test.tsx`, `tests/result-rationale.test.tsx`; `scripts/verify-guided-demo.mjs`; this report.

The existing ordinary components gained only the props and presentation boundaries needed for the guide. No calculation logic was copied into the UI.

## Reproduce the browser check

Build and serve the production bundle with the existing preview command on port 5180. Run `node scripts/verify-guided-demo.mjs` with `PLAYWRIGHT_MODULE` pointing to an available Playwright module and `CHROME_PATH` pointing to a headless-capable Chrome executable. No installation occurs. Optionally set `QA_URL` to the published Inversis root (including trailing slash) for the public run. Screenshots, PDF, JSON exports and results are written only to `.local/verification/completion/` (or its `public/` subdirectory).

## Release and limits

The commit containing this report must pass the existing GitHub Actions/Pages workflow, public guided-demo checks and deployed/local asset comparison before release completion is reported. Public verification results are reported with the actual deployment status.

Validation uses isolated headless Chrome. Physical devices, other browser engines, a screen-reader audit and physical printer output were not tested. The 60–90-second guide duration is an intended reading pace, not a measured user-study result. Existing scientific limitations remain unchanged: historical exposure does not establish yield, future performance, field suitability or biological rotation benefit.
