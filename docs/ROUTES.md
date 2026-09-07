# Route-to-source map

This file is generated from the active declarative application registry. Route IDs, URL patterns, methods, policy metadata, documentation, and source ownership must be changed in route declarations rather than edited here.

## Registered public navigation

| Route ID | Route | Methods | Kind | Visibility | Offline | Indexing | Purpose | Source |
|---|---|---|---|---|---|---|---|---|
| `interfaces.frontend.index` | `/` | `GET` | page | public | gated | allow | Architecture demo index | `src/ui/page.ts` |
| `assurance.wizardgang-public-assurance.html` | `/assurance` | `GET` | page | public | gated | allow | Assurance registry html | `src/demos/assurance.ts` |
| `interfaces.page` | `/interfaces` | `GET` | page | public | gated | allow | Interfaces | `src/demos/interfaces.ts` |
| `operations.page` | `/operations` | `GET` | page | public | available | allow | Operations | `src/demos/operations.ts` |
| `platform.page` | `/platform` | `GET` | page | public | gated | allow | Cloudflare Platform | `src/demos/platform.ts` |
| `assurance.advisories.html` | `/security` | `GET` | page | public | available | allow | Assurance advisories html | `src/demos/security-page.ts` |

## Registered service, protocol, asset, and private routes

| Route ID | Route | Methods | Kind | Visibility | Offline | Indexing | Purpose | Source |
|---|---|---|---|---|---|---|---|---|
| `platform.accessibility.lab` | `/__api/accessibility/lab` | `GET` | api | public | gated | deny | Accessibility teaching frame | `src/platform/route-capabilities/accessibility.ts` |
| `platform.d1.records-reset` | `/__api/api-sandbox/reset` | `POST` | api | public | gated | deny | D1 record sandbox reset API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.reset` | `/__api/d1/reset` | `POST` | api | public | gated | deny | D1 users and tasks reset API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.tasks` | `/__api/d1/tasks` | `GET`, `POST` | api | public | gated | deny | D1 tasks laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.task` | `/__api/d1/tasks/{id}` | `PATCH`, `DELETE` | api | public | gated | deny | D1 task item laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.users` | `/__api/d1/users` | `GET`, `POST` | api | public | gated | deny | D1 users laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.user` | `/__api/d1/users/{id}` | `PATCH`, `DELETE` | api | public | gated | deny | D1 user item laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.durable-objects.counter` | `/__api/durable/counter` | `GET`, `POST` | api | public | gated | deny | Durable Object counter API | `src/platform/route-capabilities/durable-objects.ts` |
| `platform.edge.inspect` | `/__api/edge/inspect` | `GET` | api | public | gated | deny | Edge inspection API | `src/platform/route-capabilities/edge.ts` |
| `interfaces.governance.traceability` | `/__api/evidence/traceability` | `GET` | api | public | gated | deny | Governance traceability evidence | `src/api/governance.ts` |
| `interfaces.git.demo` | `/__api/git/demo` | `GET`, `POST` | api | public | gated | deny | Git delivery demonstration | `src/api/git-demo.ts` |
| `interfaces.git.demo-release` | `/__api/git/demo/release` | `POST` | api | private | gated | deny | Git demo release action | `src/api/git-demo.ts` |
| `interfaces.governance.ai-evaluation` | `/__api/governance/ai-evaluation` | `POST` | api | public | gated | deny | Governance AI boundary evaluation | `src/api/governance.ts` |
| `interfaces.governance.security-controls` | `/__api/governance/security-controls` | `GET` | api | public | gated | deny | Governance security controls | `src/api/governance.ts` |
| `interfaces.identity.authorize` | `/__api/identity/authorize` | `POST` | api | private | gated | deny | Identity authorization decision | `src/api/identity.ts` |
| `interfaces.identity.oauth-pkce` | `/__api/identity/oauth-pkce` | `POST` | api | public | gated | deny | OAuth PKCE boundary demonstration | `src/api/identity.ts` |
| `interfaces.identity.saml.inspect` | `/__api/identity/saml/inspect` | `GET` | api | public | gated | deny | SAML boundary inspection | `src/api/identity.ts` |
| `interfaces.identity.sso-boundary` | `/__api/identity/sso` | `GET` | api | public | gated | deny | SSO boundary status | `src/api/identity.ts` |
| `interfaces.identity.token` | `/__api/identity/token` | `POST` | api | private | gated | deny | Identity demo access token | `src/api/identity.ts` |
| `platform.r2.demo-object` | `/__api/r2/demo` | `POST` | api | public | gated | deny | R2 demonstration object API | `src/platform/route-capabilities/r2.ts` |
| `platform.r2.files` | `/__api/r2/files` | `GET`, `POST` | api | public | gated | deny | R2 files laboratory API | `src/platform/route-capabilities/r2.ts` |
| `platform.r2.file` | `/__api/r2/files/{id}` | `GET`, `DELETE` | api | public | gated | deny | R2 file item laboratory API | `src/platform/route-capabilities/r2.ts` |
| `platform.r2.object` | `/__api/r2/object` | `GET`, `PUT`, `DELETE` | api | public | gated | deny | R2 object API | `src/platform/route-capabilities/r2.ts` |
| `platform.r2.reset` | `/__api/r2/reset` | `POST` | api | public | gated | deny | R2 files reset API | `src/platform/route-capabilities/r2.ts` |
| `interfaces.webhooks.synthetic` | `/__api/webhooks/demo` | `POST` | api | public | gated | deny | Synthetic webhook action | `src/api/webhooks.ts` |
| `interfaces.webhooks.events` | `/__api/webhooks/events` | `GET` | api | public | gated | deny | Verified webhook events | `src/api/webhooks.ts` |
| `interfaces.webhooks.reset` | `/__api/webhooks/reset` | `POST` | api | public | gated | deny | Webhook demo reset | `src/api/webhooks.ts` |
| `platform.workers.compute` | `/__api/workers/compute` | `POST` | api | public | gated | deny | Worker computation API | `src/platform/route-capabilities/workers.ts` |
| `interfaces.graphql.asset` | `/__assets/graphiql/{asset}` | `GET` | asset | public | gated | deny | GraphiQL local asset | `src/ui/graphiql-assets.ts` |
| `operations.security-txt` | `/.well-known/security.txt` | `GET`, `HEAD` | protocol | public | available | deny | Security contact | `src/api/security-policy.ts` |
| `operations.admin` | `/admin` | `GET`, `POST` | page | private | available | deny | Demo administration | `src/ui/admin.ts` |
| `interfaces.openapi.json` | `/api/openapi.json` | `GET` | api | public | gated | deny | OpenAPI JSON contract | `src/api/openapi.ts` |
| `operations.api-budget` | `/api/operations/budget` | `POST` | api | public | available | deny | Operations budget API | `src/api/billing.ts` |
| `operations.health` | `/api/operations/health` | `GET` | api | public | available | deny | Operations health | `src/api/operations.ts` |
| `operations.api-logs` | `/api/operations/logs` | `GET` | api | public | available | deny | Operations logs API | `src/api/operations.ts` |
| `operations.api-usage` | `/api/operations/usage` | `GET` | api | public | available | deny | Operations usage API | `src/api/operations.ts` |
| `operations.version` | `/api/operations/version` | `GET` | api | public | available | deny | Operations version | `src/api/operations.ts` |
| `reporting.index` | `/api/reporting` | `GET`, `OPTIONS` | api | public | gated | deny | Reporting collection index | `src/api/reporting.ts` |
| `reporting.collection` | `/api/reporting/{collection}` | `GET`, `OPTIONS` | api | public | gated | deny | Reporting collection API | `src/api/reporting.ts` |
| `reporting.record` | `/api/reporting/{collection}/{recordId}` | `GET`, `PATCH`, `OPTIONS` | api | public | gated | deny | Reporting record API | `src/api/reporting.ts` |
| `interfaces.graphql.endpoint` | `/graphql` | `GET`, `POST` | protocol | public | gated | deny | GraphQL API | `src/api/graphql.ts` |
| `interfaces.graphql.schema` | `/graphql/schema` | `GET` | protocol | public | gated | deny | GraphQL schema | `src/api/graphql.ts` |
| `interfaces.identity.github.start` | `/identity/github` | `GET` | protocol | public | gated | deny | github authorization start | `src/api/identity.ts` |
| `interfaces.identity.github.callback` | `/identity/github/callback` | `GET` | protocol | public | gated | deny | github authorization callback | `src/api/identity.ts` |
| `interfaces.identity.google.start` | `/identity/google` | `GET` | protocol | public | gated | deny | google authorization start | `src/api/identity.ts` |
| `interfaces.identity.google.callback` | `/identity/google/callback` | `GET` | protocol | public | gated | deny | google authorization callback | `src/api/identity.ts` |
| `interfaces.identity.logout` | `/identity/logout` | `POST` | api | public | gated | deny | Identity logout | `src/api/identity.ts` |
| `interfaces.identity.microsoft.start` | `/identity/microsoft` | `GET` | protocol | public | gated | deny | microsoft authorization start | `src/api/identity.ts` |
| `interfaces.identity.microsoft.callback` | `/identity/microsoft/callback` | `GET` | protocol | public | gated | deny | microsoft authorization callback | `src/api/identity.ts` |
| `interfaces.identity.saml.start` | `/identity/saml` | `GET` | protocol | public | gated | deny | SAML sign-in start | `src/api/identity.ts` |
| `interfaces.identity.saml.acs` | `/identity/saml/acs` | `POST` | protocol | public | gated | deny | SAML assertion consumer service | `src/api/identity.ts` |
| `interfaces.identity.saml.metadata` | `/identity/saml/metadata` | `GET` | protocol | public | gated | deny | SAML service-provider metadata | `src/api/identity.ts` |
| `interfaces.identity.session` | `/identity/session` | `GET` | api | public | gated | deny | Identity session | `src/api/identity.ts` |
| `interfaces.mcp.server` | `/mcp/server` | `GET`, `POST`, `DELETE` | protocol | public | gated | deny | MCP streamable HTTP server | `src/api/mcp.ts` |
| `operations.offline` | `/offline` | `GET` | page | public | available | deny | Offline recovery page | `src/ui/admin.ts` |
| `operations.social-card` | `/og.png` | `GET`, `HEAD` | asset | public | available | deny | Social preview image | `src/ui/brand-assets.ts` |
| `operations.robots` | `/robots.txt` | `GET`, `HEAD` | protocol | public | available | deny | Robots policy | `src/lib/crawler-control.ts` |
| `operations.sitemap` | `/sitemap.xml` | `GET` | protocol | public | gated | deny | Sitemap | `src/api/sitemap.ts` |
| `platform.d1.records` | `/v1/demo-records` | `GET`, `POST` | api | public | gated | deny | D1 records collection API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.record` | `/v1/demo-records/{key}` | `GET`, `PUT`, `DELETE` | api | public | gated | deny | D1 record item API | `src/platform/route-capabilities/d1.ts` |
| `interfaces.webhooks.demo-receipt` | `/v1/webhooks/demo` | `POST` | protocol | public | gated | deny | Signed demo webhook receiver | `src/api/webhooks.ts` |
| `interfaces.webhooks.github` | `/v1/webhooks/github` | `POST` | protocol | public | gated | deny | GitHub webhook receiver | `src/api/webhooks.ts` |

## Generation

- Runtime registry: `src/routing/application-routes.ts`
- Route contract: `src/routing/registry.ts`
- Artifact projection: `src/routing/artifacts.ts`
- Regenerate: `npm run generate:routes`
- Validate: `npm run validate:routes`

Unknown paths are not inferred from prefixes or aliases; they use the normal 404 response.
