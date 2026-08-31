# Route-to-source map

This file is the stable public URL contract for `demo.wizardgang.ai`.

| Route | Architecture concept | Primary source | Status |
|---|---|---|---|
| `/edge` | Cloudflare Edge | `src/demos/edge.ts` | Scaffolded |
| `/workers` | Cloudflare Workers | `src/demos/workers.ts` | Scaffolded |
| `/durable-objects` | Durable Objects | `src/demos/durable-objects.ts` | Scaffolded |
| `/d1` | Cloudflare D1 | `src/demos/d1.ts` | Scaffolded |
| `/r2` | Cloudflare R2 | `src/demos/r2.ts` | Scaffolded |
| `/api` | API Architecture | `src/demos/api.ts` | Scaffolded |
| `/api/rest` | REST / JSON | `src/demos/rest.ts` | Scaffolded |
| `/api/openapi` | OpenAPI / Swagger 2.x | `src/demos/openapi.ts` | Scaffolded |
| `/api/graphql` | GraphQL | `src/demos/graphql.ts` | Scaffolded |
| `/api/webhooks` | Webhooks | `src/demos/webhooks.ts` | Scaffolded |
| `/identity` | Authentication & Authorization | `src/demos/identity.ts` | Scaffolded |
| `/identity/oauth` | OAuth 2.0 | `src/demos/oauth.ts` | Scaffolded |
| `/identity/sso` | Single Sign-On | `src/demos/sso.ts` | Scaffolded |
| `/identity/saml` | SAML | `src/demos/saml.ts` | Scaffolded |
| `/mcp` | Model Context Protocol | `src/demos/mcp.ts` | Scaffolded |
| `/i18n` | Internationalization | `src/demos/i18n.ts` | Scaffolded |
| `/accessibility` | WCAG 2.2 | `src/demos/accessibility.ts` | Scaffolded |
| `/git` | Git / GitHub | `src/demos/git.ts` | Scaffolded |
| `/git/versioning` | Git Versioning | `src/demos/versioning.ts` | Scaffolded |
| `/git/branching` | Branching | `src/demos/branching.ts` | Scaffolded |
| `/git/releases` | Release Management | `src/demos/releases.ts` | Scaffolded |
| `/git/actions` | GitHub Actions | `src/demos/actions.ts` | Scaffolded |
| `/environments` | Environment Separation | `src/demos/environments.ts` | Scaffolded |
| `/traceability` | Change Traceability | `src/demos/traceability.ts` | Scaffolded |
| `/governance` | Governance | `src/demos/governance.ts` | Scaffolded |
| `/governance/iso-27001` | ISO/IEC 27001 Alignment | `src/demos/iso-27001.ts` | Scaffolded |
| `/governance/iso-42001` | ISO/IEC 42001 Alignment | `src/demos/iso-42001.ts` | Scaffolded |
| `/evidence` | Evidence & Auditability | `src/demos/evidence.ts` | Scaffolded |


## Operations routes

| Route | Operational concept | Primary source | Status |
|---|---|---|---|
| `/dashboard` | Operations dashboard | `src/demos/dashboard.ts` | Scaffolded |
| `/dashboard/uptime` | Uptime history | `src/demos/uptime.ts` | Scaffolded |
| `/dashboard/health` | Human health view | `src/demos/health.ts` | Scaffolded |
| `/dashboard/docs` | Documentation index | `src/demos/docs.ts` | Scaffolded |
| `/dashboard/logs` | Public-safe log viewer | `src/demos/logs.ts` | Scaffolded |
| `/dashboard/billing` | Synthetic billing / usage | `src/demos/billing.ts` | Scaffolded |
| `/health` | Machine health | `src/api/operations.ts` | Working scaffold |
| `/version` | Build / release metadata | `src/api/operations.ts` | Working scaffold |
| `/__api/operations/logs` | Sanitized log JSON | `src/api/operations.ts` | Working scaffold |
| `/admin` | Protected demo control | `src/ui/admin.ts` | Working scaffold |
| `/offline` | Public maintenance page | `src/ui/admin.ts` | Working scaffold |

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

The dedicated demo files intentionally begin as metadata + route contracts. Route-specific implementations should move into the corresponding module (or a subfolder owned by that module) as the demos are completed.

## Scaffolded contracts and specialized primitives

| Capability | Scaffold source |
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
