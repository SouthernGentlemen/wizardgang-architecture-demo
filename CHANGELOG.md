# Changelog

## Unreleased

- Flattened the public architecture map from 34 HTML routes in eight groups to 17 routes in five layer-level groups without removing an executable demonstration.
- Preserved all 17 retired page URLs as exact permanent redirects to anchors on `/api`, `/identity`, `/git`, `/governance`, and `/dashboard`; `/identity/saml/metadata` remains a distinct XML machine endpoint.
- Consolidated REST CRUD, OpenAPI, GraphQL, webhooks, identity boundaries, delivery lifecycle, ISO-aligned governance, traceability, evidence, and detailed health into their layer pages.
- Replaced duplicated global page chrome with per-interface runnable request/response blocks and removed the unused generic demo runner and event-listing endpoints.
- Added a generated 45-entry route manifest, a validator for generated-route drift, and migration `0007` to update seeded `/api/rest` and `/api/graphql` presentation links.

## 0.2.0 — 2026-08-31

- Adopted the shared WizardGang controlled change, branch, release, annotated-tag, and exact-tag deployment model.
- Rethemed every surface onto the `wizardgang.ai` token system with a persisted light theme, shared wordmark, route labels, focus treatment, and type scale.
- Seeded `demo_records` so the REST, GraphQL, and MCP read demonstrations return real data instead of an empty array.
- Replaced the placeholder runner on `/d1` and `/api/rest` with a live record console that reads publicly, then demonstrates the shared write boundary refusing an unauthenticated request.
- Fixed `/offline`, which announced an outage with a `503` while the demo was online; it now reports the real state and only fails when actually offline.
- Fixed a right-to-left layout defect that rendered the Arabic locale as a blank page and added a regression test.
- Added a favicon, page descriptions, social metadata, a site-wide skip link, primary navigation, in-group previous/next paging, and a registry-generated `/sitemap.xml`.
- Corrected heading outlines on the index, dashboard, and documentation index so status values are no longer announced as headings.

## 0.1.0 — 2026-08-31

- Added the stable public human and machine route contract with direct source links.
- Added the repository-native architecture/operations standards and removed the PDF package dependency.
- Implemented Edge, stateless Worker, D1, real R2, and real Durable Object demonstrations.
- Implemented authorized REST CRUD, served Swagger 2.0, GraphQL, signed webhooks, and controlled MCP.
- Implemented OAuth PKCE, provider-neutral SSO/SAML boundaries, and separate application authorization evaluation.
- Implemented English, Spanish, and Arabic localization with RTL and accessible interactions.
- Built the live dashboard, health, uptime, docs, sanitized logs, synthetic billing, and observable graceful degradation.
- Hardened authenticated D1-backed online/offline control, same-origin mutations, fail-closed state, and public maintenance behavior.
- Added delivery/traceability evidence, ISO-aligned control mapping, and executable AI/MCP boundary evaluation.
- Expanded CI to validate contracts, migrations, localization, security, dependencies, Worker build, and commit-bound evidence.
- Hardened tag-only deployment so runtime version metadata is verified after deployment.

This is the first reviewed public architecture-laboratory baseline. Production deployment is recorded separately by the tag-bound workflow and runtime `/version` evidence.
