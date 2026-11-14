# Field Evidence & Readiness

This presentation-only workbench follows the crop sequences on Context and connects
to Next Evidence on Stability. It distinguishes validated processing of gridded
historical Earth evidence, supplied field information and unestablished agronomic
suitability. A collapsed intake keeps the default view compact; review questions
remain visible without entering data. Information completeness is never a readiness score.

## Inputs and provenance

Eight independent categories default to unknown: pH (0–14), texture (120 characters),
organic matter (0–100%), drainage, irrigation, preceding crop, reported disease history
and local timing (200 characters). Disease history allows an optional 200-character note.
Zero is a valid supplied numeric value; missing values are not converted to zero.
Invalid values block the field-note export, not the scientific analysis.

Each supplied category requires one of four source classifications: farmer-reported,
on-site observation reported by user, laboratory report reported by user, or regional
mapped estimate reported by user. An optional reference is limited to 200 characters.
Every supplied entry says **Supplied — not independently verified**. Choosing a
laboratory source does not mean Inversis inspected or authenticated a laboratory report.
“No history reported” is not proof of absence of disease.

## State, export and scientific isolation

Typed state lives only in the ordinary React workspace. It persists across the four
screens, but refreshing clears it. There is no backend, browser storage, account,
upload, analytics or new API request. No personal identifiers are requested.
Clear requires an accessible confirmation and restores focus to its initiating button.

The separate `inversis-field-notes-v1` JSON has designation
`unverified_user_supplied_information`, an export timestamp, supplied provenance,
and explicit unknown statuses with null values. It is not hashed or included in the
scientific certificate. It does not authenticate entries or establish suitability.

The field state is never passed to engine inputs, candidate permissions, evidence
processing or canonical serialization. Existing preferences and Apply-to-analysis
controls remain the sole routes for hypothetical exclusions. Existing crop windows
are read from the engine for display only; timing notes never change them. The
five-stage demo omits field intake entirely and cannot inherit or export ordinary
field notes. Exit, restart and completion preserve those notes.

## Agricultural guidance and limits

The advisory asks for local assessment of soybean/sunflower Sclerotinia constraints.
It is general United States extension guidance, not a verified Romanian field rule:

- [UMN Extension: Sclerotinia stem rot on soybean](https://extension.umn.edu/agriculture/crop-production/soybean/sclerotinia-stem-rot-white-mold-on-soybean)
- [UMN Extension: White Mold Review](https://blog-nwcrops.extension.umn.edu/2018/07/white-mold-review.html)

No disease score, probability, outbreak claim, suitability threshold, automatic
exclusion, yield prediction or soil-health inference is implemented. Future agronomic
integration requires authenticated source records, location/date applicability,
qualified local review, validated crop-specific rules, explicit user authorization,
versioned scientific contracts and independent tests before changing eligibility.

## Verification and file inventory

The release adds 18 focused tests to the prior 124 (142 total in 20 files).
`scripts/verify-field-evidence.mjs` exercises all eight categories, invalid input,
source labels, unknown and populated exports, four-screen persistence, every demo
exit stage, restart/completion, clear/cancel/re-entry, focus, no storage/uploads and
responsive layouts at 390, 768, 1024 and 1440 CSS pixels. Supply `PLAYWRIGHT_MODULE`
and `CHROME_PATH` for an installed isolated headless runtime; optionally set `QA_URL`
to test the deployed site. No project dependency is added. Captures stay ignored
under `.local/verification/field/`.

Full certificate comparisons exclude only the generation timestamp. Required hashes:

- Default: `4b62215c9f6885d3f558ab1eb65f62c01c826d722c2f73bd62c1faaf06ca8194`
- 20% heat, +7 days: `0e0f04011a61824c52089963690f799c46f9b61b80a28c877034f637f387af15`

Release gates also retain `npm run check`, all 3,653 original IMERG validations,
the four independent Python scientific validators, existing headless interaction,
demo, accessibility and certificate checks, rendered screenshot inspection, protected
path/branding audits, successful CI deployment and public-site verification.

Exact feature inventory:

- `src/components/FieldEvidence.tsx`: intake, review and Stability connection.
- `src/components/fieldNotes.ts`: types, validation, questions and separate export.
- `src/components/AnalysisWorkspace.tsx`: shared session state and placement.
- `src/main.tsx`: stylesheet import.
- `src/field-evidence.css`: responsive presentation and print exclusion.
- `tests/field-notes.test.tsx`: focused validation/render/export tests.
- `scripts/verify-field-evidence.mjs`: isolated headless regression coverage.
- `README.md`, `docs/AI_USE.md`, `docs/FIELD_EVIDENCE.md`: capability and limits.

No engine, data contracts, source evidence, original branding, canonicalization,
dependencies or deployment configuration are changed by this feature.

Local verification on 2026-11-14 passed: the full check suite (142 tests), four Python
validators, all original IMERG files, 26 existing browser check groups, the guided-demo
suite, 16 expanded-disclosure accessibility layouts, both scaling checks, and the new
field regression suite. Rendered collapsed and expanded field captures were inspected
at all four widths. The two-page A4 certificate retains its full fingerprint and
limitations; both canonical records remain unchanged except generation timestamps.
Protected scientific paths and original brand assets are unchanged. GitHub deployment
and public checks are separate post-push gates, not implied by these local results.
