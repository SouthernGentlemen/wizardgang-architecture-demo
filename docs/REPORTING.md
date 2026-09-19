# Reporting architecture

Reporting is the shared query, pagination, disclosure, export, and provider-integration layer for structured assurance and provider-backed records. The reporting registry describes source ownership; the reporting service owns normalized access; the canonical HTTP family is `/api/reporting`.

## Canonical HTTP contract

| Route | Methods | Meaning |
|---|---|---|
| `/api/reporting` | `GET`, `OPTIONS` | Discover reporting collections visible to the caller. |
| `/api/reporting/{collection}` | `GET`, `OPTIONS` | Query one collection with declared filters, signed pagination, and export behavior. |
| `/api/reporting/{collection}/{recordId}` | `GET`, `PATCH`, `OPTIONS` | Read one exact record or perform an authorized provider-backed update where mutation is supported. |

The application route registry owns paths, methods, authentication, authorization declarations, same-origin policy, offline behavior, cache/crawler policy, and source ownership. Reporting code does not maintain a second route inventory.

## Registry and source ownership

`src/reporting/registry.ts` binds each reporting collection to its source, visibility, supported filters, provider requirements, and optional assurance resource.

Structured assurance collections project repository-governed records from `assurance/**`. Canonical identity, lifecycle, publication state, schemas, normalized relationships, and disclosure remain assurance-owned.

Provider-backed collections enter through adapters that normalize provider-native data into the reporting contract. Provider access does not transfer source ownership to the repository and does not make private provider data public.

## Collection discovery and queries

`GET /api/reporting` returns the disclosure-safe collection inventory available to the current principal.

`src/reporting/service.ts` is the common query boundary for APIs and server-rendered consumers. It owns collection discovery, query normalization, filter validation, pagination, exact record lookup, disclosure, exports, provider integration, provider-backed updates, and presentation metadata.

Collection filters are declared by reporting/source metadata. Unknown or unsupported filters are rejected rather than silently ignored. Provider-specific selectors are normalized by the reporting service so handlers and browser consumers do not define parallel query semantics.

## Exact record reads and provider-backed updates

`GET /api/reporting/{collection}/{recordId}` returns one disclosure-safe record when the record exists and is visible to the caller. A non-disclosable record is not exposed through the public response.

Writable provider sources use:

```text
PATCH /api/reporting/{collection}/{recordId}
```

Mutation requires `reporting:write`, explicit source support, runtime payload validation, and provider revision checks where the provider exposes a revision. Stale writes fail rather than silently overwriting newer provider state.

Repository-governed structured assurance sources remain read-only through reporting.

## Pagination and signed cursors

`src/reporting/pagination.ts` owns one public pagination and cursor contract for structured and provider-backed sources.

Pagination fields are:

- `limit`: accepted page size, from 1 through 100;
- `returned`: records returned in the current result;
- `total`: records observed by the bounded query represented by the result;
- `nextCursor`: the only public continuation field, either one opaque cursor or `null`;
- `completeness`: `complete` or `partial`;
- `partialReason`: `null` for complete results, otherwise a supported partial-result reason.

A complete result cannot carry a continuation cursor or partial reason. A partial result carries an explicit reason.

The current signed cursor version is 1 and uses the `rpc1` envelope. The authenticated encrypted payload binds continuation state to the reporting schema version, collection, source, normalized filters, ordered sort fields/directions, continuation position, and any provider continuation state.

Filters are normalized before cursor binding. Set-like values are sorted/deduplicated, strings are trimmed, and numeric values must be finite. Sort ordering remains sequence-sensitive.

Provider continuation data is encapsulated inside the common encrypted cursor. Raw provider page numbers, GraphQL cursors, REST tokens, or other continuation strings are never exposed as a second public cursor.

Cursor validation does not authenticate or authorize the caller. Reporting authorization and source disclosure checks still run independently.

Cursor errors use the shared vocabulary:

| Error | Meaning |
|---|---|
| `reporting_cursor_malformed` | Structurally invalid, corrupted, tampered, wrongly encrypted, or undecodable cursor. |
| `reporting_cursor_mismatch` | Valid cursor bound to a different collection, source, normalized filter set, or ordering. |
| `reporting_cursor_stale` | Cursor issued for a different reporting schema version. |
| `reporting_cursor_unknown` | Unsupported cursor codec version. |

Provider export safety bounds remain partial results. When a provider bound is reached, `completeness` is `partial`, `partialReason` is `provider-export-bound`, `total` reflects records actually observed, and `nextCursor` is present only when safe continuation is supported.

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

Reporting tests cover disclosure-safe discovery, filter validation, deterministic structured pagination, cursor query binding, cursor error semantics, encrypted provider continuation, exact reads, export equivalence, mutation authorization, provider revision conflicts, response schema validation, cache policy, ETags, CORS, and `OPTIONS`.

New consumers reuse the reporting registry/service and common cursor contract rather than adding a parallel API family or provider-specific public pagination shape.
