# Unified Reporting Pagination and Cursors

DEMO-176 defines the pagination and continuation contract shared by reporting sources. It adds the common types and codec foundation only; existing provider consumers are intentionally not all migrated in this change.

## Pagination contract

Reporting pagination has one public shape:

- `limit` — accepted page size. The only valid range is **1 through 100**, inclusive.
- `returned` — records returned in the current result.
- `total` — records observed by the bounded query represented by the result. For a partial result this is not an assertion about the provider's global total.
- `nextCursor` — the only public continuation field. It is either one common opaque cursor or `null`.
- `completeness` — `complete` or `partial` for consumers that have adopted the DEMO-176 pagination constructor.
- `partialReason` — `null` for complete results, otherwise one of `page-boundary`, `sample`, `provider-export-bound`, or `provider-unavailable`.

`completeness` and `partialReason` are optional in the JSON schema during staged adoption so DEMO-176 does not require every existing reporting producer to migrate in the same pull request. The common constructor always emits and validates them. Follow-up migrations should adopt this constructor rather than define another pagination shape.

A complete result cannot carry a continuation cursor or a partial reason. A partial result must carry an explicit reason. `returned` cannot exceed the observed `total` represented by that result.

## Opaque cursor codec

`src/reporting/pagination.ts` owns the one cursor codec. The current cursor version is `1` and encoded cursors use the `rpc1` envelope.

The authenticated encrypted payload binds the cursor to all of the following:

- cursor version;
- reporting schema version;
- collection;
- source;
- normalized filters;
- ordered sort fields and directions;
- continuation position;
- provider continuation data, when a provider has its own paging token or position.

Provider continuation data is encrypted inside the common cursor. It is never a second public cursor, page token, or provider-specific continuation field. Clients receive only `nextCursor`.

Filters are normalized before binding: filter names are canonicalized, strings are trimmed, set-like filter arrays are sorted and deduplicated, and numeric values must be finite. Ordering remains sequence-sensitive because sort precedence is part of the paging contract.

## Validation and authorization

Cursor decoding validates continuation state only. It does **not** authenticate a caller, grant a permission, expand source visibility, or bypass provider authorization. A reporting handler must perform its normal authentication and authorization checks independently of cursor validation.

The codec uses one error vocabulary:

| Error | Meaning |
| --- | --- |
| `reporting_cursor_malformed` | The cursor is structurally invalid, corrupted, tampered with, encrypted under another key, or otherwise undecodable. |
| `reporting_cursor_mismatch` | The cursor is valid but belongs to a different collection, source, normalized filter set, or ordering. |
| `reporting_cursor_stale` | The cursor was issued for a different reporting schema version. |
| `reporting_cursor_unknown` | The cursor declares an unsupported cursor codec version. |

These errors intentionally say nothing about whether the caller is authorized for the bound source.

## Provider export safety bound

Provider adapters may impose a hard export bound to protect the Worker and upstream provider. Reaching that bound is never represented as a complete export.

A migrated producer must return:

- `completeness: "partial"`;
- `partialReason: "provider-export-bound"`;
- the number of records actually observed in `total`;
- a common opaque `nextCursor` only when continuation is safe and supported, otherwise `null`.

Any native provider continuation value required to resume is placed only inside the encrypted common cursor payload. Raw provider values such as a GitHub page number, GraphQL cursor, REST page token, or provider-specific continuation string are implementation details.

## Staged adoption

DEMO-176 establishes the codec, common TypeScript types, schema vocabulary, validation rules, and tests without migrating every reporting consumer. Existing provider execution paths can be migrated incrementally, but new code must not introduce another public cursor field or a parallel legacy cursor contract.

The existing access-control boundary remains authoritative during migration. A valid cursor can identify where an authorized query would continue; it can never establish that the query is authorized.
