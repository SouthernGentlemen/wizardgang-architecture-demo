# Reporting architecture

Reporting is a shared application capability, not a family of resource-specific HTTP handlers. The reporting registry describes source ownership and disclosure; the reporting service owns query normalization, pagination, presentation inputs, exports, and provider integration; the canonical HTTP boundary is `/api/reporting`.

## Canonical HTTP contract

| Route | Methods | Meaning |
|---|---|---|
| `/api/reporting` | `GET`, `OPTIONS` | Discover reporting collections visible to the caller. |
| `/api/reporting/{collection}` | `GET`, `OPTIONS` | Query one collection with the source's declared filters, signed cursors, and export behavior. |
| `/api/reporting/{collection}/{id}` | `GET`, `PATCH`, `OPTIONS` | Read one record or perform an authorized update where the source is writable. |

There is one active reporting URL family. Retired assurance- and Git-specific API paths are not aliases and are not redirected.

## Layers

### Registry

`src/reporting/registry.ts` is the reporting ownership contract. It binds a reporting domain to a source, optional assurance resource, visibility, supported filters, and provider requirements.

Registry metadata answers questions such as:

- Which collections exist?
- Which source owns each collection?
- Is the collection public or private?
- Which filters are valid?
- Does the source require a repository selector?
- Is provider-backed mutation supported?

HTTP paths are not duplicated in the reporting registry. The application route registry owns URL topology.

### Query service

`src/reporting/service.ts` is the common query boundary used by APIs and server-rendered reporting views. It provides:

- disclosure-safe collection inventory;
- normalized structured-record queries;
- provider-backed queries;
- exact record lookup;
- filter validation;
- signed cursor pagination;
- export production;
- source-specific update integration;
- normalized result metadata for presentation.

Consumers should call this service instead of importing datasets or provider clients directly.

### Disclosure

`src/reporting/service.ts` applies the caller's principal and source visibility before data crosses a presentation or HTTP boundary. Private data must never become visible merely because a collection or provider can technically return it. Public entry points can therefore remain discoverable while private collection membership and private fields stay protected.

### Pagination

`src/reporting/pagination.ts` is the only cursor contract. Cursors are signed and bound to normalized query state. The same cursor cannot be replayed against a different collection or filter set.

See `docs/REPORTING-CURSORS.md` for the cursor envelope and validation rules.

### Presentation

`src/reporting/presentation.ts` and `src/reporting/html.ts` normalize reporting results for the public UI. `/assurance` and operations reporting views consume the same service result instead of reconstructing resource-specific tables or pagination rules.

## Structured assurance collections

Registry-backed assurance records are exposed through reporting collections when their resource metadata allows reporting. Canonical record identity, lifecycle, publication state, schema validation, relationships, and disclosure remain owned by the assurance model.

Examples include evidence, compliance, risks, incidents, advisories, claims, objectives, and governance records. The reporting API projects those records; it does not create a second source of truth.

Structured collection responses retain the canonical assurance reporting schema and runtime validation path.

## Provider-backed collections

Provider-backed sources, including GitHub reporting, enter through the same collection and record routes. A provider adapter normalizes native records into the reporting contract and applies source-specific query requirements.

Provider records may expose a stable native identifier alongside their reporting identifier. Exact record reads use the identity declared by that adapter.

Private provider fields remain private even when the provider collection itself is discoverable.

## Authorized record updates

Writable provider records are updated on the canonical record resource:

```text
PATCH /api/reporting/{collection}/{id}
```

Mutation requires `reporting:write` and a source that explicitly supports updates. The request boundary validates the payload and requires the source's revision token when applicable. The provider adapter performs the revision-checked mutation and returns the normalized updated record.

A source that is read-only through reporting rejects mutation rather than exposing a separate import route.

## Filters

Filter vocabulary is source metadata, not route-specific code. The API validates requested filter names against the collection declaration before querying.

Structured assurance filters continue to use canonical names such as `status`, `lifecycle`, `framework`, `level`, `residual`, and source-declared relationship filters. Provider collections expose their own normalized filter set.

Unsupported filters fail explicitly. Consumers must not silently drop unknown filters or translate legacy names.

## Cursors

Collection queries accept:

- `limit` for bounded page size;
- `cursor` for the signed continuation state.

The response exposes the next cursor only when another page exists. Cursor signing, verification, query fingerprinting, and provider continuation state are handled by the shared pagination module.

## Exports

`export=1` uses the same normalized query and disclosure boundary as a JSON read. Exporting never broadens disclosure and never bypasses filters or cursor validation.

Provider-backed exports and structured assurance exports are normalized by the reporting service so consumers do not implement their own export path families.

## Authorization

The canonical reporting routes use policy-based authorization:

- readable public reporting uses the ordinary read principal;
- private disclosure requires `reporting:private`;
- mutation requires `reporting:write`;
- provider-specific authorization is still enforced after the common policy decision.

Authorization is evaluated independently from publication/disclosure. Possessing provider access does not automatically make a private record public.

## HTTP response policy

Reporting responses own their cache policy because it depends on source and principal:

- public structured assurance responses can retain public caching and ETags;
- public provider results use their bounded public cache policy;
- authenticated or private responses are private and `no-store`;
- CORS and OPTIONS behavior remain available for supported methods;
- conditional requests continue to use the canonical ETag behavior.

The application router uses `cache: response` for reporting routes so it does not overwrite these response-specific headers.

## Runtime validation

Every successful reporting index, collection, record, and update response is checked against the applicable definition in the canonical reporting JSON Schema before serialization. Provider payloads are normalized first and pass through the same response validator.

The principal contract files are:

- `contracts/assurance/reporting.schema.json`
- `contracts/assurance/registry.schema.json`
- `src/reporting/contracts.ts`
- `src/reporting/service.ts`
- `src/reporting/schema-validation.ts`
- `src/api/reporting.ts`
- `src/api/reporting-response.ts`

## OpenAPI

The active OpenAPI 3.1 document is served from `/api/openapi.json`. Every documented operation declares `x-route-id`, and contract tests verify that the referenced route ID owns the documented method and path in the application registry. Reporting operations reference the canonical schema `$id` directly; OpenAPI does not embed, wrap, or weaken a second reporting schema.

## Consumer guidance

New reporting consumers should:

1. register or reuse a reporting collection;
2. query through `src/reporting/service.ts`;
3. present through the shared presentation layer when rendering HTML;
4. use `/api/reporting` for HTTP access;
5. preserve disclosure, cursor, export, schema, and cache behavior rather than recreating them locally.

A compatible new reporting source should not require a new top-level API family or changes to the central router.
