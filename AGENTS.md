# AGENTS.md

## Portfolio plan maintenance

An explicit owner-directed portfolio planning request may append or clarify future tasks while the first open implementation task or its pull request remains active. Preserve all existing open tasks and their order; the maintenance change does not deliver, retire, or skip one. Reserve a separate controlled maintenance ID outside the implementation task headings: normally the first unassigned ID after the queued IDs, or an existing unassigned gap when the repository history contract requires it. Once this policy setup is merged, routine amendments change only the active implementation plan file. This exception is for planning edits, not implementation or provider mutation.

Record authoritative `main` and the plan's base before editing. Immediately before a maintenance merge, re-fetch `main`, open pull requests, the exact head, checks, and mergeability. If `main` or the plan moved, rebase and reconcile the additive plan edit, then revalidate the new exact head. Only the actual last remaining task deletes the plan. The normal first-open-task rule still governs the next implementation delivery.

This repository is a public architecture demonstration, not a generic application template.

## Repository authority

Repository documentation describes the current system. Superseded source and document states are recovered from Git and GitHub rather than narrated in permanent architecture or policy prose. An active root `IMPLEMENTATION_PLAN.md` is the live current/future work queue, not a historical roadmap. It is the only Markdown outside `docs/history/` that may name the change IDs it reserves; delete it in the change that delivers its last task.

Use repository authorities in this order. A lower layer may explain, project, or evidence a higher layer; it must not silently redefine it.

1. **Executable source and contracts** — source declarations, configuration, migrations, schemas, and interface contracts define executable behavior and machine interfaces.
2. **Structured assurance records** — `assurance/**` is authoritative for current structured assurance state, rationale, lifecycle, and relationships.
3. **Generated artifacts** — deterministic outputs are projections of authoritative inputs and are never independent manually maintained authorities.
4. **Human current-state architecture and policy** — concise Markdown explains present intent, boundaries, responsibilities, and controls without duplicating machine-owned state.
5. **Operating evidence** — runtime observations, audit records, assessments, reviews, accessibility evidence, and other dated records prove what happened for a stated scope or period.
6. **Git and GitHub history** — Git, annotated tags, GitHub Releases, workflow runs/artifacts, pull requests, and commits are authoritative for superseded repository states, historical releases, and historical delivery execution.

Concern-specific rules follow that hierarchy:

- application route declarations are authoritative for runtime routes and route policy;
- contracts are authoritative for executable interface definitions;
- `docs/route-manifest.json` is the generated machine projection of route declarations;
- `docs/ROUTE-REGISTRY.md` is the human current-state routing and browser information-architecture contract;
- `assurance/registry.json` and its registered schemas inventory the structured assurance authorities under `assurance/**`;
- `docs/CHANGE-MANAGEMENT.md` governs the current controlled-change process; Git/GitHub retain the historical change record;
- `docs/RELEASE-MANAGEMENT.md` governs the current release/deployment process; annotated tags and GitHub Releases retain historical release identity.

Permanent current-state architecture and policy docs do not carry implementation-history narration such as concrete old change IDs, pull requests, merge SHAs, retired routes, former labels, staged migrations, or previous implementations. Machine-enforced immutable-history exceptions stay with the validator, test, or exception data that requires them. Dated evidence records may retain the facts they actually observed and must not be rewritten to mimic the current presentation.

## Active plan and `do needful`

`do needful` is a standing explicit instruction to complete the next authoritative repository operation. Start every such turn by fetching/re-reading `main`, this file, the active plan when present, open pull requests, and current CI. Reconcile the plan with accepted `main` before selecting work. If an already-open PR is the authoritative current controlled change, verify its exact head, required checks, currency, provider settings, and mergeability; finish and verify that change first when it is green and mergeable. Reuse its branch/PR rather than making a duplicate. Finishing that PR consumes this turn's one change: return the next-task prompt without starting another implementation.

When the plan exists, remove already-merged task blocks and resolved/obsolete findings, then select the **first task in the active plan** by default. If that first task is blocked, report its exact prerequisite and stop; do not select a later task unless the owner explicitly overrides priority. Respect the selected task's dependencies and scope. Update future tasks in the same delivering change when discoveries alter their scope, dependencies, or acceptance criteria. The delivering PR removes its own task, so merged `main` never waits for a later cleanup turn. Do not retain completed tasks, merge SHAs, release notes, retrospectives, or legacy narratives in the active plan. If no future task remains, delete the plan in that final delivery.

For one selected task, complete branch → implementation → validation → one controlled commit on the branch → PR → exact-head required CI → squash the exact validated head into one controlled commit on `main` → verify `main`, post-merge CI, and branch cleanup. Do not weaken rulesets or rewrite published history. Confirm live provider settings before the merge when that verification is available, and report any unavailable check honestly. Never claim a validation, provider mutation, release, deployment, PR, or merge that did not occur.

Stop after the one task merges. Return a complete copy-paste next-task prompt naming the fresh `main` SHA, first open task, dependencies, branch/title, scope, validation, task retirement, exact-head CI, merge, and subsequent handoff. Do not implement the next task in the same turn. If a `do needful` turn starts with no active task, perform a fresh deep repository review and publish a small implementation wave as its own controlled planning change; stop before implementing that new wave. An exhausted plan is deleted in its last task's merge, not kept as an empty placeholder. If the first task is blocked, report its exact prerequisite and do not invent or skip work.

Plan-authored tasks normally have one controlled ID, one primary concern and observable outcome, narrow ownership, explicit prerequisites, concise scope and non-goals, acceptance criteria, and relevant validation. Split independently reviewable outcomes; favor a near-term wave of roughly 5–12 surgical tasks over a long reserved sequence. A deeper roadmap may remain high level outside the active task queue. Research again from fresh state when the wave is exhausted. Planning and the first task of its new wave are separate turns.

## Definition of done

After every task that changes repository files, finish the delivery loop before handing the task back:

1. Account for every modified, deleted, and untracked file; preserve unrelated or user-authored work.
2. Remove only task-created temporary artifacts, then run `npm run check`, `npm run validate:migrations`, `npm run security:dependency-advisories`, `npm run build`, and the canonical committed-patch whitespace command with explicit base context (`BASE_SHA=<pr-base-sha> npm run validate:patch-whitespace`). Run `git diff --check` only as an additional working-tree sanity check; without base context it does not prove the committed PR range. `check` is the canonical credential-free gate; provider-authenticated verification is separate. Run focused validation relevant to the task as well.
3. Commit each intended controlled change with one permanent `DEMO-###` ID and one primary bracketed type.
4. Push the isolated branch and open a pull request. Verify required CI on its exact head and merge it when current, green, authoritative, and mergeable. Do not push ordinary changes directly to `main`.
5. Re-fetch merged `main`, verify the delivered task is absent from the plan, and confirm the worktree is clean before reporting completion.

When a requested controlled change is gated on an open predecessor PR, inspect it before stopping. Merge it only if it is the authoritative current change, targets `main`, has current exact-head required checks, matches live provider settings, and is cleanly mergeable; then refresh `main` and rerun the history gate. Stop and report if any condition fails. This instruction does not authorize merging unrelated work.

Production is deployed only from an annotated semantic-version release tag, never from an arbitrary branch commit. See `docs/CHANGE-MANAGEMENT.md` and `docs/RELEASE-MANAGEMENT.md`.

If a required check, push, pull request, release, deployment, or live verification cannot be completed, report the exact blocker and leave all recoverable work intact.

## CI failure troubleshooting

CI troubleshooting is a mandatory part of the normal delivery loop, not an optional debugging technique. Use any available authenticated GitHub interface—connector actions, GitHub CLI, or REST—as an equivalent transport for the same evidence standard.

1. Resolve the exact current pull-request head SHA before investigating CI. Do not substitute a previous commit or run.
2. Find the workflow run for that exact head SHA and the relevant run attempt. Verify the run's recorded head SHA matches before using it as evidence.
3. Enumerate that run attempt's jobs and identify every failing job.
4. Retrieve the complete log body for each failing job using its numeric GitHub Actions job ID. Connector job-log actions, `gh run view --job <job-id> --log`, and the REST job-log endpoint are equivalent interfaces when they return the complete log.
5. When direct job-log retrieval is unavailable, redirected output cannot be consumed by the client, or the `validate` log is impractically large, retrieve the same run/attempt's retained `ci-diagnostics-<run_id>-<run_attempt>` artifact and inspect `validation.log` and `report.json`. The artifact is fallback failure evidence for the `validate` job, not permission to ignore a different failing job.
6. Diagnose the failure from that complete job evidence. Do not infer the failure solely from commit status, combined status, pull-request check summaries, failed-step summaries, step names, annotations, previous runs, or remembered failures.
7. If one authenticated interface cannot retrieve the evidence, use another available authenticated interface or the retained artifact where applicable. If permissions or interface limits still block retrieval, report the exact connector/CLI/API error and the missing access instead of guessing.
8. When the evidence proves a concrete failing assertion or test, fix only that demonstrated regression unless later complete evidence proves additional failures.
9. Re-run or fetch CI after each controlled fix and continue until the complete required validation set is green. Do not stop merely because the first failure was repaired.
10. Preserve the controlled-history rules throughout troubleshooting. Temporary fix commits must be squashed or rebuilt when the DEMO requires one controlled commit.

Retrieving complete evidence for diagnosis does not permit copying unbounded output into another CI log or report; keep reported failure evidence bounded and actionable.

The repository-local equivalent is `npm run validate:ci`. It records complete redacted command output under `.ci-diagnostics/`, preserves the first authoritative exit code, and publishes the same directory as a failed-run artifact. See `docs/CI-DIAGNOSTICS.md` for verified connector, `gh`, REST, and artifact-recovery paths.

## Cloud development contract

- Keep the full development and delivery loop reproducible from a clean cloud checkout using only the repository, its terminal commands, and authenticated service CLIs. Do not rely on local-only files, desktop UI state, or an existing working directory.
- After changing route declarations or route artifact generation, run `npm run generate:routes` and commit `docs/route-manifest.json` before validation.
- Keep CI failure output bounded and actionable for cloud clients: emit the failing file, line when available, and remediation command. Never print an entire generated artifact or a single-line Base64 payload into job logs.

## Architecture invariants

Preserve these invariants:

- Render HTML presentations from server-side React components, except the dependency-free safe error page. Keep pages usable without JavaScript; first-party browser modules progressively enhance them without hydration or a client-side router. Confine raw HTML insertion to an audited component.
- Keep the site-wide Content Security Policy free of `'unsafe-inline'`. HTML has no inline event handlers, and any necessary inline script or style is explicitly hash- or nonce-authorized; preserve standalone route policies where their browser dependencies require them.
- Serve browser-downloaded modules, stylesheets, and vendored files from Workers Static Assets through the `ASSETS` binding, not the Worker bundle. Build first-party browser assets with Vite into content-hashed, immutable files, and author stylesheets as CSS under `src/styles/`.
- Keep the ordinary public browser surface task-oriented and minimal: `/`, `/demos`, and `/assurance`; keep `/security` as a contextual support/security boundary; keep `/admin` protected and `/offline` as recovery.
- The shared shell stays minimal: the header is one non-wrapping row of brand, primary navigation, and utilities at every width; the footer carries the `/security` reachability link the frontend contract requires; navigation projections derive from route declarations without a hardcoded route allowlist; and breadcrumbs, secondary navigation, and related-destination navigation are not reintroduced.
- Do not leave a retired surface's stylesheet rules behind. A controlled change that removes markup removes the rules that styled it in the same change.
- `/demos` is one focused workbench, not a catalog page: one demo is selected/mounted at a time, D1 is the default, the released demo fragments remain stable deep links, category/demo controls are navigation, and an `All demos` mode or giant trailing inventory must not be introduced.
- Preserve the released demo set and capabilities while changing their presentation; hiding inactive demos from the page body is not permission to remove their underlying behavior or machine contracts.
- Keep verbose schemas, raw protocol payloads, logs, source detail, and assurance/control evidence subordinate to the executable demo task through bounded inspector/advanced surfaces when practical.
- `/operations` is an ordinary 404. Preserve operational machine APIs, scheduled collection, retention, bounded logs, protected controls, and the compact homepage operational proof without creating a public operations dashboard.
- Keep public routes stable once released unless a controlled change explicitly retires a route without compatibility aliases.
- Keep one architecture concern per demo module.
- Treat route declarations as the runtime route source of truth; `docs/route-manifest.json` is the generated machine projection and `docs/ROUTE-REGISTRY.md` is the human architecture contract, not a parallel route inventory.
- Keep registry-declared operations, security, administration, and offline-recovery capabilities available according to each declaration's offline policy; do not protect them with a hardcoded pathname inventory.
- Never let ordinary demo behavior execute behind the intentional offline gate.
- API/non-HTML/write requests receive `503` JSON while offline; browser HTML demo navigation may redirect to the registered offline recovery page.
- Do not commit secrets, real Cloudflare billing/account data, or admin credentials.
- A controlled change that adds, renames, or removes a Worker secret names the production provisioning requirement in its controlled record. Production must hold every required secret from `config/worker-secrets.json` before a release tag is pushed, and the deploy workflow must fail closed on a missing required name. Record secrets by name, date, and purpose only, never by value.
- Do not claim WCAG, ISO/IEC 27001, or ISO/IEC 42001 certification.
- The canonical JSON evidence records and `evidence` relationships stay as they are, and every `/assurance` requirement references the Markdown documentation that governs it. Do not set a compliance status without a rationale, and do not set any status other than `gap` without a Markdown documentation reference. Never create, backdate, or simulate an operating record to improve a status.
- Prefer the smallest implementation that visibly proves the architecture concept.
- Keep all source links public and deterministic.
- Use `DEMO_DB` / `demo-blob` for shared relational demo state and audit metadata.
- Use R2 for actual objects and Durable Objects for actual coordinated state; do not fake them with D1.
- Record safe audit evidence for meaningful control/architecture actions without logging credentials.
- Keep `application_logs` public-safe and bounded; never persist credentials, authorization headers, cookies, tokens, secrets, payment data, private account metadata, or unreviewed request bodies.
- Keep architecture documentation in Markdown/text. Do not add PDFs to this package unless explicitly requested later.
- Report route counts from generated artifacts or runtime projections; never encode a fixed route count as an invariant.
