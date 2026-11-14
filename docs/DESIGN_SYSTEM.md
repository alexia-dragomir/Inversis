# Inversis presentation system

The final refinement layers `src/precision.css` after the existing styles. It
changes presentation and shared-state interactions, not scientific computation.

| Role | Token / treatment |
|---|---|
| Page canvas / analytical surface | Warm ivory `#F8F8F3` / white `#FFFFFF` |
| Primary / secondary text | Deep teal `#073E40` / `#405753` |
| Disclosure surface / boundary | `#EDF2E9` / `#B4C6BC` |
| Baseline / Alternative A / Alternative B | `#076B6D` / `#536326` / `#655176` |
| Heat / dry-spell indicators | `#98521D` / `#225B7B` |
| Focus | 3 px teal outline, 4 px offset |
| Controls | Explicit labels, bordered surfaces, selected text and pressed state |
| Numerical readouts | Tabular numbers; exact values in retained disclosures |
| Status | Conditional, sole candidate, missing evidence and no-eligible states use words |

Measured sRGB contrast: ink on white 11.85:1; secondary on ivory 7.28:1 and
on sage 6.83:1; candidate colors on white 6.30, 6.60 and 7.02:1; heat/dry on
white 5.90 and 7.37:1. Control outline on white is 3.63:1. These selected token
checks are not a claim of a complete WCAG conformance audit. Pale structural
dividers do not carry state or essential information alone.

The system retains system fonts, modest heading sizes and tight metadata. White
analytical panels contrast with the page canvas; dark teal is reserved for the
principal result. Desktop grids reduce at 1000 px and stack at 700 px. Main
spacing is 18–32 px, with smaller mobile padding and no page-level horizontal
scroll. Exact tables can scroll within their own labeled containers.

Candidate names accompany color everywhere. Indicators use a separate palette.
Chart columns and the keyboard range control select the same existing preference
state; connecting curves show sampled values only. Margin brackets read engine
scores, and diagnostic bars explicitly disclose local scales. No probabilities,
continuous decision boundaries or intermediate animated scores are introduced.

Next Evidence is explicitly a preview until applied. Applying a declared answer
updates the existing analysis options, recomputes through the existing engine and
updates the certificate. The reset control restores the established defaults.

The certificate uses original Inversis branding, a document hierarchy, a copyable
full fingerprint and the unchanged canonical JSON download. A4 portrait printing
uses 12 mm margins, suppresses controls, keeps the fingerprint together and begins
the complete limitations on a new page. No PDF-generation dependency ships in the
application. Browser-generated PDFs are QA artifacts only.

See `public/brand/README.md` for original-asset hashes and deterministic derivative
reproduction. NASA is acknowledged through factual source text and provenance,
never through insignia, logos, flags or imitated branding.
