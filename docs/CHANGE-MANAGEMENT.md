# Change management

Every controlled change to WizardGang Architecture Demo receives exactly one permanent ID in the `DEMO-###` namespace.

## Identity rules

- One change, one ID. IDs are sequential, permanent, and never reused after publication.
- A commit title is `[DEMO-###] [TYPE] <imperative summary>` with one primary type.
- A revert keeps the original change intact and receives a new ID with type `REVERT`.
- A correction receives a new ID and names the corrected change in its body.
- Controlled pull requests land as one squash commit with the permanent DEMO ID on `main`.
- Troubleshooting may use temporary branch commits, but a change that requires one controlled commit must be squashed or rebuilt before merge. Diagnose CI from the exact-head failing job's complete log or its retained diagnostics artifact before changing code; then revalidate the new exact head without weakening these identity rules.
- Use an isolated `demo-###-imperative-summary` branch and a PR title matching the controlled commit. The provider requires strict/current-with-main `validate` and `change-id` and permits only squash merge. Verify the exact PR head and live settings before squashing that head.

Allowed primary types are `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, and `CHORE`.

### Published-history exceptions

Published history is not rewritten to repair an already shared change identity. A correction moves forward under a new controlled ID.

Any exact immutable-history exception needed by sequential validation is encoded with the validator, test, or exception data that enforces it, including the exact immutable identity and reason. Permanent current-state policy does not enumerate old pull requests, merge SHAs, collisions, or prior numbering; Git and GitHub remain the authority for those historical facts.

## Controlled record

Rigor scales with risk. A meaningful commit records:

```text
[DEMO-###] [TYPE] Imperative summary

Change:
What changed.

Reason:
Why it changed.

Impact:
Affected boundaries.

Risk:
Low | Medium | High

Controls:
- Required invariant.

Validation:
- Check actually run.

Evidence:
- Repository path carrying the change.

Source:
Original SHA for reconstructed work, or direct.

Release:
v0.x.x | Unreleased
```

Low risk covers documentation and non-authoritative presentation. Medium risk covers application behavior, routes, storage behavior, and new user workflows. High risk covers authentication, authorization, secrets, persistence schemas, deployment controls, privileged administration, and destructive data behavior. High-risk changes state explicit controls, validation, and a rollback target.

The repository validates sequential IDs and controlled titles on every full check. Pull-request titles use the same syntax. Superseded or reconstructed repository states are recovered from Git/GitHub; current change-management policy does not duplicate their narrative.

## Active work and completion

The root `implementation_plan.md` is the permanent current/future queue. Reconcile it against authoritative `main` and open PRs, then select its first open task by default. If that task is blocked, report its exact prerequisite and stop; do not select a later task unless the owner explicitly overrides priority. Retire the delivered task in its delivering PR and keep later tasks accurate. When none remain, leave the shared empty queue tracked. The next instruction fills it through a controlled plan-only change before implementation begins.

`do needful` authorizes the controlled delivery loop defined in `AGENTS.md`: refresh authority; if an already-green/current authoritative PR exists, finish it; otherwise select and deliver the first open task through exact-head CI, merge, and verification of merged `main`. When the queue is empty, select no implementation task. Provider operations and validation are reported only when actually performed.

`npm run check` is the canonical credential-free local gate. `npm run test:github-settings` is pure, `npm run verify:github-settings` is read-only live verification, and `npm run apply:github-settings` is the explicit bounded administration command with independent post-apply verification. Use `GH_ADMIN_TOKEN` or an authorized `GH_TOKEN` only in process environment. The committed baseline in `config/github-repository-settings.json` is the settings-as-code authority. CI failure diagnosis uses complete failing-job logs or the retained diagnostics artifact, not a status summary. A correction to an accepted change receives a new ID rather than rewriting history.

## Alignment

**Controls:** ISO27001-A.8.32
