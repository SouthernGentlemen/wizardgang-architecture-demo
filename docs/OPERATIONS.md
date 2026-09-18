# Operations

The ordinary human-facing `/operations` page is retired. It is not redirected, aliased, or replaced; requests fall through to the application's standard 404 response, including requests with query parameters.

## Visitor-facing proof

The homepage carries intentionally small public operational proof:

- current service/dependency state;
- measured scheduled-availability summary and monitoring qualification;
- running semantic version and source/commit identity.

Do not rebuild the retired dashboard on the homepage. Detailed logs, raw health payloads, observation tables, usage/cost dashboards, synthetic billing controls, resource-pressure internals, and deployment-internals views are not ordinary public HTML destinations.

## Preserved operational contracts

Route retirement does not remove the operational system. The following remain independently declared and supported:

- `/api/operations/health` and `/api/operations/version`;
- the existing operational log/budget and reporting machine contracts;
- scheduled availability collection and persistence;
- the 365-day availability retention policy;
- current service/dependency and provider observations;
- version, commit, source, and release identity;
- bounded public-safe logging plus internal operational data;
- protected `/admin` and recovery `/offline` pages;
- crawler controls, `robots.txt`, `/.well-known/security.txt`, assets, and the sitemap protocol route.

Interactive health reads remain read-only. Scheduled five-minute observations are the measured availability evidence and records older than 365 days are purged by the existing collector behavior.

The public log API returns only the identity log envelope needed for bounded diagnostics; structured identity detail is withheld. Identity audit-event payload detail is likewise excluded from public event projections. Subject-derived audit identifiers and visitor sandbox namespaces are not retained in application-log detail.

## Route and source ownership

Operational route declarations remain in `src/routing/operational-routes.ts`; machine collection remains in `src/api/operations.ts`; usage/provider observation remains in `src/lib/cloudflare-usage.ts`; logs remain in `src/lib/logs.ts`; reporting APIs remain under the reporting route/API modules.

There is no public operations presentation module. Route declarations are authoritative; `docs/ROUTES.md` and `docs/route-manifest.json` are generated projections and must be refreshed with `npm run generate:routes` after route changes.

## Alignment

**Controls:** ISO27001-A.8.15
