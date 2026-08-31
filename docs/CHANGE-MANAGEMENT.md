# Change management

Every controlled change to WizardGang Architecture Demo receives exactly one permanent ID in the `DEMO-###` namespace.

## Identity rules

- One change, one ID. IDs are sequential, permanent, and never reused after publication.
- A commit title is `[DEMO-###] [TYPE] <imperative summary>` with one primary type.
- A revert keeps the original change intact and receives a new ID with type `REVERT`.
- A correction receives a new ID and names the corrected change in its body.
- Merge commits preserve pull-request topology and are excluded from the sequential controlled-commit check.

Allowed primary types are `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, and `CHORE`.

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

The repository validates sequential IDs and controlled titles on every full check. Pull-request titles use the same syntax. `docs/history/CHANGE-MAP.csv` connects reconstructed commits to their original source objects without making those legacy objects part of the public branch graph.
