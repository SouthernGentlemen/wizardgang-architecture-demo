# Change management

Every controlled change to WizardGang Architecture Demo receives exactly one permanent ID in the `DEMO-###` namespace.

## Identity rules

- One change, one ID. IDs are sequential, permanent, and never reused after publication.
- A commit title is `[DEMO-###] [TYPE] <imperative summary>` with one primary type.
- A revert keeps the original change intact and receives a new ID with type `REVERT`.
- A correction receives a new ID and names the corrected change in its body.
- Merge commits preserve pull-request topology and are excluded from the sequential controlled-commit check.

Allowed primary types are `INIT`, `FEAT`, `FIX`, `SEC`, `API`, `A11Y`, `I18N`, `AI`, `DB`, `OPS`, `TEST`, `DOCS`, `REFACTOR`, `PERF`, `BUILD`, `REVERT`, and `CHORE`.

### Published identity correction

Commit `45f2ff42d2b92ea1f820e037306f07104480f8b5` was published through pull request #124 with `DEMO-175` in its title, but its controlled record identifies it as the completion of DEMO-174 in the same pull request. Rewriting published `main` history would invalidate shared commit identities, so `scripts/validate-history.mjs` excludes that exact SHA from the sequential count while continuing to validate its structured body. DEMO-175 is therefore assigned to the subsequent removal of duplicate relationship graphs.

This is a SHA-exact correction of one published operator error, not a general allowance to reuse IDs. A different commit cannot claim the exception, and future corrections continue to receive new sequential IDs.

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
