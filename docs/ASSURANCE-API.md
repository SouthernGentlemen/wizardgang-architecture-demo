# Assurance reporting API

The public assurance experience is rendered at `/assurance`. Machine-readable assurance and reporting data is exposed only through the canonical reporting API.

## Canonical routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/reporting` | `GET`, `OPTIONS` | Discover reporting collections visible to the current principal. |
| `/api/reporting/{collection}` | `GET`, `OPTIONS` | Query one structured or provider-backed reporting collection. |
| `/api/reporting/{collection}/{id}` | `GET`, `PATCH`, `OPTIONS` | Read one reporting record, or update it when that source supports authorized mutation. |

The route registry is authoritative for method, offline, cache, disclosure, and crawler policy. Unknown collections, unknown records, and removed paths use the normal not-found behavior; there are no redirects or aliases.

## Collection discovery

`GET /api/reporting` returns the disclosure-safe collection inventory available to the caller. The inventory is derived from the reporting registry rather than a hardcoded HTTP path list.

Structured assurance collections include the current public domains such as claims, evidence, compliance, risks, incidents, advisories, objectives, governance records, and other registry-backed data that is eligible for reporting. Provider-backed collections are included only when the caller is allowed to discover them.

Each collection description identifies its source kind, visibility, supported filters, pagination capability, and export support.

## Querying a collection

`GET /api/reporting/{collection}` uses the shared reporting service for filtering, pagination, disclosure, schema validation, and export behavior.

Common query parameters are:

- `limit`: bounded page size.
- `cursor`: signed cursor returned by the previous page.
- `export=1`: request the collection's supported export representation.

Collection-specific filter parameters are declared by the reporting registry. Unknown or unsupported filters are rejected rather than silently ignored. Canonical filter names are used consistently by HTML and API consumers.

Provider-backed collections may require source selectors such as `repository`. The reporting service owns provider query normalization so pages and APIs do not implement separate pagination or filtering contracts.

## Reading one record

`GET /api/reporting/{collection}/{id}` returns one disclosure-safe canonical record when it exists and is visible to the caller. Record identity follows the source contract; structured assurance records use their canonical IDs and provider records use the reporting provider's stable identity.

A record that exists but is not disclosable is not exposed through a public response. The API does not leak private collection membership, private fields, draft provider data, credentials, or internal-only metadata.

## Authorized updates

Writable reporting sources use the appropriate method on the canonical record URL instead of a separate import endpoint.

The current provider-backed update contract uses:

```text
PATCH /api/reporting/{collection}/{id}
```

Updates require `reporting:write` authorization and the source must explicitly support mutation. Revision checks are required where the provider exposes a revision so stale writes cannot silently overwrite a newer record. The request body is runtime-validated before any provider mutation occurs.

Structured assurance data checked into the repository remains governed by its canonical source and lifecycle process; exposing a structured collection through the reporting API does not make that collection remotely writable.

## Authorization and disclosure

The reporting routes are public entry points with policy-based authorization:

- ordinary public reads require the normal readable reporting principal;
- private reporting disclosure requires `reporting:private`;
- record mutation requires `reporting:write`;
- source-specific permissions still apply after the shared reporting authorization decision.

The reporting service applies disclosure policy before serialization. HTML pages such as `/assurance` and `/security` consume the same reporting/publication contracts and do not bypass these rules.

## Caching, ETags, and CORS

Response policy is owned by the reporting response because disclosure differs by collection and principal.

- public structured reporting responses may use public caching and ETags;
- public provider-backed responses use the provider reporting cache policy;
- authenticated or private responses are private and `no-store`;
- conditional requests retain the existing ETag behavior;
- CORS and preflight handling are preserved for supported reporting methods.

The application router must not replace these response-owned headers with a generic route cache policy.

## Runtime schema validation

Structured reporting records are serialized through the canonical assurance/reporting contract and runtime schema validation. Provider-backed payloads are normalized and boundary-validated by the reporting service before they cross the HTTP boundary.

Contract sources include:

- `contracts/assurance/reporting.schema.json`
- `contracts/assurance/registry.schema.json`
- `src/reporting/service.ts`
- `src/reporting/schema-validation.ts`
- `src/reporting/pagination.ts`
- `src/api/reporting.ts`
- `src/api/reporting-response.ts`

## Pagination and cursors

All paginated reporting surfaces use the common signed cursor contract. A cursor is bound to the collection and normalized query state; it cannot be replayed against a different collection or changed filter set.

Cursor behavior is documented in `docs/REPORTING-CURSORS.md` and implemented by `src/reporting/pagination.ts`.

## Exports

Export requests use the same canonical query and disclosure path as normal reads. An export must not broaden access, bypass filters, or reveal fields that would be hidden from the equivalent JSON response.

## OpenAPI

The current OpenAPI 3.1 document is served from `/api/openapi.json`. It documents the active reporting operations and maps each operation to an application route ID.

`contracts/openapi/openapi.json` is the checked-in contract. Reporting operations reference the canonical reporting schema `$id` directly. `npm run validate:contracts` rejects embedded duplicates, wrappers, or weaker reporting schemas.
