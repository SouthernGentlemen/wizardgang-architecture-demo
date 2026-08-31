# WizardGang Systems Architecture

**Reference:** WG-ARCH-001  
**Version:** 1.0  
**Issued:** 2026-08-31  
**Status:** Published  
**Owner:** WizardGang — wizardgang.ai

This Markdown copy is the repository-native architecture reference for the public demo project. It preserves the scope and terminology of WG-ARCH-001 while keeping this package text-only.

## Alignment and certification statement

WizardGang systems are designed and built toward WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 as engineering and governance references. These references are **aligned — uncertified** unless independent certification has been explicitly obtained and evidenced. Internationalization (i18n) and localization readiness are supported architectural capabilities.

## 00 — Purpose and scope

WizardGang applications use a lightweight, edge-first architecture built around TypeScript, Cloudflare, and GitHub. The goal is to keep systems simple to deploy, easy to audit, inexpensive to operate, and capable of scaling without requiring a major architectural redesign.

The standard supports modern authentication, API integration, accessibility, internationalization, AI integration, version control, automated delivery, and governance practices while keeping the system understandable by a small development team. Individual projects may extend the baseline where a requirement justifies it; those departures are project-specific work rather than changes to the standard.

## 01 — Core technology stack

**Primary language:** TypeScript.

**Cloud platform:** Cloudflare Workers, Durable Objects, D1, R2, DNS, CDN / Edge Network, security and traffic controls.

**Source control and delivery:** Git, GitHub, GitHub Actions, GitHub Releases, Git tags.

**Supported integration standards:** REST, JSON, OpenAPI / Swagger 2.x, GraphQL, OAuth 2.0, SSO, SAML, MCP.

Legacy web-service technologies are not part of the default WizardGang architecture. They may be integrated when an external system requires them, but that work is project-specific compatibility engineering.

## 02 — High-level architecture

Cloudflare is the primary application platform and public edge boundary. GitHub is the source of truth for application code, documentation, engineering history, releases, and deployment automation.

```text
Users / Clients
      |
Cloudflare DNS & Edge
TLS · CDN · caching · routing · traffic controls · security
      |
TypeScript Web UI
WCAG 2.2 aligned · i18n ready
      |
Cloudflare Workers
stateless application compute / mediation boundary
      |
      +--> D1                relational persistence
      +--> R2                object / artifact storage
      +--> Durable Objects   coordinated stateful compute
      +--> REST / GraphQL / Webhooks
      +--> OAuth 2.0 / SSO / SAML
      +--> MCP               controlled AI integration
```

Workers are the component that reaches platform state or crosses integration boundaries.

## 03 — Cloudflare Edge

The edge provides the public infrastructure boundary before application code executes. Typical responsibilities include DNS, TLS / HTTPS, CDN delivery, caching, request routing, traffic filtering, rate controls, security policies, deployment routing, environment management, and observability.

## 04 — Cloudflare Workers

Workers provide the primary compute layer and execute TypeScript application logic at the edge. They mediate requests between clients, platform state, and external systems.

Workers should remain stateless wherever practical. Persistent or coordinated state belongs in the appropriate platform service rather than in process memory.

Typical Worker responsibilities include REST APIs, GraphQL, authentication, authorization, business logic, request validation, routing, D1/R2/Durable Object access, external API integration, OAuth callbacks, SSO/SAML, MCP endpoints, webhook processing, and security controls.

## 05 — Durable Objects

Durable Objects provide coordinated stateful compute when independent Worker requests are insufficient and multiple requests must agree on the same state at the same moment.

Typical uses include real-time sessions, WebSocket coordination, collaborative state, multiplayer state, synchronized workflows, controlled concurrency, distributed locking, per-user/per-tenant coordinated state, and other stateful application coordination.

Durable Objects are introduced deliberately for a coordination requirement; they are not the default persistence layer.

## 06 — D1

D1 provides relational persistence for structured application information such as users, roles, permissions, application records, workflow state, configuration metadata, integration metadata, transactions, audit metadata, and deployment metadata.

Large files and binary objects belong in R2 instead.

## 07 — R2

R2 provides object storage for files rather than records: images, documents, exports, generated artifacts, reports, evidence packages, uploaded files, backups, and large application objects.

D1 may maintain metadata and references to R2 objects so structured state remains separate from file/object persistence.

## 08 — API architecture

Modern API interfaces are the primary integration model. Capabilities needed by another system are exposed through defined interfaces rather than shared infrastructure.

Supported approaches include REST, JSON, OpenAPI, GraphQL, Webhooks, and MCP.

API boundaries should be explicit, documented where appropriate, authenticated and authorized as required, validated, logged, rate controlled where necessary, and versioned when compatibility requires it.

Secrets remain outside source control and are supplied through managed GitHub or Cloudflare secret mechanisms.

## 09 — REST and OpenAPI

REST is the default conventional system-to-system integration pattern. WizardGang applications support OpenAPI / Swagger 2.x contracts where appropriate. Contracts may define endpoints, methods, parameters, payloads, response schemas, authentication requirements, error conditions, and integration expectations.

## 10 — GraphQL

GraphQL is supported where schema-driven and flexible data access is preferable. It may coexist with REST. GraphQL does not bypass authorization, validation, security, or persistence controls; resolvers remain inside the same authorization boundary as other callers.

## 11 — Authentication and identity

WizardGang systems support OAuth 2.0, SSO, and SAML for enterprise identity integration.

Authentication answers **who is this?** Authorization answers **what may this identity access or perform?** The two remain separate concerns.

Applications should support least privilege by default, role- or policy-based access, secure token handling, session expiration, identity-provider validation, secrets separation, and explicit authorization boundaries.

## 12 — Model Context Protocol (MCP)

WizardGang applications may expose or consume MCP interfaces as a controlled interface between AI agents and application capabilities.

MCP may expose approved APIs, business operations, search, documentation, structured data, workflows, and automation capabilities. It must retain explicit tool definitions, least-privilege access, authentication, validation, permission boundaries, and auditability.

AI callers do not bypass ordinary security or data-access boundaries. An agent reaches only what an equivalently privileged human caller could reach.

## 13 — Internationalization (i18n)

Internationalization is an architectural capability, not a later translation patch. Typical considerations include translation resources, locale-aware content, language selection/detection, Unicode, date/time/number/currency formatting, pluralization, text expansion, RTL layout support, localized validation and errors, and localized accessibility labels.

## 14 — Accessibility

WizardGang applications are designed toward WCAG 2.2 accessibility principles, **aligned — uncertified**.

Typical concerns include semantic HTML, keyboard navigation, visible focus states, screen-reader support, logical heading hierarchy, color contrast, accessible forms, understandable errors, alternatives to color-only communication, responsive interfaces, accessible dynamic content, predictable navigation, appropriate ARIA usage, and correct document language identification.

## 15 — Git repository architecture

GitHub is the authoritative source for development. A repository should carry enough context for someone who did not build the system to understand, run, change, test, release, and deploy it.

Representative structure:

```text
/
├── src/
├── public/
├── tests/
├── docs/
├── scripts/
├── migrations/
├── .github/workflows/
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── README.md
├── CONTRIBUTING.md
├── AGENTS.md
├── SECURITY.md
├── CHANGELOG.md
└── LICENSE
```

Secrets are never committed in any environment.

## 16 — Git versioning

Git history is part of the engineering and audit trail. Changes should be small enough to understand independently and identifiable by purpose.

Commit pattern:

```text
[WG-001] FEAT Add authentication middleware
[WG-002] API Add project API contract
[WG-003] SEC Enforce role validation
[WG-004] A11Y Correct keyboard navigation
[WG-005] FIX Handle expired OAuth tokens
[WG-006] DOCS Document SAML configuration
```

Categories: `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`.

Project-specific prefixes are encouraged, such as `[DEMO-001]` for this repository.

## 17 — Branching

`main` represents the accepted production baseline. Development work occurs on isolated branches and returns to `main` through validation and review.

```text
branch -> commits -> validation -> pull request -> review -> merge -> tag -> deploy
```

## 18 — Release management

Production milestones are represented by Git tags and GitHub Releases using semantic versioning: `MAJOR.MINOR.PATCH`.

A deployed production version must be traceable to a specific Git tag and commit. Meaningful releases should document version, date, major changes, fixes, security-related changes, known limitations, compatibility changes, and migration requirements where applicable.

## 19 — GitHub Actions

GitHub Actions automates validation, testing, release management, and deployment. Repeatable controls should be automated rather than remembered.

Typical validation includes dependency installation, type checking, linting, unit/integration tests, security checks, accessibility checks, build validation, dependency scanning, configuration validation, API contract validation, migration checks, deployment verification, release packaging, evidence generation, AI evaluation checks, and localization validation.

Deployment credentials stay in managed secret mechanisms.

## 20 — Environment separation

Applications distinguish environments where appropriate: local, development, preview, and production. Environment configuration may control API endpoints, identity configuration, feature flags, service bindings, D1/R2/Durable Object bindings, and deployment settings.

Secrets remain outside source-controlled configuration in every environment.

## 21 — Change traceability

A production change should be reconstructable across the full lifecycle:

```text
Requirement
-> Issue / work item
-> Branch
-> Commit
-> Pull request
-> Automated validation
-> Review
-> Merge
-> Git tag
-> GitHub release
-> Deployment
```

The evidence chain should explain why a change occurred, what changed, who or what changed it, what validation occurred, which release included it, and what was deployed.

## 22 — ISO/IEC 27001 alignment

WizardGang systems may be engineered around ISO/IEC 27001 information-security management principles without representing the application or organization as certified.

Relevant areas include access control, authentication, authorization, least privilege, source control, secure development, change/release management, secrets management, logging, incident investigation, vulnerability management, configuration management, backup/recovery, environment separation, and evidence retention.

**Status:** ISO/IEC 27001 aligned — uncertified.

## 23 — ISO/IEC 42001 alignment

Systems containing AI capabilities may be engineered around ISO/IEC 42001 AI-management principles.

Relevant considerations include identification of AI components, defined AI system boundaries, intended use, known limitations, human oversight, agent permissions, MCP tool boundaries, change tracking, data protection, AI-related testing, monitoring, risk evaluation, evidence retention, fallback behavior, and graceful degradation.

AI systems remain inside established security and authorization boundaries.

**Status:** ISO/IEC 42001 aligned — uncertified.

## 24 — Evidence and auditability

Meaningful technical changes and operational events should be reconstructable where required.

Primary evidence sources include Git commits, issues/work items, pull requests, reviews, tags, releases, Actions runs, test results, Cloudflare deployment/configuration history, application logs, security events, accessibility testing, AI evaluations, and D1/R2 audit metadata or artifacts.

```text
Requirement -> Change -> Validation -> Release -> Deployment -> Operation
```

GitHub records how the system changed. Cloudflare records how it was deployed and operated. D1/R2 hold application-specific audit records and evidence artifacts.

## 25 — Core architecture principles

1. TypeScript first.
2. Cloudflare first.
3. Edge first.
4. Stateless by default.
5. Stateful when required.
6. Structured data in D1.
7. Objects in R2.
8. API first.
9. Modern interfaces by default.
10. Identity aware.
11. Accessible by design.
12. Internationalization ready.
13. AI as a controlled integration.
14. Git as the source of truth.
15. Release what you deploy.
16. Automate repeatable controls.
17. Trace production changes.
18. Keep the platform simple.

## 26 — Architecture summary

The standard architecture is TypeScript + Cloudflare Edge + Workers, with D1 for relational data, R2 for objects, Durable Objects for coordinated state, REST/OpenAPI/GraphQL/Webhooks for modern integration, OAuth/SSO/SAML for identity, MCP for controlled AI integration, i18n/WCAG for interface readiness, and Git/GitHub/Actions/Releases for auditable delivery and governance.

The result is a deliberately small architecture that can support simple applications while retaining a clear path toward larger integrations, stateful workloads, enterprise identity, governed AI capabilities, auditable releases, operations visibility, and scalable production deployment.
