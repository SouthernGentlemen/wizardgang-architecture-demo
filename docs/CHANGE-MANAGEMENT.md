# Change management

Every controlled change to WizardGang Architecture Demo receives exactly one permanent ID in the `DEMO-###` namespace.

## Identity rules

- One change, one ID. IDs are sequential, permanent, and never reused after publication. Agents allocate IDs; owners never calculate them. `scripts/lib/controlled-identity-allocation.ts` reads raw accepted IDs (including historical suffixes), the queue, all open PR title/branch reservations and remote branches. The first queued task retains its assigned ID. New maintenance/live identities skip every reservation; a plan-only reservation receives its ID before ordered task assignment.
- A commit title is `[DEMO-###] [TYPE] <imperative summary>` with one primary type.
- A revert keeps the original change intact and receives a new ID with type `REVERT`.
- A correction receives a new ID and names the corrected change in its body; `Post-Merge-Recovery` and same-ID correction paths are retired.
- Controlled pull requests land as one squash commit with the permanent DEMO ID on `main`.
- Troubleshooting may use temporary branch commits, but a change that requires one controlled commit must be squashed or rebuilt before merge. Diagnose CI from the exact-head failing job's complete log or its retained diagnostics artifact before changing code; then revalidate the new exact head without weakening these identity rules.
- Use an isolated `demo-###-imperative-summary` branch and a PR title matching the controlled commit. The provider requires strict/current-with-main `validate` and `browser` and permits only squash merge. Verify the exact PR head and current `main` before squashing that head. Inspect live settings when changing them or investigating drift.
- A live release uses the narrow `Live-Release: true` identity: `[DEMO-###] [BUILD] Demonstrate vX.Y.Z release lifecycle` on `demo-###-live-vX-Y-Z-<request>` with one structured commit changing only `package.json` and `package-lock.json` version metadata. Its ID comes from the shared automatic allocator, skipping every accepted, queued and open reservation; it preserves the current queue rather than retiring its first task. The PR and history validators verify the marker, title, branch, files, versions, and body. This exception does not waive any required check or branch rule.

Allowed primary types are `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, and `CHORE`.

### Fixed forward-history boundary

The fixed accepted checkpoint is pinned solely in `scripts/lib/forward-history.ts`, with sequential numeric floor 498 and no additional IDs consumed above the floor. Its identity is pinned in `scripts/lib/forward-history.ts`; it does not advance automatically with `main`. The validator requires that exact checkpoint to exist and be an ancestor of HEAD. Only commits after it undergo controlled title/body and ordered queue-transition validation. The pre-checkpoint history is read solely for raw accepted IDs, not metadata replay. Above-floor maintenance/live-release identities are tracked by current forward records without an old exception registry.

New history must use fresh IDs and valid structured bodies, even for corrections of published changes. Same-ID post-merge recovery, historical renumbering, suffix normalization and missing-body exceptions are no longer authored or accepted. Published commits/tags remain intact. The separate security gate still scans all reachable history, including commits before the checkpoint.



## Controlled record

`scripts/lib/controlled-record.ts` owns one subject/body record. `npm run delivery -- record <record.json> <commit-file>` generates the controlled commit. Its JSON fields are `id`, `type`, `summary`, `change`, `reason`, `impact`, `risk`, `controls`, `validation`, `evidence`, `source`, `release`, and, for High risk, `rollback` naming an explicit forward recovery or rollback target. Optional `maintenance`, `liveRelease` and `requestId` produce their markers in that same body. Every required section is nonempty; Validation describes evidence actually obtained and identifies outstanding gates without claiming they ran.

The exact-head committed record supplies the PR title/body and the explicit squash subject/body. Normalization changes only CRLF, trailing line whitespace and outer whitespace. It never strips PR-number suffixes, rewrites a summary or accepts a parallel narrative. The body excludes the subject. PR metadata drift fails validation and blocks merge; reconcile it to the committed record and re-read/revalidate, rather than recovering merge text manually. Request correlation and the live release range are part of the committed record, PR and squash body together.

Low risk covers documentation and non-authoritative presentation. Medium risk covers application behavior, routes, storage behavior, and new user workflows. High risk covers authentication, authorization, secrets, persistence schemas, deployment controls, privileged administration, and destructive data behavior. New high-risk records require explicit controls, validation, and a `Rollback:` target; accepted historical bodies remain immutable.

The repository validates forward-only sequential IDs, required controlled bodies and queue transitions from the fixed accepted checkpoint on every full check. Pull-request titles use the same syntax. Superseded or reconstructed repository states are recovered from Git/GitHub; current change-management policy does not duplicate their narrative.

## Active work and completion

The root `implementation_plan.md` is the permanent current/future queue. Reconcile it against authoritative `main` and open PRs, then select its first open task by default. If that task is blocked, report its exact prerequisite and stop; do not select a later task unless the owner explicitly overrides priority. Retire the delivered task in its delivering PR and keep later tasks accurate. When none remain, leave the shared empty queue tracked. The next instruction fills it through a controlled plan-only change before implementation begins.

`do needful` authorizes the controlled delivery loop defined in `AGENTS.md`: refresh authority; if an already-green/current authoritative PR exists, finish it; otherwise select and deliver the first open task through exact-head CI, merge, and verification of merged `main`. When the queue is empty, select no implementation task. Provider operations and validation are reported only when actually performed.

The authenticated live Git release action is a separate owner-confirmed release path. Its preflight exposes the target version and the complete commit range since the previous published release. The workflow opens the version-only PR, waits for both successful exact-head CI jobs, rechecks current `main` and mergeability, then squash-merges that exact head without bypass. Successful CI on that exact current `main` commit cuts or verifies the annotated version tag and dispatches Release. The same post-CI cutter handles a separately delivered controlled version-only PR; it never moves an existing tag or releases an already-published version again.

### Automatic authoring and protected delivery

- `npm run delivery -- begin` refreshes authoritative reservations twice, selects the first unblocked task, requires a clean checkout and creates its isolated branch from exact current main. `select` reads selection without mutation.
- `npm run delivery -- plan <tasks.json>` reads current reservations and returns one plan-only maintenance identity followed by ordered task assignments (`type`/`title` inputs). Publish that reservation through a controlled plan-only change before implementation. `allocate` reads the next unused maintenance/live identity. Neither operation publishes a reservation on its own.
- Re-read reservations immediately before branch and PR creation. The live publisher recomputes an unpublished allocation on collision. Once a branch/task/PR has been published, stop and reconcile collisions without renumbering it. The ordinary `open <head-sha> <base-sha>` path re-reads main, open PRs, remote branches and the exact pushed head, validates the record/queue and publishes the PR from that record.
- `npm run delivery -- merge <pr-number> <validated-head-sha> <validated-base-sha>` is read-only mutation planning. Add `--apply` only for authorized delivery. Ordinary and live delivery both use `scripts/lib/controlled-delivery-provider.ts` and `protectedSquash`: independently re-read PR title/body, base/head, canonical CI, every effective required check, strict-base protection, merge settings and mergeability before one explicit SHA-bound squash API request. Provider protections remain enforced; there is no bypass or auto-merge-stall/manual-text fallback.
- The adapter verifies merged subject/body, exact parent and queue transition against the validated head. Then verify exact-main CI, automatic branch deletion and the next queue entry using native Git/GitHub evidence. Stop after that task. Post-merge evidence belongs in provider records and the session handoff, not a second metadata narrative in the immutable controlled record.

`npm run check` is the canonical credential-free local gate. Connected GitHub tools or an authenticated CLI can handle ordinary PR delivery. `npm run test:github-settings` is pure, `npm run verify:github-settings` is read-only live verification for settings changes or drift, and `npm run apply:github-settings` is the explicit bounded administration command with independent post-apply verification. Supply `GH_ADMIN_TOKEN` or an authorized `GH_TOKEN` at runtime when a settings command requires it. The committed baseline in `config/github-repository-settings.json` is the settings-as-code authority. CI failure diagnosis uses complete failing-job logs or the retained diagnostics artifact, not a status summary. A correction to an accepted change receives a new ID rather than rewriting history.

## Alignment

**Controls:** ISO27001-A.8.32
