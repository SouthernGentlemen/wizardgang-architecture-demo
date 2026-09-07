# Operations and Demo Administration

The public operational experience is one server-rendered route: `/operations`. Operational state remains backed by the same runtime, D1, Cloudflare, reporting, and deployment evidence sources; the consolidation removes redundant HTML route contracts rather than duplicating or replacing those sources.

## Route family

```text
/operations
├── overview      /operations
├── availability  /operations?view=availability
├── logs          /operations?view=logs
├── usage         /operations?view=usage
├── reports       /operations?view=reports
└── docs          /operations?view=docs

/admin       protected control surface
/offline     public maintenance/offline page
/security    public security and advisory recovery surface
/health      machine-readable health
/version     machine-readable release/build metadata
/robots.txt  dynamic ChatGPT crawler policy
/__api/operations/logs              machine-readable public-safe logs
/__api/operations/cloudflare-usage   sanitized Cloudflare observations
/__api/operations/billing            synthetic cost-guardrail simulation
```

The retired HTML routes `/dashboard`, `/dashboard/uptime`, `/dashboard/docs`, `/dashboard/logs`, and `/dashboard/billing` have no redirect or alias. They use the normal 404 path.

## Operations views

### Overview

`/operations` is the public, read-only operational center. It preserves the current demo-control state, runtime/dependency health, crawler policy, Cloudflare observations, deployment evidence, operational reporting context, and links to administrative and machine recovery interfaces. Mutation controls remain under authenticated `/admin` or the explicitly labeled synthetic guardrail simulator.

### Availability

`/operations?view=availability` reads `service_health_checks` from `demo-blob`. A Cloudflare Cron Trigger invokes the Worker every five minutes; `scheduled()` calls `collectHealth(env, true)`, so availability observations exist independently of browser traffic and `/health` requests.

The view preserves measured service, observation window, latest check, operational/degraded/down counts, response-time history, calculated availability, and the distinction between intentional planned/manual offline windows and unexpected failures. No SLA is implied unless one is explicitly defined.

```text
*/5 * * * *  -> dependency health and availability observation
```

### Logs

`/operations?view=logs` is the public operational log viewer. It reads bounded application-generated records from `application_logs` in `demo-blob`; it is not a raw Cloudflare account-log proxy. Level/source filters and bounded limits remain available.

Public log safety is mandatory. Do not log or render passwords, authorization headers, cookies, bearer tokens, API keys, secrets, payment data, private account identifiers, or raw request bodies that may contain credentials. Structured detail is defensively redacted and bounded. `demo_events` remains the audit/evidence stream; `application_logs` remains operational diagnostics.

`GET /__api/operations/logs` exposes the same sanitized data as JSON and remains reachable during an intentional offline state.

### Usage

`/operations?view=usage` preserves two distinct layers:

1. Sanitized Cloudflare usage observations for the configured Worker, D1 database, R2 bucket, and Durable Objects namespace.
2. The controlled `normal -> warning -> degraded` application-behavior simulator.

The Worker queries Cloudflare server-side. Provider responses are validated before a dataset is marked available. Valid empty datasets are legitimate zero activity; missing account scope, malformed data, authorization failures, rate limits, partial collection, unavailable datasets, and stale observations remain distinguishable.

GraphQL Analytics is usage telemetry, not billing. When Cloudflare returns populated `BilledCost`, the account-scoped cost observation is labeled **billed**, retains its billing period and collection/freshness time, and is never attributed to an individual Worker, D1 database, R2 bucket, or Durable Objects namespace. If authoritative billing is unavailable, there is no local pricing fallback.

The public browser never receives Cloudflare API tokens, account IDs, resource IDs, invoice identifiers, customer profiles, subscription identifiers, or payment data. `GET /__api/operations/cloudflare-usage` projects approved observations through the common reporting query-result contract and sends `Cache-Control: no-store`.

The synthetic `/__api/operations/billing` simulator demonstrates graceful degradation only. In degraded state it pauses optional stateless Worker compute while operations, security, documentation, logs, admin, health, and recovery interfaces remain available. It does not mutate real Cloudflare billing configuration.

### Reports

`/operations?view=reports` uses the shared reporting presentation stack in `src/reporting/presentation.ts` and `src/reporting/html.ts`. Collection discovery comes from reporting ownership and registered capabilities; the operations page does not introduce a parallel reporting inventory, provider-specific record interpretation, or independent pagination/filter contract.

The common reporting source and observation ownership contract is defined in `docs/REPORTING.md` and `contracts/assurance/reporting.schema.json`.

### Docs

`/operations?view=docs` is the live documentation index. It links the architecture standard, route map and manifest, router, public API/interface contracts, repository guidance, release/tag history, workflows, migrations, evidence material, `/health`, and `/version`.

The canonical project documentation remains Markdown/text so it is diffable, searchable, linkable, and reviewable in Git.

## Health and deployment evidence

`/operations#health` is the human-readable health view. `/health` is the machine-readable endpoint. Health reports runtime availability, dependency readiness, demo control state, and overall status without returning secrets or private Cloudflare metadata.

An intentionally offline demo is not the same as a crashed Worker. The Worker and recovery interfaces can remain operational while ordinary architecture demonstrations are intentionally gated.

The operations overview also preserves deployment evidence and direct public source/documentation links so a reviewer can trace the running state back to repository-controlled artifacts.

## Admin control

`/admin` controls public demo availability and ChatGPT fetch policy. It remains authenticated, no-store, same-origin for mutations, D1-backed, and audited. Credentials are never committed.

When the demo is intentionally offline:

- ordinary browser architecture pages may redirect to `/offline?from=<route>`;
- ordinary gated API, non-HTML, and write requests return structured `503` responses;
- `/operations`, `/admin`, `/offline`, `/security`, `/health`, `/version`, `/robots.txt`, `/__api/operations/logs`, and `/__api/operations/cloudflare-usage` remain reachable;
- there is no redirect loop;
- the public offline page uses the explicit heading **“Oops! demo is down.”**.

Crawler changes update `/robots.txt` and the server-side `OAI-SearchBot` / `ChatGPT-User` request gate. `GPTBot` remains blocked in both crawler-control states, so user/search fetch access never implies model-training access.

## Offline behavior matrix

| Request | Online | Offline |
|---|---|---|
| Browser GET to ordinary architecture route | normal demo | `302` to `/offline?from=...` |
| Gated API / non-HTML GET | normal response | JSON `503` |
| Gated demo write / POST | normal action | JSON `503` |
| `/operations` and its six views | available | available |
| `/security` | available | available |
| `/__api/operations/logs` | available | available |
| `/__api/operations/cloudflare-usage` | available | available |
| `/health` | machine health | reachable and reports intentional offline state |
| `/version` | available | available |
| `/admin` | protected | protected + available |
| `/offline` | available | available |
| `/robots.txt` | reflects crawler control | reflects crawler control |

## Runtime configuration

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN       secret; minimum Analytics Read and optional Billing Read
CLOUDFLARE_WORKER_NAME
CLOUDFLARE_D1_DATABASE_ID
CLOUDFLARE_R2_BUCKET
CLOUDFLARE_DO_NAMESPACE
```

Store `CLOUDFLARE_API_TOKEN` as an encrypted Worker secret and use a dedicated read-only token rather than a deployment token. Resource identifiers remain environment-owned inputs even though public responses do not display them.

## Source ownership

| Concern | Primary source |
|---|---|
| Consolidated operations page and view dispatch | `src/demos/operations.ts` |
| Health, availability, usage, and documentation presenters | `src/demos/operations-pages.ts` |
| Public log presenter | `src/demos/logs.ts` |
| Shared reporting presentation | `src/reporting/presentation.ts`, `src/reporting/html.ts`, `src/demos/reporting-dashboard.ts` |
| Reporting authority and observation contracts | `assurance/registry.json`, `contracts/assurance/reporting.schema.json`, `docs/REPORTING.md` |
| Cloudflare usage collection, validation, billing observations, and derived caches | `src/lib/cloudflare-usage.ts` |
| Scheduled health collection | `src/index.ts`, `wrangler.jsonc` |
| Machine health/version/Cloudflare projection | `src/api/operations.ts` |
| Synthetic guardrail API | `src/api/billing.ts` |
| Admin UI/offline page | `src/ui/admin.ts` |
| Admin authentication | `src/lib/admin-auth.ts` |
| Online/offline state | `src/lib/demo-control.ts` |
| ChatGPT crawler state and robots policy | `src/lib/crawler-control.ts` |
| Public-safe log persistence/redaction | `src/lib/logs.ts` |
| Shared audit evidence | `src/lib/audit.ts` |
| Route declarations | `src/routing/operational-routes.ts` |
| Routing and offline gate | `src/router.ts` |
| Operations schema | `migrations/0002_operations_dashboard.sql` |
| Application log schema | `migrations/0004_application_logs.sql` |
| Control schema | `migrations/0003_demo_control.sql` |
| Crawler-control schema | `migrations/0009_crawler_control.sql` |
