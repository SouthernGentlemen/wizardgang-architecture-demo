# Frontend Information Architecture

DEMO-196 completes the application-owned browser hierarchy for the operations surface. `/platform`, `/interfaces`, `/assurance`, and `/operations` are real index pages, and each architectural presentation is a separately declared child resource. Feature metadata references application route IDs; it does not own browser pathnames.

| Surface | Route ID | Path | Browser state |
| --- | --- | --- | --- |
| Home | `interfaces.frontend.index` | `/` | none |
| Platform index | `platform.index` | `/platform` | none |
| Edge | `platform.edge` | `/platform/edge` | none |
| Workers | `platform.workers` | `/platform/workers` | none |
| Durable Objects | `platform.durable-objects` | `/platform/durable-objects` | none |
| D1 | `platform.d1` | `/platform/d1` | none |
| R2 | `platform.r2` | `/platform/r2` | none |
| Interfaces index | `interfaces.index` | `/interfaces` | none |
| REST | `interfaces.rest` | `/interfaces/rest` | request deep-link state such as `requestId` |
| GraphQL console | `interfaces.graphql.console` | `/interfaces/graphql` | console state |
| Webhooks console | `interfaces.webhooks.console` | `/interfaces/webhooks` | console state |
| Identity | `interfaces.identity.page` | `/interfaces/identity` | provider/auth result state |
| MCP console | `interfaces.mcp.console` | `/interfaces/mcp` | console state |
| Internationalization | `interfaces.i18n` | `/interfaces/i18n` | `locale` |
| Accessibility | `interfaces.accessibility` | `/interfaces/accessibility` | `mode` |
| Assurance index | `assurance.index` | `/assurance` | none |
| Delivery assurance | `assurance.delivery` | `/assurance/delivery` | reporting/filter state only |
| Governance assurance | `assurance.governance` | `/assurance/governance` | reporting/filter state only |
| Evidence assurance | `assurance.evidence` | `/assurance/evidence` | search state and stable fragments |
| Compliance assurance | `assurance.compliance` | `/assurance/compliance` | framework/status/level filters and stable fragments |
| Risk assurance | `assurance.risks` | `/assurance/risks` | framework/status/residual filters and stable fragments |
| Incident assurance | `assurance.incidents` | `/assurance/incidents` | reporting state and stable fragments |
| Concern intake | `assurance.concerns` | `/assurance/concerns` | none |
| Security | `security.index` | `/security` | none |
| Operations index | `operations.index` | `/operations` | none |
| Availability | `operations.availability` | `/operations/availability` | none |
| Public-safe logs | `operations.logs` | `/operations/logs` | log filter and request-correlation state |
| Usage and cost | `operations.usage` | `/operations/usage` | none |
| Operations reports | `operations.reports` | `/operations/reports` | reporting/filter state only |
| Operations documentation | `operations.docs` | `/operations/docs` | none |
| Admin | `operations.admin` | `/admin` | none |
| Offline | `operations.offline` | `/offline` | none |

Route metadata owns labels, summaries, parentage, navigation placement, architecture-map membership, visibility, indexing policy, sitemap publication, and source provenance. There is no separate frontend route or query-view inventory.

## Resources versus state

Platform, interface, assurance, and operations presentations are resources, so they use canonical child pathnames. Retired resource-selection `view` forms have no redirect or alias and return the ordinary 404.

Query parameters remain appropriate for interaction state. Examples include `/interfaces/i18n?locale=ar`, `/interfaces/accessibility?mode=broken`, REST `requestId` deep links, `/assurance/risks?residual=high#SEC-RISK-001`, and `/operations/logs?level=warn&source=rest`.

## Protocol and machine endpoints

Protocol and API URLs remain separate from browser pages. `/graphql` is a machine-only GraphQL protocol endpoint even for `Accept: text/html`; the locally bundled GraphiQL document is served from `/interfaces/graphql`. `/mcp` remains the MCP protocol endpoint while `/interfaces/mcp` is its browser console. Identity callbacks, webhook endpoints, `/api/labs/*`, `/api/operations/health`, `/api/operations/version`, and other registered machine contracts keep their existing protocol/API route IDs and URLs.

## Retired HTML paths

Every removed top-level HTML pathname remains enumerated in `tests/fixtures/removed-html-pathnames.ts`. Removed page paths and retired resource-selection query-view URLs have no redirects, aliases, or alternate renderers and fall through to the ordinary 404. `/graphql` remains a retained protocol pathname, not a browser alias.

## Rendering model

The application has no client-side router. `src/router.ts` normalizes and matches requests on the server, while capability-owned route declarations supply browser handlers and metadata. Client scripts may enhance controls or update true interaction state, but they do not dispatch application routes or emulate the canonical child hierarchy.
