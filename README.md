# WizardGang Architecture Demo

Public, executable companion to **WG-ARCH-001 — WizardGang Systems Architecture**.

Target site: `https://demo.wizardgang.ai`  
Public repository: `SouthernGentlemen/wizardgang-architecture-demo`

The canonical architecture standard is [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md). This repository intentionally keeps architecture and operational documentation in reviewable Markdown/text rather than PDFs.

## Public surface

The ordinary browser experience is intentionally small:

- `/` — project orientation and compact live proof;
- `/demos` — executable architecture demonstrations;
- `/assurance` — four bounded engineering-assurance checks;
- `/security` — contextual vulnerability-reporting and advisory boundary.

`/admin` is a protected operational page and `/offline` is the recovery page. The former human `/operations` page is retired and returns the ordinary 404. Operational machine APIs, scheduled availability collection, 365-day retention, bounded logs, provider observations, and protected controls remain independent contracts.

The server-rendered application hierarchy is declared once in the route registry. Navigation, sitemap membership, canonical links, page metadata, and generated route documentation are projections of those declarations. Do not maintain a second route list in this README. The current inventories are generated in [`docs/ROUTES.md`](docs/ROUTES.md) and [`docs/route-manifest.json`](docs/route-manifest.json); the permanent browser contract is [`docs/FRONTEND-ROUTES.md`](docs/FRONTEND-ROUTES.md).

## Demonstrated architecture

`/demos` groups the live demonstrations around visitor tasks rather than implementation inventory:

- Data — D1 and R2;
- APIs — REST/OpenAPI and GraphQL;
- Integrations — signed webhooks;
- Identity — OAuth/OIDC/SAML behavior;
- AI / MCP — MCP endpoint, tools, executable proof, and connection guidance;
- supporting runtime proof — Edge, Workers, and Durable Objects;
- supporting quality proof — accessibility and internationalization.

Browser presentation and machine/protocol contracts remain separate. REST, OpenAPI, GraphQL, MCP, identity callbacks, webhooks, reporting, laboratory, operational, crawler, admin, and recovery routes keep their own declarations and policies.

Core invariants:

- shared relational state uses `DEMO_DB` / `demo-blob`;
- R2 stores object bytes while D1 stores metadata/references;
- Durable Objects own coordinated state and D1 stores audit evidence where applicable;
- Workers mediate application state and integrations;
- public REST, GraphQL, and MCP reads share an explicit authorization boundary;
- secrets, credentials, private account metadata, and real billing/payment data never belong in Git or public logs;
- WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 references mean **aligned — uncertified**.

## Assurance

`/assurance` is a focused verification surface for:

1. security controls;
2. the AI/MCP boundary;
3. traceability and evidence;
4. accessibility posture.

Canonical risks, incidents, exercises, governance records, objectives, framework records, and other management-system data remain available through their governed structured sources and reporting contracts without being projected as ordinary public navigation. See [`docs/ASSURANCE.md`](docs/ASSURANCE.md) and [`docs/ASSURANCE-API.md`](docs/ASSURANCE-API.md).

## Operations and administration

The homepage exposes only compact visitor-facing operational proof: current service/dependency state, measured scheduled availability, and running release/source identity. Detailed operational data remains behind machine contracts such as `/api/operations/*` and the reporting layer rather than a public dashboard.

Availability while intentionally offline is declared per route. Gated API traffic returns structured `503` responses; browser demo navigation uses the registered recovery experience. `/admin` controls demonstration availability and crawler-access state under its authentication boundary.

## Local setup

1. Run `npm ci` using the committed lock file.
2. Copy `.dev.vars.example` to ignored `.dev.vars` and replace local placeholders.
3. Run `npm run validate:migrations`.
4. Run `npm run dev`.

Validation:

```text
npm run generate:routes
npm run check
npm run validate:migrations
npm run security:dependencies
npm run build
git diff --check
```

## Delivery

Commit pattern: `[DEMO-NNN] [TYPE] Imperative description`.

`main` is the accepted production baseline. Changes flow through isolated branches, pull requests, automated validation, review, annotated semantic tags, GitHub Releases, and exact-tag deployment. See [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md) and [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md).

## Start here

- [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md) — governing architecture.
- [`docs/FRONTEND-ROUTES.md`](docs/FRONTEND-ROUTES.md) — browser information architecture and retirement rules.
- [`docs/ASSURANCE.md`](docs/ASSURANCE.md) — canonical assurance model and publication boundary.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — operational machine contracts, retention, admin, and recovery behavior.
- [`docs/IDENTITY.md`](docs/IDENTITY.md) — identity and authorization model.
- [`docs/REPORTING.md`](docs/REPORTING.md) — canonical reporting architecture.
- [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md) — controlled change identity and history.
- [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md) — reproducible releases, deployment, and rollback.
- [`docs/ROUTES.md`](docs/ROUTES.md) — generated route-to-source projection.
