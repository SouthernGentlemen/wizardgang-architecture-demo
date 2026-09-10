# Operations

`/operations` is the single public human-facing operations dashboard. It is a task surface, not a collection of dataset pages.

## Public dashboard

The page is organized around stable fragments:

- `/operations#status` — current service posture, dependency health, demo/crawler policy, and health/version endpoints.
- `/operations#availability` — verified scheduled observations, 24-hour through 365-day windows, planned maintenance, and unexpected failures.
- `/operations#activity` — bounded public-safe application-log search. Filters use query parameters on `/operations`; the public result set is capped at 200 records.
- `/operations#usage` — usage, provider telemetry, billed-cost availability, the synthetic budget guardrail, and cost/degradation evidence.
- `/operations#deployment` — deployed version, environment, release/commit evidence, source, Actions, and repository documentation.

The canonical URL is always `/operations`. Query parameters may filter data such as availability window or activity level/source/request ID/limit. They do not select a conceptual page or view. `?view=...` is not a supported routing mechanism and returns the ordinary 404.

## Retired human routes

The five former operations child pages are retired with no redirects or aliases. Their pathnames and expected outcomes are maintained in `tests/fixtures/removed-html-pathnames.ts`; each returns the normal application 404. Historical `/dashboard/*` locations remain retired under the same policy.

Reports and Documentation are no longer human navigation concepts. Operational reporting remains available through the machine reporting contract under `/api/reporting/*`. Documentation is linked contextually to repository source/docs from the relevant dashboard sections.

## Preserved operational contracts

DEMO-245 does not change the operational machine/protocol surface. `/admin` and `/offline` remain hidden operational pages. Health, version, log, and budget APIs remain available, as do the reporting APIs, reporting authorization, cursor/pagination behavior, `robots.txt`, `sitemap.xml`, `security.txt`, assets, offline policy, and crawler controls.

Availability collection remains a scheduled five-minute observation stream with a 365-day retention window. Interactive health reads do not create availability evidence. Public log presentation continues to use the existing redaction pipeline and bounded query limit.

## Source ownership

Human presentation is owned by `src/demos/operations.ts`. Operational API collection remains in `src/api/operations.ts`; usage/cost collection remains in `src/lib/cloudflare-usage.ts`; logs remain in `src/lib/logs.ts`; reporting APIs remain under the reporting route/API modules.

Route ownership belongs to the application route registry. Generated route documentation is refreshed with `npm run generate:routes` after route changes.
