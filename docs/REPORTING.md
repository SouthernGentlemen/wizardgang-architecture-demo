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

`src/reporting/disclosure.ts` is the shared disclosure boundary for protected collections. Consumers first obtain a disclosed view, then derive counts, facets, search results, relationships, links, downloads, and exports from that view. A consumer must not derive an aggregate or traversal from the authoritative private collection and filter the result afterward.

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

## Protected access and disclosure

A server-side GitHub credential establishes only the Worker's ability to read the configured source. It never establishes the visitor's right to receive that source. `src/api/git-evidence.ts` resolves the existing application principal first, and `src/lib/github-api.ts` refuses private repository content unless that principal carries `reporting:private`.

`reporting:private` is derived only from a validated, revocable application identity whose normalized role is `operator`. The existing static `DEMO_API_TOKEN` and normalized `viewer` identities do not receive this permission. Revoking the D1-backed identity session therefore removes protected reporting access before private source content is fetched.

For a private collection, public disclosure is fail-closed unless an explicit projection is bound to the exact authoritative source revision. `sourceRevision` and `approvedRevision` must match before projection. The resulting public view strips repository scope, disables ingestion, derives its count from projected records, and drops relationships that are not wholly contained in the projected record set. This is the reporting equivalent of the existing exact-revision assurance publication policy; it does not create another source of lifecycle truth.

No private reporting source or public projection is configured by this change. `assurance/registry.json` continues to declare `privateIngestion: "disabled"`, and private source declarations remain payload-free. Private ingestion stays unavailable until a separately controlled source declaration and access policy are configured.

## GitHub credential and cache boundary

Public GitHub repositories are queried through the unauthenticated GitHub context even when `GITHUB_READ_TOKEN` is present. A 403/404 repository visibility probe may be retried with the server credential solely to resolve a configured private source. Private commits, pull requests, Actions, tags, releases, and protection metadata are not fetched until visitor authorization succeeds.

Public and private cache contexts are separate. Protected cache keys include a one-way server-credential context, a one-way principal/permission context, and the current branch revision. The raw token and raw principal subject are not cache keys, response fields, log fields, or error text. Private HTTP responses are `private, no-store` and vary on `Authorization, Cookie`; public responses retain the existing short public cache policy. Removing or changing the GitHub credential, revoking/changing visitor authorization, or changing the source revision cannot reuse a previously authorized private cache entry.

## Deployment bindings and minimum permissions

Protected GitHub reporting is opt-in. Do not create credentials or point the demo at a private repository merely to satisfy validation.

- `GITHUB_READ_TOKEN` — Cloudflare secret, required only when the configured authoritative GitHub repository is private. Use a dedicated read-only fine-grained credential scoped only to the configured repository. The evidence reader needs repository **Metadata: read**, **Contents: read**, **Pull requests: read**, and **Actions: read** for the cards it queries. **Administration: read** is needed only if branch-protection verification is expected; without it that control remains `not-publicly-verifiable`.
- `IDENTITY_SESSION_SECRET` — existing Cloudflare secret used to encrypt identity session references/payloads and short-lived visitor tokens. It must remain server-side and at least 32 bytes.
- `DEMO_DB` — existing D1 binding that stores revocable encrypted application sessions.
- Identity-provider bindings — existing Microsoft Entra ID, Google, GitHub OAuth, and SAML secrets/settings documented in `docs/IDENTITY.md`. Protected reporting currently requires the normalized `operator` role; the Microsoft role mapping accepts the verified `operator` or `demo.operator` application role claim. Google and GitHub identities normalize to `viewer` and therefore do not authorize private reporting.

GitHub provider OAuth access credentials obtained during visitor sign-in are discarded after identity normalization and are not reused as reporting source credentials. `GITHUB_READ_TOKEN` is likewise never exposed to the browser.

## Private source declarations

A private source may be declared with provider/resource scope, identity rules, schema, visibility, and capabilities without including its payload. Public registry/build artifacts must not contain credentials, secret values, private provider payloads, or private infrastructure metadata.

Private ingestion is globally `disabled` until a protected source and its access policy are explicitly configured. Validator invariants reject private sources that enable ingestion or advertise import capability. A future protected ingestion change must be separately controlled and must not turn public source declarations into a payload store.

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
- active runtime code does not depend on the retired Cloudflare D1 mirror;
- anonymous and insufficient-permission principals cannot retrieve configured private GitHub content;
- protected responses are not publicly cacheable and credential removal cannot reuse protected cache entries;
- public projections require an exact approved source revision, and all aggregates/traversals/exports are derived after projection.
