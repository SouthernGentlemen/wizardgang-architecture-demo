# Demo Workbench Implementation Plan

Status: **Active**

Scope: post-v0.21.0 refinement of the public `/demos` MVP.

This file is the active planning source of truth for DEMO-264 through DEMO-272. Runtime route declarations and permanent contract documents remain authoritative for shipped behavior. Retire or delete this plan after the sequence is released and its durable requirements have been absorbed by permanent contracts/tests.

## Context

The v0.21.0 public shell successfully reduced the browser product to Home, Demos, Assurance, contextual Security, and hidden operational/recovery boundaries. `/demos` is now curated into recognizable capability groups, but its presentation still behaves like a directory followed by another directory: grouped selectors are followed by a long disclosure list that repeats every demonstration.

The next MVP pass must make `/demos` feel like one intentional product surface rather than an inventory page.

## Product goal

Turn `/demos` into a focused **Demo Workbench**:

- one selected demonstration is visible at a time;
- the selected demonstration is mounted in one persistent workbench pane;
- all other demonstrations exist only as navigation choices until selected;
- category tabs organize the inventory without duplicating it below the workbench;
- no giant trailing demo list and no `All demos` mode;
- D1 is the default initial demonstration because it provides an immediately tangible interaction;
- the existing stable fragment IDs remain the public deep-link contract;
- browser back/forward and fragment navigation select the correct demo;
- advanced implementation evidence stays opt-in instead of competing with the task.

The user should experience `/demos` as: **pick a capability, use it, inspect what happened**.

## Workbench information architecture

### Primary category tabs

Use one primary tab row:

- Data
- APIs
- Integrations
- Identity
- AI
- Platform
- Quality

Do not add an `All` tab or any equivalent inventory view that renders every demo at once.

### Demo selectors within categories

Show a compact secondary selector only where the active category contains multiple demos:

- Data: `D1`, `R2`
- APIs: `REST`, `GraphQL`
- Integrations: `Webhooks`
- Identity: `Identity`
- AI: `MCP`
- Platform: `Edge`, `Workers`, `Durable Objects`
- Quality: `Accessibility`, `Internationalization`

Preserve the released stable fragment IDs:

- `#d1`
- `#r2`
- `#rest`
- `#graphql`
- `#webhooks`
- `#identity`
- `#mcp`
- `#edge`
- `#workers`
- `#durable-objects`
- `#accessibility`
- `#i18n`

A fragment must directly select its demo and enclosing category. `/demos` without a valid fragment selects D1. Invalid fragments must not create a second routing system or new compatibility surface.

## Workbench composition

The page should contain, in order:

1. compact page heading and one-sentence orientation;
2. category tab row;
3. optional demo selector for the active category;
4. one persistent workbench container;
5. normal compact site footer.

There should be no second selector directory, no repeated `Primary demonstrations` section, no repeated `Supporting proof` section, and no vertical list of all twelve demo disclosures after the workbench.

### Active demo header

Standardize the active pane header around:

- category / capability context;
- demo name;
- concise one-line purpose;
- one task-oriented `Try this` instruction;
- bounded status chips only when they convey real state, such as `LIVE`, `RESETTABLE`, or `LOCAL`.

Do not put architecture exposition between the visitor and the first useful interaction.

### Main demo + inspector

On wide layouts, target an approximately 70/30 split:

- left/main: live interactive demonstration;
- right: compact inspector.

The inspector should expose three modes where the demo has meaningful material for them:

- `Guide` — concise steps for what to do next;
- `Request` — latest request/response, SQL, protocol exchange, or equivalent execution evidence;
- `Evidence` — source, implementation proof, standards/control references, and other deeper evidence.

The inspector may degrade to only the modes a demonstration can honestly support. Do not fabricate request telemetry or evidence merely to fill the pattern.

On narrow layouts, stack the inspector below the demo without forcing horizontal scrolling.

### Visual direction

Keep the existing dark system and avoid decorative cyberpunk styling. The workbench should feel closer to a developer console / Cloudflare-style dashboard / API playground:

- one elevated workbench surface;
- thin neutral borders;
- restrained use of the existing accent for active state;
- monospace where protocol/code evidence benefits from it;
- minimal nested cards;
- generous space around the actual interactive task;
- primary tabs should read as navigation, not oversized pills;
- secondary demo selectors may use compact pill/segmented-control treatment.

## Mounting and state behavior

Preserve the existing lazy presentation architecture where useful, but change the page model from many collapsible disclosures to one active mount target.

Required behavior:

- only the active demo is mounted into the workbench;
- changing demos deactivates/unmounts the previous presentation cleanly;
- switching back may use a bounded in-memory presentation cache when safe;
- loading and error states render inside the persistent workbench, not as page-level layout jumps;
- presentation scripts must be reactivated safely when inserted;
- a demo's own reset semantics remain demo-specific;
- no background execution from inactive demos;
- offline and authorization boundaries remain unchanged.

Do not add new public page routes for individual demos. The consolidated `/demos#fragment` contract remains the browser interface.

## Complex demo containment

### REST / OpenAPI

The REST demo must not dump the complete OpenAPI document into the normal workbench geometry.

Default REST presentation should provide a compact operation browser such as:

- `GET /records`
- `POST /records`
- `GET /records/{id}`
- `PUT /records/{id}`
- `PATCH /records/{id}`
- `DELETE /records/{id}`

Selecting an operation updates one bounded detail/execution area. The full OpenAPI specification remains reachable as deeper evidence through the existing authoritative interface/source rather than dominating `/demos`.

### Other large demonstrations

Apply the same rule to any demo whose evidence is larger than the task:

- show the executable proof first;
- contain verbose schemas, raw payloads, logs, code, or standards mappings behind the inspector or an explicit advanced disclosure;
- never solve density by rendering every record, schema, or evidence block at once.

## Accessibility and interaction contract

The workbench must remain fully usable without a pointer.

Required behavior includes:

- category tabs use appropriate tab/list semantics or an equivalently correct navigation pattern;
- active states are exposed programmatically and visually;
- secondary demo controls have clear accessible names;
- fragment selection moves focus deliberately without unexpected page jumps;
- left/right or equivalent keyboard behavior follows the chosen tab pattern when applicable;
- visible focus remains strong;
- browser back/forward restores the correct selected demo;
- narrow viewport reflow does not create horizontal scrolling;
- loading status and load failures are announced appropriately;
- locale changes preserve the selected demo fragment;
- all existing accessibility/localization audits remain applicable to `/demos`.

## Boundaries and non-goals

This sequence must not:

- add a new public page route for each demo;
- restore retired Operations UI;
- broaden primary site navigation;
- change machine/API/protocol contracts merely to support the new layout;
- change canonical assurance data or reporting contracts;
- remove existing demo capabilities solely because they are no longer all visible at once;
- replace real D1/R2/Workers/Durable Objects behavior with simulated presentation data;
- claim standards certification;
- create an `All demos` page, tab, accordion, or long trailing inventory.

## Delivery sequence

Changes are sequential and should normally branch from the latest merged `main`. Do not consume a later reserved ID before the prior controlled change is merged unless the work is intentionally stacked and its base is explicit.

### DEMO-264 — DOCS — Define demo workbench roadmap

- create this active root implementation plan;
- bind `AGENTS.md` to it while active;
- reserve DEMO-265 through DEMO-272;
- no runtime or route changes.

### DEMO-265 — REFACTOR — Build tabbed demo workbench shell

Replace the duplicated selector + disclosure-list presentation with the structural workbench:

- category tabs;
- category-local demo selector;
- D1 default;
- one persistent active demo mount;
- fragment-driven selection;
- browser history synchronization;
- remove the giant trailing disclosure inventory;
- preserve all twelve stable fragment IDs and the existing consolidated `/demos` route.

This change should primarily establish the new page geometry and selection lifecycle, not comprehensively redesign every demo body.

### DEMO-266 — DOCS — Standardize CI failure troubleshooting

#### Goal

Make complete GitHub Actions job-log retrieval mandatory before diagnosing CI failures.

#### Required behavior

- discover and load GitHub connector workflow and job-log actions when CI investigation begins;
- fetch the workflow run associated with the current branch head or pull request;
- enumerate its jobs and identify every failing job;
- fetch each complete failing job log body by numeric GitHub Actions job ID;
- diagnose the exact failing assertion or test from the primary log evidence;
- avoid guessing from statuses, check summaries, step names, annotations, previous runs, or remembered failures;
- expose connector, connectivity, or permission errors precisely instead of substituting an assumed diagnosis;
- continue the complete validation and CI loop until green rather than stopping after the first repaired failure;
- preserve the one-change/one-ID controlled history, squashing or rebuilding temporary fix commits when required.

#### Expected outcome

Future DEMO sessions reliably troubleshoot CI failures from primary GitHub Actions job evidence instead of repeatedly stopping at check or status summaries.

This is a repository process/documentation hardening change only. It does not implement the focused pane, inspector, REST/OpenAPI containment, or any other product work reserved below.

### DEMO-267 — FEAT — Add focused demo pane and inspector

Standardize the selected-demo experience:

- active demo heading/status/purpose/`Try this` framing;
- live demonstration as the primary content;
- responsive Guide / Request / Evidence inspector model;
- compact loading/error/reset/source affordances;
- move verbose implementation evidence out of the primary task flow without deleting it.

Use demo-specific data honestly; inspector modes may be omitted where a demo has no meaningful content for them.

### DEMO-268 — REFACTOR — Contain REST and oversized demo evidence

Refine the densest presentations so they fit the workbench model:

- make REST/OpenAPI operation-first instead of full-spec-first;
- keep full OpenAPI reachable as deeper evidence;
- audit D1 and other large presentations for raw/schema/log sections that overwhelm the task;
- contain advanced evidence behind bounded inspector/disclosure surfaces;
- preserve all existing machine/API behavior.

### DEMO-269 — BUILD — Make CI failures self-diagnosing

Add CI-log visibility, complete failure evidence, deterministic local reproduction, and generated-artifact parity diagnostics:

- provide one local command that runs the same strict validation sequence as CI;
- capture the exact command, exit code, bounded safe runtime facts, repository state, and full command output without enumerating the full environment;
- preserve every authoritative failure and pipeline exit code;
- publish a concise Actions step summary and a bounded diagnostic artifact when validation fails;
- identify generated-artifact inputs, outputs, first-pass drift, second-pass drift, and idempotence;
- document primary GitHub Actions log retrieval plus the artifact fallback for clients that cannot expose redirected or large log bodies;
- extend the active sequence reservation through DEMO-272 without changing any merged DEMO identity.

This is CI, local tooling, documentation, and test scope only. It must not change application behavior or implement any shifted workbench item.

### DEMO-270 — A11Y — Harden workbench navigation and responsive behavior

Make the new interaction model robust:

- keyboard-complete primary/secondary selection;
- correct active semantics and focus behavior;
- back/forward + hash restoration;
- fragment preservation across locale changes;
- narrow reflow and touch-target review;
- loading/error announcements;
- browser accessibility/localization audit coverage for representative workbench states.

### DEMO-271 — TEST — Enforce demo workbench MVP acceptance

Add focused regression coverage that locks the public contract:

- `/demos` defaults to D1;
- exactly one demonstration is active/mounted at a time;
- all twelve stable fragments select the correct demo/category;
- no `All demos` mode or giant trailing inventory returns;
- REST stays operation-first in the workbench;
- full capability remains reachable through the appropriate deeper evidence/source path;
- machine/API/protocol routes remain unchanged;
- inactive demos do not continue ordinary execution;
- keyboard, history, locale, and narrow-layout expectations remain covered by the appropriate test layer.

### DEMO-272 — BUILD — Release demo workbench as v0.22.0

After DEMO-265 through DEMO-271 are merged and green:

- release the workbench MVP as `v0.22.0`;
- record validation, deployment, rollback, and release evidence according to `docs/RELEASE-MANAGEMENT.md`;
- retain v0.21.0 as the previous release/rollback reference;
- retire this implementation plan after release once any durable requirements have been moved into permanent contracts/tests.

## Validation expectations

Every controlled change follows `AGENTS.md` and `docs/CHANGE-MANAGEMENT.md`.

At minimum, repository-changing tasks complete the standard validation loop:

- `npm run check`
- `npm run validate:migrations`
- `npm run security:dependencies`
- `npm run build`
- `git diff --check`

Run browser accessibility/localization audits whenever the changed surface or repository checks require them. Route-generation commands and generated artifacts are required only when authoritative route declarations change.
