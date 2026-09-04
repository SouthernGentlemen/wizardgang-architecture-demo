# Public assurance registry

The `assurance/` directory is the canonical disclosure-safe data layer for assurance claims, compliance mappings, objectives, risks, incidents, exercises, evidence, and published security advisories. It is not the complete private operational or forensic record and does not claim certification or formal conformance.

`assurance/registry.json` is the authoritative inventory for controlled assurance resources. It declares each dataset's schema, record collection, routes, capabilities, query fields, reporting source, visibility, and lifecycle participation. Runtime code, validation, API discovery, and repository interchange derive their inventory from this registry rather than maintaining family lists.

## Canonical query and HTTP boundary

`src/assurance/model.ts` binds registry-declared runtime resources into one record map. `src/assurance/service.ts` owns registry/schema-driven listing, lookup, filtering, counts, stable anchors, URL resolution, source metadata, and forward/reverse relationship traversal. `src/assurance/publication.ts` applies lifecycle and disclosure publication rules. Presentation-only evidence freshness, deployment links, and other rendered state remain derived.

The current `/v1/assurance` HTTP contract uses canonical records directly through one common collection/detail envelope. Records retain normalized `relationships`; HTTP-only aliases such as `frameworkReferences`, flattened `evidence`, `controls`, `riskLinks`, `controlLinks`, `objectiveLinks`, and `incidentLinks` are not supported. Family-specific top-level arrays are not supported. `src/api/assurance-contract.ts` owns request validation, pagination, errors, caching, ETags, and CORS without legacy representation negotiation.

`GET /v1/assurance` is registry/API discovery. Focused public queries are available at `/v1/assurance/evidence`, `/v1/assurance/compliance`, `/v1/assurance/risks`, `/v1/assurance/incidents`, and `/v1/assurance/advisories`. Exact compliance lookup remains at `/v1/assurance/compliance/{recordId}` and returns the same common envelope with one record.

See `docs/ASSURANCE-API.md` for the current response/query contract and `docs/REPORTING.md` for reporting-source and repository interchange rules.

## Record lifecycle and disclosure review

`assurance/lifecycle/records.json` is the lifecycle control plane for stable assurance record IDs. Historical release fixtures remain immutable evidence, while current runtime behavior uses the normalized lifecycle contract. Lifecycle values are `Draft`, `Approved`, `Published`, `Superseded`, and `Withdrawn`.

Stable IDs are never recycled. Supersession and withdrawal require explicit lifecycle metadata. Source approval is revision-bound: changing a canonical structured source changes its Git blob identity, and publication validation requires the exact reviewed source revision before that content can be published.

Lifecycle state never weakens the disclosure boundary. Sensitive credentials, private treatment detail, reporter identity, exploit detail, unreleased vulnerability detail, or other prohibited public fields are rejected independently of lifecycle status.

## Relationships, risk ratings, and other derivations

Canonical relationship-bearing records store one normalized `relationships` object. Runtime queries, HTML, HTTP, reporting exports, and relationship validation all use that contract. Reverse relationships are derived rather than copied into source JSON.

Canonical risks store scores rather than duplicated rating labels. The shared risk method derives `inherent.rating` and `residual.rating` for runtime consumers. Counts, facets, publication summaries, evidence `usedBy`, freshness state, generated URLs, and stable anchors are also derived and are never independently editable source facts.

## Compliance projection

Compliance is registry-driven across ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 resources/partitions. Source JSON remains framework-specific while runtime records are normalized by shared model/service code. Framework/status/level filter vocabularies come from registry metadata, registered schemas, or shared derivations rather than hardcoded handler inventories.

Public record IDs remain stable lookup and anchor keys:

- `ISO27001-<reference>` for ISO/IEC 27001 records
- `ISO42001-<reference>` for ISO/IEC 42001 records
- `WCAG-<criterionId>` for WCAG 2.2 success criteria

The generated ISO Statements of Applicability under `docs/governance/soa/` are deterministic summaries of canonical structured data and are not independent control-state stores.

## Evidence and publication rules

Repository evidence records source paths and other canonical locators, not branch-dependent presentation URLs. Deployment-specific URLs and freshness are resolved at presentation time. Time-bound observations retain their observation windows and are validated for expiry. Live/native telemetry is not rewritten into the structured assurance source through interchange.

Published advisories contain only sanitized public advisory data. Private vulnerability reports, triage notes, reporter identity, exploit detail, and draft remediation discussion never enter the public canonical advisory dataset.

## Reporting interchange

`contracts/assurance/reporting.schema.json` is the one current reporting contract. `npm run assurance:interchange -- export` produces a deterministic authorized repository export of registered structured-record sources with registry/schema references, source identity/capabilities, record identities, relationships, provenance scope, and commit/blob revisions.

`npm run assurance:interchange -- import --input <file> --dry-run` validates without writing. A non-dry-run import can write only to the registered canonical structured source for a resource. It rejects unsupported/native telemetry writes, legacy envelopes, derived/rendered source edits, duplicate IDs, invalid relationships, and changed writes against stale source revisions. Re-importing the same desired state is idempotent.

Incoming records merge into the authoritative current record so intentionally omitted fields are preserved. This makes subset/public exports safe to re-import without erasing omitted private or non-exported source fields. No dashboard, API response, or generated summary becomes a second editable copy.

## CI integrity gates

`npm run validate:assurance` and the broader `npm run check` suite validate registry completeness, schemas, lifecycle/disclosure review, source-revision approval, immutable identity, global duplicates, referential integrity, risk derivation, filter contracts, publication, generated summaries, monitoring ownership, and public disclosure boundaries.

The current API/interchange tests assert one canonical relationship/query contract rather than legacy aliases. Interchange tests cover deterministic round trips, dry-run validation, idempotent re-import, duplicate prevention, revision conflicts, relationship failures, derived-field rejection, unsupported telemetry writes, and subset merge semantics.
