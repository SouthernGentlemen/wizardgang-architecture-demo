# AGENTS.md

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

When the plan exists, remove already-merged task blocks and resolved/obsolete findings, and select the **first remaining unblocked task** by default. An owner may explicitly override priority; otherwise do not skip a blocked first task to implement a later one. Respect its dependencies and scope. Update future tasks in the same delivering change when discoveries alter their scope, dependencies, or acceptance criteria. The delivering PR removes its own task, so merged `main` never waits for a later cleanup turn. Do not retain completed tasks, merge SHAs, release notes, retrospectives, or legacy narratives in the active plan. If no future task remains, delete the plan in that final delivery.

For one selected task, complete branch → implementation → validation → one controlled commit → PR → exact-head required CI → merge when current/green/authoritative/mergeable → re-fetch and verify `main`. This repository currently permits merge commits only; do not weaken rulesets or rewrite published history to force a preferred merge style. Do not stop at local completion, push, PR creation, or “ready to merge” if the authoritative change can actually be merged. Confirm live provider settings before the merge when that verification is available, and report any unavailable check honestly. Never claim a validation, provider mutation, release, deployment, PR, or merge that did not occur.

Stop after the one task merges. Return a complete copy-paste next-task prompt naming the fresh `main` SHA, first open task, dependencies, branch/title, scope, validation, task retirement, exact-head CI, merge, and subsequent handoff. Do not implement the next task in the same turn. If a `do needful` turn starts with no active task, perform a fresh deep repository review and publish a small implementation wave as its own controlled planning change; stop before implementing that new wave. An exhausted plan is deleted in its last task's merge, not kept as an empty placeholder. If the first task is blocked, report its exact prerequisite and do not invent or skip work.

Plan-authored tasks normally have one controlled ID, one primary concern and observable outcome, narrow ownership, explicit prerequisites, concise scope and non-goals, acceptance criteria, and relevant validation. Split independently reviewable outcomes; favor a near-term wave of roughly 5–12 surgical tasks over a long reserved sequence. A deeper roadmap may remain high level outside the active task queue. Research again from fresh state when the wave is exhausted. Planning and the first task of its new wave are separate turns.

## Definition of done

After every task that changes repository files, finish the delivery loop before handing the task back:

1. Account for every modified, deleted, and untracked file; preserve unrelated or user-authored work.
2. Remove only task-created temporary artifacts, then run `npm run check`, `npm run validate:migrations`, `npm run security:dependencies`, `npm run build`, and `git diff --check`. `check` is the canonical credential-free gate; provider-authenticated verification is separate. Run focused validation relevant to the task as well.
3. Commit each intended controlled change with one permanent `DEMO-###` ID and one primary bracketed type.
4. Push the isolated branch and open a pull request. Verify required CI on its exact head and merge it when current, green, authoritative, and mergeable. Do not push ordinary changes directly to `main`.
5. Re-fetch merged `main`, verify the delivered task is absent from the plan, and confirm the worktree is clean before reporting completion.

When a requested controlled change is gated on an open predecessor PR, inspect it before stopping. Merge it only if it is the authoritative current change, targets `main`, has current exact-head required checks, matches live provider settings, and is cleanly mergeable; then refresh `main` and rerun the history gate. Stop and report if any condition fails. This instruction does not authorize merging unrelated work.

Production is deployed only from an annotated semantic-version release tag, never from an arbitrary branch commit. See `docs/CHANGE-MANAGEMENT.md` and `docs/RELEASE-MANAGEMENT.md`.

If a required check, push, pull request, release, deployment, or live verification cannot be completed, report the exact blocker and leave all recoverable work intact.

## CI failure troubleshooting

CI troubleshooting is a mandatory part of the normal delivery loop, not an optional debugging technique. When CI investigation begins:

1. Explicitly discover and load the GitHub connector actions for workflow runs, jobs, and job logs, searching for `workflow` and/or `log` capabilities as needed.
2. Fetch the actual workflow run associated with the current branch head or pull request; do not substitute a previous run.
3. Enumerate the workflow run's jobs.
4. Identify every failing job.
5. Fetch the complete failing workflow job log body for each failure using its numeric GitHub Actions job ID.
6. Diagnose the failure from that complete log body.
7. Do not infer the failure solely from commit status, combined status, pull-request check summaries, step names, annotations, previous runs, or remembered failures.
8. If the dedicated job-log action is not initially exposed, rediscover connector actions using `workflow` and/or `log` before declaring logs inaccessible.
9. If the log action exists but access is denied, surface the exact connector or API error and identify the missing GitHub permission instead of guessing at the failure.
10. When the log proves a concrete failing assertion or test, fix only that demonstrated regression unless later complete logs prove additional failures.
11. Re-run or fetch CI after each controlled fix and continue until the complete required validation set is green.
12. Do not stop merely because the first failure was repaired.
13. Preserve the controlled-history rules throughout troubleshooting. Temporary fix commits must be squashed or rebuilt when the DEMO requires one controlled commit.

Retrieving a complete job log for diagnosis does not permit copying unbounded output into another CI log or report; keep reported failure evidence bounded and actionable as required below.

The repository-local equivalent is `npm run validate:ci`. It records complete redacted command output under `.ci-diagnostics/`, preserves the first authoritative exit code, and publishes the same directory as a failed-run artifact. If a client cannot expose a redirected or large job-log body, retrieve `ci-diagnostics-<run_id>-<run_attempt>` and inspect `validation.log` and `report.json`; see `docs/CI-DIAGNOSTICS.md` for `gh` and REST retrieval commands.

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
