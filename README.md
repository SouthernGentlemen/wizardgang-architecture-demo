# WizardGang Architecture Demo

Public, executable companion to **WG-ARCH-001 — WizardGang Systems Architecture**.

Target site: `https://demo.wizardgang.ai`  
Intended public repository: `SouthernGentlemen/wizardgang-architecture-demo`

The canonical standard is [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md). This repository intentionally contains no PDFs. All registered architecture routes have working implementations; external production deployment and identity-provider credentials remain environment-specific steps.

## Architecture laboratory

The server-rendered application hierarchy is declared once in the route registry. Each user-facing conceptual destination has one stable route ID and one canonical pathname, while navigation, breadcrumbs, the homepage architecture map, sitemap membership, canonical links, and route documentation are projections of the same declarations.

Query parameters are reserved for interaction state such as filters, search, sorting, pagination, locale, accessibility mode, or request deep links. They do not select the primary resource. Retired resource-selection query forms and retired aliases remain ordinary unknown routes.

The demonstration is organized into Platform, Interfaces, Assurance, Operations, and Security domains. Browser presentations and machine protocols remain separate contracts even when they demonstrate the same capability.

Do not maintain a route list in this README. The current human-readable and machine-readable inventories are generated in [`docs/ROUTES.md`](docs/ROUTES.md) and [`docs/route-manifest.json`](docs/route-manifest.json). The frontend model and replacement invariants are documented in [`docs/FRONTEND-ROUTES.md`](docs/FRONTEND-ROUTES.md).

Core invariants:

- Shared relational state uses `DEMO_DB` -> `demo-blob`.
- R2 content stays in R2; D1 stores metadata/references only.
- Coordinated counter state stays in a Durable Object; D1 stores audit evidence only.
- Workers mediate application state and integrations.
- Public REST, GraphQL, and MCP reads share one authorization boundary; identity sessions produce short-lived bearer tokens whose REST writes are limited to server-derived visitor sandboxes.
- Secrets, credentials, private account metadata, and real billing/payment data never belong in Git or public logs.
- WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 references mean **aligned — uncertified**.

## Interface

The demo uses the `wizardgang.ai` design tokens: dark by default, with a light theme the reader can toggle and the browser remembers. Every HTML surface carries a skip link and shared page chrome.

There is no client-side router. Browser navigation resolves registered route IDs through the server-side routing contract; client scripts may enhance controls and maintain true interaction state, but they do not emulate application routing.

Protocol endpoints, browser consoles, identity callbacks, reporting APIs, laboratory APIs, and operational APIs keep independent declarations and policies. Their current concrete locations are published by the generated route artifacts and OpenAPI.

## Operations and admin

The operations domain combines browser presentations with separately declared health, release-identity, public-safe logging, usage, reporting, synthetic budget, administration, crawler-control, and offline-recovery contracts.

Availability while intentionally offline is declared per route rather than protected by a hardcoded pathname list. Ordinary gated API traffic returns structured `503` responses while ordinary gated browser navigation uses the registered offline experience.

The protected administration surface can control demonstration availability and ChatGPT web access. Crawler policy is backed by D1 and the dynamic robots response. `GPTBot` remains blocked regardless of the user-facing search/fetch control; the control never opts the demo into foundation-model training.

## Shared D1 backend

The numbered migrations establish:

- `demo_events` — common audit/evidence stream;
- `demo_records` — versioned REST/GraphQL/MCP demonstration records;
- `service_health_checks` — timestamped availability history;
- `usage_snapshots` and normalized provider observation tables required by current contracts;
- `demo_control` and `crawler_control` — availability and crawler-control state;
- `application_logs` — bounded public-safe diagnostics;
- `r2_object_metadata` — relational references to real R2 objects;
- `webhook_receipts` and `webhook_events` — signed-delivery evidence and replay protection;
- visitor-scoped D1 demo state for users, tasks, records, and reset behavior;
- identity session and SAML correlation/replay state.

Machine contracts for OpenAPI, GraphQL, MCP, webhooks, and SAML service-provider metadata are versioned beside their implementations.

## Local setup

1. Run `npm ci` using the committed lock file.
2. The committed D1 identifier targets the public `demo-blob`; local mode still uses isolated Wrangler state.
3. Copy `.dev.vars.example` to ignored `.dev.vars` and replace every local placeholder.
4. Apply migrations with `npm run validate:migrations`.
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

`main` is the accepted production baseline. Changes flow through isolated branches, pull requests, automated validation, review, annotated semantic tags, GitHub Releases, and tag-only deployment. Production requires real Cloudflare resource identifiers, managed Worker secrets, the custom domain, and preferably Cloudflare Access in front of protected administration.

See [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md), [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md), and [`docs/RELEASE.md`](docs/RELEASE.md).

## Start here

- [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md) — governing architecture.
- [`docs/FRONTEND-ROUTES.md`](docs/FRONTEND-ROUTES.md) — registry-derived frontend model and query-state policy.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — operations, health, logs, usage/cost, admin, and offline behavior.
- [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md) — permanent change IDs, commit records, and risk controls.
- [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md) — reproducible releases, annotated tags, and rollback records.
- [`docs/ROUTES.md`](docs/ROUTES.md) — generated routes mapped to implementation source.
- [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md) — implementation status and external prerequisites.
- [`docs/INTERACTIVE-DEMO-SPEC.md`](docs/INTERACTIVE-DEMO-SPEC.md) — current browser, protocol, reporting, and security interaction contract.
