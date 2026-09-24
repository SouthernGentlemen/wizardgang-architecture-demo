# Operations

There is no human-facing `/operations` page. The pathname is not redirected or aliased; requests fall through to the application's standard 404 response, including requests with query parameters.

## Visitor-facing proof

The homepage carries intentionally small public operational proof:

- current service/dependency state;
- measured scheduled-availability summary and monitoring qualification;
- running semantic version and source/commit identity.

Do not add a public operations dashboard to the homepage. Detailed logs, raw health payloads, observation tables, usage/cost dashboards, synthetic billing controls, resource-pressure internals, and deployment-internals views are not ordinary public HTML destinations.

## Preserved operational contracts

Route retirement does not remove the operational system. The following remain independently declared and supported:

- `/api/operations/health` and `/api/operations/version`; the health payload includes one public-safe identity readiness value, `ready` or `not-configured`, without identifying a credential or its properties;
- the existing operational log/budget and reporting machine contracts;
- scheduled availability collection and persistence;
- the 365-day availability retention policy;
- current service/dependency and provider observations;
- version, commit, source, and release identity;
- bounded public-safe logging plus internal operational data;
- protected `/admin` and recovery `/offline` pages;
- crawler controls, `robots.txt`, `/.well-known/security.txt`, assets, and the sitemap protocol route.

Cloudflare Worker Version IDs and production traffic allocations are provider-side deployment evidence. The deployment workflow binds that evidence to Wrangler's structured deploy result before it accepts the public version, health, identity, and browser-asset checks; provider IDs are not added to the public operations API.

Interactive health reads remain read-only. Identity readiness is informational and does not change the existing health status or HTTP status-code semantics. Scheduled five-minute observations are the measured availability evidence and records older than 365 days are purged by the existing collector behavior.

The public log API returns only the identity log envelope needed for bounded diagnostics; structured identity detail is withheld. Identity audit-event payload detail is likewise excluded from public event projections. Subject-derived audit identifiers and visitor sandbox namespaces are not retained in application-log detail.

## Route and source ownership

Operational route declarations remain in `src/routing/operational-routes.ts`; machine collection remains in `src/api/operations.ts`; usage/provider observation remains in `src/lib/cloudflare-usage.ts`; logs remain in `src/lib/logs.ts`; reporting APIs remain under the reporting route/API modules.

There is no public operations presentation module. Route declarations are authoritative; `docs/route-manifest.json` is the generated machine projection and must be refreshed with `npm run generate:routes` after route changes. Human routing architecture remains in `docs/ROUTE-REGISTRY.md`.

## Alignment

**Controls:** ISO27001-A.8.15
