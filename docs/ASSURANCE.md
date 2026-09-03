# Public assurance registry

The `assurance/` directory is the canonical public, disclosure-safe data layer for assurance claims, risks, incidents, exercises, and their evidence. It is not the complete private operational or forensic record and does not claim certification.

`assurance/registry.json` indexes controlled datasets and their JSON Schema contracts. Counts, reverse `usedBy` relationships, resolved source URLs, and freshness presentation are derived in code; they are not duplicated in canonical JSON.

`/evidence` is the canonical human-searchable evidence route. `GET /v1/assurance` exposes the full disclosure-safe public registry projection and `GET /v1/assurance/evidence` exposes the evidence-only projection. Existing focused risk and incident APIs remain available at `/v1/assurance/risks` and `/v1/assurance/incidents`.

## Evidence rules

- Evidence IDs are stable `EVD-<KIND>-###` identifiers.
- Claim IDs are stable `CLM-<AREA>-###` identifiers.
- Repository evidence records paths, not branch-dependent GitHub URLs.
- Repository evidence URLs are resolved only against the exact `DEPLOYED_SHA`; a moving branch is never substituted when deployment identity is unavailable.
- Source/test evidence is release-bound, governance evidence is event-driven, and live observations are observation-bound.
- Reverse `usedBy` relationships are derived from all public assurance records that reference evidence, including claims, risks, incidents, and exercises.
- Counts are derived from canonical datasets at presentation time.
- No secret, reporter identity, private infrastructure detail, unreviewed request content, or unreleased vulnerability detail belongs in this registry.

Run `npm run validate:assurance` to enforce paths, identifiers, visibility, schemas, duplicates, referential integrity, and the separation between canonical assurance data and derived presentation fields.
