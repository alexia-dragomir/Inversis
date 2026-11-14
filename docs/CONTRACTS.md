# Shared scientific contracts

Authority: the supplied Master Handoff v6, START HERE and Addendum I, then H, then G,
then reconciled older sections. Addendum J updates preflight status only. The user's
current Stage 0 request bounds implementation; later-stage behavior is planned.

`src/domain/contracts.ts` is the single shared schema. It has no React imports and
uses readonly records, discriminated unions, explicit units and no `any`.

| Boundary | Contract |
| --- | --- |
| Evidence | Provenance includes collection/science versions, exact variable, observed/model/assimilation origin, granule/query, extraction footprint, UTC alignment, raw units/fills, transformations and SHA-256. Observation retains the raw value and a quality union. Missing/invalid/unverified values cannot carry a usable quantity. |
| Exposure | Crop, candidate, assigned year, actual window dates, shift, physical quantity, coverage, contributing observations and normalization reference remain traceable. |
| Context | Site, requested/validated period, crops/windows, indicator specifications, QC/reference/scenario policies, assumptions, preferences, facts and rule version are explicit. |
| Agronomy | Unknown is distinct from supplied. Farmer constraints have attribution; literature rules carry sources, applicability and advisory/hard severity. Ledger separates environmental evidence, cautions, constraints and unknowns. SCREENED is not confirmed suitability. |
| Decision | Precedence: no eligible candidates → insufficient evidence → tie → unique preference. Provisional and constraint-dependent are separate flags. Refusals have reasons, an empty preferred set and no computed matrices. Ties require at least two IDs. Single-candidate results require the only-eligible scope. Invalid configuration is refused before evaluation. |
| Comparison | Full-precision loss/regret matrices, worst regrets, declared tolerance, reference bounds and fingerprint. Average-loss benchmark consumes the same matrix and eligible set. |
| Sensitivity | Axis, sampled configurations/results, metric, resolution and untested-domain notice; cyclic phase remains separate from primary fixed-start replay. |
| Next Evidence | Finite answer branches with hypothetical/farmer/source provenance, baseline and branch fingerprints, full reevaluations, sources and limitations. I.2 consequence labels supersede earlier classifications. Eligibility, preferred-set, status and margin changes are preserved separately. |
| Certificate | Context, sources, scenarios, results/refusal, counterfactuals, sensitivities, model/data/canonicalization versions and limitations. Generation timestamp is presentation metadata outside the analysis fingerprint. |

Types cannot prove finite numbers, valid UTC intervals, genuine source identity, hash
integrity, unit compatibility, equal matrix domains or complete field evidence.
Runtime validation is a Stage 1+ requirement. No schema here certifies empirical data.
Nonempty tuples enforce cardinality, not uniqueness; validators must enforce unique IDs.
The minimum common scenario count, tie tolerance, near-constant policy and reference
protocol must be justified and declared before calculation; no fabricated defaults
are installed in Stage 0.

Future computation order: validate → filter eligibility → establish common complete
scenarios → apply candidate-independent normalization → calculate losses/minima/regret
→ preserve the preferred set → compare finite counterfactual branches → certificate.
Every dependency change must invalidate derived results. Weight-only sensitivity
cannot change agronomic eligibility. UI consumers must never independently rank crops.
