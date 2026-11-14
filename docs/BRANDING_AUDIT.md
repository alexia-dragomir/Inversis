# Branding restriction and asset audit

## Mandatory project requirement

Generated content must not use, contain, imitate or modify NASA logos, flags,
mission identifiers as visual insignia, or NASA-specific branding/design elements.
Only the project owner's original Inversis logo and banner may supply branding.
Factual textual dataset attribution (NASA POWER, GPM IMERG), product identifiers,
citations and reproducible provenance must remain accurate and are not branding.
Do not reproduce official mission logos or insignia in the app, favicon,
certificate, preview images or submission visuals.

Recheck this requirement before any deployment that changes public visuals.
This records the user's project constraint; it does not assert NASA approval.

## Audit completed 2026-11-14

Audited the presentation release `6103347`, deployed with documentation checkpoint
`ffe316d`, including source components, CSS image references, `index.html`, the
complete public/build visual-asset inventory and the actual live Context and
Certificate views at https://alexia-dragomir.github.io/Inversis/.

| Surface | Finding |
|---|---|
| Navigation | Original Inversis PNG through `Brand.tsx`; whitespace-only viewport clipping |
| Context composition | Corner crop of the original Inversis banner; no NASA imagery |
| Certificate screen | Same original Inversis logo; no NASA seal, mission insignia or endorsement styling |
| Exported certificate | JSON data, textual sources/product identifiers and limitations; no embedded image assets |
| Favicon/app icons | No icon link in source or live document; no favicon, app-icon or webmanifest file bundled |
| Charts and location schematic | Application-native analytical graphics, not mission emblems, flags or NASA branding |
| Other public raster/vector assets | Only the two supplied PNG originals and Vite's identical banner build copy |

The live document referenced `./brand/inversis-logo-original.png` for both header
and certificate, and `assets/inversis-banner-original-CjSWICgu.png` for the Context
motif. The two original assets, dimensions and SHA-256 are documented in
`public/brand/README.md`. No prohibited visual element was found; no application
or scientific change was required. Existing factual NASA dataset attribution and
source metadata remain intact.

Two outdated documentation statements about absent branding were corrected in
README.md and THIRD_PARTY_NOTICES.md. The verified scientific pipeline, certificate
canonicalization, source archives and completed redesign were preserved.

## Final product refinement audit — 2026-11-14

This supersedes the earlier visual inventory. Both original PNGs remain
byte-identical. Added images are only a deterministic transparent Inversis logo
and a favicon derived from its original symbol. No generative redrawing, NASA
emblem, flag, mission insignia or NASA-specific visual styling was added.

Reviewed the header, Context banner, analytical charts, certificate, two-page
headless A4 output and complete public visual inventory. The print record
identifies itself as an Inversis decision record and disclaims NASA endorsement.
Required textual data attribution, product identifiers, source archives, receipts,
manifests and canonical JSON remain intact. See the brand README for hashes.

The resume phase used terminal and isolated headless processes only: no Computer
Use, desktop screenshots or interactive print dialog. Temporary QA artifacts stay
under ignored `.local`. Release-file credential-pattern and unrelated-file checks
found nothing to exclude. No Earthdata token was opened, moved or included.
