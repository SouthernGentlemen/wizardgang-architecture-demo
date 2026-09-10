# Implementation plan and status

The stable route contract was established first; genuine capabilities were then implemented without renaming the public human routes. Capability IDs below are design-plan references, not permanent Git change IDs.

The current interaction contract for R2, D1, i18n, WCAG, Git, webhooks, GraphQL, reporting, and route topology is specified in [`INTERACTIVE-DEMO-SPEC.md`](INTERACTIVE-DEMO-SPEC.md). Exact production evidence for released historical states is recorded separately in [`history/DEPLOYMENTS.md`](history/DEPLOYMENTS.md).

The shared dark/light interface, responsive shell, technical surfaces, navigation, and social preview were aligned with the flagship `wizardgang.ai` brand system in v0.6.0 and deployed from its verified annotated tag on 2026-09-01.

The dashboard-visible ChatGPT crawler control, dynamic robots policy, and server-enforced user-agent gate are included in v0.7.0. The production migration seeds access as disabled so an authenticated operator must explicitly enable it.

| Sequence | Capability | Status |
|---|---|---|
| CAP-001 | Route registry, shell, direct source links, D1/admin/offline baseline | Complete |
| CAP-002 | D1 CRUD and shared read/write authorization | Complete |
| CAP-003–006 | Edge context, stateless Worker compute, R2 objects, Durable Object coordination | Complete |
| CAP-007–010 | REST/JSON v1, OpenAPI 3.1, GraphQL, signed webhooks | Complete |
| CAP-011 | Microsoft/Google OIDC and GitHub OAuth 2.0 authorization-code flows with server-side PKCE | Complete; provider credentials are environment-owned |
| CAP-012 | Microsoft Entra SSO/SAML validation, identity normalization, and revocable application sessions | Complete; provider credentials and signing certificate are environment-owned |
| CAP-013 | MCP tool operating against authorized D1 data | Complete |
| CAP-014–015 | Locale switching/formatting/pluralization/RTL and accessible interaction | Complete; WCAG aligned — uncertified |
| CAP-016 | Git/branch/release/Actions source and runtime evidence | Complete |
| CAP-017 | ISO/IEC 27001-aligned control evidence | Complete; uncertified |
| CAP-018 | ISO/IEC 42001-aligned MCP evaluation/fallback evidence | Complete; uncertified |
| CAP-019 | End-to-end traceability and evidence API | Complete |
| CAP-020–024 | Dashboard, uptime/health, logs, synthetic billing/degradation, protected control | Complete |
| CAP-025 | Dashboard-visible, admin-controlled ChatGPT search/fetch access with independent training opt-out | Complete |
| CAP-026 | Canonical assurance compliance view, operations entry point, consolidated global chrome, and automated route/link contract | Complete; aligned/supporting statements remain uncertified |

The v0.5.0 interaction work adds visitor-scoped D1 users/tasks, GraphQL Yoga and local GraphiQL, bounded R2 uploads, six-locale switching, an accessibility comparison lab, verified GitHub webhook handling, and live GitHub delivery evidence without changing the released HTML route set.

Each route identifies what it proves, links to primary/supporting source and tests, exposes behavior a visitor can execute or inspect, emits appropriate D1 evidence, and fails safely during intentional offline or dependency-failure conditions.

## Task-oriented frontend migration

DEMO-240 defines the target frontend information architecture in [`FRONTEND-ROUTES.md`](FRONTEND-ROUTES.md) before changing the runtime inventory. The migration intentionally separates browser information architecture from machine/API/protocol contracts.

Implement the frontend consolidation in this order:

1. **Define the contract — DEMO-240.** Establish that a page route represents a distinct user task or browser-visible security/protocol boundary. Permit stable page sections and fragments for independently linkable demonstrations and records. Do not change runtime route declarations in this step.
2. **Consolidate browser route declarations.** Reduce the intended public browser destinations to `/`, `/demos`, `/assurance`, `/operations`, and `/security`. Preserve `/admin` and `/offline` as hidden operational pages with their existing protected/recovery responsibilities.
3. **Consolidate presentation inside each task.** Move framework-, dataset-, technology-, renderer-, registry-, and reporting-view distinctions into sections, controls, and stable fragments on the appropriate task page. Query parameters may filter, search, sort, paginate, or localise, but may not select the primary conceptual destination.
4. **Rebuild route-derived discovery.** Project navigation, breadcrumbs, homepage task links, canonical links, sitemap membership, and internal links from the consolidated declarations. Link directly to stable fragments when a demonstration or record needs an independently shareable target.
5. **Retire superseded browser locations.** Remove old browser pathnames and obsolete query-selected destinations without redirects, aliases, or compatibility routes. Verify that retired browser locations return the ordinary 404 and that no public/internal navigation continues to emit them.
6. **Regenerate and validate route artifacts.** For each runtime route change, run `npm run generate:routes`, commit the resulting `docs/ROUTES.md` and `docs/route-manifest.json`, then complete the repository validation loop required by `AGENTS.md`.

Throughout the migration, machine/API/protocol route declarations remain unchanged unless a separate controlled change explicitly scopes such a modification.

**DEMO-242 status:** the Architecture Demos slice is complete. `/demos` now owns the Edge, Workers, Durable Objects, D1, R2, REST/OpenAPI, GraphQL, Webhooks, Identity, MCP, Accessibility, and i18n presentations through stable fragments. The former Platform and Interfaces browser paths are retired as ordinary 404s; machine/API/protocol routes remain unchanged.

## Release evidence

The v0.1.0 baseline completed the publication path below. Every later release repeats it without inventing external evidence:

1. Publish or push the reviewed branch to `SouthernGentlemen/wizardgang-architecture-demo`.
2. Complete pull-request review and merge to `main`.
3. Create `demo-blob`, the R2 buckets, and Worker secrets; bind the reviewed resource identifiers.
4. Configure Cloudflare Access for `/admin` where available and configure `demo.wizardgang.ai`.
5. Tag the reviewed commit with semantic versioning and publish a GitHub Release.
6. Run the tag-only deploy workflow and verify `/api/operations/version`, `/api/operations/health`, and the operations surface.

Outside a tagged production deployment, `/api/operations/version` intentionally reports development or missing commit metadata and the traceability API reports unavailable release evidence as `not-supplied`.

No route or document claims WCAG, ISO/IEC 27001, or ISO/IEC 42001 certification.

## DEMO-244 assurance consolidation

The public assurance information architecture has one human-facing destination: `/assurance`. Delivery and release evidence, governance, evidence, compliance, risks, incidents, exercises, and non-sensitive concern intake are sections of that workbench. Stable record links use `assuranceAnchor` fragments on `/assurance`; query parameters are limited to filtering and search. Published advisories remain owned by `/security`.

The retired assurance child paths return the ordinary 404 response. They have no aliases or redirects. The concern-intake live-route evidence identity is superseded immutably as `EVD-RUN-013`, current relationships follow that replacement, and `EVD-RUN-011` remains reserved in lifecycle history. Other canonical assurance datasets, reporting APIs, schemas, record identities, and publication boundaries are unchanged. The executable retired-route catalog remains the source of truth for the exact path set.
