# Reporting architecture

Reporting is a shared application capability. The reporting registry describes source ownership and disclosure; the reporting service owns query normalization, pagination, presentation inputs, exports, and provider integration; the canonical HTTP boundary is `/api/reporting`.

## Canonical HTTP contract

| Route | Methods | Meaning |
|---|---|---|
| `/api/reporting` | `GET`, `OPTIONS` | Discover reporting collections visible to the caller. |
| `/api/reporting/{collection}` | `GET`, `OPTIONS` | Query one collection with declared filters, signed cursors, and export behavior. |
| `/api/reporting/{collection}/{id}` | `GET`, `PATCH`, `OPTIONS` | Read one record or perform an authorized update where the source is writable. |

There is one active reporting URL family. Retired assurance- and Git-specific API paths are not aliases and are not redirected.

## Layers

### Registry

`src/reporting/registry.ts` is the reporting ownership contract. It binds a reporting domain to a source, optional assurance resource, visibility, supported filters, and provider requirements. HTTP paths are not duplicated there; the application route registry owns URL topology.

### Query service

`src/reporting/service.ts` is the common query boundary used by APIs and server-rendered consumers. It provides disclosure-safe collection inventory, normalized structured/provider queries, exact lookup, filter validation, signed pagination, exports, source-specific update integration, and presentation metadata. Consumers should call this service instead of importing datasets or provider clients directly.

### Disclosure

`src/reporting/service.ts` applies the caller principal and source visibility before data crosses a presentation or HTTP boundary. Private data must never become visible merely because a collection or provider can technically return it.

### Pagination

`src/reporting/pagination.ts` owns the cursor contract. Cursors are signed and bound to normalized query state. See `docs/REPORTING-CURSORS.md`.

### Presentation

`src/reporting/presentation.ts` normalizes query results for browser consumers that need the shared model. `/assurance` consumes focused disclosure-safe reporting data for its four verification checks. Operational reporting remains available through machine/reporting contracts and compact homepage proof; the retired human `/operations` route is not a reporting presentation surface.

## Structured assurance collections

Registry-backed assurance records are exposed through reporting collections when resource metadata allows reporting. Canonical identity, lifecycle, publication state, schema validation, relationships, and disclosure remain owned by the assurance model. Examples include evidence, compliance, risks, incidents, advisories, claims, objectives, and governance records. The reporting API projects those records; it does not create a second source of truth.

## Provider-backed collections

Provider-backed sources, including GitHub reporting, enter through the same collection and record routes. Provider adapters normalize native records into the reporting contract and apply source-specific query requirements. Private provider fields remain private even when a provider collection is discoverable.

## Authorized record updates

Writable provider records use:

```text
PATCH /api/reporting/{collection}/{id}
```

Mutation requires `reporting:write`, explicit source support, runtime payload validation, and revision checks when applicable. Repository-governed structured assurance sources remain read-only through reporting.

## Filters and cursors

Filter vocabulary is source metadata, not route-specific code. Unsupported filters fail explicitly. Collection queries accept bounded `limit` and the common opaque `cursor`; provider continuation state never becomes a second public cursor.

## Exports

`export=1` uses the same normalized query and disclosure boundary as JSON reads. Exporting never broadens disclosure or bypasses filters/cursor validation.

## Authorization

- readable public reporting uses the ordinary read principal;
- private disclosure requires `reporting:private`;
- mutation requires `reporting:write`;
- source-specific authorization remains enforced after the common policy decision.

Authorization is independent from publication/disclosure. Provider access does not make a private record public.

## HTTP response policy

Reporting responses own their cache policy because it depends on source and principal. Public structured responses may use public caching/ETags; authenticated or private responses are private and `no-store`; CORS, OPTIONS, conditional requests, and provider cache policy remain source-aware.

## Runtime validation and OpenAPI

Successful reporting responses are checked against the applicable canonical reporting JSON Schema before serialization. Principal contract files include `contracts/assurance/reporting.schema.json`, `contracts/assurance/registry.schema.json`, `src/reporting/contracts.ts`, `src/reporting/service.ts`, `src/reporting/schema-validation.ts`, `src/api/reporting.ts`, and `src/api/reporting-response.ts`.

The active OpenAPI 3.1 document is served from `/api/openapi.json`. Documented operations declare `x-route-id`, and contract tests verify that each referenced route owns the documented method/path.

## Consumer guidance

New reporting consumers should reuse the reporting registry/service, the shared presentation model when needed, and `/api/reporting` for HTTP access while preserving disclosure, cursor, export, schema, and cache behavior. A compatible reporting source should not require a new top-level API family or central-router change.
