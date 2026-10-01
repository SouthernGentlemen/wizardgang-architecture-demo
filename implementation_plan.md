# Implementation plan

## Open tasks

### DEMO-398 — [FIX] Reproduce tagged releases with shared local D1 persistence

- Dependency: none; first open task.
- Why: The v0.29.0 Release run failed twice because direct `npm run check` removed migration state before the browser audit, which then received HTTP 503 from the local Worker.
- Scope: Give the Release reproduction command a fresh shared local D1 persistence directory for migration validation and browser audits, with cleanup and diagnostic coverage. Preserve exact-tag identity and protected deployment gates.
- Non-goals: Move or delete v0.29.0, publish a Release manually, bypass CI, or alter production state outside the release workflow.
- Acceptance: The tagged reproduction path completes its browser audit against migrated local D1 state; a new forward release can proceed through the existing protected workflow.
- Validation: Pinned `npm ci`, focused reproduction tests, credential-free `npm run check`, dependency advisories, committed-range whitespace, exact-head CI, and post-merge CI.
- Authorities: `AGENTS.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`, `.github/workflows/release.yml`.

### DEMO-399 — [OPS] Record the next verified production deployment

- Dependency: DEMO-398 merged and the next immutable release deployed and verified.
- Why: The deployment record requires actual production evidence and cannot be written before release and deployment complete.
- Scope: Add the verified deployment to `docs/history/DEPLOYMENTS.md` with exact tag, commit, workflow run, environment, validation, previous release, and rollback target.
- Non-goals: Invent validation evidence, modify a published tag, or change production configuration.
- Acceptance: A separate controlled record captures only checks observed after the protected deploy succeeds.
- Validation: Credential-free `npm run check`, committed-range whitespace, exact-head CI, and post-merge CI.
- Authorities: `AGENTS.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`.
