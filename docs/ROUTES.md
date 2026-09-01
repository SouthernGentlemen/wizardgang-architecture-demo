# Route-to-source map

This file is the stable public URL contract for `demo.wizardgang.ai`. The public architecture map contains 17 HTML routes in five groups. Retired page URLs remain stable through exact permanent redirects to anchored sections; machine interfaces keep their existing paths and response shapes.

## Public architecture routes

| Group | Route | Architecture concept | Primary source | Status |
|---|---|---|---|---|
| Platform | `/edge` | Cloudflare Edge | `src/demos/edge.ts` | Working |
| Platform | `/workers` | Cloudflare Workers | `src/demos/workers.ts` | Working |
| Platform | `/durable-objects` | Durable Objects | `src/demos/durable-objects.ts` | Working |
| Platform | `/d1` | Cloudflare D1 | `src/demos/d1.ts` | Working |
| Platform | `/r2` | Cloudflare R2 | `src/demos/r2.ts` | Working |
| Interfaces | `/api` | REST, OpenAPI, GraphQL, and webhooks | `src/demos/api.ts` | Working |
| Interfaces | `/identity` | Authorization, OAuth, SSO, and SAML | `src/demos/identity.ts` | Working |
| Interfaces | `/mcp` | Model Context Protocol | `src/demos/mcp.ts` | Working |
| Standards | `/i18n` | Internationalization | `src/demos/i18n.ts` | Working |
| Standards | `/accessibility` | WCAG 2.2 | `src/demos/accessibility.ts` | Working |
| Delivery & Governance | `/git` | Source, change, CI/CD, release, and environment lifecycle | `src/demos/git.ts` | Working |
| Delivery & Governance | `/governance` | ISO alignment, traceability, and evidence | `src/demos/governance.ts` | Working |
| Operations | `/dashboard` | Operations dashboard and detailed health | `src/demos/dashboard.ts` | Working |
| Operations | `/dashboard/uptime` | Uptime history | `src/demos/uptime.ts` | Working |
| Operations | `/dashboard/docs` | Documentation index | `src/demos/docs.ts` | Working |
| Operations | `/dashboard/logs` | Public-safe log viewer | `src/demos/logs.ts` | Working |
| Operations | `/dashboard/billing` | Synthetic billing and usage | `src/demos/billing.ts` | Working |

The architecture map at `/` and `/sitemap.xml` are generated from this 17-route registry.

## Retired page redirects

These are exact-path `301` redirects. `/identity/saml/metadata` is resolved as a machine interface before the redirect table and is not covered by the `/identity/saml` entry.

| Retired route | Permanent destination |
|---|---|
| `/api/rest` | `/api#rest` |
| `/api/openapi` | `/api#openapi` |
| `/api/graphql` | `/api#graphql` |
| `/api/webhooks` | `/api#webhooks` |
| `/identity/oauth` | `/identity#oauth` |
| `/identity/sso` | `/identity#sso` |
| `/identity/saml` | `/identity#saml` |
| `/git/versioning` | `/git#versioning` |
| `/git/branching` | `/git#branching` |
| `/git/releases` | `/git#releases` |
| `/git/actions` | `/git#actions` |
| `/environments` | `/git#environments` |
| `/governance/iso-27001` | `/governance#iso-27001` |
| `/governance/iso-42001` | `/governance#iso-42001` |
| `/traceability` | `/governance#traceability` |
| `/evidence` | `/governance#evidence` |
| `/dashboard/health` | `/dashboard#health` |

## Operations and control routes

| Route | Operational concept | Primary source | Status |
|---|---|---|---|
| `/health` | Machine health | `src/api/operations.ts` | Working |
| `/version` | Build and release metadata | `src/api/operations.ts` | Working |
| `/__api/operations/logs` | Sanitized log JSON | `src/api/operations.ts` | Working |
| `/admin` | Protected demo control | `src/ui/admin.ts` | Working |
| `/offline` | Public maintenance page | `src/ui/admin.ts` | Working |
| `/sitemap.xml` | Registry-generated sitemap | `src/api/sitemap.ts` | Working |

## Machine and action interfaces

Ordinary interfaces return structured `503` responses during an intentional offline window; operational interfaces explicitly marked as reachable continue to work.

| Route | Methods | Capability | Primary source |
|---|---|---|---|
| `/__api/edge/inspect` | `GET` | Allowlisted edge request context | `src/api/runtime.ts` |
| `/__api/workers/compute` | `POST` | Bounded stateless Worker compute | `src/api/runtime.ts` |
| `/__api/durable/counter` | `GET`, `POST` | Coordinated Durable Object counter | `src/api/durable.ts` |
| `/__api/r2/demo` | `POST` | Visitor-safe R2 write | `src/api/r2.ts` |
| `/__api/r2/object` | `GET`, `PUT`, `DELETE` | R2 object with D1 metadata | `src/api/r2.ts` |
| `/v1/demo-records` | `GET`, `POST` | REST record collection | `src/api/records.ts` |
| `/v1/demo-records/{key}` | `GET`, `DELETE` | REST record item | `src/api/records.ts` |
| `/v1/openapi.json` | `GET` | Swagger 2.0 contract | `src/api/openapi.ts` |
| `/graphql` | `POST` | GraphQL record query | `src/api/graphql.ts` |
| `/graphql/schema` | `GET` | GraphQL schema | `src/api/graphql.ts` |
| `/v1/webhooks/demo` | `POST` | Signed webhook receiver | `src/api/webhooks.ts` |
| `/__api/webhooks/demo` | `POST` | Visitor signed-webhook run | `src/api/webhooks.ts` |
| `/mcp` | `POST` | Controlled MCP JSON-RPC interface | `src/api/mcp.ts` |
| `/__api/identity/oauth-pkce` | `POST` | OAuth PKCE material | `src/api/identity.ts` |
| `/__api/identity/authorize` | `POST` | Application policy decision | `src/api/identity.ts` |
| `/__api/identity/sso` | `GET` | SSO trust boundary | `src/api/identity.ts` |
| `/identity/saml/metadata` | `GET` | SAML SP metadata | `src/api/identity.ts` |
| `/__api/identity/saml/inspect` | `GET` | SAML validation boundary | `src/api/identity.ts` |
| `/__api/operations/logs` | `GET` | Sanitized logs; offline-reachable | `src/api/operations.ts` |
| `/__api/operations/billing` | `POST` | Synthetic budget scenario; offline-reachable | `src/api/billing.ts` |
| `/__api/evidence/traceability` | `GET` | Release and audit evidence | `src/api/governance.ts` |
| `/__api/governance/security-controls` | `GET` | Security-control mapping | `src/api/governance.ts` |
| `/__api/governance/ai-evaluation` | `POST` | MCP boundary evaluation | `src/api/governance.ts` |

## Shared implementation

| Concern | Source |
|---|---|
| Worker entry point | `src/index.ts` |
| Router and retired-page redirects | `src/router.ts` |
| Demo registry | `src/demos/registry.ts` |
| Route-manifest generator | `scripts/generate-route-manifest.mjs` |
| HTML renderer | `src/ui/page.ts` |
| GitHub source-link builder | `src/lib/github.ts` |
| Shared D1 audit functions | `src/lib/audit.ts` |
| Application log persistence and redaction | `src/lib/logs.ts` |
| Operations APIs | `src/api/operations.ts` |
| D1 base schema | `migrations/0001_demo_blob.sql` |
| Operations and log schemas | `migrations/0002_operations_dashboard.sql`, `migrations/0004_application_logs.sql` |
| Route-flatten seed update | `migrations/0007_flatten_demo_record_routes.sql` |
| Cloudflare configuration | `wrangler.jsonc` |
| CI | `.github/workflows/ci.yml` |
| Deployment | `.github/workflows/deploy.yml` |

## Working contracts and specialized primitives

| Capability | Source |
|---|---|
| R2 helper and object boundary | `src/storage/r2.ts` |
| Durable Object class | `src/durable/demo-coordinator.ts` |
| REST OpenAPI / Swagger 2.x contract | `contracts/openapi/swagger.json` |
| GraphQL schema | `contracts/graphql/schema.graphql` |
| MCP tool manifest | `contracts/mcp/tools.json` |
| Webhook event contract | `contracts/webhooks/events.json` |
| SAML metadata example | `contracts/identity/saml-metadata.example.xml` |
| Synthetic billing policy | `config/billing-demo.json` |
| i18n configuration | `config/i18n.json` |
| Locale resources | `src/i18n/locales/` |
| Accessibility plan | `docs/ACCESSIBILITY.md` |
| Identity plan | `docs/IDENTITY.md` |
| Evidence map | `docs/EVIDENCE.md` |
