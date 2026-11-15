# Final pre-submission release — 2026-11-15

Starting checkpoint: `426d57fd626c1984b911ebbb44bb835f60215103`, clean working tree,
existing `stage-1/evidence` branch. This is a controlled refinement, not a new
scientific model. Competition submission itself has not been completed.

## Changes and rationale

- `src/App.tsx`: replace focus-induced route scrolling with post-commit,
  pre-paint ordinary-workspace focus using `preventScroll:true`, followed by
  instant absolute-top scrolling. Manual history scroll restoration prevents
  browser Back/Forward from restoring an old offset. A same-hash link click
  increments a navigation revision, so re-selecting the current screen works.
  Modified clicks retain normal browser behavior. The skip link and guided-demo
  panels keep their intentional focus behavior; field-review focus is retained.
- `src/components/AnalysisWorkspace.tsx`: Decision heading now says
  “Which rotation holds up across historical conditions?”
- `src/components/FieldEvidence.tsx`, `src/field-evidence.css`: keep each input's
  accessible label and fieldset legend while showing the category only once;
  remove unnecessary card stretching. Inputs, validation and export are unchanged.
- `scripts/verify-navigation.mjs`: desktop/mobile regression checks for all four
  destinations, direct hashes, same-screen navigation, bottom-to-top scrolling,
  Back/Forward, keyboard, internal links and intentional skip-to-content behavior.
- `README.md`: project problem and contribution, exact approved creator/lead
  paragraphs, five-stage reviewer walkthrough, actual historical findings,
  reproducibility, limits and current test count. Developer setup is retained.
- `docs/VALIDATION.md`, `docs/SUBMISSION_TECHNICAL_HANDOFF.md`,
  `docs/DEPLOYMENT_AND_SUBMISSION.md`, `docs/FINAL_PRODUCT_REPORT.md`,
  `docs/AI_USE.md`, `docs/FINAL_RELEASE.md`: reconcile current release status,
  retain historical counts with explicit labels and disclose actual assistance.

The optional extra worst-replay explanation was omitted to keep the final change
small. Existing dynamic explanations and certificate export were not rewritten.
README clarifies machine-readable JSON versus the human-readable Print record route.
No branding, engine, contracts, candidate sequences, source evidence, processing,
normalization, certificate schema/canonicalization or dependencies changed.

## Required verification

The Vitest suite remains **142 tests in 20 files**; browser checks are separate.
Release gates are `npm run check`, the four established independent Python scripts,
all 3,653 original IMERG binary validations, navigation regression, existing guided
demo, field-evidence, interaction, accessibility and print checks, rendered mobile
and desktop capture inspection, documentation-link and protected-path audits.
Independent arithmetic is computational independence, not human agronomic review.

The default record must retain SHA-256:

`4b62215c9f6885d3f558ab1eb65f62c01c826d722c2f73bd62c1faaf06ca8194`

The 20% heat / +7-day record must retain:

`0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15`

Full record comparisons exclude only the generation timestamp. Default maximum
regrets remain 0.0481, 0.1364 and 0.1712; the bounded 210-configuration finding is
unchanged. Neither stable selected sets nor field notes establish suitability.

Captures and machine-readable QA results remain in ignored `.local/verification/`.
Commit only after local gates pass. The existing Actions scientific-check and Pages
deployment jobs must then succeed for that exact commit. Public navigation, feature
and certificate checks plus asset/evidence verification are post-deployment gates;
the completion report gives their observed outcomes and commit, not an assumed result.

Local release gates passed on 2026-11-15: 142 tests in 20 files, full build/lint/type
checks, all 3,653 original IMERG validations, four Python validators, 42 navigation
checks, existing demo/field/interaction/accessibility checks and two-page A4 print
verification. Rendered desktop/mobile navigation and expanded field captures were
inspected. All 29 relative links in the reviewed documents resolve; approved creator
paragraphs match the supplied text exactly. The certificate verifier reproduced the
default SHA-256 above; full default/nondefault regression comparisons passed.
Protected scientific/data/branding paths and dependencies have no changes.
