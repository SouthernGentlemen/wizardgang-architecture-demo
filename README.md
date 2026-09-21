# WizardGang Architecture Demo

Public, executable companion to **WG-ARCH-001 — WizardGang Systems Architecture**.

Target site: `https://demo.wizardgang.ai`  
Public repository: `SouthernGentlemen/wizardgang-architecture-demo`

The canonical architecture standard is [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md). This repository intentionally keeps architecture and operational documentation in reviewable Markdown/text rather than PDFs.

## Public surface

The ordinary browser experience is intentionally small:

- `/` — project orientation and compact live proof;
- `/demos` — executable architecture demonstrations;
- `/assurance` — framework assessment workbench with focused record drilldown;
- `/security` — contextual vulnerability-reporting and advisory boundary.

`/admin` is a protected operational page and `/offline` is the recovery page. There is no human `/operations` route; requests receive the ordinary 404. Operational machine APIs, scheduled availability collection, 365-day retention, bounded logs, provider observations, and protected controls remain independent contracts.

The server-rendered application hierarchy is declared once in the route registry. Navigation, sitemap membership, canonical links, page metadata, and the generated route manifest are projections of those declarations. Do not maintain a second route list in this README. The human routing/browser contract is [`docs/ROUTE-REGISTRY.md`](docs/ROUTE-REGISTRY.md), and the generated machine inventory is [`docs/route-manifest.json`](docs/route-manifest.json).

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

`/assurance` is a single workbench for the published ISO/IEC 27001, ISO/IEC 42001, and WCAG 2.2 assessment records. Framework tabs and section selection expose derived section/framework posture, while stable record fragments such as `/assurance#ISO27001-A.5.19` select one focused assessment.

The focused pane presents the assessment, recorded gaps, assessment date, Markdown references, and linked evidence without projecting risk, incident, register, or other management-system inventories into public HTML. The presentation fragment at `GET /api/assurance/{record}` serves one record pane for workbench activation; exhaustive structured records remain available through the governed reporting contracts. See [`docs/ASSURANCE.md`](docs/ASSURANCE.md) and [`docs/REPORTING.md`](docs/REPORTING.md).

## Operations and administration

The homepage exposes only compact visitor-facing operational proof: current service/dependency state, measured scheduled availability, and running release/source identity. Detailed operational data remains behind machine contracts such as `/api/operations/*` and the reporting layer rather than a public dashboard.

Availability while intentionally offline is declared per route. Gated API traffic returns structured `503` responses; browser demo navigation uses the registered recovery experience. `/admin` controls demonstration availability and crawler-access state under its authentication boundary.

## Local setup

1. Use the pinned Node.js 26 / npm 11 toolchain and run `npm ci` from the committed lock file.
2. Copy `.dev.vars.example` to ignored `.dev.vars` and replace local placeholders.
3. Run `npm run validate:migrations` to prove the migrations against local D1 state.
4. Run `npm run dev` for the local-only development surface.

### Command map

WG-ARCH-001 §27 defines the shared command meanings; this table records how this repository currently implements them and the prerequisites that matter in a clean cloud checkout.

| Command | Purpose | Prerequisites and side-effect boundary |
| --- | --- | --- |
| `npm ci` | Install the locked dependency graph using the reviewed install-script allowlist. | Requires the pinned Node/npm versions and npm registry access; writes local dependencies only and does not require provider credentials. |
| `npm run dev` | Generate browser assets, then run the repository's Vite/Wrangler development lifecycle. | Requires local `.dev.vars` configuration and the local Cloudflare development prerequisites; starts local processes only and does not publish or deploy. |
| `npm run generate:routes` | Regenerate the route-manifest projection after route declarations change. | Intentionally rewrites tracked `docs/route-manifest.json`; run it only when the route authority changed, then validate the generated diff. |
| `npm run check` | Canonical credential-free repository acceptance gate. | Runs the current source, contract, policy, security, test, type, asset, and assurance checks, but does **not yet** include every temporary CI gate listed below. It must not mutate live providers. |
| `npm run validate:generated-artifacts` | Temporary CI gate for generated-artifact parity and idempotence. | Credential-free; a clean result leaves tracked projections unchanged. This remains separate until the planned command-convergence work composes it into `check`. |
| `npm run validate:migrations` | Apply the D1 migration chain to local Wrangler state. | Requires Wrangler's local D1 runtime; mutates local development state only, never remote D1. |
| `npm run verify:chromium` / `npm run test:site-accessibility` | Prove Chromium is available, then run the browser accessibility/localization audit. | Requires a usable local Chromium runtime; browser execution is local and has no provider mutation. |
| `npm run security:dependencies` | Query npm advisories and fail on high-severity dependency findings. | Requires npm registry/network access; network failure is a blocker, not a clean audit. No provider credentials are required. |
| `npm run build` | Build browser assets and dry-run the Worker bundle. | Writes local build outputs and invokes Wrangler only in dry-run mode; it does not publish or deploy. |
| `npm run validate:ci` | Reproduce the current CI validation sequence with retained diagnostics. | Validates the toolchain, runs `npm ci`, generated-artifact parity, `check`, local migrations, Chromium/browser audit, dependency audit, build, and patch whitespace. It therefore needs registry access, Chromium, and Git history/base context for full PR parity, but no live-provider credentials. |
| `npm run validate:repository-settings -- --live` | Compare GitHub repository/ruleset state with the committed settings baseline. | Requires authenticated `gh` access with repository visibility; read-only verification, not a settings mutation. |
| `npm run deploy` | Invoke a live Wrangler deployment from the current checkout. | Requires Cloudflare credentials and mutates the live Worker; it is **not** a validation command or a substitute for the governed production release path. Production delivery is through the annotated semantic-tag Release workflow and production Deploy workflow. |

For ordinary pre-PR acceptance, run `npm run check` plus the temporary extra gates that CI still owns separately: `npm run validate:generated-artifacts`, `npm run validate:migrations`, `npm run verify:chromium`, `npm run test:site-accessibility`, `npm run security:dependencies`, `npm run build`, and `git diff --check`. From a clean checkout with the required network/browser tooling, `npm run validate:ci` is the one-command CI-parity path.

`npm run validate:ci` stops on the first failing command, preserves its exit code, writes complete command output and safe runtime/repository facts under `.ci-diagnostics/`, and records generated-artifact first-pass drift, second-pass drift, and idempotence. The directory is ignored by Git. GitHub Actions publishes it as a failure artifact when a client cannot expose the complete log body. Live repository-setting verification remains separate because it needs authenticated GitHub access.

## Delivery

Commit pattern: `[DEMO-NNN] [TYPE] Imperative description`.

`main` is the accepted production baseline. Changes flow through isolated branches, pull requests, automated validation, review, annotated semantic tags, GitHub Releases, and exact-tag deployment. See [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md) and [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md).

## Start here

- [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md) — architecture, boundaries, and engineering defaults.
- [`docs/ROUTE-REGISTRY.md`](docs/ROUTE-REGISTRY.md) — routing contract; [`docs/route-manifest.json`](docs/route-manifest.json) is its generated machine projection.
- [`docs/ASSURANCE.md`](docs/ASSURANCE.md) and [`docs/REPORTING.md`](docs/REPORTING.md) — structured assurance and reporting authority.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) and [`docs/IDENTITY.md`](docs/IDENTITY.md) — operating and authorization boundaries.
- [`docs/governance/GOVERNANCE.md`](docs/governance/GOVERNANCE.md) — management-system entry point and links to the focused governance policies.
- [`docs/CHANGE-MANAGEMENT.md`](docs/CHANGE-MANAGEMENT.md) and [`docs/RELEASE-MANAGEMENT.md`](docs/RELEASE-MANAGEMENT.md) — controlled delivery, release, deployment, and rollback.
