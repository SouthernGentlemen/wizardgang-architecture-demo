# Operations, Dashboard, and Demo Administration

This document makes the operational surface a first-class part of the architecture demo rather than an afterthought.

## Route family

```text
/dashboard
├── overview → /compliance assurance index
├── /dashboard/uptime
├── /dashboard/docs
├── /dashboard/logs
└── /dashboard/billing

/admin       protected control surface
/offline     public maintenance/offline page
/health      machine-readable health
/version     machine-readable release/build metadata
/robots.txt  dynamic ChatGPT crawler policy
/__api/operations/logs  machine-readable public-safe logs
/__api/operations/cloudflare-usage  sanitized current Cloudflare usage observation
```

The operational routes remain reachable while ordinary demos are intentionally offline.

## Dashboard

`/dashboard` is the public, read-only operational center. It answers these questions without exposing private infrastructure:

1. Is the demo intentionally online or offline?
2. Is the Worker healthy and are its dependencies ready?
3. What availability history has been observed?
4. What version/source/docs are running?
5. What recent application activity can be safely inspected?
6. What Cloudflare resources are being consumed, and how fresh is that data?
7. Is ChatGPT search and user-requested web access currently enabled?
8. What happens when cost guardrails enter warning or degraded state?
9. Where can a reviewer enter the compliance and assurance evidence map?

All mutation controls live under authenticated `/admin` or an explicitly labeled simulator. The overview reports demo and crawler policy state but renders no working administration forms. It links directly to the source files, migrations, tests, GitHub Actions, releases, and route documentation that produce the displayed state.

Compliance is not an operational KPI or a dashboard child route. The overview presents a separate Compliance & Assurance panel linking to canonical `/compliance`, where alignment statements lead back into the dashboard and other working evidence owners.

## Availability

`/dashboard/uptime` uses `service_health_checks` in `demo-blob`. A Cloudflare Cron Trigger invokes the Worker every five minutes; `scheduled()` calls `collectHealth(env, true)`, so observations exist independently of dashboard traffic or calls to `/health`.

Show:

- measured service key;
- observation window;
- latest check;
- operational/degraded/down counts;
- calculated availability percentage;
- response-time history where available;
- distinction between an intentional admin offline window and an unexpected dependency failure.

Do not imply an SLA unless one is explicitly defined.

Collection cadence:

```text
*/5 * * * *  -> dependency health and availability observation
```

Cloudflare usage and returned billing observations are queried from Cloudflare on demand by the dashboard/API. They are not refreshed into a local provider-state mirror.

## Health

`/dashboard#health` is the human-readable view. `/health` is the machine-readable endpoint. The retired `/dashboard/health` page permanently redirects to that dashboard card.

Health should report separately:

- Worker/runtime availability;
- D1 readiness;
- R2 readiness once configured;
- Durable Object readiness once configured;
- demo control state (`online` or `offline`);
- overall status.

An intentionally offline demo is not the same as a crashed Worker. The Worker can remain operational while the public demo state is intentionally offline.

No secret, token, account identifier, internal host, or private Cloudflare metadata may be returned.

## Documentation

`/dashboard/docs` is a live documentation index. It should include:

- `docs/ARCHITECTURE-STANDARD.md`;
- `docs/ROUTES.md`;
- `docs/route-manifest.json`;
- `src/router.ts`;
- API/OpenAPI/GraphQL/MCP contracts when implemented;
- public repository and direct route source links;
- README, CONTRIBUTING, AGENTS, SECURITY, CHANGELOG;
- GitHub Releases and tags;
- CI/deploy workflows;
- migrations;
- evidence/traceability material;
- `/health` and `/version`.

The repository intentionally contains no PDF architecture dependency; the canonical project copy is Markdown so it is diffable, searchable, linkable, and reviewable in Git.

## Logs

`/dashboard/logs` is the public operational log viewer. It reads bounded, application-generated records from `application_logs` in `demo-blob`; it is not a raw Cloudflare account-log proxy.

Show:

- timestamp;
- level (`debug`, `info`, `warn`, `error`);
- source/component;
- event key;
- short message;
- route where useful;
- structured detail behind an explicit disclosure;
- level/source filters and a bounded row limit;
- direct links to the emitting/persistence source and D1 migration.

Public log safety is mandatory. Do not log or render passwords, authorization headers, cookies, bearer tokens, API keys, secrets, payment data, private account identifiers, or raw request bodies that may contain credentials. Structured details are defensively redacted by key and capped in size. Treat `demo_events` as the audit/evidence stream and `application_logs` as operational diagnostics; they may reference the same occurrence but should not be conflated.

`GET /__api/operations/logs` exposes the same sanitized data as JSON with bounded `limit`, `level`, and `source` filters. Both the human and machine log surfaces remain reachable during an intentional demo-offline window so the outage/maintenance state can still be inspected.

## Cloudflare usage and cost

`/dashboard/billing` presents two deliberately separate layers:

1. Sanitized, current Cloudflare usage observations for the configured Worker, D1 database, R2 bucket, and Durable Objects namespace.
2. The controlled `normal -> warning -> degraded` application-behavior simulator.

The Worker queries Cloudflare server-side and returns only normalized metrics through `GET /__api/operations/cloudflare-usage`. The browser never receives an API token, account identifier, resource identifier, invoice identifier, account name, customer profile, subscription identifier, or payment data. The historical `cloudflare_usage_snapshots` table remains in immutable migration history, but active runtime code does not read from or write to it and it is not an authoritative provider-state source.

GraphQL Analytics is labeled **live usage**, never billed cost. When the restricted account billable-usage API returns populated `BilledCost` values, the UI labels the total **billed** and treats it as authoritative usage-based overage. If access or cost fields are unavailable, the UI uses a clearly labeled **estimated** overage from published Workers Paid, D1, R2 Standard, and Durable Objects request rates. That estimate is a derived presentation value, not a native Cloudflare observation. Current storage bytes serve only as a GB-month proxy in that fallback; fixed plan fees and unsupported CPU/duration dimensions are excluded and disclosed. Missing credentials or an unavailable dataset produces an honest setup/partial/unavailable state; illustrative values are never substituted.

The common reporting source and observation ownership contract is defined in `docs/REPORTING.md` and `contracts/assurance/reporting.schema.json`. Cloudflare aggregate observation identity is derived from resource, metric, normalized dimensions, and the observation window.

Runtime configuration:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN       secret; minimum Analytics Read and optional Billing Read
CLOUDFLARE_WORKER_NAME
CLOUDFLARE_D1_DATABASE_ID
CLOUDFLARE_R2_BUCKET
CLOUDFLARE_DO_NAMESPACE
```

The account and resource identifiers are environment-owned inputs even though the API response never displays them. Store `CLOUDFLARE_API_TOKEN` as an encrypted Worker secret with `wrangler secret put CLOUDFLARE_API_TOKEN` (or the Cloudflare dashboard), never as a plaintext Wrangler variable. Use a dedicated read-only token rather than the deployment token; the deploy workflow supplies only the non-secret resource identifiers.

Use `usage_snapshots` to demonstrate:

```text
normal -> warning -> degraded
```

Suggested default demonstration policy:

- **Normal:** estimated spend < 70% of synthetic monthly budget.
- **Warning:** 70% to < 90%.
- **Degraded:** >= 90%.

The live controlled scenario endpoint is `/__api/operations/billing`. In degraded state it pauses the optional stateless Worker compute action with a structured response while status, documentation, logs, admin, and health remain available. Selecting a scenario never writes Cloudflare account configuration or changes real billing thresholds.

The UI should show which optional behaviors would be reduced or disabled as cost rises, while keeping critical status, admin, and health routes available. The policy is a demonstration of graceful degradation, not a real billing-control integration unless explicitly wired later.

## Admin control

`/admin` intentionally controls whether public architecture demos are online or offline and whether ChatGPT may fetch public demo content.

Requirements:

- authenticated access only;
- credentials never committed;
- D1 persistence through `demo_control`;
- separate D1 persistence through `crawler_control`;
- public message editable by admin;
- changes written to the common audit event stream;
- `Cache-Control: no-store`;
- ordinary demo behavior blocked while offline;
- HTML demo navigation redirects to `/offline?from=<route>`;
- API/non-HTML/write requests receive a JSON `503` rather than an HTML redirect;
- `/dashboard/*`, `/health`, `/version`, `/offline`, and `/admin` stay available;
- no redirect loop;
- public offline page uses the explicit heading **“Oops! demo is down.”**.
- crawler changes update both `/robots.txt` and a server-side `OAI-SearchBot` / `ChatGPT-User` request gate;
- crawler control fails closed when D1 is unavailable;
- `GPTBot` remains blocked in both crawler-control states so web access never implies model-training access.

For local development the implementation supports HTTP Basic credentials from `.dev.vars`. The application compares digests, requires exact same-origin state-changing submissions, emits no-store responses, and fails closed if control state cannot be read. For production, prefer Cloudflare Access in front of `/admin` while retaining the application-side authorization boundary.

## Offline behavior matrix

| Request | Online | Offline |
|---|---|---|
| Browser GET to architecture route | normal demo | `302` to `/offline?from=...` |
| API / non-HTML GET | normal response | JSON `503` |
| Demo write / POST | normal action | JSON `503` |
| `/dashboard/*` | available | available |
| `/__api/operations/logs` | available | available |
| `/__api/operations/cloudflare-usage` | available | available |
| `/health` | `200` if healthy | reachable; reports intentional offline state, generally `503` overall |
| `/version` | available | available |
| `/admin` | protected | protected + available |
| `/offline` | available | available |
| `/robots.txt` | available; reflects crawler control | available; reflects crawler control |

## Audit trail

Admin transitions should emit a `demo_events` record such as:

```json
{
  "demo_id": "admin",
  "event_type": "demo_state_changed",
  "payload": {
    "state": "offline",
    "message": "Maintenance in progress.",
    "updatedBy": "<authenticated-admin>"
  }
}
```

Do not record passwords, authorization headers, tokens, cookies, or other credentials.

Crawler transitions use the same safe evidence boundaries with event type `chatgpt_crawl_access_changed`; the public payload contains only the selected state, an opaque authenticated-admin actor label, and a timestamp. The actual admin username remains confined to the protected control record. OpenAI documents that ChatGPT user-triggered fetches may not follow `robots.txt`, so the Worker also enforces the state before routing public content. Search indexing may take time to observe a policy update even though the Worker gate changes immediately.

## Source ownership

| Concern | Primary source |
|---|---|
| Reporting authority and shared observation contracts | `assurance/registry.json`, `contracts/assurance/reporting.schema.json`, `docs/REPORTING.md` |
| Retained CI / assurance-monitor reports | `.github/workflows/report-publisher.yml`, `scripts/generate-retained-report.mjs`, `contracts/assurance/report.schema.json`, `assurance-reports` branch |
| Dashboard metadata | `src/demos/dashboard.ts` |
| Uptime metadata | `src/demos/uptime.ts` |
| Health metadata | `src/demos/health.ts` |
| Docs metadata | `src/demos/docs.ts` |
| Log viewer | `src/demos/logs.ts` |
| Log persistence / redaction | `src/lib/logs.ts` |
| Billing metadata | `src/demos/billing.ts` |
| Cloudflare usage collection and normalization | `src/lib/cloudflare-usage.ts` |
| Scheduled health collection | `src/index.ts`, `wrangler.jsonc` |
| Machine health/version | `src/api/operations.ts` |
| Admin UI/offline page | `src/ui/admin.ts` |
| Admin authentication | `src/lib/admin-auth.ts` |
| Online/offline state | `src/lib/demo-control.ts` |
| ChatGPT crawler state, robots policy, and request classification | `src/lib/crawler-control.ts` |
| Shared event audit | `src/lib/audit.ts` |
| Operations schema | `migrations/0002_operations_dashboard.sql` |
| Retired Cloudflare snapshot migration history | `migrations/0011_cloudflare_usage.sql` |
| Application log schema | `migrations/0004_application_logs.sql` |
| Control schema | `migrations/0003_demo_control.sql` |
| Crawler-control schema | `migrations/0009_crawler_control.sql` |
| Routing gate | `src/router.ts` |
