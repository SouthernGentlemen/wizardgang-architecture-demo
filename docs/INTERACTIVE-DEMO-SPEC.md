# Interactive demonstration specification

This document describes the current interactive architecture demo. Route declarations, the generated route manifest, OpenAPI, and the implementation remain authoritative when extending a capability.

## Browser topology

HTML resources are declared by capability-owned routes. `/platform` and `/interfaces` are real indexes whose demonstrations are canonical child resources:

| Pathname | Purpose |
|---|---|
| `/` | Architecture index |
| `/platform` | Platform laboratory index |
| `/platform/edge` | Edge inspection laboratory |
| `/platform/workers` | Worker computation laboratory |
| `/platform/durable-objects` | Durable Object counter laboratory |
| `/platform/d1` | D1 laboratory |
| `/platform/r2` | R2 laboratory |
| `/interfaces` | Interface demonstration index |
| `/interfaces/rest` | REST/OpenAPI console |
| `/interfaces/graphql` | GraphiQL console |
| `/interfaces/webhooks` | Webhook console |
| `/interfaces/identity` | Identity console |
| `/interfaces/mcp` | MCP console |
| `/interfaces/i18n` | Internationalization laboratory |
| `/interfaces/accessibility` | Accessibility laboratory |
| `/assurance` | Delivery, governance, evidence, compliance, risks, incidents, and concerns |
| `/security` | Security policy, private reporting boundary, and published advisories |
| `/operations` | Health, availability, logs, usage, reporting, and documentation |
| `/admin` | Authenticated availability and crawler controls |
| `/offline` | Intentional-maintenance status |

Platform and interface demonstrations use those child pathnames. Query parameters remain state where appropriate, including `/assurance/compliance`, `/operations?view=reports`, `/interfaces/i18n?locale=ar`, and `/interfaces/accessibility?mode=broken`. Unknown pathnames and retired platform/interface `view` URLs use the ordinary 404. There is no redirect table, route alias, proxy path, dual endpoint, or client-side routing fallback.

## Routing contract

`src/routing/application-routes.ts` composes capability-owned declarative route modules. `src/routing/registry.ts` provides the generic matcher. `src/router.ts` performs normalization, matching, common policy enforcement, and handler invocation; it does not dispatch by application pathname or prefix.

The same registry generates:

- `docs/route-manifest.json`;
- the tables in `docs/ROUTES.md`;
- registered navigation metadata; and
- sitemap membership.

OpenAPI operations identify their owning declaration with `x-route-id`. A route change is incomplete until `npm run generate:routes` and `npm run generate:openapi` produce matching checked-in artifacts.

## Platform laboratories

The `/platform` index links to five canonical child pages backed by the existing `/api/labs/*` routes:

- Edge inspection exposes only allowlisted request context.
- Worker compute accepts bounded numeric operations and remains stateless.
- Durable Objects own coordinated counter state and write only audit evidence to D1.
- D1 owns visitor-scoped users, tasks, and REST demonstration records.
- R2 owns object bytes while D1 stores bounded metadata and session references.

Every mutation has explicit method, body, identity, same-origin, size, and storage constraints in its route declaration and handler. Reset behavior is scoped to the current visitor sandbox.

## Interface demonstrations

The `/interfaces` index links to canonical browser presentations while preserving one machine endpoint per protocol:

- OpenAPI 3.1 is served at `/api/openapi.json` and drives the REST forms.
- GraphQL executes at `/graphql`; the browser console is `/interfaces/graphql`.
- GitHub webhook deliveries enter at `/webhooks/github`; synthetic demonstrations use the current laboratory API.
- OAuth/OIDC and SAML use the `/auth/*` protocol routes documented in `docs/IDENTITY.md`.
- MCP Streamable HTTP uses `/mcp` and protocol revision `2026-07-28`.
- i18n and accessibility are browser child pages with their current laboratory APIs where execution is required.

REST, GraphQL, and MCP public reads share the same authorization boundary. Authenticated visitor writes use identity-derived, ten-minute access tokens scoped to a server-derived sandbox namespace. There is no static bearer-token credential.

## Reporting and assurance

All structured assurance and provider-backed queries use one HTTP family:

| Route | Purpose |
|---|---|
| `/api/reporting` | Discover collections visible to the caller |
| `/api/reporting/{collection}` | Query or export a collection with common filters and cursors |
| `/api/reporting/{collection}/{recordId}` | Read one record or perform an authorized source-supported update |

`contracts/assurance/reporting.schema.json` is the single reporting JSON Schema. OpenAPI references its `$id` definitions directly and does not embed a copy. Every successful reporting index, query, record, and update response is runtime-validated before serialization.

Canonical records store relationship edges once as `relationships`. Forward views read those edges, reverse graphs are built from them at runtime, and counts/facets are calculated from the selected records. Flattened relationship properties and stored presentation counts are not supported.

Structured and provider-backed collection queries both accept the common `limit` and signed `cursor` contract. A cursor is bound to source, collection, filters, ordering, and authorization context; provider-native continuations are never exposed as an alternate public cursor.

Public reporting includes disclosure-safe assurance, provider-native GitHub, and Cloudflare observation collections registered for anonymous discovery. The `reports` collection is the shared presentation of GitHub workflow attempts, not a copied report family or a separate branch. Protected GitHub security sources are discoverable only by an authenticated operator with `reporting:private`; authorized updates additionally require `reporting:write` and source support.

## Operations

The Operations page presents current runtime state. Machine interfaces are:

- `/api/operations/health` for dependency readiness;
- `/api/operations/version` for deployed source identity;
- `/api/operations/logs` for sanitized application logs;
- `/api/operations/budget` for the synthetic cost-guardrail demonstration; and
- `/api/reporting/operations` for normalized Cloudflare usage observations.

Provider credentials, private resource identifiers, invoices, payment details, and raw provider payloads never cross the public boundary. Missing or malformed provider data is reported as unavailable or partial; it is not converted into invented zero usage. Stale observations retain their original observation time and explicit freshness state.

## Identity and security boundaries

OAuth authorization-code flows use server-side PKCE and validated provider callbacks. SAML validates issuer, audience, recipient, time bounds, request correlation, signatures, and replay state. Application sessions are encrypted, revocable, short-lived, and separate from provider credentials.

GitHub webhook requests are HMAC-verified before persistence, and delivery IDs are replay-protected. MCP requests are origin-checked and pass through the common authorization layer. GraphQL enforces body, depth, field-count, batching, and same-origin mutation constraints.

Public records and logs are disclosure-safe projections. Credentials, cookies, tokens, authorization codes, PKCE material, SAML assertions, and private provider data are excluded from HTML, logs, reporting responses, and error details.

## Verification

The implementation is complete only when these commands pass from a clean checkout:

```text
npm run generate:routes
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
git diff --check
```

Release and deployment are separate controlled actions. An implementation PR must not tag, release, migrate a remote database, or deploy the Worker.
