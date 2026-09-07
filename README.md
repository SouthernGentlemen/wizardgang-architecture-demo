# WizardGang Architecture Demo

Public, executable companion to **WG-ARCH-001 — WizardGang Systems Architecture**.

Target site: `https://demo.wizardgang.ai`  
Intended public repository: `SouthernGentlemen/wizardgang-architecture-demo`

The canonical standard is [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md). This repository intentionally contains no PDFs. All registered architecture routes have working implementations; external production deployment and identity-provider credentials remain environment-specific steps.

## Architecture laboratory

Public HTML routes organize the architecture into five layers. Each layer has a dedicated owner under `src/demos/`, live implementation, observable behavior, and direct public source/evidence links.

- **Platform:** one server-rendered `/platform` surface selects safe edge-context inspection, bounded stateless Worker compute, the coordinated Durable Object counter, the session-isolated D1 users-and-tasks lab, or the bounded R2 mini file manager with D1 metadata through ordinary `?view=` deep links.
- **Interfaces:** focused REST/OpenAPI, GraphQL/GraphiQL, signed-webhook, identity, and MCP routes converging on explicit application policies and shared D1/logging boundaries.
- **Standards:** English, Spanish, French, German, Japanese, and Arabic resources; instant switching and `Intl` inspection; RTL rendering; and accessible/broken comparison labs with locally bundled axe-core analysis.
- **Delivery and governance:** live GitHub branch/commit/pull-request/Actions/tag/release evidence, durable provider-derived CI and assurance reports, runtime traceability, generated governance-register views, security-control mapping, an executable MCP boundary evaluation, and a compact compliance and assurance index linking those canonical proofs.
- **Operations:** five-minute scheduled dependency health, measured availability, live documentation, sanitized D1 logs, cached Cloudflare usage telemetry, progressive billable-cost evidence, observable graceful degradation, and authenticated D1-backed demo control.

Core invariants:

- Shared relational state uses `DEMO_DB` -> `demo-blob`.
- R2 content stays in R2; D1 stores metadata/references only.
- Coordinated counter state stays in a Durable Object; D1 stores audit evidence only.
- Workers mediate application state and integrations.
- Public REST, GraphQL, and MCP reads share one authorization boundary; identity sessions produce ten-minute bearer tokens whose REST writes are limited to server-derived visitor sandboxes.
- Secrets, credentials, private account metadata, and real billing/payment data never belong in Git or public logs.
- WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 references mean **aligned — uncertified**.

See [`docs/ROUTES.md`](docs/ROUTES.md) and [`docs/route-manifest.json`](docs/route-manifest.json) for the stable human and machine route contract.

## Interface

The demo uses the `wizardgang.ai` design tokens: dark by default, with a light theme the reader can toggle and the browser remembers. Every page carries a skip link, a compact Dashboard/Main site/Theme header, and in-group previous/next paging; `/sitemap.xml` is generated from the same registry that serves the routes, so it cannot drift from the published contract.

`/platform` is the single Platform HTML surface. Deep links use `/platform?view=edge`, `/platform?view=workers`, `/platform?view=durable-objects`, `/platform?view=d1`, and `/platform?view=r2`. The former `/edge`, `/workers`, `/durable-objects`, `/d1`, and `/r2` page paths are intentionally unregistered and return the ordinary 404 without redirects; their working API endpoints keep their existing URLs and storage boundaries.

`/interfaces` is the single browser surface for REST, GraphQL, webhooks, identity, MCP, internationalization, and accessibility. Deep links use `/interfaces?view=rest`, `/interfaces?view=graphql`, `/interfaces?view=webhooks`, `/interfaces?view=identity`, `/interfaces?view=mcp`, `/interfaces?view=i18n`, and `/interfaces?view=accessibility`. The former `/api`, `/webhooks`, `/identity`, `/mcp`, `/i18n`, and `/accessibility` HTML paths return the ordinary 404 without redirects. `/graphql` is machine-only, while `/graphql/schema`, `/graphql/console`, the identity protocol routes, webhook endpoints, and `/mcp/server` retain their protocol URLs. The D1 view exposes visitor-scoped users and tasks queryable through GraphQL, and `/assurance?view=delivery` runs and tracks a controlled two-stage delivery lifecycle against this repository.

## Operations and admin

```text
/dashboard
├── overview → /assurance assurance index
├── /dashboard/uptime
├── /dashboard/docs
├── /dashboard/logs
└── /dashboard/billing

/admin       protected D1-backed demo control
/offline     public maintenance page
/health      machine-readable dependency health
/version     machine-readable release/source identity
/robots.txt  dynamic ChatGPT crawler policy
```

The read-only dashboard’s `#health` section carries per-service status and latency, while its separate Compliance & Assurance panel links to the canonical `/assurance` evidence index. Cloudflare Cron stores a health observation every five minutes, refreshes sanitized account telemetry every fifteen minutes, and attempts restricted billable usage hourly. `/dashboard/billing` keeps that live usage evidence visually and behaviorally separate from the synthetic cost-guardrail simulator.

`/admin` can intentionally take ordinary demos online or offline. Offline browser navigation redirects to `/offline?from=<route>` and displays **“Oops! demo is down.”** API, non-HTML, and write requests return JSON `503`. Dashboard, status, logs, synthetic billing, offline, and authenticated admin surfaces remain reachable. Control failures fail closed.

The same protected admin page controls ChatGPT web access. The switch updates a D1-backed `/robots.txt` policy and a server-side gate for `OAI-SearchBot` and `ChatGPT-User`, so disabling access also covers user-requested ChatGPT fetches that may not follow robots rules. `GPTBot` remains blocked in either state; this control never opts the demo into foundation-model training. The public dashboard reports the current state without rendering a mutation form.

## Shared D1 backend

The numbered migrations establish:

- `demo_events` — common audit/evidence stream;
- `demo_records` — versioned REST/GraphQL/MCP demonstration records, seeded so public reads return real data;
- `service_health_checks` — timestamped availability history;
- `usage_snapshots` — controlled synthetic usage/cost state;
- `cloudflare_usage_snapshots` — cached, normalized public-safe Cloudflare telemetry;
- `demo_control` — online/offline state and public message;
- `crawler_control` — ChatGPT search and user-requested web access state;
- `application_logs` — bounded public-safe diagnostics;
- `r2_object_metadata` — relational references to real R2 objects;
- `webhook_receipts` — signed-delivery digests and replay protection;
- `demo_sessions`, `demo_users`, and `demo_tasks` — expiring visitor-scoped D1 laboratory state;
- session fields on `r2_object_metadata` — expiring visitor-scoped references to R2 uploads;
- `webhook_events` — bounded sanitized webhook evidence and delivery-ID replay state;
- `demo_state` — bounded shared lab state used by reset and cleanup operations;
- `identity_sessions` — encrypted, expiring, revocable application sessions;
- `identity_saml_requests` and `identity_saml_assertions` — SAML request correlation and assertion replay protection.

Machine contracts for Swagger 2.0, GraphQL, MCP, webhooks, and SAML service-provider metadata are versioned beside their implementations.

## Local setup

1. Run `npm ci` using the committed lock file.
2. The committed D1 identifier targets the public `demo-blob`; local mode still uses isolated Wrangler state.
3. Copy `.dev.vars.example` to ignored `.dev.vars` and replace every local placeholder.
4. Apply migrations: `npm run validate:migrations`.
5. Run `npm run dev`.

Validation:

```text
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
```

CI repeats those controls. A separate trusted `workflow_run` publisher derives the actual default-branch run/job/step outcomes from GitHub and retains the schema-valid report on the `assurance-reports` branch; its 30-day Actions artifact is transport/recovery only.

## Delivery

Commit pattern: `[DEMO-NNN] [TYPE] Imperative description`.

Primary types: `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, `CHORE`.

`main` is the accepted production baseline. Changes flow through isolated branches, pull requests, automated validation, review, annotated semantic tags, GitHub Releases, and tag-only deployment. Production requires real Cloudflare resource identifiers, managed Worker secrets, the custom domain, and preferably Cloudflare Access in front of `/admin`. See [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md), [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md), and [`docs/RELEASE.md`](docs/RELEASE.md).

## Start here

- [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md) — governing architecture.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — dashboard, health, logs, billing, admin, and offline behavior.
- [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md) — permanent change IDs, commit records, and risk controls.
- [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md) — reproducible releases, annotated tags, and rollback records.
- [`docs/ROUTES.md`](docs/ROUTES.md) — routes mapped to implementation source.
- [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md) — implementation status and external prerequisites.
- [`docs/INTERACTIVE-DEMO-SPEC.md`](docs/INTERACTIVE-DEMO-SPEC.md) — precise interaction upgrade plan for R2, D1, i18n, WCAG, Git, webhooks, and GraphQL.
- [`KICKOFF-SOL-VERY-HIGH.md`](KICKOFF-SOL-VERY-HIGH.md) — original implementation brief retained as project context.
