# MVP implementation plan

This file is the authoritative source of truth for the **active product target, ordered implementation roadmap, and reserved DEMO change IDs** for `demo.wizardgang.ai`.

Read this file together with `AGENTS.md` before starting any controlled change. Route declarations remain authoritative for what exists at runtime; this plan is authoritative for what the public product is intended to become. If an older planning or frontend-design document conflicts with this file, this file wins for active roadmap and presentation scope.

Historical release records, assurance records, generated route artifacts, and prior implementation documents remain evidence of what was built. They do not override the active MVP target below.

## Objective

Get `demo.wizardgang.ai` into a minimal, credible architecture-demo state as quickly as possible.

The public experience should answer three questions without requiring insider knowledge:

1. **What was built?**
2. **Can I run or inspect it?**
3. **Can I verify that it is real?**

The site is not a public GRC product, operations console, registry browser, or generic documentation portal. Canonical assurance, operational, and audit machinery may remain behind the presentation layer, but it must not dominate the visitor experience.

## Target public surface

### Primary destinations

The ordinary public product has three primary browser destinations:

- `/` — concise project orientation and entry point;
- `/demos` — executable architecture demonstrations;
- `/assurance` — concise verification of engineering-assurance claims.

Primary navigation should expose **Demos**, **Assurance**, and **Source**. The site logo may continue to return home.

### Support boundary

`/security` remains a narrow browser-visible security boundary for vulnerability reporting and public advisories. It is not a primary architecture-demo destination and should be linked from the footer or other contextual security links rather than the main navigation.

### Hidden/retired browser surfaces

- `/operations` is to be retired as a human-facing public page once its small amount of useful proof has been projected elsewhere. Operational machine endpoints, scheduled collection, retention, and protected administration remain separate contracts.
- `/admin` remains a hidden protected operational page.
- `/offline` remains a hidden recovery page.
- Retired browser locations return the ordinary 404 with no compatibility alias or redirect.

Machine/API/protocol routes remain unchanged unless a specifically scoped controlled change says otherwise.

## Public presentation contract

### Home

Keep the homepage extremely small:

- one sentence explaining that this is a live Cloudflare architecture laboratory;
- primary action: **Explore demos**;
- secondary action: **View assurance**;
- a compact proof strip showing current service state plus running version/commit and a measured availability summary when available;
- direct public source access.

Do not recreate an operations dashboard on the homepage.

### Demos

`/demos` remains the single human architecture-demo destination. Preserve stable demo fragments, but group the presentation around visitor-recognizable capabilities rather than implementation inventory.

Primary groups:

1. **Data** — D1 and R2;
2. **APIs** — REST/OpenAPI and GraphQL;
3. **Integrations** — Webhooks;
4. **Identity** — OAuth/OIDC/SAML behavior that is actually available in the configured environment;
5. **AI / MCP** — MCP endpoint, available tools, one executable interaction, and concise client connection guidance.

Secondary proof:

- **Runtime architecture** — Edge, Workers, and Durable Objects;
- **Quality** — Accessibility and internationalization.

Keep one obvious executable/inspectable proof per concept. Move raw payloads, alternate clients, schemas, implementation notes, complete request history, and other expert detail behind optional disclosures. A visitor should not have to read documentation before discovering the live action.

For MCP specifically, the default path should be: endpoint -> tools -> run a representative tool -> result -> copy connection guidance. Advanced Claude/Codex/Inspector/raw HTTP material may remain collapsed.

### Assurance

`/assurance` becomes a compact verification surface centered on four checks:

1. **Security controls** — ISO/IEC 27001-aligned executable/control evidence;
2. **AI boundary** — ISO/IEC 42001-aligned MCP evaluation/fallback evidence;
3. **Traceability** — claim/control -> evidence/source chain;
4. **Accessibility posture** — bounded WCAG 2.2 evidence and explicit uncertified limitations.

Each check should have a plain-English explanation, current status/posture, and one clear Run/Inspect action. Exact evidence may remain available through focused drill-down.

The default human presentation must not expose or enumerate the internal management-system inventory. Hide risks, incidents, exercises, concerns, suppliers, objectives, competence/awareness records, configuration inventories, giant framework tables, registry pagination, lifecycle minutiae, and similar internal records from ordinary public HTML. Preserve canonical records, schemas, reporting APIs, evidence relationships, and lifecycle history unless a later controlled change explicitly retires them.

Do not claim ISO/IEC or WCAG certification.

### Operational proof

Only the following operational facts justify ordinary public presentation:

- current service/dependency state;
- measured scheduled availability summary and monitoring qualification;
- running semantic version and commit/source identity.

Do not expose application log explorers, raw health payloads, five-minute observation tables, usage dashboards, synthetic billing/cost simulators, resource-pressure tables, or deployment internals as primary public UX.

The operational APIs, availability collector, 365-day retention policy, bounded public-safe logs, provider observation code, and protected controls may remain because they prove engineering behavior and support operations even when the human `/operations` page is retired.

## Preservation boundaries

The MVP pass is a **presentation reduction**, not a deletion of working architecture.

Preserve unless a controlled change explicitly says otherwise:

- canonical D1/R2/Durable Object behavior;
- REST/OpenAPI, GraphQL, webhooks, identity, and MCP machine contracts;
- assurance registries, schemas, validators, evidence IDs, lifecycle history, and reporting APIs;
- scheduled availability collection and 365-day retention;
- protected administration and offline behavior;
- public-safe audit evidence and bounded logs;
- accessibility/i18n runtime behavior and site-wide validation;
- security reporting and advisory boundary;
- tag-only production deployment and release evidence.

Prefer hiding or collapsing valid implementation detail over deleting it.

## Ordered controlled changes

The IDs below are reserved for this roadmap and must not be reused for unrelated work without first updating this file in a controlled change.

| Change | Type | Branch | Depends on | Required outcome |
|---|---|---|---|---|
| **DEMO-255** | DOCS | `demo-255-mvp-demo-contract` | DEMO-254 | Establish this root source of truth, bind `AGENTS.md` to it, and align older frontend/planning docs with the MVP target. No runtime change. |
| **DEMO-256** | FEAT | `demo-256-minimal-public-shell` | DEMO-255 | Reduce primary navigation/homepage to Demos, Assurance, Source; demote Security to the support/footer boundary; add the compact operational proof strip without reproducing Operations. |
| **DEMO-257** | REFACTOR | `demo-257-curated-demos` | DEMO-256 | Reframe `/demos` around Data, APIs, Integrations, Identity, and MCP; move Edge/Workers/DO and Accessibility/i18n to secondary proof; make advanced detail opt-in while preserving stable fragments and machine contracts. |
| **DEMO-258** | REFACTOR | `demo-258-minimal-assurance` | DEMO-257 | Reduce `/assurance` to the four primary checks and focused evidence drill-down; remove risks/incidents/exercises/concerns/registry dumps and other management-system inventories from ordinary HTML without deleting canonical data/APIs. |
| **DEMO-259** | REFACTOR | `demo-259-retire-public-operations` | DEMO-258 | Retire the human `/operations` route as an ordinary 404, remove it from sitemap/discovery, and preserve operational APIs, collectors, retention, logs, protected controls, and the small proof already surfaced on home. |
| **DEMO-260** | TEST | `demo-260-mvp-acceptance` | DEMO-259 | Add regression/acceptance coverage that enforces the minimal public surface, absence of hidden management/operations dumps, working demo actions, source/security access, route retirement, accessibility, localization, and machine-contract preservation. |
| **DEMO-261** | BUILD | `release/v0.21.0` | DEMO-260 | Release the completed minimal-demo stack as v0.21.0 through the existing annotated-tag-only production workflow and verify the live public surface. |

The v0.20.0 release through DEMO-254 is a prerequisite to this sequence. DEMO-255 branches from that reviewed release state; subsequent MVP changes stack in the order above until the stack is landed.

## Change-specific acceptance

### DEMO-255

- Root `IMPLEMENTATION_PLAN.md` exists and is the active roadmap.
- `AGENTS.md` requires agents to read and maintain it.
- Older planning documentation cannot be mistaken for a competing active roadmap.
- No runtime route or presentation behavior changes.

### DEMO-256

- Main navigation has no Operations or Security item.
- Security reporting remains easy to find from the footer/context.
- Homepage has one primary and one secondary product CTA.
- Compact status/version/availability proof is readable without opening an operations dashboard.
- Source remains directly reachable.

### DEMO-257

- A first-time visitor can discover the five primary demo groups immediately.
- Every primary group has an executable or directly inspectable proof.
- Existing stable fragments continue to resolve and open the correct content.
- Runtime and quality proofs no longer compete with primary capabilities above the fold.
- MCP no longer opens with a wall of client-specific commands or raw protocol detail.

### DEMO-258

- Assurance opens with exactly the four primary checks.
- No risk register, incident/exercise register, concern intake, supplier/governance inventory, objective inventory, or full framework dump appears in the ordinary default page.
- Focused evidence remains inspectable from each primary check.
- Canonical machine reporting and assurance records remain valid.

### DEMO-259

- `/operations` returns the ordinary application 404 with no redirect or alias.
- No public navigation, sitemap entry, canonical link, or homepage action points to `/operations`.
- `/api/operations/*`, scheduled collection, 365-day availability retention, bounded logs, and protected controls continue to function according to their declarations.

### DEMO-260

- Automated route inventory matches declarations.
- Automated accessibility/localization checks cover every remaining public HTML surface.
- Tests fail if hidden assurance/operations inventories reappear in ordinary public HTML.
- Tests exercise representative D1/R2, REST/GraphQL, webhook, identity-availability, MCP, assurance, source, security, 404, offline, and admin boundaries.
- Repository-required validation passes.

### DEMO-261

- Release metadata records DEMO-255 through DEMO-260.
- Annotated `v0.21.0` tag reproduces and deploys the reviewed state.
- Live verification confirms the minimal navigation, representative demo actions, assurance checks, security reporting path, retired `/operations`, version/commit identity, and health endpoint.

## Guardrails

- Do not add a new public browser route to solve a presentation problem that belongs on `/demos` or `/assurance`.
- Do not promote internal datasets to navigation merely because the data exists.
- Do not replace canonical machine evidence with hand-authored marketing claims.
- Do not delete working APIs or assurance evidence just to make the HTML smaller.
- Do not add synthetic dashboards or fake data to make a surface look fuller.
- Do not broaden the scope while the MVP sequence is active unless this plan is deliberately updated first.
- Prefer deletion, hiding, grouping, and progressive disclosure over another redesign framework.

## Definition of MVP complete

The MVP is complete when a visitor can understand the project from the homepage, execute or inspect the primary architecture capabilities on `/demos`, verify the four bounded assurance claims on `/assurance`, reach source and security reporting, and never need to understand the repository's internal risk, incident, governance, reporting, or operations inventories.
