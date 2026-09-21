# Active implementation plan

This is the first post-React **process-conformance wave**. It is a live current/future work queue, not a history or a general technical backlog. Re-fetch authoritative `main`, open PRs, CI, and provider settings before selecting work. `do needful` takes the first open task unless its prerequisite is unsatisfied or the owner explicitly overrides priority. A blocked first task is reported, not bypassed. Finish only one controlled change per turn; its delivering PR removes that task and updates any affected future blocks. Delete this file in the PR delivering the last task. Git/GitHub retain completed work.

The wave closes proven gaps between the architecture process, the SharkTank/Hexframe/YarReader operating mechanics, and execution from a clean ChatGPT/Codex cloud repository terminal. Keep the architecture's stronger change, release, deployment, security, and assurance controls. Do not implement application, deployment, build, browser, or local-dev normalization under these tasks. After this wave is exhausted, review fresh repository and provider state before authoring a separate technical wave; earlier findings are not automatically future tasks.

## Open tasks

### DEMO-344 — [DOCS] Make first-task selection and blocked-head behavior unambiguous

- Dependency: DEMO-343 merged on `main`.
- Why: The current operating text says to select the first *unblocked* task but also forbids skipping a blocked first task, so a fresh agent can choose different work from the same queue.
- Scope: Make `AGENTS.md` the explicit read-first agent contract; define first-open-task selection, owner override, blocked-head reporting, authoritative open-PR completion, and one-change handoff consistently in the human process authorities. Preserve the existing current/future plan and same-delivery retirement rules.
- Non-goals: Do not take a later task, change provider rules, or alter release/deploy policy.
- Acceptance: A fresh agent can identify one next operation from `main`, PRs, CI, and the queue; it never skips a blocked first task without owner direction; the human mirror and organization baseline agree with `AGENTS.md`.
- Validation: Focused process-policy tests where applicable; `npm run check`; `git diff --check`.
- Authorities: `AGENTS.md`, `CONTRIBUTING.md`, `docs/CHANGE-MANAGEMENT.md`, WG-ARCH-001 in `docs/ARCHITECTURE-STANDARD.md`.

### DEMO-345 — [DOCS] Make CI diagnosis runnable from a clean cloud terminal

- Dependency: DEMO-344 merged on `main`.
- Why: `AGENTS.md` currently makes discovery of GitHub connector log actions mandatory even when a web/cloud repository terminal has authenticated `gh` or REST access instead. The terminal workflow must not depend on a desktop-only surface or a particular connector.
- Scope: Specify complete failing-job log retrieval by whichever authenticated GitHub interface is available, with `gh`/REST and diagnostics-artifact recovery documented; retain exact-head run selection, full-log diagnosis, bounded reporting, and honest permission failures.
- Non-goals: Do not weaken failure investigation, put credentials in logs, or require a new hosted service.
- Acceptance: The documented sequence works from a clean repository terminal with GitHub CLI/API access and from a connector-equipped session; neither path treats status summaries as complete job logs.
- Validation: Check documented commands against current workflow/run shapes; `npm run check`; `git diff --check`.
- Authorities: `AGENTS.md`, `docs/CI-DIAGNOSTICS.md`, `.github/workflows/ci.yml`.

### DEMO-346 — [TEST] Enforce a sequential future-only task queue

- Dependency: DEMO-345 merged on `main`.
- Why: The current plan validator rejects accepted IDs and malformed blocks, but it allows a plan to start after the next controlled ID or reserve gaps between tasks.
- Scope: Make the validator derive the next available controlled ID from accepted history and require contiguous ascending IDs for open tasks; add focused tests for valid, stale, skipped, duplicate, and exhausted queues. Keep planning/resequencing possible before an ID is accepted.
- Non-goals: Do not reserve a long roadmap or rewrite accepted IDs.
- Acceptance: A fresh agent cannot silently skip an available ID or retain an accepted task; a plan-free repository remains valid for planning mode.
- Validation: Focused plan-policy tests; `npm run check`; `git diff --check`.
- Authorities: `scripts/validate-implementation-plan.mjs`, `tests/implementation-plan-policy.test.mjs`, `docs/CHANGE-MANAGEMENT.md`.

### DEMO-347 — [TEST] Guard the organization process invariants against drift

- Dependency: DEMO-346 merged on `main`.
- Why: Current tests check plan formatting but not the cross-authority contract for one-task `do needful`, same-delivery task retirement, queue exhaustion, truthful provider actions, and process applicability to labs.
- Scope: Add focused, maintainable conformance assertions over the authoritative process files and plan validator, checking behavior/invariants rather than a full prose snapshot; wire them into the credential-free check.
- Non-goals: Do not duplicate policy prose, impose a release/deploy capability on every product, or implement another queued concern.
- Acceptance: Removing a required process invariant from an authority causes a clear local/CI failure; harmless wording changes do not require snapshot churn.
- Validation: Focused conformance tests; `npm run check`; `git diff --check`.
- Authorities: `AGENTS.md`, `CONTRIBUTING.md`, `docs/CHANGE-MANAGEMENT.md`, WG-ARCH-001, `scripts/validate-implementation-plan.mjs`.

### DEMO-348 — [DOCS] Define explicit process and product capability boundaries

- Dependency: DEMO-347 merged on `main`.
- Why: WG-ARCH-001 makes the development process universal, but the reference baseline still conflates that process with this repository's Worker, React, browser, and deployment stack.
- Scope: State the mandatory executable-repository process capabilities and the explicit N/A boundaries for product runtime, release publication, and production deployment; define how a repository declares its applicable profile before baseline validation.
- Non-goals: Do not exempt laboratories from change control or prescribe one runtime to every executable repository.
- Acceptance: An offline/lab repository has the same controlled-change, queue, policy, CI, settings, and credential-free check obligations, while genuinely inapplicable runtime/deploy capabilities can be declared N/A without pretending verification occurred.
- Validation: Focused standard/baseline documentation review; `npm run check`; `git diff --check`.
- Authorities: WG-ARCH-001 in `docs/ARCHITECTURE-STANDARD.md`, `scripts/validate-repository-baseline.mjs`, `AGENTS.md`.

### DEMO-349 — [BUILD] Separate universal baseline checks from the reference runtime profile

- Dependency: DEMO-348 merged on `main`.
- Why: The copyable baseline validator currently requires `wrangler.jsonc`, `release.yml`, React 19, Vite, and Worker Static Assets for every repository even though those are product capabilities, not universal process controls.
- Scope: Refactor baseline validation to check mandatory process controls for every declared profile and apply the architecture reference-stack checks only when the profile declares them; preserve this repository's existing strict validation.
- Non-goals: Do not weaken this repository's runtime/release checks or mutate another repository.
- Acceptance: This repository still fails on drift from its declared stack, while a valid non-Worker profile is not rejected solely for lacking Worker/browser/deploy files.
- Validation: Focused baseline-validator tests; `npm run check`; `git diff --check`.
- Authorities: `scripts/validate-repository-baseline.mjs`, the capability contract from DEMO-348, `package.json`.

### DEMO-350 — [TEST] Prove the baseline accepts process-compliant non-Worker repositories

- Dependency: DEMO-349 merged on `main`.
- Why: A conditional validator can still regress to a laboratory exemption or accidentally require the reference stack unless contrasting fixtures exercise both paths.
- Scope: Add small fixtures for an executable offline/non-Worker repository and for this architecture reference profile; assert mandatory process failures and optional-capability N/A behavior independently.
- Non-goals: Do not normalize SharkTank, Hexframe, YarReader, or another product in this change.
- Acceptance: A process-compliant non-Worker fixture passes, missing universal controls fail, and declared architecture capabilities remain enforced.
- Validation: Focused fixture tests; `npm run check`; `git diff --check`.
- Authorities: `scripts/validate-repository-baseline.mjs`, its tests/fixtures, WG-ARCH-001.

### DEMO-351 — [BUILD] Bind pull-request title, branch, and controlled head identity

- Dependency: DEMO-350 merged on `main`.
- Why: CI currently checks the PR title pattern but does not prove the branch name and controlled head commit identify the same single change.
- Scope: Add a pure PR-identity validator and invoke it in the existing `change-id` job for the current PR head; check controlled ID, primary type, and title agreement without changing the provider's merge-commit policy.
- Non-goals: Do not rewrite published history, change rulesets, or require a squash merge.
- Acceptance: A PR with mismatched branch/title/head identity fails exact-head CI; the current compliant branch and merge-commit topology remain valid.
- Validation: Focused identity tests; `npm run check`; `git diff --check`; inspect exact-head `change-id` CI.
- Authorities: `.github/workflows/ci.yml`, `docs/CHANGE-MANAGEMENT.md`, `scripts/validate-history.mjs`.

### DEMO-352 — [TEST] Reject multiple controlled changes in one task PR

- Dependency: DEMO-351 merged on `main`.
- Why: Sequential full-history validation permits a PR to introduce multiple valid controlled commits even though one `do needful` task should deliver one controlled change.
- Scope: Compare the PR's current base/head range with the single-change contract and add tests for one commit, multiple controlled commits, and an unrelated commit; allow GitHub's eventual merge commit outside the PR head range.
- Non-goals: Do not force a new merge method or erase a contributor's published commits; report a nonconforming PR before merge.
- Acceptance: Exact-head CI rejects a PR that would deliver more than one controlled change; one compliant controlled commit passes.
- Validation: Focused PR-range tests; `npm run check`; `git diff --check`; inspect exact-head `change-id` CI.
- Authorities: `.github/workflows/ci.yml`, the validator from DEMO-351, `docs/CHANGE-MANAGEMENT.md`.

### DEMO-353 — [BUILD] Prevent the live Git demo from consuming a queued ID

- Dependency: DEMO-352 merged on `main`.
- Why: The live Git demonstration derives the next ID from Git history without consulting an active plan, so a demonstration started during a queued wave can collide with its first reserved task.
- Scope: Fail the live-demo start operation before branch/version mutation when the active plan has open tasks; give a precise recovery path. Preserve completion of a previously opened authoritative live-demo PR.
- Non-goals: Do not start a demonstration, publish a release, deploy, or reassign accepted IDs.
- Acceptance: A queued ID cannot be consumed by a competing demo start; without a plan, the existing controlled demonstration remains available.
- Validation: Focused workflow/policy test; `npm run check`; `git diff --check`.
- Authorities: `.github/workflows/git-demo.yml`, `IMPLEMENTATION_PLAN.md`, `scripts/validate-implementation-plan.mjs`.

### DEMO-354 — [TEST] Exercise repository-settings comparison without credentials

- Dependency: DEMO-353 merged on `main`.
- Why: The settings validator combines baseline assertions, live API projection, and comparison without isolated pure cases, weakening the universal settings-as-code process contract.
- Scope: Extract pure normalization/comparison functions and test missing or changed main checks, merge methods, tag protection, and matching state; preserve committed settings and live verification behavior.
- Non-goals: Do not change provider settings, merge policy, release/deploy behavior, or secrets.
- Acceptance: Credential-free tests fail on material settings drift and pass on the committed baseline; live verification still matches current GitHub state. Delete this plan in the delivering PR unless fresh future requirements have been explicitly planned.
- Validation: Focused settings tests; `npm run check`; `npm run validate:repository-settings -- --live`; `git diff --check`.
- Authorities: `config/github-repository-settings.json`, `scripts/validate-github-repository-settings.mjs`, `.github/workflows/ci.yml`.
