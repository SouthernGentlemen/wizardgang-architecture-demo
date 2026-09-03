# Public assurance registry

The `assurance/` directory is the canonical public, disclosure-safe data layer for assurance claims, compliance mappings, risks, incidents, exercises, published security advisories, and their evidence. It is not the complete private operational or forensic record and does not claim certification or formal conformance.

`assurance/registry.json` is the authoritative inventory for controlled assurance resources. It declares each dataset's schema and public presentation/API routes, and it declares queryable record paths where filtering is supported. Allowed filter values remain owned by the registered dataset schemas rather than being copied into API or HTML code. Counts, exact lookup, stable anchors, forward/reverse relationships, resolved record URLs, evidence `usedBy`, and freshness/deployment presentation are derived from the canonical records; they are not duplicated in canonical JSON.

`/evidence` is the canonical human-searchable evidence route. `/compliance` is the canonical human-readable compliance registry projection. `GET /v1/assurance` exposes the released disclosure-safe public registry projection, `GET /v1/assurance/evidence` exposes the evidence-only projection, and `GET /v1/assurance/compliance` exposes the normalized compliance projection. Focused APIs remain available at `/v1/assurance/risks`, `/v1/assurance/incidents`, and `/v1/assurance/advisories`.

## Canonical query, presentation, and HTTP boundaries

`src/assurance/model.ts` binds registry-declared runtime resources into one canonical record map. Relationship-bearing records keep the normalized `relationships` object all the way through `src/assurance/service.ts`, `src/assurance/publication.ts`, and the HTML routes. `src/assurance/service.ts` owns registry/schema-driven listing, canonical-ID lookup, filtering, derived facet counts, stable anchors, URL resolution, and forward/reverse relationship traversal. `src/assurance/presentation.ts` is a real presentation module: it resolves evidence against the deployed commit, derives evidence usage/freshness, and resolves governance-document references for human or boundary presentation.

The released `/v1/assurance` body shape is intentionally separate from that internal contract. `src/api/assurance-v1.ts` is the only compatibility serializer for released version-1 record aliases such as `frameworkReferences`, `controls`, `riskLinks`, `controlLinks`, `objectiveLinks`, `incidentLinks`, and flattened `evidence`. API handlers select, publish, count, and paginate canonical records first, then serialize the selected records at the HTTP boundary. `src/api/assurance-contract.ts` owns version negotiation, pagination, errors, caching, ETags, and CORS. HTML consumers never deserialize or depend on the version-1 HTTP shapes.

This separation does not authorize an API break. `docs/ASSURANCE-API.md` remains the released compatibility contract: stable routes, IDs, version-1 fields, deterministic collection ordering, filters, pagination behavior, lifecycle presentation, and historical lifecycle decoding remain supported. A new internal shape is not a reason to introduce a new public API version.

The service intentionally does not erase domain meaning. Incident versus exercise classification and completion grouping remain incident-domain behavior; private vulnerability reporting and public advisory disclosure remain security-domain behavior; governance-document source resolution remains presentation-specific. Obsolete compatibility barrels and resource-specific internal adapters are not part of the supported internal contract.

## Record lifecycle and disclosure review

`assurance/lifecycle/records.json` is the lifecycle control plane for every stable assurance record ID. The released `v0.14.0` registry at commit `c2359f00fc3bac80bfbc2e82369a86f20e522f74` is the immutable reviewed baseline. Those existing records inherit `Published` lifecycle state and the baseline disclosure review. Any record ID introduced after that baseline requires its own explicit lifecycle and disclosure-review metadata.

Lifecycle values are `Draft`, `Approved`, `Published`, `Superseded`, and `Withdrawn`. Lifecycle state does not weaken the public disclosure boundary: because the canonical assurance package is public, every current or retained record must already have `Reviewed` disclosure metadata before it can be committed here. Draft and approval state describe record governance, not permission to place sensitive material in the repository.

Stable IDs are never recycled. Approved and published record identity anchors are immutable; if the represented record changes identity, create a new ID and use `supersedes` / `supersededBy`. A `Superseded` record requires at least one reciprocal `supersededBy` relationship. A `Withdrawn` record requires a meaningful `withdrawalRationale`. Removing a previously known record requires a retained `Superseded` or `Withdrawn` tombstone in `retiredRecords`; deleting both the record and its reservation is rejected by lifecycle validation.

The lifecycle validator compares current records with the pinned release baseline and the previous repository snapshot. This prevents silent deletion, detects reuse of locked IDs for a different record identity, preserves retired ID reservations, requires explicit metadata for newly introduced IDs, and verifies reciprocal supersession links. Sensitive public fields such as credentials, private treatment detail, triage notes, exploit detail, reporter identity, or unreleased vulnerability detail are rejected independently of lifecycle state.

## Compliance projection

The public compliance view is derived from the registry-declared ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 resources and partitions. Presentation code does not import those framework files directly. Framework metadata comes from canonical registry metadata, query fields come from `assurance/registry.json`, and allowed framework/status/level values are derived from the registered JSON Schemas.

The source JSON remains framework-specific. `src/assurance/model.ts` enriches those records with registry-owned framework, section, and source metadata while preserving canonical relationship fields. ISO clauses and Annex A controls use their approved public mapping status. WCAG criteria retain their engineering-evidence status and A/AA/AAA level. The status vocabularies are not converted into pass/fail or certification claims.

Public record IDs are stable lookup and anchor keys:

- `ISO27001-<reference>` for ISO/IEC 27001 clauses and Annex A controls
- `ISO42001-<reference>` for ISO/IEC 42001 clauses and Annex A controls
- `WCAG-<criterionId>` for WCAG 2.2 success criteria

`GET /v1/assurance/compliance` accepts `framework`, `status`, and `level` query parameters. `level` applies only to WCAG records. `GET /v1/assurance/compliance/{recordId}` returns one exact normalized version-1 record or `404` when the stable ID is unknown. The API and `/compliance` page use the same canonical selection and count primitives, but only the API applies the version-1 compatibility serializer. Canonical JSON does not store totals, generated anchors, generated URLs, or HTTP compatibility aliases.

### SoA source of truth

The ISO/IEC 27001 and ISO/IEC 42001 structured compliance files are the sole canonical source for per-control applicability, status, N/A rationale, title, and evidence links. The corresponding `docs/governance/soa/ISO-27001-SOA.md` and `docs/governance/soa/ISO-42001-SOA.md` files are deterministic summaries generated from that structured state; they do not maintain independent control tables.

Run `npm run generate:assurance-summaries` after an approved structured compliance change. `npm run validate:assurance-summaries` regenerates the expected bytes in memory and fails when a checked-in summary is stale or was edited independently. This makes status/count/rationale drift a CI failure rather than a documentation reconciliation task.

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

## Release snapshots and recurring monitoring

Each annotated semantic-version release generates an assurance registry snapshot before the GitHub release is published. The snapshot is attached to the release and retained as a workflow artifact. It records the exact tag, the 40-character commit resolved from that tag, the UTC generation time, per-file and total assurance-record counts, and a SHA-256 digest over the sorted exact bytes of the release's `assurance/**/*.json` corpus. Snapshot outputs are excluded from their own digest scope.

`assurance/operations/monitoring.json` assigns accountable owners for the registry, lifecycle control plane, each indexed dataset kind, and security reporting. Missing assignments fail assurance validation.

`.github/workflows/assurance-monitor.yml` runs daily and can also be dispatched manually. It re-runs assurance validation so time-bound evidence becomes a failure when it expires, validates that `security.txt` has not expired, checks the configured security policy and machine-readable reporting routes, follows the advertised reporting links, and verifies through GitHub's public repository metadata API that private vulnerability reporting remains enabled. The workflow is contents-read-only and does not request access to advisory contents.

## Published advisory rules

- `assurance/advisories/advisories.json` contains only published, sanitized GitHub Security Advisories. Private vulnerability reports, triage notes, draft advisory content, reporter identity, exploit detail, and private remediation discussion never enter this dataset.
- A public advisory record uses its real published GHSA identifier. No placeholder or demonstration advisory is created to populate the registry.
- A fixed release is required before an advisory can enter the public projection, and validation requires a corresponding controlled release record under `docs/releases/`.
- A CVE identifier is optional and is recorded only after a real CVE has been assigned. The absence of a CVE does not prevent a legitimate GHSA from being represented.
- `INC-*` linkage is optional. An advisory may reference only an actual incident already established in the retained incident register; publishing an advisory never creates or implies an incident record.
- An empty published-advisory dataset is not a claim that no vulnerabilities, reports, defects, or security investigations have existed.

## CI integrity gates

`npm run validate:assurance` includes lifecycle validation plus the cross-dataset integrity pass after the framework-specific validators. It fails closed on unreviewed public records, unsupported lifecycle states, silent record deletion, immutable ID reuse, invalid supersession/withdrawal metadata, sensitive disclosure fields, globally duplicated public IDs, unsupported status vocabularies, missing ISO N/A rationales, unresolved evidence/risk/incident/advisory links, stale time-bound observation evidence, missing assurance routes, stored derived counts, public fields reserved for private or sensitive detail, stale generated SoA summaries, expired security-reporting metadata, and missing accountable owners.

`npm run test:assurance-integrity` runs mutation-based negative tests against isolated repository copies so each important failure mode is proven to return a non-zero validator result. Lifecycle tests explicitly prove rejection of unsupported states, unreviewed records, missing supersession/withdrawal requirements, silent deletion, immutable ID reuse, and sensitive public fields. The targeted suite also verifies that HTML projections consume canonical relationship fields while representative version-1 responses retain their released compatibility aliases, record ordering, lifecycle metadata, and pagination behavior. The normal unit suite additionally proves generated-summary drift rejection, owner/expiry gates, deterministic release snapshot metadata/digests, registry/schema-driven filters, resolver-backed links, and reverse evidence completeness.

Run `npm run validate:assurance` to enforce paths, identifiers, visibility, schemas, lifecycle, disclosure review, immutable identity, retention, duplicates, referential integrity, freshness, public disclosure boundaries, route coverage, generated SoA consistency, operational ownership, reporting metadata, and the separation between canonical assurance data and derived presentation fields.
