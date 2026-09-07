# Frontend Information Architecture

DEMO-183 defines one authoritative frontend contract. The application has exactly eight HTML page pathnames:

| Surface | Route ID | Path | Query-selected views |
| --- | --- | --- | --- |
| Home | `interfaces.frontend.index` | `/` | none |
| Platform | `platform.page` | `/platform` | `edge`, `workers`, `durable-objects`, `d1`, `r2` |
| Interfaces | `interfaces.page` | `/interfaces` | `rest`, `graphql`, `webhooks`, `identity`, `mcp`, `i18n`, `accessibility` |
| Assurance | `assurance.wizardgang-public-assurance.html` | `/assurance` | `overview`, `delivery`, `governance`, `evidence`, `compliance`, `risks`, `incidents`, `concerns` |
| Security | `assurance.advisories.html` | `/security` | none |
| Operations | `operations.page` | `/operations` | `overview`, `availability`, `logs`, `usage`, `reports`, `docs` |
| Admin | `operations.admin` | `/admin` | none |
| Offline | `operations.offline` | `/offline` | none |

`src/demos/registry.ts` owns these surface declarations and their view inventory. Navigation and sitemap publication are derived from the same declarations through application-route metadata. Application-registry validation fails if a ninth `kind: page` route is registered or one of the eight canonical page declarations is missing.

## Views are state, not routes

A named view never creates another pathname. Deep links use the owning surface pathname with a `view` query parameter, for example:

- `/platform?view=d1`
- `/interfaces?view=graphql`
- `/assurance?view=risks#SEC-RISK-001`
- `/operations?view=logs`

Frontend code builds these links through the surface route-ID/view helpers instead of introducing route aliases. Unknown view values return the normal 404 document. Assurance record anchors remain stable after the route collapse.

## Protocol and machine endpoints

Protocol and API URLs remain separate from the frontend page contract. In particular, `/graphql` is a machine-only GraphQL protocol endpoint even when a browser sends `Accept: text/html`; it does not render GraphiQL or another removed page. The locally bundled GraphiQL document is embedded inside `/interfaces?view=graphql`. Identity callbacks, webhook endpoints, MCP, `/api/operations/health`, `/api/operations/version`, and other registered machine contracts keep their protocol/API kinds and are not HTML pages.

## Retired HTML paths

Every removed HTML pathname is enumerated once in `tests/fixtures/removed-html-pathnames.ts`. Removed page paths have no redirects, aliases, or alternate renderers and fall through to the ordinary 404. The fixture separately marks `/graphql` as a retained protocol pathname so tests can prove that it remains machine-only rather than treating it as a removed endpoint.

## Rendering model

The application has no client-side router. `src/router.ts` normalizes and matches requests on the server, while surface renderers select views from query state and return complete server-rendered documents. Client scripts may enhance controls inside a document, but they do not dispatch application routes or mutate browser history to emulate routes.
