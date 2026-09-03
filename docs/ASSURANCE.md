# Public assurance registry

The `assurance/` directory is the canonical public, disclosure-safe data layer for assurance claims, compliance mappings, risks, incidents, exercises, published security advisories, and their evidence. It is not the complete private operational or forensic record and does not claim certification or formal conformance.

`assurance/registry.json` indexes controlled datasets and their JSON Schema contracts. Counts, reverse `usedBy` relationships, resolved source URLs, and freshness presentation are derived in code; they are not duplicated in canonical JSON.

`/evidence` is the canonical human-searchable evidence route. `/compliance` is the canonical human-readable compliance registry projection. `GET /v1/assurance` exposes the full disclosure-safe public registry projection, `GET /v1/assurance/evidence` exposes the evidence-only projection, and `GET /v1/assurance/compliance` exposes the normalized compliance projection. Focused APIs remain available at `/v1/assurance/risks`, `/v1/assurance/incidents`, and `/v1/assurance/advisories`.

## Compliance projection

The public compliance view is derived from the three canonical datasets introduced by DEMO-117 through DEMO-119:

- `assurance/compliance/iso-27001-2022.json`
- `assurance/compliance/iso-42001-2023.json`
- `assurance/compliance/wcag-2.2.json` and its four principle partitions

The source JSON remains framework-specific. `src/assurance/registry.ts` normalizes those records only for public presentation and API filtering. ISO clauses and Annex A controls use their approved public mapping status. WCAG criteria retain their engineering-evidence status and A/AA/AAA level. The status vocabularies are not converted into pass/fail or certification claims.

Public record IDs are stable lookup and anchor keys:

- `ISO27001-<reference>` for ISO/IEC 27001 clauses and Annex A controls
- `ISO42001-<reference>` for ISO/IEC 42001 clauses and Annex A controls
- `WCAG-<criterionId>` for WCAG 2.2 success criteria

`GET /v1/assurance/compliance` accepts `framework`, `status`, and `level` query parameters. `level` applies only to WCAG records. `GET /v1/assurance/compliance/{recordId}` returns one exact normalized record or `404` when the stable ID is unknown. Counts in both the API and `/compliance` page are derived from the selected records; canonical JSON does not store totals or generated URLs.

## Evidence rules

- Evidence IDs are stable `EVD-<KIND>-###` identifiers.
- Claim IDs are stable `CLM-<AREA>-###` identifiers.
- Compliance record IDs are stable `ISO27001-*`, `ISO42001-*`, and `WCAG-*` identifiers.
- Repository evidence records paths, not branch-dependent GitHub URLs.
- Repository evidence URLs are resolved only against the exact `DEPLOYED_SHA`; a moving branch is never substituted when deployment identity is unavailable.
- Source/test evidence is release-bound, governance evidence is event-driven, and live observations are observation-bound.
- A recorded time-bound observation uses `observedAt` plus `validUntil`; CI rejects it after `validUntil` or when the interval is malformed. Live-route evidence remains observation-bound without becoming a stored snapshot.
- Reverse `usedBy` relationships are derived from all public assurance records that reference evidence, including claims, compliance records, risks, incidents, exercises, and published advisories.
- Counts are derived from canonical datasets at presentation time.
- No secret, reporter identity, private infrastructure detail, unreviewed request content, or unreleased vulnerability detail belongs in this registry.

## Published advisory rules

- `assurance/advisories/advisories.json` contains only published, sanitized GitHub Security Advisories. Private vulnerability reports, triage notes, draft advisory content, reporter identity, exploit detail, and private remediation discussion never enter this dataset.
- A public advisory record uses its real published GHSA identifier. No placeholder or demonstration advisory is created to populate the registry.
- A fixed release is required before an advisory can enter the public projection, and validation requires a corresponding controlled release record under `docs/releases/`.
- A CVE identifier is optional and is recorded only after a real CVE has been assigned. The absence of a CVE does not prevent a legitimate GHSA from being represented.
- `INC-*` linkage is optional. An advisory may reference only an actual incident already established in the retained incident register; publishing an advisory never creates or implies an incident record.
- An empty published-advisory dataset is not a claim that no vulnerabilities, reports, defects, or security investigations have existed.

## CI integrity gates

`npm run validate:assurance` includes a cross-dataset integrity pass after the framework-specific validators. It fails closed on globally duplicated public IDs, unsupported status vocabularies, missing ISO N/A rationales, unresolved evidence/risk/incident/advisory links, stale time-bound observation evidence, missing assurance routes, stored derived counts, and public fields reserved for private or sensitive detail.

`npm run test:assurance-integrity` runs mutation-based negative tests against isolated repository copies so each important failure mode is proven to return a non-zero validator result. The targeted suite also compares the compliance, risk, and incident/exercise APIs against their HTML projections, including filter-specific record identity and derived counts, with negative assertions that deliberately introduce row and count drift.

Run `npm run validate:assurance` to enforce paths, identifiers, visibility, schemas, duplicates, referential integrity, freshness, public disclosure boundaries, route coverage, and the separation between canonical assurance data and derived presentation fields.
