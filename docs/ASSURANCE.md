# Public assurance registry

The `assurance/` directory is the canonical public, disclosure-safe data layer for assurance claims and their evidence. It is not the complete private operational or forensic record and does not claim certification.

`assurance/registry.json` indexes controlled datasets and their JSON Schema contracts. Counts and reverse relationships are derived by `src/assurance/registry.ts`; they are not duplicated in source JSON.

The initial registry deliberately contains only the claims already presented by the governance implementation. Later controlled changes will add public risk, incident, exercise, advisory, and exhaustive compliance datasets without replacing the approved narrative governance records.

## Evidence rules

- Evidence IDs are stable `EVD-<KIND>-###` identifiers.
- Claim IDs are stable `CLM-<AREA>-###` identifiers.
- Repository evidence records paths, not branch-dependent GitHub URLs.
- Public URLs are resolved against the exact deployed commit when presented.
- Source/test evidence is release-bound, governance evidence is event-driven, and live observations are observation-bound.
- Validation derives reverse `usedBy` relationships from claim references.
- No secret, reporter identity, private infrastructure detail, unreviewed request content, or unreleased vulnerability detail belongs in this registry.

Run `npm run validate:assurance` to enforce paths, identifiers, visibility, schemas, duplicates, and referential integrity.
