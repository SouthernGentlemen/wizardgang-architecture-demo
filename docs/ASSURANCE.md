# Public assurance registry

The `assurance/` directory is the canonical public, disclosure-safe data layer for assurance claims, risks, incidents, exercises, published security advisories, and their evidence. It is not the complete private operational or forensic record and does not claim certification.

`assurance/registry.json` indexes controlled datasets and their JSON Schema contracts. Counts, reverse `usedBy` relationships, resolved source URLs, and freshness presentation are derived in code; they are not duplicated in canonical JSON.

`/evidence` is the canonical human-searchable evidence route. `GET /v1/assurance` exposes the full disclosure-safe public registry projection and `GET /v1/assurance/evidence` exposes the evidence-only projection. Focused APIs remain available at `/v1/assurance/risks`, `/v1/assurance/incidents`, and `/v1/assurance/advisories`.

## Evidence rules

- Evidence IDs are stable `EVD-<KIND>-###` identifiers.
- Claim IDs are stable `CLM-<AREA>-###` identifiers.
- Repository evidence records paths, not branch-dependent GitHub URLs.
- Repository evidence URLs are resolved only against the exact `DEPLOYED_SHA`; a moving branch is never substituted when deployment identity is unavailable.
- Source/test evidence is release-bound, governance evidence is event-driven, and live observations are observation-bound.
- Reverse `usedBy` relationships are derived from all public assurance records that reference evidence, including claims, risks, incidents, exercises, and published advisories.
- Counts are derived from canonical datasets at presentation time.
- No secret, reporter identity, private infrastructure detail, unreviewed request content, or unreleased vulnerability detail belongs in this registry.

## Published advisory rules

- `assurance/advisories/advisories.json` contains only published, sanitized GitHub Security Advisories. Private vulnerability reports, triage notes, draft advisory content, reporter identity, exploit detail, and private remediation discussion never enter this dataset.
- A public advisory record uses its real published GHSA identifier. No placeholder or demonstration advisory is created to populate the registry.
- A fixed release is required before an advisory can enter the public projection, and validation requires a corresponding controlled release record under `docs/releases/`.
- A CVE identifier is optional and is recorded only after a real CVE has been assigned. The absence of a CVE does not prevent a legitimate GHSA from being represented.
- `INC-*` linkage is optional. An advisory may reference only an actual incident already established in the retained incident register; publishing an advisory never creates or implies an incident record.
- An empty published-advisory dataset is not a claim that no vulnerabilities, reports, defects, or security investigations have existed.

Run `npm run validate:assurance` to enforce paths, identifiers, visibility, schemas, duplicates, referential integrity, published-advisory disclosure boundaries, and the separation between canonical assurance data and derived presentation fields.
