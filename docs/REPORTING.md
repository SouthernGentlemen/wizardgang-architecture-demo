# Reporting architecture

Reporting is the shared query, pagination, disclosure, export, and provider-integration layer for structured assurance and provider-backed records. The reporting registry describes source ownership; the reporting service owns normalized access; the canonical HTTP family is `/api/reporting`.

## Canonical HTTP contract

`/api/reporting` is the canonical reporting family. The application route registry and active OpenAPI contract own exact paths, methods, authentication, authorization, same-origin policy, offline behavior, cache/crawler policy, and source ownership; reporting documentation does not maintain a second route inventory.

## Registry and source ownership

`src/reporting/registry.ts` binds each reporting collection to its authoritative source metadata and capabilities; the exact registry shape remains contract-owned.

Structured assurance collections project repository-governed records from `assurance/**`. Canonical identity, lifecycle, publication state, schemas, normalized relationships, and disclosure remain assurance-owned.

Provider-backed collections enter through adapters that normalize provider-native data into the reporting contract. Provider access does not transfer source ownership to the repository and does not make private provider data public.

## Collection discovery and queries

`GET /api/reporting` returns the disclosure-safe collection inventory available to the current principal.

`src/reporting/service.ts` is the common query boundary for APIs and server-rendered consumers. It interprets declared collection metadata and applies normalized access, disclosure, pagination, exports, provider integration, and supported updates.

Collection filters are declared by reporting/source metadata. Unknown or unsupported filters are rejected rather than silently ignored. Provider-specific selectors are normalized by the reporting service so handlers and browser consumers do not define parallel query semantics.

## Exact record reads and provider-backed updates

`GET /api/reporting/{collection}/{recordId}` returns one disclosure-safe record when the record exists and is visible to the caller. A non-disclosable record is not exposed through the public response.

Provider-backed mutation is available only where the current route and source contracts declare it. Mutation requires `reporting:write`, explicit source support, runtime payload validation, and provider revision checks where the provider exposes a revision. Stale writes fail rather than silently overwriting newer provider state.

Repository-governed structured assurance sources remain read-only through reporting.

## Pagination and signed cursors

`src/reporting/pagination.ts` owns one public pagination and cursor contract for structured and provider-backed sources.

The reporting contract and `src/reporting/pagination.ts` own the exact pagination fields, cursor codec/version, normalization rules, and wire-level validity constraints. Consumers treat continuation cursors as opaque, query-bound continuation state rather than source-native paging data.

Provider continuation data is encapsulated inside the common encrypted cursor. Raw provider page numbers, GraphQL cursors, REST tokens, or other continuation strings are never exposed as a second public cursor.

Cursor validation does not authenticate or authorize the caller. Reporting authorization and source disclosure checks still run independently.

Cursor error codes and partial-result fields remain contract-owned. Provider export safety bounds are surfaced as partial results, with continuation exposed only when the shared reporting layer can do so safely.

## Exports

`export=1` uses the same normalized query, filters, cursor validation, disclosure, and schema boundary as an ordinary collection read. Export never broadens access or introduces a second reporting envelope.

For assurance-backed collections, `contracts/assurance/reporting.schema.json` is the canonical reporting result contract.

## Authorization and disclosure

Reporting authorization remains distinct from source publication/disclosure:

- ordinary readable public reporting uses the normal read principal;
- private reporting disclosure requires `reporting:private`;
- mutation requires `reporting:write`;
- source-specific permissions remain enforced after the shared reporting decision.

The reporting service applies disclosure before serialization. Provider-backed and structured collections cannot leak private membership, credentials, private fields, draft provider data, or internal-only metadata merely because a source can return them.

## HTTP response policy

Reporting responses own their cache behavior because source and principal determine disclosure.

Public structured responses may use public caching and ETags. Public provider-backed responses use the provider reporting cache policy. Authenticated or private responses are private and `no-store`.

CORS and `OPTIONS` handling are part of the reporting HTTP boundary. Conditional request behavior remains source-aware. The central router does not replace response-owned reporting headers with a generic route cache policy.

## Runtime schema validation and OpenAPI

Structured reporting results are serialized through the canonical assurance/reporting contract and runtime schema validation. Provider-backed payloads are normalized and boundary-validated before crossing the HTTP boundary.

Principal implementation/contract sources include:

- `contracts/assurance/reporting.schema.json`;
- `contracts/assurance/registry.schema.json`;
- `src/reporting/contracts.ts`;
- `src/reporting/registry.ts`;
- `src/reporting/service.ts`;
- `src/reporting/schema-validation.ts`;
- `src/reporting/pagination.ts`;
- `src/api/reporting.ts`;
- `src/api/reporting-response.ts`.

The active OpenAPI 3.1 contract is `contracts/openapi/openapi.json` and is served at `/api/openapi.json`. Reporting operations reference canonical reporting schemas and declare application route IDs. `npm run validate:contracts` verifies method/path ownership and rejects duplicate or weaker embedded reporting schemas.

## Validation and provider revisions

Reporting tests cover the discovery, disclosure, pagination, export, mutation, revision, schema, cache, CORS, and response-policy boundaries described above.

New consumers reuse the reporting registry/service and common cursor contract rather than adding a parallel API family or provider-specific public pagination shape.
