# Route-to-source map

This file is the stable public URL contract for `demo.wizardgang.ai`. The public architecture map contains 22 HTML routes in five groups. Retired page URLs remain stable through exact permanent redirects to focused routes or anchored sections; machine interfaces keep their existing paths and response shapes.

## Public architecture routes

| Group | Route | Architecture concept | Primary source | Status |
|---|---|---|---|---|
| Platform | `/edge` | Cloudflare Edge | `src/demos/edge.ts` | Working |
| Platform | `/workers` | Cloudflare Workers | `src/demos/workers.ts` | Working |
| Platform | `/durable-objects` | Durable Objects | `src/demos/durable-objects.ts` | Working |
| Platform | `/d1` | Cloudflare D1 | `src/demos/d1.ts` | Working |
| Platform | `/r2` | Cloudflare R2 | `src/demos/r2.ts` | Working |
| Interfaces | `/api` | REST and OpenAPI 2.0 | `src/demos/api.ts` | Working |
| Interfaces | `/graphql` | GraphQL Yoga and locally bundled GraphiQL | `src/demos/graphql.ts` | Working |
| Interfaces | `/webhooks` | Signed GitHub-compatible webhook verification and delivery evidence | `src/demos/webhooks.ts` | Working |
| Interfaces | `/identity` | Real provider authentication, normalized identity, SSO, and application authorization | `src/demos/identity.ts` | Working |
| Interfaces | `/mcp` | Model Context Protocol | `src/demos/mcp.ts` | Working |
| Standards | `/i18n` | Internationalization | `src/demos/i18n.ts` | Working |
| Standards | `/accessibility` | WCAG 2.2 | `src/demos/accessibility.ts` | Working |
| Delivery & Governance | `/git` | Source, change, CI/CD, release, and environment lifecycle | `src/demos/git.ts` | Working |
| Delivery & Governance | `/governance` | ISO alignment, traceability, and evidence | `src/demos/governance.ts` | Working |
| Delivery & Governance | `/compliance` | Uncertified assurance posture and canonical evidence index | `src/demos/compliance.ts` | Working |
| Delivery & Governance | `/security` | Vulnerability disclosure policy and private reporting path | `src/demos/security.ts` | Working |
| Delivery & Governance | `/governance/concerns` | Public non-security bug, feature, and other concern intake | `src/demos/concerns.ts` | Working |
| Operations | `/dashboard` | Read-only operations center, detailed health, availability, activity, usage, and deployment | `src/demos/dashboard.ts` | Working |
| Operations | `/dashboard/uptime` | Scheduled availability history | `src/demos/uptime.ts` | Working |
| Operations | `/dashboard/docs` | Documentation index | `src/demos/docs.ts` | Working |
| Operations | `/dashboard/logs` | Public-safe log viewer | `src/demos/logs.ts` | Working |
| Operations | `/dashboard/billing` | Cloudflare usage, cost evidence, and separate guardrail simulator | `src/demos/billing.ts` | Working |

The architecture map at `/` and `/sitemap.xml` are generated from this 22-route registry.

## Retired page redirects

These are exact-path `301` redirects. `/identity/saml` is now the live Entra SAML sign-in route rather than a redirect.

| Retired route | Permanent destination |
|---|---|
| `/api/rest` | `/api#rest` |
| `/api/openapi` | `/api#openapi` |
| `/api/graphql` | `/graphql#graphql` |
| `/api/webhooks` | `/webhooks#webhooks` |
| `/identity/oauth` | `/identity#oauth` |
| `/identity/sso` | `/identity#sso` |
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
| `/__api/operations/cloudflare-usage` | Sanitized cached Cloudflare usage JSON | `src/api/operations.ts` | Working |
| `/admin` | Protected demo control | `src/ui/admin.ts` | Working |
| `/offline` | Public maintenance page | `src/ui/admin.ts` | Working |
| `/og.png` | Branded social preview image | `src/ui/brand-assets.ts` | Working |
| `/robots.txt` | Dynamic ChatGPT crawler policy | `src/lib/crawler-control.ts` | Working |
| `/.well-known/security.txt` | RFC 9116 vulnerability-reporting contact | `src/api/security-policy.ts` | Working |
| `/sitemap.xml` | Registry-generated sitemap | `src/api/sitemap.ts` | Working |

## Machine and action interfaces

Ordinary interfaces return structured `503` responses during an intentional offline window; operational interfaces explicitly marked as reachable continue to work.

| Route | Methods | Capability | Primary source |
|---|---|---|---|
| `/__api/edge/inspect` | `GET` | Allowlisted edge request context | `src/api/runtime.ts` |
| `/__api/workers/compute` | `POST` | Bounded stateless Worker compute | `src/api/runtime.ts` |
| `/__api/durable/counter` | `GET`, `POST` | Coordinated Durable Object counter | `src/api/durable.ts` |
| `/__api/d1/users` | `GET`, `POST` | Session-scoped D1 demo users | `src/api/d1-lab.ts` |
| `/__api/d1/users/{id}` | `PATCH`, `DELETE` | Session-scoped D1 demo user | `src/api/d1-lab.ts` |
| `/__api/d1/tasks` | `GET`, `POST` | Session-scoped D1 demo tasks | `src/api/d1-lab.ts` |
| `/__api/d1/tasks/{id}` | `PATCH`, `DELETE` | Session-scoped D1 demo task | `src/api/d1-lab.ts` |
| `/__api/d1/reset` | `POST` | Reset the current D1 visitor sandbox | `src/api/d1-lab.ts` |
| `/__api/r2/demo` | `POST` | Visitor-safe R2 write | `src/api/r2.ts` |
| `/__api/r2/object` | `GET`, `PUT`, `DELETE` | R2 object with D1 metadata | `src/api/r2.ts` |
| `/__api/r2/files` | `GET`, `POST` | List or upload current visitor R2 files | `src/api/r2.ts` |
| `/__api/r2/files/{id}` | `GET`, `DELETE` | Preview/download or delete a visible R2 file | `src/api/r2.ts` |
| `/__api/r2/reset` | `POST` | Delete current visitor R2 uploads | `src/api/r2.ts` |
| `/__api/accessibility/lab` | `GET` | Locally bundled axe-core teaching frame | `src/ui/accessibility-lab.ts` |
| `/__api/git/evidence` | `GET` | Bounded, cached public GitHub delivery evidence | `src/api/git-evidence.ts` |
| `/__api/git/demo` | `GET` | Fast-polled active or recent live Git delivery status | `src/api/git-demo.ts` |
| `/__api/git/demo` | `POST` | Same-origin admin-authorized semantic-version workflow dispatch | `src/api/git-demo.ts` |
| `/__api/git/demo/release` | `POST` | Same-origin admin-authorized merge and release dispatch after successful CI | `src/api/git-demo.ts` |
| `/v1/demo-records` | `GET`, `POST` | REST record collection | `src/api/records.ts` |
| `/v1/demo-records/{key}` | `GET`, `PUT`, `DELETE` | Read, create/replace, or delete one REST record | `src/api/records.ts` |
| `/__api/api-sandbox/reset` | `POST` | Delete only the authenticated visitor's REST sandbox | `src/api/records.ts` |
| `/v1/openapi.json` | `GET` | Swagger 2.0 contract | `src/api/openapi.ts` |
| `/v1/openapi.yaml` | `GET` | Download the OpenAPI 2.0 contract as YAML | `src/api/openapi.ts` |
| `/graphql` | `GET`, `POST` | Focused GraphQL page for browser navigation; GraphQL execution for API clients | `src/api/graphql.ts` |
| `/graphql/console` | `GET` | Locally bundled embeddable GraphiQL | `src/ui/graphiql-assets.ts` |
| `/graphql/schema` | `GET` | GraphQL schema | `src/api/graphql.ts` |
| `/__assets/graphiql/{asset}` | `GET` | Locked local GraphiQL UI, CSS, and editor workers | `src/ui/graphiql-assets.ts` |
| `/v1/webhooks/demo` | `POST` | Signed webhook receiver | `src/api/webhooks.ts` |
| `/v1/webhooks/github` | `POST` | GitHub-compatible verified receiver | `src/api/webhooks.ts` |
| `/__api/webhooks/demo` | `POST` | Generate a session-scoped GitHub-shaped event | `src/api/webhooks.ts` |
| `/__api/webhooks/events` | `GET` | Poll verified GitHub and current-session events | `src/api/webhooks.ts` |
| `/__api/webhooks/reset` | `POST` | Reset current-session synthetic events | `src/api/webhooks.ts` |
| `/mcp/server` | `GET`, `POST`, `DELETE` | MCP 2026-07-28 and stateless legacy Streamable HTTP interface | `src/api/mcp.ts` |
| `/__api/identity/oauth-pkce` | `POST` | OAuth PKCE material | `src/api/identity.ts` |
| `/__api/identity/authorize` | `POST` | Application policy decision | `src/api/identity.ts` |
| `/__api/identity/token` | `POST` | Issue a ten-minute visitor-sandbox bearer token from the current identity session | `src/api/identity.ts` |
| `/__api/identity/sso` | `GET` | SSO trust boundary | `src/api/identity.ts` |
| `/identity/saml/metadata` | `GET` | SAML SP metadata | `src/api/identity.ts` |
| `/__api/identity/saml/inspect` | `GET` | SAML validation boundary | `src/api/identity.ts` |
| `/identity/microsoft` | `GET` | Start Microsoft Entra ID OIDC authentication | `src/api/identity.ts` |
| `/identity/microsoft/callback` | `GET` | Validate Microsoft Entra ID OIDC callback | `src/api/identity.ts` |
| `/identity/google` | `GET` | Start Google OIDC authentication | `src/api/identity.ts` |
| `/identity/google/callback` | `GET` | Validate Google OIDC callback | `src/api/identity.ts` |
| `/identity/github` | `GET` | Start GitHub OAuth authentication | `src/api/identity.ts` |
| `/identity/github/callback` | `GET` | Validate GitHub OAuth callback and API identity | `src/api/identity.ts` |
| `/identity/saml` | `GET` | Start Microsoft Entra ID SAML authentication | `src/api/identity.ts` |
| `/identity/saml/acs` | `POST` | Validate Microsoft Entra ID SAML assertion | `src/api/identity.ts` |
| `/identity/session` | `GET` | Current sanitized application identity | `src/api/identity.ts` |
| `/identity/logout` | `POST` | Revoke current application session | `src/api/identity.ts` |
| `/__api/operations/logs` | `GET` | Sanitized logs; offline-reachable | `src/api/operations.ts` |
| `/__api/operations/cloudflare-usage` | `GET` | Latest normalized Cloudflare usage snapshot; offline-reachable | `src/api/operations.ts` |
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
| ChatGPT crawler access and dynamic robots policy | `src/lib/crawler-control.ts` |
| Operations APIs | `src/api/operations.ts` |
| D1 base schema | `migrations/0001_demo_blob.sql` |
| Operations, log, and Cloudflare usage schemas | `migrations/0002_operations_dashboard.sql`, `migrations/0004_application_logs.sql`, `migrations/0011_cloudflare_usage.sql` |
| ChatGPT crawler-control schema | `migrations/0009_crawler_control.sql` |
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
| MCP interoperability test | `tests/mcp-client.test.ts` |
| Webhook event contract | `contracts/webhooks/events.json` |
| SAML metadata example | `contracts/identity/saml-metadata.example.xml` |
| Synthetic billing policy | `config/billing-demo.json` |
| i18n configuration | `config/i18n.json` |
| Locale resources | `src/i18n/locales/` |
| Accessibility plan | `docs/ACCESSIBILITY.md` |
| Seven-demo interaction specification | `docs/INTERACTIVE-DEMO-SPEC.md` |
| Identity plan | `docs/IDENTITY.md` |
| Evidence map | `docs/EVIDENCE.md` |
