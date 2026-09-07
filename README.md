# WizardGang Architecture Demo

Public, executable companion to **WG-ARCH-001 — WizardGang Systems Architecture**.

Target site: `https://demo.wizardgang.ai`  
Intended public repository: `SouthernGentlemen/wizardgang-architecture-demo`

The canonical standard is [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md). This repository intentionally contains no PDFs. All registered architecture routes have working implementations; external production deployment and identity-provider credentials remain environment-specific steps.

## Architecture laboratory

The frontend has exactly eight server-rendered HTML page pathnames: `/`, `/platform`, `/interfaces`, `/assurance`, `/security`, `/operations`, `/admin`, and `/offline`. The surface and view inventory is declared once in `src/demos/registry.ts`; navigation and sitemap publication derive from the same declarations. See [`docs/FRONTEND-ROUTES.md`](docs/FRONTEND-ROUTES.md) for the complete information architecture.

- **Platform:** `/platform` selects safe edge-context inspection, bounded stateless Worker compute, the coordinated Durable Object counter, the session-isolated D1 users-and-tasks lab, or the bounded R2 mini file manager through ordinary `?view=` query state.
- **Interfaces:** `/interfaces` selects REST/OpenAPI, GraphQL/GraphiQL, signed webhooks, identity, MCP, internationalization, and accessibility demonstrations. Protocol and API endpoints remain separate machine contracts.
- **Assurance:** `/assurance` selects delivery, governance, evidence, compliance, risks, incidents, and public-concern views while preserving stable record fragments. `/security` remains the separate public security/advisory and private-reporting boundary.
- **Operations:** `/operations` selects overview, availability, public-safe logs, usage/cost, reporting, and documentation views. `/admin` and `/offline` remain dedicated control/recovery pages.

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

The demo uses the `wizardgang.ai` design tokens: dark by default, with a light theme the reader can toggle and the browser remembers. Every HTML surface carries a skip link and shared page chrome. `/sitemap.xml` is generated from registered page metadata, so it cannot publish a page that is absent from the application route registry.

`/platform` is the single Platform HTML surface. Deep links use `/platform?view=edge`, `/platform?view=workers`, `/platform?view=durable-objects`, `/platform?view=d1`, and `/platform?view=r2`. Former standalone platform page paths are unregistered and return the ordinary 404 without redirects; their working API endpoints keep their existing URLs and storage boundaries.

`/interfaces` is the single browser surface for REST, GraphQL, webhooks, identity, MCP, internationalization, and accessibility. Deep links use `/interfaces?view=rest`, `/interfaces?view=graphql`, `/interfaces?view=webhooks`, `/interfaces?view=identity`, `/interfaces?view=mcp`, `/interfaces?view=i18n`, and `/interfaces?view=accessibility`. Former standalone interface page paths return the ordinary 404 without redirects. `/graphql` is machine-only even for browser HTML requests; the locally bundled GraphiQL document is embedded inside `/interfaces?view=graphql`. `/graphql/schema`, identity protocol routes, webhook endpoints, and `/mcp` retain their protocol URLs.

`/assurance` is the single public assurance browser surface. Its query-selected views preserve canonical filters, reporting contracts, and stable fragments such as `/assurance?view=risks#SEC-RISK-001`. `/security` remains a distinct page because vulnerability reporting and published security advisories have a separate disclosure boundary.

There is no client-side router. View changes are normal links to server-rendered documents with query state; application routing remains registry matching in `src/router.ts`.

## Operations and admin

```text
/operations
├── overview
├── ?view=availability
├── ?view=logs
├── ?view=usage
├── ?view=reports
└── ?view=docs

/admin       protected D1-backed demo control
/offline     public maintenance page
/api/operations/health      machine-readable dependency health
/api/operations/version     machine-readable release/source identity
/robots.txt  dynamic ChatGPT crawler policy
```

The read-only operations surface carries health, availability, deployment evidence, public-safe logs, sanitized usage/cost observations, shared reporting, and current documentation. Cloudflare Cron stores health observations every five minutes; other provider observations retain their own collection and freshness semantics. The synthetic cost-guardrail simulator remains explicitly separate from authoritative provider billing data.

`/admin` can intentionally take ordinary demonstrations online or offline. Offline browser navigation may redirect gated canonical pages to `/offline?from=<route>`; API, non-HTML, and write requests return JSON `503`. Operations, security, health/version recovery interfaces, public-safe logs, offline, and authenticated admin remain reachable according to their registered offline policies. Control failures fail closed.

The same protected admin page controls ChatGPT web access. The switch updates a D1-backed `/robots.txt` policy and a server-side gate for `OAI-SearchBot` and `ChatGPT-User`, so disabling access also covers user-requested ChatGPT fetches that may not follow robots rules. `GPTBot` remains blocked in either state; this control never opts the demo into foundation-model training. The public operations surface reports the current state without rendering a mutation form.

## Shared D1 backend

The numbered migrations establish:

- `demo_events` — common audit/evidence stream;
- `demo_records` — versioned REST/GraphQL/MCP demonstration records, seeded so public reads return real data;
- `service_health_checks` — timestamped availability history;
- `usage_snapshots` — controlled synthetic usage/cost state;
- `cloudflare_usage_snapshots` — cached, normalized public-safe Cloudflare telemetry retained only where current migrations/contracts require it;
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

Machine contracts for OpenAPI 3.1, GraphQL, MCP, webhooks, and SAML service-provider metadata are versioned beside their implementations.

## Local setup

1. Run `npm ci` using the committed lock file.
2. The committed D1 identifier targets the public `demo-blob`; local mode still uses isolated Wrangler state.
3. Copy `.dev.vars.example` to ignored `.dev.vars` and replace every local placeholder.
4. Apply migrations: `npm run validate:migrations`.
5. Run `npm run dev`.

Validation:

```text
npm run generate:routes
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
git diff --check
```

CI repeats the required validation controls. Delivery reporting queries GitHub's native workflow runs, attempts, and artifacts through the canonical reporting layer; no workflow creates a reporting branch or stores a second report shape.

## Delivery

Commit pattern: `[DEMO-NNN] [TYPE] Imperative description`.

Primary types: `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, `CHORE`.

`main` is the accepted production baseline. Changes flow through isolated branches, pull requests, automated validation, review, annotated semantic tags, GitHub Releases, and tag-only deployment. Production requires real Cloudflare resource identifiers, managed Worker secrets, the custom domain, and preferably Cloudflare Access in front of `/admin`. See [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md), [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md), and [`docs/RELEASE.md`](docs/RELEASE.md).

## Start here

- [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md) — governing architecture.
- [`docs/FRONTEND-ROUTES.md`](docs/FRONTEND-ROUTES.md) — the eight-page frontend information architecture and query-state view contract.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — operations, health, logs, usage/cost, admin, and offline behavior.
- [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md) — permanent change IDs, commit records, and risk controls.
- [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md) — reproducible releases, annotated tags, and rollback records.
- [`docs/ROUTES.md`](docs/ROUTES.md) — routes mapped to implementation source.
- [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md) — implementation status and external prerequisites.
- [`docs/INTERACTIVE-DEMO-SPEC.md`](docs/INTERACTIVE-DEMO-SPEC.md) — current browser, protocol, reporting, and security interaction contract.
