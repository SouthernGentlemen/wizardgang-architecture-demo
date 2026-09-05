# Kickoff Prompt — WizardGang Architecture Demo

**Recommended model:** GPT-5.6 Sol  
**Reasoning:** Very High

You are taking ownership of the public **WizardGang Architecture Demo**.

Read the repository instructions before changing code. The canonical repository-native architecture reference is `docs/ARCHITECTURE-STANDARD.md`, with dashboard/admin/offline requirements in `docs/OPERATIONS.md` and the current public URL contract in `docs/ROUTES.md` plus `docs/route-manifest.json`. This package intentionally contains no PDFs.

The public site target is `https://demo.wizardgang.ai` and the public repository is `SouthernGentlemen/wizardgang-architecture-demo`.

Do not modify or migrate unrelated WizardGang repositories. This project must stand alone as a public, auditable example of the standard architecture.

## Goal

Maintain a set of small, real, inspectable demonstrations where every architecture capability has:

1. a stable canonical public route;
2. a working implementation;
3. a direct link from the page to the exact source that implements it;
4. observable behavior a visitor can execute or inspect;
5. appropriate audit/evidence records;
6. no certification claims beyond the documented aligned-but-uncertified language.

The site is not a marketing mockup. Each technical route should exercise the primitive or interface it claims to demonstrate.

## Platform constraints

- TypeScript first.
- Cloudflare first / edge first.
- Cloudflare Workers are the primary compute boundary.
- Shared relational demo state uses `DEMO_DB` / `demo-blob`.
- R2 demos use R2 for objects; D1 may hold metadata/references.
- Durable Object demos use Durable Objects for coordinated state; D1 may hold durable audit/results.
- Do not use D1 to fake R2 or Durable Objects.
- REST uses JSON and the documented `/v1/*` API surface.
- Maintain an OpenAPI / Swagger 2.x contract for the REST example.
- GraphQL is supported as its own application interface with the same authorization boundary as REST.
- OAuth 2.0, SSO, and SAML demonstrations must clearly separate authentication from authorization.
- MCP is a controlled application interface and must not bypass ordinary authentication, authorization, validation, or data boundaries.
- i18n and WCAG 2.2 behavior must be designed into the UI, not added as decorative claims.
- Legacy web services are not a default platform capability.
- Secrets must never be committed.

## Route contract

Use only the canonical current routes defined in `docs/ROUTES.md` and `docs/route-manifest.json`. Do not recreate compatibility URLs for retired page structures.

Core groups include:

- Platform: `/edge`, `/workers`, `/durable-objects`, `/d1`, `/r2`
- Interfaces: `/api`, `/graphql`, `/webhooks`, `/identity`, `/mcp`
- Standards: `/i18n`, `/accessibility`
- Delivery & Governance: `/git`, `/governance`, `/evidence`, `/compliance`, `/security`, `/governance/concerns`, `/governance/risks`, `/governance/incidents`
- Operations: `/dashboard`, `/dashboard/uptime`, `/dashboard/docs`, `/dashboard/logs`, `/dashboard/billing`
- Administration: `/admin`, `/offline`
- Machine status: `/health`, `/version`

Do not casually rename routes. A route change is an architectural change and must follow the controlled-change process.

## Public source linkage

Every human-facing architecture demo needs prominent links to:

- its primary implementation source;
- shared routing where relevant;
- schema/migration where relevant;
- API contract where relevant;
- the public repository;
- supporting tests/evidence where useful.

Prefer direct GitHub file links. Where practical, link to a stable tagged release or commit for evidence instead of only `main`.

## Shared D1 backend

Use `demo-blob` as the common relational backend for demo records, audit events, operational health history, synthetic usage/cost records, and demo control state.

Extend through new numbered migrations. Do not rewrite applied migrations once the repository has a deployed baseline.

## Operations dashboard

`/dashboard` is the public operational proof surface and must remain a first-class architecture capability.

It should summarize and link to:

- current demo state;
- uptime history;
- the human-readable health card at `/dashboard#health` and machine status at `/health`;
- current deployed version/release;
- documentation and API contracts;
- public-safe bounded application logs;
- usage and estimated billing evidence;
- degradation/budget behavior;
- public GitHub evidence;
- compliance and assurance evidence.

### Uptime

`/dashboard/uptime` uses timestamped checks and stored history to calculate/display availability. Make clear what is being measured. Planned/manual demo-offline windows should be distinguishable from unexpected dependency failures where possible.

### Health

The dashboard health card and `/health` should distinguish the Worker/runtime from dependencies and from the intentional public demo state. Do not expose secrets or private Cloudflare account metadata.

### Docs

`/dashboard/docs` is a live documentation index covering architecture standards, route map, API contracts, source, releases, operational endpoints, contribution/security docs, and evidence paths.

### Logs

`/dashboard/logs` is a genuine public-safe operational log viewer backed by `application_logs` in `demo-blob`, with bounded history and a JSON companion at `/__api/operations/logs`. Keep this distinct from the `demo_events` audit/evidence stream.

Never store or render passwords, authorization headers, cookies, tokens, API keys, secrets, payment information, private Cloudflare account identifiers, or unsafe raw request bodies. Defensively redact sensitive structured-detail keys and cap payload sizes.

### Billing

`/dashboard/billing` is a controlled demonstration of metering, cost evidence, thresholds, and graceful degradation. Never expose invoices, payment information, account identifiers, API tokens, or private Cloudflare billing metadata.

## Protected demo administration

`/admin` controls whether public architecture demos are online or offline.

Requirements:

- `/admin` is authenticated.
- Credentials/secrets are never in Git.
- Admin state persists in `demo-blob`, not Worker memory.
- Admin can set the state to `online` or `offline` and provide a short public message.
- Control actions are auditable.
- When offline, ordinary architecture/demo routes do not execute normal demo behavior.
- HTML demo requests redirect to `/offline?from=<requested-route>`.
- Non-HTML/write/API demo requests return an appropriate `503` instead of redirecting blindly.
- The offline page clearly displays **“Oops! demo is down.”** plus the configured message.
- `/dashboard/*`, `/health`, `/version`, `/offline`, and `/admin` remain reachable while demos are intentionally offline.
- Avoid redirect loops.
- Use `Cache-Control: no-store` for admin/control responses.

Every admin state change emits a safe audit event to `demo_events`. Never record credentials, authorization headers, cookies, or secret values.

## Git / release / evidence discipline

Use the repository's controlled-change format from `docs/CHANGE-MANAGEMENT.md` and follow `AGENTS.md` completely.

Keep changes small and independently understandable. `main` is the accepted baseline. Work on isolated branches, validate via pull request, and merge only when required checks pass. Release/tag/deploy work happens only when explicitly requested and must use the repository's release workflow.

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
- build validation;
- evidence generation.

A deployed production version must be traceable to a specific commit/tag/release.

## Implementation approach

Validate and harden the existing architecture rather than creating parallel compatibility layers. For each capability:

1. define exactly what is being proved;
2. implement the smallest genuine example;
3. add tests;
4. add direct source/evidence links;
5. record appropriate audit metadata;
6. verify accessibility and failure behavior;
7. keep route/docs status synchronized with actual behavior.

Do not build giant abstractions merely to make the demos share code. Shared infrastructure should stay small, obvious, and canonical.

## Definition of done

A change is complete only when:

- the project installs and type-checks from a clean checkout;
- tests and required CI gates pass;
- D1 migrations apply cleanly;
- route behavior and route documentation agree;
- every public demo has a valid public source link;
- `/health` and `/version` work;
- `/dashboard` and its canonical child routes resolve;
- `/admin` remains protected and can switch public demos online/offline;
- offline mode preserves the documented redirect/503 split;
- operational/admin routes remain usable while offline;
- no secret is present in source or Git history;
- README, route map, operations guidance, security guidance, contributing guidance, and agent guidance agree with implementation;
- `docs/ARCHITECTURE-STANDARD.md` and `docs/OPERATIONS.md` remain governing references;
- no PDFs are present in the repository/package;
- WCAG/ISO statements remain accurately qualified as alignment targets and uncertified.

The end state is a public architecture laboratory where code, running behavior, operational state, assurance records, and Git evidence agree on one current contract.
