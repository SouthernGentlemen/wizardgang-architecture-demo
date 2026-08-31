# Route-to-source map

This file is the stable public URL contract for `demo.wizardgang.ai`.

| Route | Architecture concept | Primary source | Status |
|---|---|---|---|
| `/edge` | Cloudflare Edge | `src/demos/edge.ts` | Working |
| `/workers` | Cloudflare Workers | `src/demos/workers.ts` | Working |
| `/durable-objects` | Durable Objects | `src/demos/durable-objects.ts` | Working |
| `/d1` | Cloudflare D1 | `src/demos/d1.ts` | Working |
| `/r2` | Cloudflare R2 | `src/demos/r2.ts` | Working |
| `/api` | API Architecture | `src/demos/api.ts` | Working |
| `/api/rest` | REST / JSON | `src/demos/rest.ts` | Working |
| `/api/openapi` | OpenAPI / Swagger 2.x | `src/demos/openapi.ts` | Working |
| `/api/graphql` | GraphQL | `src/demos/graphql.ts` | Working |
| `/api/webhooks` | Webhooks | `src/demos/webhooks.ts` | Working |
| `/identity` | Authentication & Authorization | `src/demos/identity.ts` | Working |
| `/identity/oauth` | OAuth 2.0 | `src/demos/oauth.ts` | Working |
| `/identity/sso` | Single Sign-On | `src/demos/sso.ts` | Working |
| `/identity/saml` | SAML | `src/demos/saml.ts` | Working |
| `/mcp` | Model Context Protocol | `src/demos/mcp.ts` | Working |
| `/i18n` | Internationalization | `src/demos/i18n.ts` | Working |
| `/accessibility` | WCAG 2.2 | `src/demos/accessibility.ts` | Working |
| `/git` | Git / GitHub | `src/demos/git.ts` | Working |
| `/git/versioning` | Git Versioning | `src/demos/versioning.ts` | Working |
| `/git/branching` | Branching | `src/demos/branching.ts` | Working |
| `/git/releases` | Release Management | `src/demos/releases.ts` | Working |
| `/git/actions` | GitHub Actions | `src/demos/actions.ts` | Working |
| `/environments` | Environment Separation | `src/demos/environments.ts` | Working |
| `/traceability` | Change Traceability | `src/demos/traceability.ts` | Working |
| `/governance` | Governance | `src/demos/governance.ts` | Working |
| `/governance/iso-27001` | ISO/IEC 27001 Alignment | `src/demos/iso-27001.ts` | Working |
| `/governance/iso-42001` | ISO/IEC 42001 Alignment | `src/demos/iso-42001.ts` | Working |
| `/evidence` | Evidence & Auditability | `src/demos/evidence.ts` | Working |


## Operations routes

| Route | Operational concept | Primary source | Status |
|---|---|---|---|
| `/dashboard` | Operations dashboard | `src/demos/dashboard.ts` | Working |
| `/dashboard/uptime` | Uptime history | `src/demos/uptime.ts` | Working |
| `/dashboard/health` | Human health view | `src/demos/health.ts` | Working |
| `/dashboard/docs` | Documentation index | `src/demos/docs.ts` | Working |
| `/dashboard/logs` | Public-safe log viewer | `src/demos/logs.ts` | Working |
| `/dashboard/billing` | Synthetic billing / usage | `src/demos/billing.ts` | Working |
| `/health` | Machine health | `src/api/operations.ts` | Working |
| `/version` | Build / release metadata | `src/api/operations.ts` | Working |
| `/__api/operations/logs` | Sanitized log JSON | `src/api/operations.ts` | Working |
| `/admin` | Protected demo control | `src/ui/admin.ts` | Working |
| `/offline` | Public maintenance page | `src/ui/admin.ts` | Working |

## Machine and action interfaces

These interfaces are part of the public route contract. Ordinary interfaces return structured `503` responses during an intentional offline window; operational interfaces explicitly marked as reachable continue to work.

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
| `/__api/evidence/traceability` | `GET` | Release/audit evidence | `src/api/governance.ts` |
| `/__api/governance/security-controls` | `GET` | Security-control mapping | `src/api/governance.ts` |
| `/__api/governance/ai-evaluation` | `POST` | MCP boundary evaluation | `src/api/governance.ts` |

## Shared implementation

| Concern | Source |
|---|---|
| Worker entry point | `src/index.ts` |
| Router | `src/router.ts` |
| Demo registry | `src/demos/registry.ts` |
| HTML renderer | `src/ui/page.ts` |
| GitHub source-link builder | `src/lib/github.ts` |
| Shared D1 audit functions | `src/lib/audit.ts` |
| Application log persistence/redaction | `src/lib/logs.ts` |
| Demo API endpoint | `src/api/demo.ts` |
| Operations APIs | `src/api/operations.ts` |
| D1 base schema | `migrations/0001_demo_blob.sql` |
| Operations / log schemas | `migrations/0002_operations_dashboard.sql`, `migrations/0004_application_logs.sql` |
| Cloudflare configuration | `wrangler.jsonc` |
| CI | `.github/workflows/ci.yml` |
| Deployment | `.github/workflows/deploy.yml` |

The dedicated demo files own public metadata and link to their small route-specific API/page implementations. Shared infrastructure remains limited to routing, authorization, audit/log persistence, HTML response safety, and source-link generation.

## Working contracts and specialized primitives

| Capability | Source |
|---|---|
| R2 helper / object boundary | `src/storage/r2.ts` |
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
