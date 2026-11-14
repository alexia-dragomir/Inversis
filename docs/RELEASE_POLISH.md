# Final visual release polish — 2026-11-14

Starting checkpoint: `27b327ecb945dd6e04c2924869459f5c99e43313`, on `stage-1/evidence`.

## Change inventory

- Context: balanced hero/process composition, stronger coverage numerals, independently sized coordinate schematic, clearer history rows and units, consistent crop tiles.
- Decision: refined result metrics and bar spacing; explicit Selected/Inspect labels on replay overview cards. Expanded replay tables now remain inside their grid panels on mobile instead of widening the page.
- Stability: wider tablet preference chart, grouped selection/scores and responsive margin readout, larger labels, balanced diagnostic columns, and clearer Next Evidence controls and comparison panels.
- Certificate: improved screen typography, metadata, metrics and fingerprint hierarchy. All new CSS is screen-only; the existing A4 print rules are unchanged.
- Global: consistent section spacing, readable disclosure/table typography, minimum-height navigation and answer controls, and preserved keyboard focus states.

No scientific calculations, canonicalization, evidence, source archives, assets, dependencies or workflow configuration changed. The four screens, all disclosure content and default behavior, candidate colors, original Inversis branding and attribution remain intact. The field-unknowns explanation is grouped below the reference-protocol chart; no source disclosure was moved or removed.

## Verification

- Complete `npm run check`: lint, TypeScript, 114 tests in 17 files, sample/history verification and production build passed. All 3,653 original IMERG daily binaries were cross-checked. After the final grid containment correction, lint/tests/typecheck/build and headless checks were repeated; scientific inputs and code remained unchanged.
- Four independent Python checks passed: POWER decision oracle, IMERG sample oracle, combined rainfall/heat oracle and scientific interpretation oracle.
- Headless Chrome: 26 check groups covering all four screens at 1440, 1024, 768 and 390 CSS pixels, replay selection, linked chart/keyboard slider, preview/application, reset, sole-eligible and no-eligible outcomes, heat-only fallback, and HTTP 503 rainfall refusal behavior.
- Additional checks: all 16 screen/width combinations with disclosures expanded had no page-level horizontal overflow. Exact tables retain contained horizontal scrolling. Skip link, keyboard focus, button names, image alternatives and reduced-motion behavior passed.
- Screenshot review covered all four screens at each required width. Representative Stability and Certificate layouts were captured with 1152 CSS pixels / DPR 1.25 and 720 CSS pixels / DPR 2, approximating 125% and 200% scaling from a 1440-pixel viewport. This is headless viewport/DPR emulation, not a native browser zoom action.
- A4 output: two pages, complete fingerprint on page one, limitations heading with all six disclosure groups on page two; both rendered pages inspected.
- Default scores remain 0.0481 / 0.1364 / margin 0.0883. Default SHA-256 remains `4b62215c9f6885d3f558ab1eb65f62c01c826d722c2f73bd62c1faaf06ca8194`.
- The 20% heat / 80% dry-spell, +7-day certificate matches the retained prior export in full except generation timestamp; fingerprint remains `0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15`.
- Original and derivative branding hashes match the prior checkpoint. No NASA insignia or new visual assets were introduced. Factual dataset attribution remains textual.
- Scientific-path diff and credential-pattern checks passed. Temporary screenshots, PDFs, exports and logs remain ignored under `.local/verification/`.

## Release and limits

The commit containing this report is intended for the existing GitHub Pages workflow. CI and public-build verification must succeed before deployment is reported complete.

Validation uses isolated headless Chrome, not physical devices, other browser engines, a screen-reader audit or physical printer output. Full-page Chrome captures can paint the offscreen skip link; normal viewport screenshots and computed geometry confirm it is hidden until keyboard focus. No desktop or visible browser control was used.

Scientific limitations remain unchanged: historical exposure is not yield prediction, field suitability or agronomic certification; sampled preference stability is not universal robustness. No new scientific conclusions are introduced by this polish.
