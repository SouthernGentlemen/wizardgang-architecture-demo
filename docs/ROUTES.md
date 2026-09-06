# Route-to-source map

This file is generated from the active declarative application registry. Route IDs, URL patterns, methods, policy metadata, documentation, and source ownership must be changed in route declarations rather than edited here.

## Registered public navigation

| Route ID | Route | Methods | Kind | Visibility | Offline | Indexing | Purpose | Source |
|---|---|---|---|---|---|---|---|---|
| `interfaces.frontend.index` | `/` | `GET` | page | public | gated | allow | Architecture demo index | `src/ui/page.ts` |
| `platform.accessibility.page` | `/accessibility` | `GET` | page | public | gated | allow | WCAG 2.2 | `src/platform/route-capabilities/accessibility.ts` |
| `interfaces.rest.page` | `/api` | `GET` | page | public | gated | allow | REST API | `src/demos/api-page.ts` |
| `assurance.compliance.iso-27001.html` | `/compliance` | `GET` | page | public | gated | allow | Assurance compliance html | `src/demos/compliance-page.ts` |
| `platform.d1.page` | `/d1` | `GET` | page | public | gated | allow | Cloudflare D1 | `src/platform/route-capabilities/d1.ts` |
| `operations.dashboard` | `/dashboard` | `GET` | page | public | available | allow | Operations dashboard | `src/demos/operations-pages.ts` |
| `operations.dashboard-billing` | `/dashboard/billing` | `GET` | page | public | available | allow | Usage and cost | `src/demos/operations-pages.ts` |
| `operations.dashboard-docs` | `/dashboard/docs` | `GET` | page | public | available | allow | Operations documentation | `src/demos/operations-pages.ts` |
| `operations.dashboard-logs` | `/dashboard/logs` | `GET` | page | public | available | allow | Operations logs | `src/demos/logs.ts` |
| `operations.dashboard-uptime` | `/dashboard/uptime` | `GET` | page | public | available | allow | Availability history | `src/demos/operations-pages.ts` |
| `platform.durable-objects.page` | `/durable-objects` | `GET` | page | public | gated | allow | Durable Objects | `src/platform/route-capabilities/durable-objects.ts` |
| `platform.edge.page` | `/edge` | `GET` | page | public | gated | allow | Cloudflare Edge | `src/platform/route-capabilities/edge.ts` |
| `assurance.evidence.html` | `/evidence` | `GET` | page | public | gated | allow | Assurance evidence html | `src/demos/evidence-page.ts` |
| `interfaces.git.page` | `/git` | `GET` | page | public | gated | allow | Git / GitHub | `src/demos/git-page.ts` |
| `interfaces.governance.page` | `/governance` | `GET` | page | public | gated | allow | Governance | `src/ui/page.ts` |
| `interfaces.governance.concerns` | `/governance/concerns` | `GET` | page | public | gated | allow | Report a Concern | `src/demos/assurance-pages.ts` |
| `assurance.incidents.html` | `/governance/incidents` | `GET` | page | public | gated | allow | Assurance incidents html | `src/demos/assurance-pages.ts` |
| `assurance.risks.html` | `/governance/risks` | `GET` | page | public | gated | allow | Assurance risks html | `src/demos/assurance-pages.ts` |
| `interfaces.graphql.endpoint` | `/graphql` | `GET`, `POST` | protocol | public | gated | allow | GraphQL API | `src/api/graphql.ts` |
| `interfaces.i18n.page` | `/i18n` | `GET` | page | public | gated | allow | Internationalization | `src/demos/i18n-page.ts` |
| `interfaces.identity.page` | `/identity` | `GET` | page | public | gated | allow | Authentication & SSO | `src/demos/identity-page.ts` |
| `interfaces.mcp.page` | `/mcp` | `GET` | page | public | gated | allow | Model Context Protocol | `src/demos/mcp-page.ts` |
| `platform.r2.page` | `/r2` | `GET` | page | public | gated | allow | Cloudflare R2 | `src/platform/route-capabilities/r2.ts` |
| `assurance.advisories.html` | `/security` | `GET` | page | public | available | allow | Assurance advisories html | `src/demos/security-page.ts` |
| `interfaces.webhooks.page` | `/webhooks` | `GET` | page | public | gated | allow | Signed Webhooks | `src/demos/webhook-console.ts` |
| `platform.workers.page` | `/workers` | `GET` | page | public | gated | allow | Cloudflare Workers | `src/platform/route-capabilities/workers.ts` |

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
| `interfaces.git.reporting` | `/__api/git/evidence` | `GET`, `POST` | api | public | gated | deny | GitHub assurance reporting | `src/api/git-evidence.ts` |
| `interfaces.governance.ai-evaluation` | `/__api/governance/ai-evaluation` | `POST` | api | public | gated | deny | Governance AI boundary evaluation | `src/api/governance.ts` |
| `interfaces.governance.security-controls` | `/__api/governance/security-controls` | `GET` | api | public | gated | deny | Governance security controls | `src/api/governance.ts` |
| `interfaces.identity.authorize` | `/__api/identity/authorize` | `POST` | api | private | gated | deny | Identity authorization decision | `src/api/identity.ts` |
| `interfaces.identity.oauth-pkce` | `/__api/identity/oauth-pkce` | `POST` | api | public | gated | deny | OAuth PKCE boundary demonstration | `src/api/identity.ts` |
| `interfaces.identity.saml.inspect` | `/__api/identity/saml/inspect` | `GET` | api | public | gated | deny | SAML boundary inspection | `src/api/identity.ts` |
| `interfaces.identity.sso-boundary` | `/__api/identity/sso` | `GET` | api | public | gated | deny | SSO boundary status | `src/api/identity.ts` |
| `interfaces.identity.token` | `/__api/identity/token` | `POST` | api | private | gated | deny | Identity demo access token | `src/api/identity.ts` |
| `operations.api-billing` | `/__api/operations/billing` | `POST` | api | public | available | deny | Billing scenario API | `src/api/billing.ts` |
| `operations.api-cloudflare-usage` | `/__api/operations/cloudflare-usage` | `GET` | api | public | available | deny | Cloudflare usage API | `src/api/operations.ts` |
| `operations.api-logs` | `/__api/operations/logs` | `GET` | api | public | available | deny | Operations logs API | `src/api/operations.ts` |
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
| `interfaces.graphql.console` | `/graphql/console` | `GET` | page | public | gated | deny | GraphiQL console | `src/ui/graphiql-assets.ts` |
| `interfaces.graphql.schema` | `/graphql/schema` | `GET` | protocol | public | gated | deny | GraphQL schema | `src/api/graphql.ts` |
| `operations.health` | `/health` | `GET` | api | public | available | deny | Health | `src/api/operations.ts` |
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
| `assurance.wizardgang-public-assurance.collection` | `/v1/assurance` | `GET`, `OPTIONS` | api | public | gated | deny | Assurance registry collection | `src/api/assurance-registry.ts` |
| `assurance.advisories.collection` | `/v1/assurance/advisories` | `GET`, `OPTIONS` | api | public | gated | deny | Assurance advisories collection | `src/api/advisories.ts` |
| `assurance.compliance.iso-27001.collection` | `/v1/assurance/compliance` | `GET`, `OPTIONS` | api | public | gated | deny | Assurance compliance collection | `src/api/assurance.ts` |
| `assurance.compliance.iso-27001.detail` | `/v1/assurance/compliance/{recordId}` | `GET`, `OPTIONS` | api | public | gated | deny | Assurance compliance detail | `src/api/assurance.ts` |
| `assurance.evidence.collection` | `/v1/assurance/evidence` | `GET`, `OPTIONS` | api | public | gated | deny | Assurance evidence collection | `src/api/assurance-registry.ts` |
| `assurance.incidents.collection` | `/v1/assurance/incidents` | `GET`, `OPTIONS` | api | public | gated | deny | Assurance incidents collection | `src/api/assurance.ts` |
| `assurance.risks.collection` | `/v1/assurance/risks` | `GET`, `OPTIONS` | api | public | gated | deny | Assurance risks collection | `src/api/assurance.ts` |
| `platform.d1.records` | `/v1/demo-records` | `GET`, `POST` | api | public | gated | deny | D1 records collection API | `src/platform/route-capabilities/d1.ts` |
| `platform.d1.record` | `/v1/demo-records/{key}` | `GET`, `PUT`, `DELETE` | api | public | gated | deny | D1 record item API | `src/platform/route-capabilities/d1.ts` |
| `interfaces.openapi.json` | `/v1/openapi.json` | `GET` | api | public | gated | deny | OpenAPI JSON contract | `src/api/openapi.ts` |
| `interfaces.openapi.yaml` | `/v1/openapi.yaml` | `GET` | api | public | gated | deny | OpenAPI YAML contract | `src/api/openapi.ts` |
| `interfaces.webhooks.demo-receipt` | `/v1/webhooks/demo` | `POST` | protocol | public | gated | deny | Signed demo webhook receiver | `src/api/webhooks.ts` |
| `interfaces.webhooks.github` | `/v1/webhooks/github` | `POST` | protocol | public | gated | deny | GitHub webhook receiver | `src/api/webhooks.ts` |
| `operations.version` | `/version` | `GET` | api | public | available | deny | Version | `src/api/operations.ts` |

## Generation

- Runtime registry: `src/routing/application-routes.ts`
- Route contract: `src/routing/registry.ts`
- Artifact projection: `src/routing/artifacts.ts`
- Regenerate: `npm run generate:routes`
- Validate: `npm run validate:routes`

Unknown paths are not inferred from prefixes or aliases; they use the normal 404 response.
