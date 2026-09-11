# Route-to-source map

This file is generated from the active declarative application registry. Route IDs, URL patterns, methods, policy metadata, documentation, and source ownership must be changed in route declarations rather than edited here.

## Registered public navigation

| Route ID | Route | Methods | Kind | Visibility | Offline | Indexing | Purpose | Source |
|---|---|---|---|---|---|---|---|---|
| `interfaces.frontend.index` | `/` | `GET` | page | public | gated | allow | Architecture demo index | `src/ui/page.ts` |
| `assurance.index` | `/assurance` | `GET` | page | public | gated | allow | Assurance | `src/demos/assurance.ts` |
| `demos.index` | `/demos` | `GET` | page | public | gated | allow | Architecture Demos | `src/demos/demos-page.ts` |
| `operations.index` | `/operations` | `GET` | page | public | available | allow | Operations | `src/demos/operations.ts` |
| `security.index` | `/security` | `GET` | page | public | available | allow | Security | `src/demos/security-page.ts` |

## Registered service, protocol, asset, and private routes

| Route ID | Route | Methods | Kind | Visibility | Offline | Indexing | Purpose | Source |
|---|---|---|---|---|---|---|---|---|
| `operations.security-txt` | `/.well-known/security.txt` | `GET`, `HEAD` | protocol | public | available | deny | Security contact | `src/api/security-policy.ts` |
| `operations.admin` | `/admin` | `GET`, `POST` | page | private | available | deny | Demo administration | `src/ui/admin.ts` |
| `demos.presentation` | `/api/demos/{demo}` | `GET` | api | public | gated | deny | Lazy demo presentation fragment | `src/demos/demos-page.ts` |
| `platform.accessibility.lab` | `/api/labs/accessibility` | `GET` | api | public | gated | deny | Accessibility teaching laboratory API | `src/platform/route-capabilities/accessibility.ts` |
| `platform.d1.reset` | `/api/labs/d1-reset` | `POST` | api | public | gated | deny | D1 users and tasks reset laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.tasks` | `/api/labs/d1-tasks` | `GET`, `POST` | api | public | gated | deny | D1 tasks laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.task` | `/api/labs/d1-tasks/{id}` | `PATCH`, `DELETE` | api | public | gated | deny | D1 task item laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.users` | `/api/labs/d1-users` | `GET`, `POST` | api | public | gated | deny | D1 users laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.user` | `/api/labs/d1-users/{id}` | `PATCH`, `DELETE` | api | public | gated | deny | D1 user item laboratory API | `src/platform/route-capabilities/d1.ts` |
| `platform.durable-objects.counter` | `/api/labs/durable-counter` | `GET`, `POST` | api | public | gated | deny | Durable Object counter laboratory API | `src/platform/route-capabilities/durable-objects.ts` |
| `platform.edge.inspect` | `/api/labs/edge` | `GET` | api | public | gated | deny | Edge inspection laboratory API | `src/platform/route-capabilities/edge.ts` |
| `platform.git.delivery` | `/api/labs/git-delivery` | `GET`, `POST` | api | public | gated | deny | Git delivery laboratory API | `src/platform/route-capabilities/git.ts` |
| `platform.git.release` | `/api/labs/git-release` | `POST` | api | private | gated | deny | Git release laboratory action | `src/platform/route-capabilities/git.ts` |
| `platform.governance.ai-evaluation` | `/api/labs/governance-ai-evaluation` | `POST` | api | public | gated | deny | Governance AI-boundary laboratory API | `src/platform/route-capabilities/governance.ts` |
| `platform.governance.security-controls` | `/api/labs/governance-security-controls` | `GET` | api | public | gated | deny | Governance security-controls laboratory API | `src/platform/route-capabilities/governance.ts` |
| `platform.governance.traceability` | `/api/labs/governance-traceability` | `GET` | api | public | gated | deny | Governance traceability laboratory API | `src/platform/route-capabilities/governance.ts` |
| `platform.r2.files` | `/api/labs/r2-files` | `GET`, `POST` | api | public | gated | deny | R2 files laboratory API | `src/platform/route-capabilities/r2.ts` |
| `platform.r2.file` | `/api/labs/r2-files/{id}` | `GET`, `DELETE` | api | public | gated | deny | R2 file item laboratory API | `src/platform/route-capabilities/r2.ts` |
| `platform.r2.reset` | `/api/labs/r2-reset` | `POST` | api | public | gated | deny | R2 files reset laboratory API | `src/platform/route-capabilities/r2.ts` |
| `interfaces.rest.openapi.json` | `/api/labs/rest-demo-openapi.json` | `GET` | api | public | gated | deny | REST demo OpenAPI JSON | `src/api/rest-demo-openapi.ts` |
| `platform.d1.rest-demo-records` | `/api/labs/rest-demo-records` | `GET`, `POST` | api | public | gated | deny | Anonymous REST browser tutorial collection API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.rest-demo-record` | `/api/labs/rest-demo-records/{id}` | `GET`, `PUT`, `PATCH`, `DELETE` | api | public | gated | deny | Anonymous REST browser tutorial item API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.records` | `/api/labs/rest-records` | `GET`, `POST` | api | public | gated | deny | Authorized REST records machine API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.records-reset` | `/api/labs/rest-records-reset` | `POST` | api | public | gated | deny | Authorized REST record sandbox reset machine API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.record` | `/api/labs/rest-records/{id}` | `GET`, `PUT`, `DELETE` | api | public | gated | deny | Authorized REST record item machine API | `src/platform/route-capabilities/d1.ts` |
| `platform.webhooks.synthetic` | `/api/labs/webhook-demo` | `POST` | api | public | gated | deny | Synthetic webhook laboratory action | `src/platform/route-capabilities/webhooks.ts` |
| `platform.webhooks.events` | `/api/labs/webhook-events` | `GET` | api | public | gated | deny | Synthetic webhook event laboratory API | `src/platform/route-capabilities/webhooks.ts` |
| `platform.webhooks.reset` | `/api/labs/webhook-reset` | `POST` | api | public | gated | deny | Synthetic webhook reset laboratory API | `src/platform/route-capabilities/webhooks.ts` |
| `platform.workers.compute` | `/api/labs/workers` | `POST` | api | public | gated | deny | Worker edge-policy laboratory API | `src/platform/route-capabilities/workers.ts` |
| `interfaces.openapi.json` | `/api/openapi.json` | `GET` | api | public | gated | deny | OpenAPI JSON contract | `src/api/openapi.ts` |
| `operations.api-budget` | `/api/operations/budget` | `POST` | api | public | available | deny | Operations budget API | `src/api/billing.ts` |
| `operations.health` | `/api/operations/health` | `GET` | api | public | available | deny | Operations health | `src/api/operations.ts` |
| `operations.api-logs` | `/api/operations/logs` | `GET` | api | public | available | deny | Operations logs API | `src/api/operations.ts` |
| `operations.version` | `/api/operations/version` | `GET` | api | public | available | deny | Operations version | `src/api/operations.ts` |
| `reporting.index` | `/api/reporting` | `GET`, `OPTIONS` | api | public | gated | deny | Reporting collection index | `src/api/reporting.ts` |
| `reporting.collection` | `/api/reporting/{collection}` | `GET`, `OPTIONS` | api | public | gated | deny | Reporting collection API | `src/api/reporting.ts` |
| `reporting.record` | `/api/reporting/{collection}/{recordId}` | `GET`, `PATCH`, `OPTIONS` | api | public | gated | deny | Reporting record API | `src/api/reporting.ts` |
| `operations.assets` | `/assets/{asset}` | `GET`, `HEAD` | asset | public | available | deny | Bundled UI asset | `src/ui/assets.ts` |
| `interfaces.identity.authorize` | `/auth/authorize` | `POST` | api | private | gated | deny | Identity authorization decision | `src/api/identity.ts` |
| `interfaces.identity.github.start` | `/auth/github` | `GET` | protocol | public | gated | deny | github authorization start | `src/api/identity.ts` |
| `interfaces.identity.github.callback` | `/auth/github/callback` | `GET` | protocol | public | gated | deny | github authorization callback | `src/api/identity.ts` |
| `interfaces.identity.google.start` | `/auth/google` | `GET` | protocol | public | gated | deny | google authorization start | `src/api/identity.ts` |
| `interfaces.identity.google.callback` | `/auth/google/callback` | `GET` | protocol | public | gated | deny | google authorization callback | `src/api/identity.ts` |
| `interfaces.identity.logout` | `/auth/logout` | `POST` | api | public | gated | deny | Identity logout | `src/api/identity.ts` |
| `interfaces.identity.microsoft.start` | `/auth/microsoft` | `GET` | protocol | public | gated | deny | microsoft authorization start | `src/api/identity.ts` |
| `interfaces.identity.microsoft.callback` | `/auth/microsoft/callback` | `GET` | protocol | public | gated | deny | microsoft authorization callback | `src/api/identity.ts` |
| `interfaces.identity.saml.start` | `/auth/saml` | `GET` | protocol | public | gated | deny | SAML sign-in start | `src/api/identity.ts` |
| `interfaces.identity.saml.acs` | `/auth/saml/acs` | `POST` | protocol | public | gated | deny | SAML assertion consumer service | `src/api/identity.ts` |
| `interfaces.identity.saml.metadata` | `/auth/saml/metadata` | `GET` | protocol | public | gated | deny | SAML service-provider metadata | `src/api/identity.ts` |
| `interfaces.identity.session` | `/auth/session` | `GET` | api | public | gated | deny | Identity session | `src/api/identity.ts` |
| `interfaces.identity.token` | `/auth/token` | `POST` | api | private | gated | deny | Identity demo access token | `src/api/identity.ts` |
| `interfaces.graphql.endpoint` | `/graphql` | `GET`, `POST` | protocol | public | gated | deny | GraphQL API | `src/api/graphql.ts` |
| `interfaces.mcp.server` | `/mcp` | `GET`, `POST`, `DELETE` | protocol | public | gated | deny | MCP streamable HTTP server | `src/api/mcp.ts` |
| `operations.offline` | `/offline` | `GET` | page | public | available | deny | Offline recovery page | `src/ui/admin.ts` |
| `operations.robots` | `/robots.txt` | `GET`, `HEAD` | protocol | public | available | deny | Robots policy | `src/lib/crawler-control.ts` |
| `operations.sitemap` | `/sitemap.xml` | `GET` | protocol | public | gated | deny | Sitemap | `src/api/sitemap.ts` |
| `interfaces.webhooks.github` | `/webhooks/github` | `POST` | protocol | public | gated | deny | GitHub webhook receiver | `src/api/webhooks.ts` |

## Generation

- Runtime registry: `src/routing/application-routes.ts`
- Route contract: `src/routing/registry.ts`
- Artifact projection: `src/routing/artifacts.ts`
- Regenerate: `npm run generate:routes`
- Validate: `npm run validate:routes`

Unknown paths are not inferred from prefixes or aliases; they use the normal 404 response.
