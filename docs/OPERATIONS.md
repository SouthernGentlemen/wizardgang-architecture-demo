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

Cloudflare Worker Version IDs and production traffic allocations are provider-side deployment evidence. The deployment workflow binds that evidence to Wrangler's structured deploy result before it accepts the public `/version.json` identity, `/health.json` status and same-origin asset availability checks; it does not run a browser or accessibility suite against production. The verified result, including the Worker Version ID, is attached to the tag's GitHub Release as described in [Release management](RELEASE-MANAGEMENT.md#deployment-result); provider IDs are not added to the public operations API.

Interactive health reads remain read-only. Identity readiness is informational and does not change the existing health status or HTTP status-code semantics. Scheduled five-minute observations are the measured availability evidence and records older than 365 days are purged by the existing collector behavior.

The public log API returns only the identity log envelope needed for bounded diagnostics; structured identity detail is withheld. Identity audit-event payload detail is likewise excluded from public event projections. Subject-derived audit identifiers and visitor sandbox namespaces are not retained in application-log detail.

Cloudflare usage collection pins the demo Worker's surviving DemoCoordinator namespace in Wrangler alongside its resource selectors. The account's billable usage endpoint is Alpha, Restricted and is not offered despite Billing Read permission. `CLOUDFLARE_BILLABLE_USAGE=not-offered` records that verified capability: collection skips the restricted endpoint and exposes `billing-not-offered-by-cloudflare` as a separate qualification, with no invented cost or billing failure. Resource analytics still determine report availability and pagination completeness. Without that explicit capability setting, authorization, rate-limit, malformed-response, and network errors retain their existing failure handling.

## Assurance monitor

The daily `Assurance Monitor` workflow runs `npm run monitor:assurance` once. That is the same single-process suite as `npm run validate:assurance`, with live reporting checks added to its operations owner, so each static, freshness and live assertion executes once per run. Observation expiry and `security.txt` expiry are evaluated against the run's own clock (`ASSURANCE_VALIDATION_NOW`, defaulting to the current time), never against a source or commit time. The live checks fetch the security policy page, `security.txt` and every URL it names, and the GitHub private vulnerability reporting setting. An HTTP failure is reported as failed; a request with no response is reported as unknown. Both fail the run.

The monitor complements, and does not replace, the Worker's five-minute scheduled availability collection and its 365-day retention.

The monitor keeps one `Assurance Monitor failure` issue. A failed run opens, reopens or comments on it with links to the run and the head commit, and says whether an assurance assertion failed or the run failed before any assertion was tested. The next successful run comments on and closes it. A cancelled run changes nothing.

The Operations Owner, currently the repository owner, is responsible for an open monitor issue. They repair it, or authorize a session to, through the ordinary controlled delivery path; there is no separate approval, notification service or failure log. Old runs remain in GitHub Actions and need no reconstruction.

## Route and source ownership

Operational route declarations remain in `src/routing/operational-routes.ts`; machine collection remains in `src/api/operations.ts`; usage/provider observation remains in `src/lib/cloudflare-usage.ts`; logs remain in `src/lib/logs.ts`; reporting APIs remain under the reporting route/API modules.

There is no public operations presentation module. Route declarations are authoritative; `docs/route-manifest.json` is the generated machine projection and must be refreshed with `npm run generate:routes` after route changes. Human routing architecture remains in `docs/ROUTE-REGISTRY.md`.

## Alignment

**Controls:** ISO27001-A.8.15
