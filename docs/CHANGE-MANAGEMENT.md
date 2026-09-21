# Change management

Every controlled change to WizardGang Architecture Demo receives exactly one permanent ID in the `DEMO-###` namespace.

## Identity rules

- One change, one ID. IDs are sequential, permanent, and never reused after publication.
- A commit title is `[DEMO-###] [TYPE] <imperative summary>` with one primary type.
- A revert keeps the original change intact and receives a new ID with type `REVERT`.
- A correction receives a new ID and names the corrected change in its body.
- Merge commits preserve pull-request topology and are excluded from the sequential controlled-commit check.
- Troubleshooting may use temporary branch commits, but a change that requires one controlled commit must be squashed or rebuilt before merge. Follow the mandatory CI failure investigation sequence in the root `AGENTS.md` without weakening these identity rules.
- Use an isolated `demo-###-imperative-summary` branch and a PR title matching the controlled commit. The current provider rules require `validate` and `change-id` and permit only a merge commit; verify the exact PR head and live settings before a merge. The non-merge controlled commit remains one change even though GitHub records a merge commit.

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

The root `IMPLEMENTATION_PLAN.md`, when present, contains only current/future tasks. Reconcile it against authoritative `main` and open PRs, then select the first task in the active plan by default. If that first task is blocked, report its exact prerequisite and stop; do not select a later task unless the owner explicitly overrides priority. Retire the delivered task in its delivering PR. Keep later tasks accurate and delete an exhausted plan. A planning/research pass may create a new short wave, but does not implement the new wave in that same turn.

`do needful` authorizes the complete one-change loop defined in `AGENTS.md`: refresh authority; if an already-green/current authoritative PR exists, finish it as this turn's change; otherwise select and deliver one task through exact-head CI, merge, and verification of merged `main`. Do not start the subsequent task in that turn. If no task remains at the start of a later turn, that turn performs a fresh planning/research pass. Provider operations and validation are reported only when actually performed.

`npm run check` is the canonical credential-free local gate. Provider-authenticated settings verification is distinct; the committed baseline in `config/github-repository-settings.json` is the settings-as-code authority. CI failure diagnosis uses complete failing-job logs or the retained diagnostics artifact, not a status summary. A correction to an accepted change receives a new ID rather than rewriting history.

## Alignment

**Controls:** ISO27001-A.8.32
