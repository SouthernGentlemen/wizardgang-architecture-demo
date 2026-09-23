# WizardGang Systems Architecture

**Reference:** WG-ARCH-001<br>
**Version:** 1.1<br>
**Issued:** 2026-09-19<br>
**Status:** Published<br>
**Owner:** WizardGang — wizardgang.ai

This Markdown copy is the repository-native architecture reference for the public demo project. It preserves the scope and terminology of WG-ARCH-001 while keeping this package text-only.

## Alignment and certification statement

WizardGang systems are designed and built toward WCAG 2.2, ISO/IEC 27001, and ISO/IEC 42001 as engineering and governance references. These references are **aligned — uncertified** unless independent certification has been explicitly obtained and evidenced. Internationalization (i18n) and localization readiness are supported architectural capabilities.

## 00 — Purpose and scope

WizardGang applications use a lightweight, edge-first architecture built around TypeScript, Cloudflare, and GitHub. The goal is to keep systems simple to deploy, easy to audit, inexpensive to operate, and capable of scaling without requiring a major architectural redesign.

The standard supports modern authentication, API integration, accessibility, internationalization, AI integration, version control, automated delivery, and governance practices while keeping the system understandable by a small development team. Individual projects may extend the baseline where a requirement justifies it; those departures are project-specific work rather than changes to the standard.

## 01 — Core technology stack

**Primary language:** TypeScript.

**Presentation model:** React/TSX rendered on the server or at build time, progressively enhanced by first-party TypeScript. See §27 for the repository baseline.

**Cloud platform:** Cloudflare Workers, Durable Objects, D1, R2, DNS, CDN / Edge Network, security and traffic controls.

**Source control and delivery:** Git, GitHub, GitHub Actions, GitHub Releases, Git tags.

**Supported integration standards:** REST, JSON, OpenAPI 3.1, GraphQL, OAuth 2.0, SSO, SAML, MCP.

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

REST is the default conventional system-to-system integration pattern. WizardGang applications support OpenAPI 3.1 contracts where appropriate. Contracts may define endpoints, methods, parameters, payloads, response schemas, authentication requirements, error conditions, and integration expectations.

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

A repository carries the current executable system plus enough concise context for someone who did not build it to understand, run, change, test, release, and deploy it. Superseded repository states are recovered from Git/GitHub rather than restated in current architecture or policy documents.

### Documentation authority

Authority follows this order:

1. executable source and contracts;
2. structured assurance records under `assurance/**`;
3. generated artifacts derived from authoritative inputs;
4. concise human current-state architecture and policy documentation;
5. operating evidence for a stated time, scope, or activity;
6. Git/GitHub history for superseded states, releases, CI/deployment execution, pull requests, and commits.

Generated artifacts are projections, not writable sources of truth. Current architecture/policy prose explains the present system and must not become an alternate store for structured assurance state, generated inventories, or implementation history. Concrete historical change IDs, old pull requests, merge SHAs, retired routes, former labels, staged migrations, and previous implementations belong in Git/GitHub history or in the exact validator/test exception data that still requires them.

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
└── LICENSE
```

Secrets are never committed in any environment.

## 16 — Git versioning

Git history is part of the engineering and audit trail. Changes should be small enough to understand independently and identifiable by purpose.

Commit pattern:

```text
[WG-001] [FEAT] Add authentication middleware
[WG-002] [API] Add project API contract
[WG-003] [SEC] Enforce role validation
[WG-004] [A11Y] Correct keyboard navigation
[WG-005] [FIX] Handle expired OAuth tokens
[WG-006] [DOCS] Document SAML configuration
```

Each controlled change has one permanent ID and one primary bracketed type. Types include `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, and `CHORE`.

Project-specific prefixes are encouraged; this repository uses the `[DEMO-###]` namespace.

## 17 — Branching

`main` represents the accepted production baseline. Development work occurs on isolated branches and returns to `main` through validation and review.

```text
branch -> commits -> validation -> pull request -> review -> merge -> tag -> deploy
```

## 18 — Release management

Production milestones are represented by annotated Git tags and GitHub Releases using semantic versioning: `MAJOR.MINOR.PATCH`.

A deployed production version must be traceable to a specific annotated Git tag and commit. GitHub Releases publish release identity and generated change notes from Git/GitHub state, with the release-bound assurance snapshot attached. Annotated tags and GitHub Releases are the historical release authority; the repository does not maintain a parallel per-version Markdown archive or changelog.

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

**Controls:** ISO27001-A.8.20, ISO27001-A.8.21

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
14. Git/GitHub for superseded and historical repository state.
15. Release what you deploy.
16. Automate repeatable controls.
17. Trace production changes.
18. Keep the platform simple.

## 26 — Architecture summary

The standard architecture is TypeScript + Cloudflare Edge + Workers, with D1 for relational data, R2 for objects, Durable Objects for coordinated state, REST/OpenAPI/GraphQL/Webhooks for modern integration, OAuth/SSO/SAML for identity, MCP for controlled AI integration, i18n/WCAG for interface readiness, and Git/GitHub/Actions/Releases for auditable delivery and governance.

The result is a deliberately small architecture that can support simple applications while retaining a clear path toward larger integrations, stateful workloads, enterprise identity, governed AI capabilities, auditable releases, operations visibility, and scalable production deployment.

## 27 — Repository baseline

**Applicability.** The development-process baseline applies to every executable WizardGang-family repository, including products, experiments, labs, offline readers, games, and data/asset libraries. Being a laboratory is not an exemption. The repository declares product capabilities and explicit N/A boundaries; a repository without a hosted surface does not invent a production deployment, and a library without a browser runtime does not invent a browser application. Repositories without executable source are outside this executable baseline but still need an intentional source-license/attribution and security-reporting model when published.

Every executable repository carries root `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `README.md`, an explicit source-license/attribution model, a controlled change-ID namespace, branch/commit/PR discipline, CI on PRs and `main`, a credential-free `npm run check` (or an explicitly justified equivalent for a non-npm repository), settings-as-code with live verification, and immutable release semantics when releases are published. Record capability-specific N/A decisions in current architecture rather than using repository category as a blanket exemption. Production deployment controls apply only when a production environment exists.

**Reference TypeScript/Cloudflare toolchain.** These are the standard choices when a repository uses this stack, not a requirement to add Cloudflare, a browser, or a particular framework to a product without that capability.

- Node.js 26: the exact version in `.node-version`, and `engines.node` `26.x`.
- npm 11: the exact version in `packageManager`, and `engines.npm` `11.x`. `.npmrc` sets `engine-strict=true`, and dependency install scripts run only when `allowScripts` approves them.
- `"type": "module"` and a committed `package-lock.json`. CI installs with `npm ci`.
- TypeScript 7 in `strict` mode; `npm run typecheck` checks every TypeScript program in the repository. Tooling does not depend on the TypeScript compiler API.
- Cloudflare Workers through Wrangler 4, configured in `wrangler.jsonc`. Files that browsers download are served from Workers Static Assets, not bundled into Worker code.
- Vite 8 builds browser modules and stylesheets into content-hashed files.
- Vitest 5 runs tests that need TypeScript, TSX, or a DOM; `node:test` is acceptable for plain Node scripts.

**Browser presentation, when applicable.**

- Ordinary HTML documents render from React 19 components, on the server or at build time, and are complete and usable without JavaScript. An interactive client application or offline reader records its necessary boundary in current architecture.
- Browser behavior is first-party TypeScript that progressively enhances that HTML, without client hydration or a client-side router. A repository that needs a client application, such as a game, a canvas, or an offline reader, records that boundary in its architecture document.
- The Content Security Policy does not allow `'unsafe-inline'`. HTML carries no inline event-handler attributes, and any inline script or style is allowed only by hash or nonce. Raw HTML insertion is confined to one audited component.
- Stylesheets are CSS files processed by Vite, not strings. Tailwind CSS 4 may be used through Vite.

**Command contract.** An npm-based executable repository exposes the same *meaning* for its public commands; their implementation and applicable capabilities may differ. Document the actual commands, prerequisites, side effects, and N/A boundaries in its README and CONTRIBUTING guide. Do not hide a second, broader acceptance gate behind a differently named `verify` command. A non-npm repository names a justified equivalent interface.

| Command | Common meaning and boundary |
| --- | --- |
| `npm run dev` | Start a local-only development session for this checkout. Preflight configuration, generate/build what the local runtime needs, and report its URL/readiness when a server exists. Stop only checkout-owned processes; refuse to kill an unrelated port owner or erase user output. Browser opening is optional and suppressible in headless/cloud environments. A library with no running surface declares `dev` N/A rather than starting a fictitious server. |
| `npm run build` | Produce or validate the distributable artifact from declared inputs without publishing or deploying it. Generated outputs are reproducible projections, not a second source of truth. |
| `npm run typecheck` | Check every applicable TypeScript program without emitting a distributable artifact; a non-TypeScript repository records N/A. |
| `npm test` | Run the repository's deterministic automated tests. Name special suites (`test:browser`, `test:php`, visual evidence, and similar) explicitly; avoid an implicit second production build inside `test` when `check` already runs `build`, unless compiled tests genuinely require it and the reason is documented. |
| `npm run check` | The canonical unattended, credential-free acceptance gate after locked dependency installation. Compose applicable type, test, build, generated-artifact parity, history/change, security, local acceptance, and patch-integrity checks once, with bounded diagnostics. CI runs the same command on PRs and `main`; any extra CI gate is named, justified, and locally reproducible. Do not require provider credentials, mutate live services, publish, or deploy. |
| `npm run verify:*` / `npm run check:*` | Narrow, named subchecks or provider-aware verification, never an undocumented competing umbrella gate. State whether each requires browser tooling, network, credentials, or live provider access. `npm run validate:ci` may orchestrate installation, `check`, and the explicit extra gates with retained diagnostics. |

Local dependency-advisory queries may need registry network access even though they need no credentials; name that requirement and keep the security gate in CI. A cloud agent's lack of network or a provider credential is a reported capability blocker, not a pass. Release publication is a separate exact-annotated-tag workflow that reproduces the tagged state; a production deployment runs only from accepted immutable release state through the protected environment. An npm command called `deploy` must not make an arbitrary checkout a production source. Product-specific offline, library, browser, Worker, visual, and deployment capabilities are explicit, not exemptions from the shared command meanings or controlled process.

**Repository contents.**

- The root holds `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, an explicit source-license/attribution model, and applicable toolchain/lock/configuration files. A Workers project also has `wrangler.jsonc`; a non-Workers product does not add it merely for conformity.
- `.github/workflows/ci.yml` runs `check`; a repository that publishes releases also has a tag-driven release workflow.
- There is no `CHANGELOG.md` or per-version Markdown archive; annotated tags and GitHub Releases are the release history.
- An active root implementation plan, if present, is a current/future queue. It has no completed tasks, merge SHAs, release notes, or retrospectives. Its delivering PR removes its own task, and the final task deletes the plan. Git/GitHub retain completed work.

**Change control.**

- Each repository declares one change-ID prefix.
- Commit and pull-request titles use `[PREFIX-###] [TYPE] Imperative summary` with exactly one type from the §16 list, which is the complete vocabulary. CI validates pull-request titles, and `npm run check` validates that IDs are sequential.
- Branches are named `prefix-###-imperative-summary`.
- Commit bodies carry the controlled record that the repository's change-management document defines.
- `do needful` means refresh authoritative `main`, open PRs, and exact-head CI; finish a current, green, mergeable authoritative PR first; then reconcile the active plan and select the first task in the active plan by default. If that first task is blocked, report its exact prerequisite and stop; do not select a later task unless the owner explicitly overrides priority. Deliver the selected task through branch, validation, controlled commit, PR, current-head CI, permitted merge, and verification of merged `main`, then stop after one task with a complete prompt for the next.
- When no task remains, retire an exhausted plan and conduct a fresh deep planning/research pass to publish a small wave, stopping before implementation. Prefer roughly 5–12 near-term surgical tasks, each with one ID, concern, observable outcome, narrow ownership, prerequisites, scope, non-goals, acceptance, and exact relevant validation. Split independent outcomes; reassess after the wave instead of reserving a long roadmap.

**GitHub settings.**

- `main` is the default branch.
- A `main` ruleset requires a pull request and the CI status checks, and blocks force pushes and deletion.
- A `v*` tag ruleset blocks updates and deletion.
- Controlled PRs use squash-only merging, retaining one permanent controlled commit on `main`. The merge methods derive from each repository's committed settings authority. Do not weaken protections or rewrite published history.
- The expected settings are committed, for example in `config/github-repository-settings.json`; pure comparison tests run credential-free, while a documented live command verifies provider state. Changes to provider settings require explicit controlled work and verification.

**Release.**

- Published releases use immutable annotated semantic-version tags, each with a GitHub Release, and the tagged package version matches where applicable. Exact-tag reproduction precedes publication. Corrections move forward; tags, Releases, and accepted history are not rewritten.
- Release identity and deployment evidence are distinct. A product with a production environment deploys only the accepted immutable release state through a protected environment and verifies the deployed identity. A local/offline product may mark hosted deployment N/A while still keeping published releases immutable.
