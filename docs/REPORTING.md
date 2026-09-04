# Authoritative Reporting Contracts

## Purpose

Reporting is a projection layer, not a second system of record. Every reportable fact has one authoritative provider and native scope. The dashboard, assurance API, and import/export tooling consume the common reporting primitives while domain records keep their own meanings for status, publication, freshness, severity, and availability.

The common contract is `contracts/assurance/reporting.schema.json`. Source declarations live in the existing `assurance/registry.json`; there is no separate reporting registry.

## Authority model

| Domain | Authoritative source | Ownership rule |
| --- | --- | --- |
| Evidence | GitHub structured assurance records | The registered `evidence` resource owns evidence facts. |
| Reports | GitHub structured assurance records | `presentation.documents` owns document identity, ownership, review cadence, and presentation metadata. Reported domain facts remain owned by their originating datasets. |
| Issues | Native GitHub issues | Repository + issue number is the native identity; GitHub update time is revision identity. |
| Risks | GitHub structured assurance records | The registered `risks` resource owns risk facts. Generated Markdown is only a projection. |
| Security | GitHub structured assurance records | The registered `advisories` resource owns public advisory facts; native GitHub issues remain the authority for issue workflow. |
| Governance | GitHub structured assurance records | `presentation.documents` owns governance document metadata; underlying assurance facts retain their dataset authority. |
| Operations | Native Cloudflare observations | Cloudflare owns native Workers, D1, R2, Durable Objects, and returned billing observations. |

GitHub-hosted canonical data is not copied into reporting records. For each existing registered assurance resource, the reporting layer derives an effective source binding from the repository, registered resource path, existing schema, visibility, and capabilities. Its revision identity is the Git commit/blob pair.

## Shared primitives

The reporting contract defines only the cross-domain primitives needed by current consumers:

- **source** — provider, repository/resource scope, authority kind, native identity, revision or observation identity, schema, visibility, supported capabilities, and ingestion state;
- **identity** — source identity plus native identity, with optional revision or observation identity;
- **record** — the minimal canonical record identity used by collection results while the domain schema remains authoritative for domain fields;
- **relationship** — typed source/to identities without inventing another domain status model;
- **observation** — resource, metric, dimensions, observation window, availability, observation time, and value;
- **query result** — source-bound canonical records with one query block and presentation-only derived counts/facets;
- **interchange envelope** — registry/source/resource references, Git commit/blob revisions, owned records, and normalized relationship identities for repository import/export.

These primitives intentionally do not define a universal `status`. Risk status, publication state, freshness, severity, and provider availability are separate concepts and remain in the schema that owns each meaning.

`src/reporting/disclosure.ts` is the shared disclosure boundary for protected collections. Consumers first obtain a disclosed view, then derive counts, facets, search results, relationships, links, downloads, and exports from that view. A consumer must not derive an aggregate or traversal from the authoritative private collection and filter the result afterward.

## Current assurance HTTP contract

`/v1/assurance` remains the stable registry route, but the payload format cut over in DEMO-157 to the current reporting contract. It is now discovery metadata rather than a family-shaped aggregate snapshot. Registered collection and detail routes return one shared query-result shape:

- `contract`, `schemaVersion`, route `dataset`, and the participating canonical `datasets`;
- source declarations, availability, and qualifications;
- `query.filters` and optional `query.pagination`;
- one `records` array containing the canonical published records with normalized `relationships` intact;
- `derived.count`, `derived.totalAvailable`, and filter facets.

The incident route therefore returns incident and exercise records in the same `records` array instead of separate `incidents` and `exercises` envelopes. Risk, claim, incident, exercise, advisory, and compliance relationship aliases such as `evidence`, `controls`, `riskLinks`, `objectiveLinks`, `incidentLinks`, and `frameworkReferences` are not emitted. The canonical `relationships` object is the only relationship contract.

This is an intentional breaking cutover. The former vendor-media/schema-version negotiation and flattened v1 field projection are not supported in parallel. Requests using `schemaVersion` or `application/vnd.wizardgang.assurance+json` are rejected, and undeclared query parameters such as the former `residualRating` alias fail rather than being ignored. Existing useful route paths remain stable; route stability does not imply legacy payload compatibility.

Rollback for this cutover is the parent commit recorded in the DEMO-157 controlled commit. Rollback restores the previous HTTP projection and removes the interchange CLI as one atomic repository change; do not add a compatibility shim during rollback.

## Repository interchange

Repository interchange is intentionally a CLI boundary so writes occur in an authorized Git checkout and never in a dashboard copy:

```text
npm run assurance:interchange -- export [--output <file>]
npm run assurance:interchange -- import --input <file> [--dry-run]
```

`export` emits the current `interchangeEnvelope` for every registered record-bearing structured source that declares `export`. The export is deterministic and contains the registry reference, effective source declarations, registered resource/schema/collection references, Git commit/blob revisions, raw authoritative records, and record-to-record relationship identities. Derived publication presentations, risk ratings, counts, rendered evidence state, and other HTTP-only fields are not source data and are not exported as editable authority.

`import` accepts only the current interchange envelope. It validates the envelope, each affected registered domain document, source capabilities, canonical IDs, and relationship references before writing. `--dry-run` performs the same validation and change planning without modifying files. Writes are routed to each resource's registered canonical JSON path; generated runtime bindings and summaries are regenerated only after authoritative files change.

Imports are merge-safe for intentional subsets: omitted fields on an existing authoritative record are preserved, so importing a public projection cannot erase undisclosed private fields. Arrays and explicitly supplied fields replace their owned values. Duplicate IDs in one payload are rejected, an ID already owned by another resource is rejected, and a re-import of an already-applied payload is a no-op rather than a duplicate. A changed import must match the current source blob revision; otherwise it fails with `revision_conflict`.

The relationship list is an interchange integrity graph, not a second editable relationship store. Imported relationships must resolve to registered canonical records and use the current relationship vocabulary. Domain relationship values remain owned by the records and are schema/integrity validated with the rest of the canonical document.

Native GitHub objects and Cloudflare observations do not advertise `import`; the CLI rejects attempts to write them. Historical/native telemetry therefore remains provider-owned and cannot be rewritten through assurance interchange.

## Cloudflare observations

Cloudflare operational facts are read from Cloudflare when requested. The prior D1 `cloudflare_usage_snapshots` table remains only as immutable migration history; active runtime code no longer reads from or writes to that provider-state mirror.

Aggregate observation identity is deterministic over resource, metric, normalized dimensions, observation-window start, and observation-window end. This prevents distinct observation windows or dimension sets from being treated as the same fact.

Only a billed cost value returned by Cloudflare is a native Cloudflare observation. Published-rate cost estimates are derived presentation values from authoritative usage observations and never become Cloudflare authority.

## Authoritative and derived fields

Authoritative source edits are limited to fields owned by each registered domain schema. Risk ratings are derived from scores, publication state is derived from lifecycle/revision data, and HTTP counts/facets are derived from the selected records. Import rejects these rendered values as authoritative edits.

The old source/records/relationships-only import payload is not a supported interchange format. The current envelope requires registry, source, resource/schema, and revision context so a write can be validated against the actual authority it intends to modify.

## Protected access and disclosure

A server-side GitHub credential establishes only the Worker's ability to read the configured source. It never establishes the visitor's right to receive that source. `src/api/git-evidence.ts` resolves the existing application principal first, and `src/lib/github-api.ts` refuses private repository content unless that principal carries `reporting:private`.

`reporting:private` is derived only from a validated, revocable application identity whose normalized role is `operator`. The existing static `DEMO_API_TOKEN` and normalized `viewer` identities do not receive this permission. Revoking the D1-backed identity session therefore removes protected reporting access before private source content is fetched.

For a private collection, public disclosure is fail-closed unless an explicit projection is bound to the exact authoritative source revision. `sourceRevision` and `approvedRevision` must match before projection. The resulting public view strips repository scope, disables ingestion, derives its count from projected records, and drops relationships that are not wholly contained in the projected record set.

No private reporting source or public projection is configured by this change. `assurance/registry.json` continues to declare `privateIngestion: "disabled"`, and private source declarations remain payload-free. Private ingestion stays unavailable until a separately controlled source declaration and access policy are configured.

## GitHub credential and cache boundary

Public GitHub repositories are queried through the unauthenticated GitHub context even when `GITHUB_READ_TOKEN` is present. A 403/404 repository visibility probe may be retried with the server credential solely to resolve a configured private source. Private commits, pull requests, Actions, tags, releases, and protection metadata are not fetched until visitor authorization succeeds.

Public and private cache contexts are separate. Protected cache keys include a one-way server-credential context, a one-way principal/permission context, and the current branch revision. The raw token and raw principal subject are not cache keys, response fields, log fields, or error text. Private HTTP responses are `private, no-store` and vary on `Authorization, Cookie`; public responses retain the existing short public cache policy.

## Deployment bindings and minimum permissions

Protected GitHub reporting is opt-in. Do not create credentials or point the demo at a private repository merely to satisfy validation.

- `GITHUB_READ_TOKEN` — Cloudflare secret, required only when the configured authoritative GitHub repository is private. Use a dedicated read-only fine-grained credential scoped only to the configured repository. The evidence reader needs repository **Metadata: read**, **Contents: read**, **Pull requests: read**, and **Actions: read**. **Administration: read** is needed only if branch-protection verification is expected.
- `IDENTITY_SESSION_SECRET` — existing Cloudflare secret used to encrypt identity session references/payloads and short-lived visitor tokens. It must remain server-side and at least 32 bytes.
- `DEMO_DB` — existing D1 binding that stores revocable encrypted application sessions.
- Identity-provider bindings — existing Microsoft Entra ID, Google, GitHub OAuth, and SAML settings documented in `docs/IDENTITY.md`. Protected reporting currently requires the normalized `operator` role.

GitHub provider OAuth credentials obtained during visitor sign-in are discarded after identity normalization and are not reused as reporting source credentials. `GITHUB_READ_TOKEN` is likewise never exposed to the browser.

## Private source declarations

A private source may be declared with provider/resource scope, identity rules, schema, visibility, and capabilities without including its payload. Public registry/build artifacts must not contain credentials, secret values, private provider payloads, or private infrastructure metadata.

Private ingestion is globally `disabled` until a protected source and its access policy are explicitly configured. Validators reject private sources that enable ingestion or advertise import capability.

## Invariants

`npm run check` enforces the reporting foundation and interchange contract:

- authoritative source identities and provider/resource bindings are unique;
- every structured source is backed by a registered schema;
- every reporting domain has exactly one declared owner;
- capabilities match authority type and native observation sources cannot be imported;
- Cloudflare aggregate observations use the required identity components;
- private ingestion remains disabled;
- derived presentation fields cannot be imported as authority;
- public and protected disclosure remains source-revision bound;
- HTTP assurance records retain canonical `relationships` and do not expose legacy flattened aliases;
- current interchange exports validate against the registered source schemas and reporting envelope;
- import is dry-runnable, duplicate-safe, idempotent, revision-conflict aware, and preserves omitted fields;
- active runtime code does not depend on the retired Cloudflare D1 mirror.
