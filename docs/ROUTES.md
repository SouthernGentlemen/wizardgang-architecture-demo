# Route-to-source map

This file is the stable public URL contract for `demo.wizardgang.ai`. The public architecture map contains 24 HTML routes in five groups. Retired page URLs remain stable through exact permanent redirects to focused routes or anchored sections; machine interfaces keep their existing paths and response shapes.

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
| Delivery & Governance | `/governance/risks` | Disclosure-safe security and AI risk assurance with stable anchors and evidence/control links | `src/demos/risks.ts` | Working |
| Delivery & Governance | `/governance/incidents` | Disclosure-safe actual-incident and simulated-exercise assurance with permanent record anchors | `src/demos/incidents.ts` | Working |
| Operations | `/dashboard` | Read-only operations center, detailed health, availability, activity, usage, and deployment | `src/demos/dashboard.ts` | Working |
| Operations | `/dashboard/uptime` | Scheduled availability history | `src/demos/uptime.ts` | Working |
| Operations | `/dashboard/docs` | Documentation index | `src/demos/docs.ts` | Working |
| Operations | `/dashboard/logs` | Public-safe log viewer | `src/demos/logs.ts` | Working |
| Operations | `/dashboard/billing` | Cloudflare usage, cost evidence, and separate guardrail simulator | `src/demos/billing.ts` | Working |

The architecture map at `/` and `/sitemap.xml` are generated from this 24-route registry.

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
| `/__api/operations/logs` | `GET` | Operational Logs JSON | `src/api/operations.ts` |
| `/__api/operations/cloudflare-usage` | `GET` | Sanitized Cloudflare Usage JSON | `src/api/operations.ts` |
| `/__api/edge/inspect` | `GET` | Edge Context JSON | `src/api/runtime.ts` |
| `/__api/workers/compute` | `POST` | Stateless Worker Compute | `src/api/runtime.ts` |
| `/__api/durable/counter` | `GET`, `POST` | Durable Object Counter | `src/api/durable.ts` |
| `/__api/d1/users` | `GET`, `POST` | D1 Demo Users | `src/api/d1-lab.ts` |
| `/__api/d1/users/{id}` | `PATCH`, `DELETE` | D1 Demo User | `src/api/d1-lab.ts` |
| `/__api/d1/tasks` | `GET`, `POST` | D1 Demo Tasks | `src/api/d1-lab.ts` |
| `/__api/d1/tasks/{id}` | `PATCH`, `DELETE` | D1 Demo Task | `src/api/d1-lab.ts` |
| `/__api/d1/reset` | `POST` | D1 Demo Reset | `src/api/d1-lab.ts` |
| `/__api/r2/demo` | `POST` | Visitor R2 Object Action | `src/api/r2.ts` |
| `/__api/r2/object` | `GET`, `PUT`, `DELETE` | R2 Object API | `src/api/r2.ts` |
| `/__api/r2/files` | `GET`, `POST` | R2 Visitor Files | `src/api/r2.ts` |
| `/__api/r2/files/{id}` | `GET`, `DELETE` | R2 Visitor File | `src/api/r2.ts` |
| `/__api/r2/reset` | `POST` | R2 Visitor Reset | `src/api/r2.ts` |
| `/__api/accessibility/lab` | `GET` | Sandboxed Accessibility Lab | `src/ui/accessibility-lab.ts` |
| `/__api/git/evidence` | `GET` | Live GitHub Delivery Evidence | `src/api/git-evidence.ts` |
| `/__api/git/demo` | `GET`, `POST` | Live Git Delivery Lifecycle | `src/api/git-demo.ts` |
| `/__api/git/demo/release` | `POST` | Live Git Merge and Release | `src/api/git-demo.ts` |
| `/v1/demo-records` | `GET`, `POST` | REST Demo Records | `src/api/records.ts` |
| `/v1/demo-records/{key}` | `GET`, `PUT`, `DELETE` | REST Demo Record | `src/api/records.ts` |
| `/__api/api-sandbox/reset` | `POST` | REST Visitor Sandbox Reset | `src/api/records.ts` |
| `/v1/openapi.json` | `GET` | Swagger 2.0 Contract | `src/api/openapi.ts` |
| `/v1/openapi.yaml` | `GET` | OpenAPI 2.0 YAML Contract | `src/api/openapi.ts` |
| `/graphql/console` | `GET` | Embedded GraphiQL | `src/ui/graphiql-assets.ts` |
| `/graphql/schema` | `GET` | GraphQL Schema | `src/api/graphql.ts` |
| `/__assets/graphiql/{asset}` | `GET` | Locally Bundled GraphiQL Assets | `src/ui/graphiql-assets.ts` |
| `/v1/webhooks/demo` | `POST` | Signed Webhook Receiver | `src/api/webhooks.ts` |
| `/v1/webhooks/github` | `POST` | Verified GitHub Webhook Receiver | `src/api/webhooks.ts` |
| `/__api/webhooks/demo` | `POST` | Visitor Signed Webhook Action | `src/api/webhooks.ts` |
| `/__api/webhooks/events` | `GET` | Verified Webhook Events | `src/api/webhooks.ts` |
| `/__api/webhooks/reset` | `POST` | Visitor Webhook Reset | `src/api/webhooks.ts` |
| `/mcp/server` | `GET`, `POST`, `DELETE` | MCP Streamable HTTP Server | `src/api/mcp.ts` |
| `/__api/identity/oauth-pkce` | `POST` | OAuth PKCE Material | `src/api/identity.ts` |
| `/__api/identity/authorize` | `POST` | Authorization Policy Evaluation | `src/api/identity.ts` |
| `/__api/identity/token` | `POST` | Short-lived Demo API Token | `src/api/identity.ts` |
| `/__api/identity/sso` | `GET` | SSO Trust Boundary | `src/api/identity.ts` |
| `/identity/saml/metadata` | `GET` | SAML Service Provider Metadata | `src/api/identity.ts` |
| `/__api/identity/saml/inspect` | `GET` | SAML Validation Boundary | `src/api/identity.ts` |
| `/identity/microsoft` | `GET` | Microsoft Entra ID OIDC Start | `src/api/identity.ts` |
| `/identity/microsoft/callback` | `GET` | Microsoft Entra ID OIDC Callback | `src/api/identity.ts` |
| `/identity/google` | `GET` | Google OIDC Start | `src/api/identity.ts` |
| `/identity/google/callback` | `GET` | Google OIDC Callback | `src/api/identity.ts` |
| `/identity/github` | `GET` | GitHub OAuth Start | `src/api/identity.ts` |
| `/identity/github/callback` | `GET` | GitHub OAuth Callback | `src/api/identity.ts` |
| `/identity/saml` | `GET` | Microsoft Entra ID SAML Start | `src/api/identity.ts` |
| `/identity/saml/acs` | `POST` | Microsoft Entra ID SAML ACS | `src/api/identity.ts` |
| `/identity/session` | `GET` | Identity Session | `src/api/identity.ts` |
| `/identity/logout` | `POST` | Identity Logout | `src/api/identity.ts` |
| `/__api/operations/billing` | `POST` | Synthetic Budget Scenario | `src/api/billing.ts` |
| `/__api/evidence/traceability` | `GET` | Traceability Evidence JSON | `src/api/governance.ts` |
| `/v1/assurance/risks` | `GET` | Disclosure-safe Risk Assurance JSON | `src/api/assurance.ts` |
| `/v1/assurance/incidents` | `GET` | Disclosure-safe Incident and Exercise Assurance JSON | `src/api/assurance.ts` |
| `/__api/governance/security-controls` | `GET` | Security Control Evidence JSON | `src/api/governance.ts` |
| `/__api/governance/ai-evaluation` | `POST` | AI Boundary Evaluation | `src/api/governance.ts` |

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
| Public assurance registry | `src/assurance/registry.ts` |
| Disclosure-safe assurance APIs | `src/api/assurance.ts` |
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
| Public assurance registry contract | `contracts/assurance/registry.schema.json` |
| Public risk assurance contract | `contracts/assurance/risk.schema.json` |
| Public risk assurance dataset | `assurance/risks/risks.json` |
| Public incident assurance contract | `contracts/assurance/incident.schema.json` |
| Public exercise assurance contract | `contracts/assurance/exercise.schema.json` |
| Public incident assurance dataset | `assurance/incidents/incidents.json` |
| Public exercise assurance dataset | `assurance/incidents/exercises.json` |
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
