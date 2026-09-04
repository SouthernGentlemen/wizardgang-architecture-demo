# Authoritative Reporting Contracts

## Purpose

Reporting is a projection layer, not a second system of record. Every reportable fact has one authoritative provider and native scope. The dashboard, assurance API, and import/export helpers consume the common reporting primitives while domain records keep their own meanings for status, publication, freshness, severity, and availability.

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
- **collection result** — source-bound records and relationships plus presentation-only derived values such as count.

These primitives intentionally do not define a universal `status`. Risk status, publication state, freshness, severity, and provider availability are separate concepts and remain in the schema that owns each meaning.

## Cloudflare observations

Cloudflare operational facts are read from Cloudflare when requested. The prior D1 `cloudflare_usage_snapshots` table remains only as immutable migration history; active runtime code no longer reads from or writes to that provider-state mirror.

Aggregate observation identity is deterministic over:

1. resource;
2. metric;
3. normalized dimensions;
4. observation-window start;
5. observation-window end.

This prevents two distinct observation windows or dimension sets from being treated as the same fact. The dashboard can still render its existing public-safe usage shape, but that shape is derived from current Cloudflare observations rather than maintained as an editable reporting register.

Only a billed cost value returned by Cloudflare is a native Cloudflare observation. Published-rate cost estimates are derived presentation values from authoritative usage observations and never become Cloudflare authority.

## Authoritative and derived fields

Authoritative imports contain only the source identity, records, and relationships. `derived` fields belong to presentation collection results and are read-only by contract. The TypeScript import helper rejects any payload containing `derived`, and the export helper omits derived values.

Existing v1 assurance response fields are preserved. This change does not introduce a replacement endpoint, a legacy adapter, or additional legacy API behavior; later removal of legacy APIs remains a separate controlled change.

## Private source declarations

A private source may be declared with provider/resource scope, identity rules, schema, visibility, and capabilities without including its payload. Public registry/build artifacts must not contain credentials, secret values, private provider payloads, or private infrastructure metadata.

Private ingestion is globally `disabled` until protected consumption is implemented. Validator invariants reject private sources that enable ingestion or advertise import capability. A future protected ingestion change must be separately controlled and must not turn public source declarations into a payload store.

## Invariants

`npm run check` enforces the reporting foundation through the assurance registry validator and focused tests:

- authoritative source identities are unique;
- provider + repository/resource bindings are unique;
- every structured source is backed by a registered schema;
- every reporting domain has exactly one declared owner;
- capabilities match authority type;
- Cloudflare aggregate observations use the required identity components;
- private ingestion remains disabled;
- derived presentation fields cannot be imported as authority;
- active runtime code does not depend on the retired Cloudflare D1 mirror.
