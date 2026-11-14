# Limitations and specification reconciliation

Stage 1 validates seven POWER days and one IMERG day, including NetCDF extraction
and an independent authenticated repeat. Historical coverage is not established.
There is no exposure/normalization engine, ranking, agronomic rules, sensitivity
grid, counterfactual execution or certificate generation. Contract completeness and
source-format validation are not independent scientific validation. No field
recommendation is supported. Full historical coverage remains unvalidated.

Resolved specification conflicts:

- Current request says the repository already exists and authorizes implementation;
  older instructions to create another repository or wait for the event are superseded.
- Addenda G–I and v4 reject old hardcoded winners, regret values, scenario counts and
  reversal stories. None are shipped as observations or acceptance targets.
- Fixed-start is primary; old repeating-cycle primary analysis is superseded.
- 2015–2024 is provisional, with scenario count derived from complete coverage.
  Older hardcoded 2015–2025/seven-window instructions are superseded.
- Missing precipitation/heat invalidates a crop-window metric; old gap-breaking
  instructions would bias dry runs and must not be implemented.
- V008 is the preferred SMAP acquisition target; actual collection and variables
  still need verification. Earlier V007 and POWER access assumptions are nonbinding.
- Addendum I consequence classification takes precedence over earlier Next Evidence
  taxonomies; changes in eligibility alone are not preference reversals.
- Current user scope defers Vercel setup if unavailable. Historical Stage 0 preview
  deployment gate is therefore reported separately from local acceptance.
- Addendum J updates guide/preflight status; it does not revise G–I science contracts.

Open scientific decisions before later computation: minimum valid common scenario
coverage, numerical tie tolerance, near-constant normalization policy, reference
population under window shifts, subdaily SMAP aggregation/QC, exact variable/unit
semantics and source applicability for agronomic exclusions. Record chosen policies
before inspecting winners; do not tune them to obtain a dramatic reversal.

Raw dry-run length may reflect differing crop-window lengths. Normalized exposure
does not establish equal crop vulnerability. Crop-year weather allocation can drive
sequence comparisons without proving causal rotation benefit. Overlapping windows
are dependent; gridded values do not measure a field. Unknown pH, salinity, drainage,
history and management must not become favorable defaults. A/B composition is equal.

The approved original logo is absent. A text wordmark and local system-font fallback
are used without inventing a replacement logo. No generated imagery is present.
