# Deployment and submission preparation

## Actual readiness

The static application builds locally and has no backend, API key or NASA-login
dependency at runtime. `vercel.json` builds only after the complete `npm run check`
pipeline passes and publishes `dist`. It adds standard response headers. No public
deployment is claimed: there is no linked Vercel project or verified public demo URL.

Create a **new Inversis-only** Vercel project connected only to
`alexia-dragomir/Inversis`, using the verified checkpoint branch `stage-1/evidence`.
Do not attach this workspace to another project's hosting configuration. No environment
variables are required. Never upload `.local`, credentials or temporary signed URLs.
The four hash routes need no history fallback rewrite. After deployment, check all
four routes, NASA source links, missing-rainfall refusal and downloaded certificate.
Run `npm run certificate:verify -- EXPORT.json` against the download.

The user-supplied deadline is November 15, 2026, 23:59 Europe/Bucharest. A public
demo link and final submission form are still outstanding. Check the live form and
terms at submission; no form has been submitted by this agent. See SUBMISSION_RULES.md
for the earlier official-guide review. Do not claim that source publication equals
submission or public application deployment.

## Submission text draft — current verified scope

**Name:** Inversis

**Tagline:** Know what would change the decision.

**Summary:** Inversis turns historical NASA environmental evidence into an auditable
comparison of ordered five-year crop plans. It shows which assumptions and farmer
constraints change a conditional decision, preserves ties and missing-evidence
refusals, and exports the evidence and computation behind each result.

**What works:** The interactive Context → Decision → Stability → Certificate workflow
uses 3,653 real NASA POWER daily maximum temperatures from 2015–2024 at a Bărăgan
demonstration location. Six common five-year historical replays support a clearly
labeled heat-only model. Crop-window and cyclic-phase diagnostics, hypothetical crop
exclusions and fully recomputed Next Evidence branches make the assumptions visible.
The certificate includes source hashes, physical exposures, normalization, matrices,
limitations and a reproducible integrity fingerprint.

**NASA data:** POWER T2M_MAX/MERRA2, UTC daily maxima in °C; GPM IMERG Final daily
V07B precipitation, native cell in mm/day. Seven actual IMERG days were retrieved
through NASA OPeNDAP DAP4 and independently parsed with two readers. Historical
rainfall coverage is incomplete; the combined model explicitly refuses comparison.
SMAP is not used. Source URLs, citations and metadata are in DATA_SOURCES.md and
the retained evidence manifests.

**Scientific scope:** These are conditional historical environmental-exposure
comparisons. They do not predict yield, disease, soil health, future climate or
field suitability. The 35°C threshold and crop windows are illustrative assumptions.
Farmer constraints are hypothetical until supplied. All plans remain conditional.

**AI disclosure:** OpenAI Codex assisted code, tests, documentation and the two
independent arithmetic/reader implementations. NASA observations were retrieved,
not generated. The deployed app contains no runtime AI. Human scientific and
agronomic review remains necessary; see AI_USE.md.

**Demonstration sequence:** Context: show actual coverage and seven precipitation
values. Decision: show normalized heat exposure and trace one crop-year back to NASA.
Stability: demonstrate soybean exclusion (eligibility-only), sunflower exclusion
(no eligible plan), and calendar shifts. Select heat+rainfall to show an honest
evidence refusal. Certificate: export and verify the hash. Describe the incomplete
rainfall history explicitly; do not present a synthetic reversal or confidence claim.

**Links still required:** verified public application URL; final project/submission
page; public demonstration asset in the format accepted by the live form.
