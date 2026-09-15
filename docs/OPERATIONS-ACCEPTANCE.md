# Operations acceptance — DEMO-259

DEMO-259 retires the ordinary human-facing `/operations` HTML route while preserving the operational machine system and the compact visitor-facing proof already present on the homepage.

## Acceptance contract

- `/operations` and query-string variants return the ordinary application 404 with no redirect, alias, canonical destination, or replacement browser page.
- Public navigation, architecture/discovery projections, homepage actions, sitemap output, generated route documentation, and the canonical route manifest do not advertise `/operations`.
- `/api/operations/health`, `/api/operations/version`, the existing operational machine/reporting contracts, provider observations, bounded logs, and protected controls remain declared according to their existing policies.
- `/admin` remains protected and `/offline` remains the recovery surface.
- Scheduled availability collection remains independent of interactive health reads, and the 365-day retention contract remains unchanged.
- The homepage continues to expose only the compact service/dependency, scheduled-availability, version, and commit/source proof established by DEMO-256.

The route registry is authoritative. There is no special `/operations` 404 handler; the removed page falls through the normal unmatched-route path.

## Automated coverage

- `tests/operations-acceptance.test.ts` covers ordinary-404 retirement, no query resurrection, machine health/version preservation, admin/offline behavior, and absence from navigation/discovery/sitemap.
- `tests/availability-history.test.ts` covers read-only interactive health, scheduled persistence, and 365-day purging.
- `tests/operations.test.ts` covers scheduled reporting, budget/runtime behavior, Cloudflare provider observation, cost qualification, freshness, and public-safe machine projection.
- `tests/logs.test.ts` covers bounded/redacted public-safe logging without depending on a dashboard renderer.
- `tests/operational-route-registry.test.ts`, `tests/canonical-frontend-routes.test.ts`, `tests/application-route-registry.test.ts`, and the removed-route fixture enforce the route inventory and normal-404 retirement policy.
- `tests/demo-256-minimal-public-shell.test.ts` preserves the compact homepage operational proof and prevents a public Operations link from returning.

## Required validation

From a clean checkout run:

```sh
npm ci
npm run generate:routes
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
git diff --check
```

The PR CI additionally runs the site-wide browser accessibility/localization audit defined by `.github/workflows/ci.yml`.
