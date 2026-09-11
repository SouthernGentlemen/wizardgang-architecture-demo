# Operations acceptance — DEMO-245

DEMO-245 consolidates the public operations experience onto `/operations` while preserving the operational and reporting machine contracts.

## Acceptance contract

The single page must expose `#status`, `#availability`, `#activity`, `#usage`, and `#deployment`, with native disclosures for long history and detailed evidence. Availability retains verified scheduled-observation semantics and the 365-day retention model. Activity filtering remains public-safe and bounded to 200 rows. Usage retains provider/cost qualification and synthetic budget behavior. Deployment exposes version and repository evidence.

Availability and activity query parameters may filter data but must not change the canonical destination from `/operations`. Any `?view=...` selector is rejected as an ordinary 404.

Every former operations child page recorded in `tests/fixtures/removed-html-pathnames.ts` must return an ordinary 404 response with no `Location` header. `/admin`, `/offline`, `/api/operations/health`, `/api/operations/version`, `/api/operations/logs`, `/api/operations/budget`, `/api/reporting/*`, robots, sitemap, security.txt, assets, crawler controls, and offline behavior remain intact.

## Automated coverage

- `tests/operations-consolidation.test.ts` covers the five-section page, filter/canonical behavior, retired paths, offline behavior, machine gating, and sitemap projection.
- `tests/availability-history.test.ts` covers scheduled-only qualification, long-history retention, and section presentation.
- `tests/logs.test.ts` covers bounded filtering, redaction, representative events, and the activity disclosure.
- `tests/operations.test.ts` covers dashboard evidence, budget degradation/recovery, scheduled health, reporting machine output, and Cloudflare telemetry qualification.
- `tests/operational-route-registry.test.ts`, `tests/canonical-frontend-routes.test.ts`, and the removed-route fixture enforce the route inventory and ordinary-404 retirement policy.

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

The PR CI additionally runs the repository site-accessibility/browser checks defined by `.github/workflows/ci.yml`.
