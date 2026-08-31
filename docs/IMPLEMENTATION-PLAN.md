# Implementation plan and status

The stable route contract was established first; genuine capabilities were then implemented without renaming the public human routes. Capability IDs below are design-plan references, not permanent Git change IDs.

| Sequence | Capability | Status |
|---|---|---|
| CAP-001 | Route registry, shell, direct source links, D1/admin/offline baseline | Complete |
| CAP-002 | D1 CRUD and shared read/write authorization | Complete |
| CAP-003–006 | Edge context, stateless Worker compute, R2 objects, Durable Object coordination | Complete |
| CAP-007–010 | REST/JSON v1, Swagger 2.0, GraphQL, signed webhooks | Complete |
| CAP-011 | OAuth 2.0 PKCE boundary | Complete; no live provider tenant is claimed |
| CAP-012 | Provider-neutral SSO/SAML boundary and metadata | Complete; real federation needs environment-owned configuration |
| CAP-013 | MCP tool operating against authorized D1 data | Complete |
| CAP-014–015 | Locale switching/formatting/pluralization/RTL and accessible interaction | Complete; WCAG aligned — uncertified |
| CAP-016 | Git/branch/release/Actions source and runtime evidence | Complete |
| CAP-017 | ISO/IEC 27001-aligned control evidence | Complete; uncertified |
| CAP-018 | ISO/IEC 42001-aligned MCP evaluation/fallback evidence | Complete; uncertified |
| CAP-019 | End-to-end traceability and evidence API | Complete |
| CAP-020–024 | Dashboard, uptime/health, logs, synthetic billing/degradation, protected control | Complete |

Each route identifies what it proves, links to primary/supporting source and tests, exposes behavior a visitor can execute or inspect, emits appropriate D1 evidence, and fails safely during intentional offline or dependency-failure conditions.

## Release evidence

The v0.1.0 baseline completed the publication path below. Every later release repeats it without inventing external evidence:

1. Publish or push the reviewed branch to `SouthernGentlemen/wizardgang-architecture-demo`.
2. Complete pull-request review and merge to `main`.
3. Create `demo-blob`, the R2 buckets, and Worker secrets; bind the reviewed resource identifiers.
4. Configure Cloudflare Access for `/admin` where available and configure `demo.wizardgang.ai`.
5. Tag the reviewed commit with semantic versioning and publish a GitHub Release.
6. Run the tag-only deploy workflow and verify `/version`, `/health`, and the dashboard.

Outside a tagged production deployment, `/version` intentionally reports development or missing commit metadata and the traceability API reports unavailable release evidence as `not-supplied`.

No route or document claims WCAG, ISO/IEC 27001, or ISO/IEC 42001 certification.
