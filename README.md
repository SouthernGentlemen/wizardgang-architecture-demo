# WizardGang Architecture Demo

Public, executable companion to **WG-ARCH-001 — WizardGang Systems Architecture**.

Target site: `https://demo.wizardgang.ai`  
Intended public repository: `SouthernGentlemen/wizardgang-architecture-demo`

This repository is deliberately text/code first. The architecture standard is maintained in [`docs/ARCHITECTURE-STANDARD.md`](docs/ARCHITECTURE-STANDARD.md); no PDF is required or included in this package.

## What this repo is

The site is a public architecture laboratory. Each architecture concept receives a stable route, a dedicated implementation module, a working demonstration, and direct links back to the public source that implements it.

Core rules:

- One architecture concept = one stable public route.
- One route = one primary source module under `src/demos/`.
- Every human-facing demo links directly to its implementation source.
- Shared relational demo state uses `DEMO_DB` -> `demo-blob`.
- R2 demos use R2 for actual objects; D1 may hold metadata.
- Durable Object demos use Durable Objects for coordinated state; D1 may hold audit/results.
- Workers remain the application mediation boundary.
- GitHub is the public source of truth for code, history, releases, CI, and evidence.
- WCAG 2.2 / ISO/IEC 27001 / ISO/IEC 42001 references are alignment targets only: **uncertified**.

## Route groups

- **Runtime:** Edge, Workers, Durable Objects, D1, R2
- **Integration:** REST, OpenAPI / Swagger 2.x, GraphQL, Webhooks, MCP
- **Identity:** OAuth 2.0, SSO, SAML
- **Interface:** i18n, WCAG 2.2
- **Delivery:** Git, versioning, branching, releases, GitHub Actions, environments
- **Governance:** traceability, ISO/IEC 27001 alignment, ISO/IEC 42001 alignment, evidence
- **Operations:** dashboard, uptime, health, docs, logs, billing/usage
- **Administration:** protected online/offline control and public maintenance page

See [`docs/ROUTES.md`](docs/ROUTES.md) and [`docs/route-manifest.json`](docs/route-manifest.json) for the stable route contract.

## Operations and admin

Operations are first-class architecture demonstrations, not a separate afterthought.

```text
/dashboard
├── /dashboard/uptime
├── /dashboard/health
├── /dashboard/docs
├── /dashboard/logs
└── /dashboard/billing

/admin       protected demo state control
/offline     public maintenance page
/health      machine-readable health
/version     machine-readable build/repository metadata
```

`/dashboard` is the public operational proof surface. It covers intentional demo state, uptime history, runtime/dependency health, documentation/source evidence, public-safe application logs, deployed version, synthetic usage/cost, budget thresholds, and graceful degradation.

`/admin` can intentionally take ordinary architecture demos online or offline while leaving `/dashboard/*`, `/health`, `/version`, `/offline`, and `/admin` available. Offline HTML navigation redirects to `/offline?from=<route>` and displays **“Oops! demo is down.”** API/non-HTML/write requests return a `503` instead of being redirected.

Admin changes persist in `demo-blob` and emit audit events. Credentials remain outside Git. See [`docs/OPERATIONS.md`](docs/OPERATIONS.md) for the complete behavior matrix and implementation requirements.

## Shared D1 backend

Binding: `DEMO_DB`  
Database: `demo-blob`

Current migrations establish:

- `demo_events` — common audit/event stream;
- `demo_records` — shared demo records;
- `service_health_checks` — uptime/health history;
- `usage_snapshots` — synthetic usage/cost snapshots;
- `demo_control` — online/offline state and public message;
- `application_logs` — bounded public-safe operational log records.

Specialized platform primitives remain separate from D1 even when their metadata/audit history is stored in D1.

The scaffold also includes explicit placeholders/bindings for R2 and Durable Objects plus machine contracts for OpenAPI 2.x, GraphQL, MCP, webhooks, and provider-neutral SAML metadata. Synthetic billing and i18n configuration live under `config/`, and the public evidence/accessibility/identity plans live under `docs/`.

## Repository layout

```text
/
├── src/
│   ├── api/
│   ├── demos/
│   ├── lib/
│   ├── ui/
│   ├── index.ts
│   ├── router.ts
│   └── types.ts
├── migrations/
├── docs/
│   ├── ARCHITECTURE-STANDARD.md
│   ├── OPERATIONS.md
│   ├── ROUTES.md
│   ├── route-manifest.json
│   └── IMPLEMENTATION-PLAN.md
├── tests/
├── .github/workflows/
├── KICKOFF-SOL-VERY-HIGH.md
├── AGENTS.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── wrangler.jsonc
└── package.json
```

## Local setup

1. Run `npm install` and commit the generated lock file when the repository is initialized.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc`.
3. Copy `.dev.vars.example` to `.dev.vars` and replace local admin placeholders.
4. Apply migrations: `npx wrangler d1 migrations apply demo-blob --local`.
5. Run `npm run dev`.

For production, apply migrations without `--local`, configure the custom domain, store credentials/tokens in managed secrets, and deploy through the release workflow.

## Delivery and evidence

Commit pattern:

```text
[DEMO-NNN] CATEGORY Description
```

Categories follow WG-ARCH-001: `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`.

`main` is the accepted production baseline. Changes should flow through isolated branches, pull requests, automated validation, review, tags, GitHub Releases, and controlled Cloudflare deployment.

## Start here

Hand [`KICKOFF-SOL-VERY-HIGH.md`](KICKOFF-SOL-VERY-HIGH.md) to GPT-5.6 Sol at Very High reasoning. It contains the complete implementation brief, including runtime demos, integration/identity demos, dashboard, uptime, health, docs, log viewer, billing/degradation, admin online/offline control, evidence, accessibility, i18n, governance, CI, release discipline, and acceptance criteria.
