# Public assurance API contract

The `/v1/assurance` family is a public, read-only projection of the disclosure-safe assurance registry. This document defines the HTTP behavior that sits around the canonical record schemas: ordering, filters, pagination, errors, caching, schema negotiation, deprecation, and browser cross-origin access.

The contract is intentionally additive to the released version-1 response bodies. A plain `GET` without pagination parameters continues to return the same complete collection shape used by existing consumers.

## Routes

| Route | Purpose | Collection pagination |
|---|---|---|
| `GET /v1/assurance` | Aggregate public registry, deployment context, and resolved evidence | No. The aggregate remains the legacy complete projection. |
| `GET /v1/assurance/evidence` | Resolved evidence records and freshness semantics | Optional |
| `GET /v1/assurance/compliance` | Normalized ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 records | Optional |
| `GET /v1/assurance/compliance/{recordId}` | Exact stable compliance-record lookup | No |
| `GET /v1/assurance/risks` | Disclosure-safe security and AI risks | Optional |
| `GET /v1/assurance/incidents` | Actual incidents plus explicitly simulated exercises | Optional |
| `GET /v1/assurance/advisories` | Published, sanitized security advisories | Optional |

All routes are read-only. `POST`, `PUT`, `PATCH`, and `DELETE` are rejected with `405` and preserve the legacy `Allow: GET` response header. `OPTIONS` exists only for CORS preflight and does not create a write capability.

## Deterministic ordering

Record order is part of the version-1 contract.

- The aggregate `/v1/assurance` projection preserves the canonical dataset order already released to consumers.
- Focused collection routes preserve that same canonical order.
- Filters remove non-matching records without reordering the remaining records.
- Compliance records retain the deterministic framework/reference ordering established by the normalized compliance registry.
- `/v1/assurance/incidents` orders actual incident records before simulated exercise records, preserving each canonical dataset's order.
- Pagination slices the deterministic filtered sequence. It does not introduce a separate sort order.

Changing the established order of an existing version-1 collection is treated as a breaking semantic change and requires a new supported schema version.

## Filters

Filters are exact, case-sensitive query parameters. Unsupported values return `400` rather than silently broadening a result.

### Risks

`GET /v1/assurance/risks` supports:

| Parameter | Allowed values |
|---|---|
| `framework` | `security`, `ai` |
| `status` | `open`, `treating` |
| `residual` | `low`, `moderate`, `high`, `critical` |

Filters are combined with logical AND.

### Compliance

`GET /v1/assurance/compliance` supports:

| Parameter | Allowed values |
|---|---|
| `framework` | `iso-27001`, `iso-42001`, `wcag-2.2` |
| `status` | `met`, `partial`, `gap`, `not-applicable`, `demonstrated`, `not-observed` |
| `level` | `A`, `AA`, `AAA` |

`level` applies only to WCAG records. Filters are combined with logical AND.

Evidence, incident/exercise, and advisory routes currently have no domain filters. They still support the common pagination and schema-version parameters described below.

## Pagination

Pagination is opt-in so existing consumers keep the complete collection response by default.

A collection is paginated only when `limit` or `cursor` is supplied:

- `limit` is an integer from `1` through `100`.
- If `cursor` is supplied without `limit`, the page size defaults to `50`.
- `cursor` is the stable record ID returned as the prior page's `nextCursor`.
- A cursor that is not present in the current filtered sequence returns `400`.
- Duplicate `limit` or `cursor` parameters return `400`.
- `nextCursor` is `null` when no records remain.

When pagination is active, the existing collection fields remain in place and an additive `pagination` object is returned:

```json
{
  "pagination": {
    "limit": 50,
    "returned": 50,
    "total": 86,
    "nextCursor": "WCAG-2.4.7"
  }
}
```

Counts continue to describe the complete filtered selection, not only the current page. For example, risk `counts.total` and compliance `counts.total` are calculated before the pagination slice. Existing `totalAvailable` values continue to describe the full unfiltered dataset.

The aggregate `GET /v1/assurance` route intentionally ignores collection pagination parameters because its complete shape is the compatibility baseline. Consumers that need bounded responses should use the focused collection routes.

## Schema-version negotiation

Schema version `1` is the current and only supported assurance API schema.

Existing consumers do not need to send a version. An unversioned request defaults to schema version `1`.

Consumers that want explicit negotiation may use either:

- query parameter: `schemaVersion=1`
- vendor media type: `Accept: application/vnd.wizardgang.assurance+json; version=1`

If both mechanisms are present, they must request the same version. A conflict returns `400` with `error: "schema_version_conflict"`. An unsupported version returns `406` with `error: "unsupported_schema_version"` and the supported-version list.

Successful and assurance error responses expose `X-Assurance-Schema-Version: 1`. Responses vary on `Accept` so shared caches do not conflate future negotiated representations.

## Error contract

Assurance API errors retain a stable top-level string `error` field. This preserves the existing error shape while allowing route-specific context to be added when useful.

Representative error codes are:

| Status | `error` | Meaning |
|---|---|---|
| `400` | `invalid_filter` | A documented filter value is invalid. |
| `400` | `duplicate_query_parameter` | A single-valued contract parameter was supplied more than once. |
| `400` | `invalid_pagination` | `limit` or `cursor` syntax is invalid. |
| `400` | `invalid_cursor` | The supplied cursor is not in the current filtered sequence. |
| `400` | `invalid_compliance_record_id` | The exact-record path segment cannot be decoded. |
| `400` | `schema_version_conflict` | Query and `Accept` requested different schema versions. |
| `404` | `compliance_record_not_found` | The stable compliance record ID does not exist. |
| `405` | `method_not_allowed` | A write or otherwise unsupported method was attempted. |
| `406` | `unsupported_schema_version` | The requested assurance schema is not supported. |

The existing compliance lookup payload `{ "error": "compliance_record_not_found", "recordId": "..." }` remains unchanged.

Contract errors are returned with `Cache-Control: no-store`. Unexpected service failures continue through the shared safe-error boundary and are also non-cacheable.

## ETags and cache behavior

Successful assurance GET responses use:

`Cache-Control: public, max-age=300`

The five-minute policy is unchanged from the released API.

Every successful representation also receives a deterministic weak `ETag` derived from its exact JSON body. Because deployed-commit evidence URLs and filtered/paginated bodies can differ, the validator is calculated after presentation and query processing.

Clients may send `If-None-Match`. A matching validator returns `304 Not Modified` with the same `ETag`, cache policy, schema-version, security, and CORS metadata and no response body.

Assurance contract errors use `Cache-Control: no-store`. CORS preflight responses use `Cache-Control: public, max-age=3600` and `Access-Control-Max-Age: 3600`.

## CORS decision

The assurance API is intentionally readable from other browser origins because its content is already public and disclosure-reviewed.

The version-1 decision is:

- `Access-Control-Allow-Origin: *`
- allowed preflight methods: `GET, OPTIONS`
- allowed non-safelisted request header: `If-None-Match`
- credentials are not allowed
- `ETag`, `Cache-Control`, `X-Assurance-Schema-Version`, `Deprecation`, `Sunset`, and `Link` are exposed to browser clients
- assurance responses override the shared same-origin resource policy with `Cross-Origin-Resource-Policy: cross-origin`

This CORS allowance applies only to the public assurance response layer. It does not change authentication, CORS, or resource-policy decisions for other demo APIs.

## Deprecation rules

No `/v1/assurance` route and no schema-version-1 representation is deprecated by DEMO-124.

Future breaking changes follow these rules:

1. Do not remove, rename, reinterpret, or reorder an established version-1 field or collection in place.
2. Introduce a new schema version while keeping the prior supported representation available.
3. Provide at least 90 calendar days of notice before a supported assurance schema version or route is sunset.
4. During the notice period, deprecated responses must carry `Deprecation`, `Sunset`, and a `Link` with `rel="deprecation"` pointing to migration documentation.
5. Keep ETag, cache, error, and CORS behavior valid for the deprecated representation until its published sunset date.
6. Removing a stable record is governed separately by the assurance lifecycle rules; API deprecation never permits silent record deletion or ID reuse.

Additive metadata, new focused routes, and new allowed filter values may be introduced within the same schema version when they do not change the meaning of existing fields. Consumers should ignore additive fields they do not understand.

## Compatibility expectations

A consumer that already calls `GET /v1/assurance` or any focused collection without the new query parameters receives the existing body shape and complete record set. DEMO-124 adds HTTP validators, explicit cross-origin read metadata, strict validation for documented filters, opt-in pagination, and explicit version negotiation around that compatibility baseline.
