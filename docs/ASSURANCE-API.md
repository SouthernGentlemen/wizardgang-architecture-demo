# Public assurance API contract

The `/v1/assurance` routes expose the current disclosure-safe assurance query contract. The route prefix remains stable, but DEMO-157 is an intentional representation cutover: the former family-specific envelopes, flattened relationship aliases, and schema-version negotiation are no longer supported.

Canonical records remain authoritative. HTTP responses are projections selected through the shared registry/service layer and keep canonical `relationships` intact. Derived values such as risk ratings, counts, facets, publication metadata, and evidence presentation may appear in runtime records or response metadata, but they are not independent source fields.

## Routes

| Route | Purpose |
|---|---|
| `GET /v1/assurance` | Discover the current assurance registry and API collections. |
| `GET /v1/assurance/evidence` | Query published evidence records. |
| `GET /v1/assurance/compliance` | Query published ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 records. |
| `GET /v1/assurance/compliance/{recordId}` | Exact compliance-record lookup using the same record envelope. |
| `GET /v1/assurance/risks` | Query published security and AI risk records. |
| `GET /v1/assurance/incidents` | Query published incident and exercise records. |
| `GET /v1/assurance/advisories` | Query published security advisory records. |

The routes are public and read-only. `OPTIONS` is supported for CORS preflight. Other methods return `405` with `Allow: GET`.

## Current collection/detail shape

Focused collection routes return one common structure:

```json
{
  "schemaVersion": 1,
  "contract": "contracts/assurance/reporting.schema.json",
  "dataset": "risks",
  "datasets": ["risks"],
  "availability": { "risks": "available" },
  "sources": [],
  "qualifications": { "risks": null },
  "query": {
    "filters": {},
    "pagination": {
      "limit": 50,
      "returned": 50,
      "total": 80,
      "nextCursor": "SEC-RISK-050"
    }
  },
  "records": [],
  "derived": {
    "count": 80,
    "totalAvailable": 80,
    "facets": {}
  }
}
```

`query.pagination` is omitted when pagination was not requested. Exact-record routes use the same envelope with one member in `records`, no family-specific detail body, and no flattened relationship fields.

`GET /v1/assurance` is discovery rather than an aggregate duplicate of every dataset. It returns the registry plus the current registered API collection routes.

## Relationships and derived fields

Records expose the normalized canonical `relationships` object. The following former HTTP-only aliases are not part of the current contract and are not emitted: `frameworkReferences`, flattened `evidence`, `controls`, `riskLinks`, `controlLinks`, `objectiveLinks`, and `incidentLinks`.

Risk records retain numeric canonical scores. Runtime risk ratings are derived from the controlled risk method and appear in the runtime record under `inherent.rating` and `residual.rating`. The old flattened `residualRating` response field and query parameter are rejected.

Counts and facets are response derivations. They are not accepted by the repository interchange importer as authoritative edits.

## Filters

Filter declarations come from `assurance/registry.json` and their value vocabularies come from registered schemas or shared derivations. Filters are exact and case-sensitive. Multiple supported filters combine with logical AND.

Current risk filters are `framework`, `status`, and `residual`. Current compliance filters are `framework`, `status`, and `level`. Other focused routes accept only filters declared for their route owner.

Unknown query parameters are rejected with `400` and `error: "unsupported_query_parameter"`. This prevents obsolete aliases or accidental parameters from silently changing or appearing to change the current contract.

## Pagination

Pagination is optional and uses `limit` and `cursor`:

- `limit` is an integer from `1` through `100`.
- A cursor without a limit uses the default page size of `50`.
- `cursor` is a stable record ID returned as the previous page's `nextCursor`.
- Duplicate pagination parameters, invalid limits, and unknown cursors return `400`.

`derived.count` describes the complete filtered selection. `query.pagination.returned` describes the current page. `derived.totalAvailable` describes the unfiltered current route population.

## Representation negotiation cutover

There is one current JSON representation. Clients should use ordinary `Accept: application/json` or omit `Accept`.

The former `schemaVersion` query parameter is rejected with `400` and `error: "legacy_schema_version_parameter_unsupported"`. The former `application/vnd.wizardgang.assurance+json` media type is rejected with `406` and `error: "legacy_assurance_media_type_unsupported"`.

`X-Assurance-Schema-Version: 1` remains response metadata identifying the current schema generation; it is not a negotiation mechanism.

## Errors

Assurance API errors use a top-level `error` string. Important current errors include:

| Status | Error | Meaning |
|---|---|---|
| `400` | `invalid_filter` | A declared filter is invalid. |
| `400` | `unsupported_query_parameter` | The query uses a parameter outside the current contract. |
| `400` | `duplicate_query_parameter` | A single-valued pagination parameter is repeated. |
| `400` | `invalid_pagination` | Pagination syntax or range is invalid. |
| `400` | `invalid_cursor` | The cursor does not resolve in the filtered sequence. |
| `400` | `legacy_schema_version_parameter_unsupported` | Obsolete version negotiation was attempted. |
| `404` | `assurance_record_not_found` | Exact lookup did not resolve in the route's datasets. |
| `405` | `method_not_allowed` | An unsupported HTTP method was attempted. |
| `406` | `legacy_assurance_media_type_unsupported` | Obsolete vendor-media negotiation was attempted. |

Errors are non-cacheable.

## Caching and CORS

Successful GET responses use `Cache-Control: public, max-age=300` and a deterministic weak `ETag` based on the exact response body. Matching `If-None-Match` returns `304`.

Public assurance responses use `Access-Control-Allow-Origin: *`, expose `ETag`, `Cache-Control`, and `X-Assurance-Schema-Version`, and use `Cross-Origin-Resource-Policy: cross-origin`. Credentials are not enabled.

## Breaking behavior and rollback

DEMO-157 intentionally removes the old v1 body compatibility contract while keeping useful `/v1/assurance/...` routes. Consumers must migrate to `records`, canonical `relationships`, `query`, and `derived` in the common envelope.

Rollback is repository-level: revert the DEMO-157 merge commit to restore the prior representation as a whole. Do not add a parallel serializer, Accept-based fallback, old query alias, or old/new dual support path.

Repository import/export behavior is defined in [REPORTING.md](./REPORTING.md) and by `contracts/assurance/reporting.schema.json`.
