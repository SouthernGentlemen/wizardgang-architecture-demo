# Kickoff Prompt — WizardGang Architecture Demo

**Recommended model:** GPT-5.6 Sol  
**Reasoning:** Very High

You are taking ownership of the initial implementation of the public **WizardGang Architecture Demo**.

The working scaffold in this repository is the starting point. Read it completely before changing code. The canonical repository-native architecture reference is `docs/ARCHITECTURE-STANDARD.md`, with the dashboard/admin/offline requirements in `docs/OPERATIONS.md`. This package intentionally contains no PDFs. The public site target is `https://demo.wizardgang.ai` and the intended public repository is:

`SouthernGentlemen/wizardgang-architecture-demo`

Do not modify or migrate unrelated WizardGang repositories. This project must stand alone as a public, auditable example of the standard architecture.

## Goal

Turn the scaffold into a set of small, real, inspectable demonstrations where every architecture capability has:

1. a stable public route;
2. a working implementation;
3. a direct link from the page to the exact source that implements it;
4. observable behavior a visitor can execute or inspect;
5. appropriate audit/evidence records;
6. no certification claims beyond the documented **aligned — uncertified** language.

The site is not a marketing mockup. Each technical route should actually exercise the primitive or interface it claims to demonstrate.

## Platform constraints

- TypeScript first.
- Cloudflare first / edge first.
- Cloudflare Workers are the primary compute boundary.
- Shared relational demo state uses the same D1 database: `DEMO_DB` -> `demo-blob`.
- R2 demos must actually use R2 for objects; D1 may hold metadata/references.
- Durable Object demos must actually use Durable Objects for coordinated state; D1 may hold durable audit/results.
- Do not use D1 to fake R2 or Durable Objects.
- REST uses JSON and a defined `/v1/*` API surface.
- Maintain an OpenAPI / Swagger 2.x contract for the REST example.
- GraphQL is supported as its own application interface with the same authorization boundary as REST.
- OAuth 2.0, SSO and SAML demonstrations must clearly separate authentication from authorization.
- MCP is a controlled application interface and must not bypass ordinary authentication, authorization, validation or data boundaries.
- i18n and WCAG 2.2 behavior must be designed into the UI, not added as decorative claims.
- Legacy web services are not a default platform capability.
- Secrets must never be committed.

## Route contract

Preserve the existing public routes in `docs/ROUTES.md` and `docs/route-manifest.json`.

Core groups include:

- Runtime: `/edge`, `/workers`, `/durable-objects`, `/d1`, `/r2`
- Integration: `/api`, `/api/rest`, `/api/openapi`, `/api/graphql`, `/api/webhooks`, `/mcp`
- Identity: `/identity`, `/identity/oauth`, `/identity/sso`, `/identity/saml`
- Interface: `/i18n`, `/accessibility`
- Delivery: `/git`, `/git/versioning`, `/git/branching`, `/git/releases`, `/git/actions`, `/environments`
- Governance: `/traceability`, `/governance`, `/governance/iso-27001`, `/governance/iso-42001`, `/evidence`
- Operations: `/dashboard`, `/dashboard/uptime`, `/dashboard/health`, `/dashboard/docs`, `/dashboard/logs`, `/dashboard/billing`
- Administration: `/admin`, `/offline`

Do not casually rename routes. If a route needs to change, treat it as an architectural change and document the reason.

## Public source linkage

The repository must remain public. Every human-facing architecture demo needs prominent links to:

- its primary implementation source;
- shared routing where relevant;
- schema/migration where relevant;
- API contract where relevant;
- the public repository;
- supporting tests/evidence where useful.

Prefer direct GitHub file links. Where practical, link to a stable tagged release or commit for evidence instead of only `main`.

## Shared D1 backend

Use `demo-blob` as the common relational backend for demo records, audit events, operational health history, synthetic usage/cost records, and demo control state.

Existing migrations establish:

- `demo_events`
- `demo_records`
- `service_health_checks`
- `usage_snapshots`
- `demo_control`

Extend through new numbered migrations. Do not rewrite applied migrations once the repository has a deployed baseline.

## Operations dashboard

`/dashboard` is the public operational proof surface for the project and must be treated as a first-class architecture capability, not a cosmetic add-on.

It should summarize and link to:

- current demo state;
- uptime history;
- health/readiness;
- current deployed version/release;
- documentation and API contracts;
- public-safe bounded application logs;
- synthetic usage and estimated billing;
- degradation/budget behavior;
- public GitHub evidence.

### Uptime

`/dashboard/uptime` should use timestamped checks and stored history to calculate/display availability. Make it clear what is being measured. Planned/manual demo-offline windows should be distinguishable from an unexpected dependency failure where possible.

### Health

`/dashboard/health` and `/health` should distinguish the Worker/runtime from its dependencies and from the intentional public demo state.

Do not expose secrets or private Cloudflare account metadata.

### Docs

`/dashboard/docs` should be a useful live documentation index: architecture standard, route map, API contracts, source, releases, operational endpoints, contribution/security docs, and evidence paths.

### Logs

`/dashboard/logs` must be a genuine public-safe operational log viewer backed by `application_logs` in `demo-blob`. Provide bounded history, level/source filtering, structured detail, and a JSON companion at `/__api/operations/logs`. Keep this distinct from the `demo_events` audit/evidence stream.

Emit representative logs from baseline demo runs, health checks, and admin state changes so the viewer has meaningful data. Never store or render passwords, authorization headers, cookies, tokens, API keys, secrets, payment information, private Cloudflare account identifiers, or unsafe raw request bodies. Defensively redact sensitive structured-detail keys and cap payload sizes. The log viewer and its read-only JSON endpoint must remain available while the public demos are intentionally offline.

### Billing

`/dashboard/billing` is a **synthetic demo** of metering, estimated cost, thresholds, and graceful degradation. Never expose real invoices, payment information, account identifiers, API tokens, or private Cloudflare billing metadata.

Show how usage can move through normal -> warning -> degraded behavior using controlled demo values.

## Protected demo administration

`/admin` is the operational control surface for intentionally taking the public architecture demos online or offline.

Requirements:

- `/admin` must be authenticated.
- Credentials/secrets must never be in Git.
- The current scaffold supports ignored local `.dev.vars` credentials. Harden the production path appropriately; Cloudflare-native access control is preferred if it can be configured cleanly without weakening portability.
- Admin state persists in `demo-blob`, not Worker memory.
- Admin can set the state to `online` or `offline` and provide a short public message.
- The control action must be auditable.
- When offline, ordinary architecture/demo routes must not execute their normal demo behavior.
- HTML demo requests should redirect to `/offline?from=<requested-route>`.
- Non-HTML/write/API demo requests should return an appropriate `503` response instead of redirecting blindly.
- The offline page must clearly display **“Oops! demo is down.”** plus the configured message.
- `/dashboard/*`, `/health`, `/version`, `/offline`, and `/admin` must remain reachable while the demos are intentionally offline so visitors can inspect status and evidence.
- Avoid redirect loops.
- Use `Cache-Control: no-store` for admin/control responses.

Every admin state change must also emit a safe audit event to the common `demo_events` stream. Never record credentials, authorization headers, cookies, or secret values.

The public repository may expose how the control works; it must never expose the credentials that authorize it.

## Git / release / evidence discipline

Use the project commit pattern:

`[DEMO-NNN] CATEGORY Description`

Use the existing categories from WG-ARCH-001 (`FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`).

Keep changes small and independently understandable. `main` is the accepted production baseline. Work on branches, validate via pull request, merge, tag meaningful production baselines using semantic versioning, create GitHub Releases, then deploy the tagged/reviewed source state.

GitHub Actions should automate repeatable controls including, as appropriate:

- dependency install;
- TypeScript checking;
- linting;
- unit/integration tests;
- API contract validation;
- migration checks;
- accessibility checks;
- localization validation;
- security/dependency checks;
- build/deploy validation;
- evidence generation.

A deployed production version must be traceable to a specific commit/tag/release.

## Implementation approach

Start by validating and hardening the scaffold rather than rewriting it. Follow `docs/IMPLEMENTATION-PLAN.md` in small commits. The first objective is a deployable routing + D1 + admin/status baseline; after that, make the architecture-specific routes real one at a time.

For each route:

1. define exactly what capability is being proven;
2. implement the smallest genuine example;
3. add tests;
4. add direct source/evidence links;
5. record appropriate D1 audit metadata;
6. verify accessibility and failure behavior;
7. update route/docs status from scaffolded to working only when it truly works.

Do not build giant abstractions merely to make the demos share code. Shared infrastructure should stay small and obvious. The purpose is to make each architectural boundary understandable to a developer reviewing the public repository.

## Definition of done for the kickoff pass

Before moving into individual architecture demos, deliver a clean baseline where:

- the repository is initialized as the intended public repo if permissions allow;
- the project installs and type-checks from a clean checkout;
- tests run in CI;
- D1 migrations apply cleanly;
- `demo.wizardgang.ai` routing is ready for deployment;
- all scaffold routes resolve;
- every route has a valid public source link;
- `/health` and `/version` work;
- `/dashboard` and its four child routes resolve;
- `/admin` is protected and can switch the public demos online/offline;
- offline mode redirects ordinary demo pages to the clear `Oops! demo is down.` page;
- status/operations/admin routes remain usable while offline;
- no secret is present in source or Git history;
- README, route map, implementation plan, security guidance, contributing guidance and agent guidance agree with the actual implementation;
- `docs/ARCHITECTURE-STANDARD.md` and `docs/OPERATIONS.md` remain included as the governing architecture and operations references;
- no PDFs are present in the repository/package;
- WCAG/ISO statements remain accurately qualified as alignment targets and **uncertified**.

When the baseline is stable, continue through the implementation plan sequentially. Do not stop at static pages: the end state is a public architecture laboratory where the code, running behavior, operational state and Git evidence all agree.
