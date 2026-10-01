# Implementation plan

## Open tasks

### DEMO-395 — [OPS] Cut exact-tag releases from validated main delivery

- Dependency: DEMO-391 through DEMO-393 have merged, and the live Git delivery path is reconciled with controlled release identity.
- Why: Chat-driven controlled PR delivery should be able to publish an intentionally prepared version without a local tag push. A tag created with the workflow token does not trigger another workflow, while this repository's Release and protected Deploy paths require the exact tag event and identity.
- Scope: On successful CI for a push to exact current `main`, create or verify an annotated semantic tag only when `package.json` names a version not already released. Explicitly dispatch Release at that exact tag and accepted commit, adapt Release and Deploy guards to distinguish an authorized exact-tag dispatch from a manual recovery run, and keep the release-bound assurance snapshot, GitHub Release, protected production approval, Worker secret preflight, migration and health verification. Integrate with the DEMO-391 live Git delivery path without duplicate tags or duplicate publication. Keep `0.28.0` and its published tag unchanged; a later controlled version change is the first eligible new release.
- Non-goals: Do not create a tag or Release, deploy production, move a published tag, change version or secrets, bypass production approval, or weaken main and tag rules as part of this task.
- Acceptance: Pure tests prove a stale or failed CI run cannot cut a tag; an existing version tag is never moved; a new version is annotated at the accepted main commit and explicitly dispatches the exact-tag Release; Release/Deploy reject mismatched tag or commit, preserve the human production gate, and remain retry-safe. The implementation merge at unchanged `0.28.0` performs no publication or deployment.
- Validation: Pinned `npm ci`; workflow and release/deploy guard tests; workflow YAML validation; credential-free `npm run check`; dependency advisory gate; committed-range whitespace; exact-head required CI; read-only live settings verification; postmerge CI and no-op cutter evidence.
- Authorities: `AGENTS.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`, `.github/workflows/ci.yml`, `.github/workflows/git-demo.yml`, `.github/workflows/release.yml`, `.github/workflows/deploy.yml`, `scripts/validate-release-identity.mjs`, `config/github-repository-settings.json`, and GitHub provider state.
