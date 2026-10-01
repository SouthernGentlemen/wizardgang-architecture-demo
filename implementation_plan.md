# Implementation plan

## Open tasks

### DEMO-399 — [FIX] Share local D1 state in protected deploy validation

- Dependency: none; first open task after the owner-approved priority change.
- Why: The published v0.29.1 Release cannot deploy because the protected deploy job's direct `npm run check` discards its temporary migrations before the browser audit and returns local HTTP 503.
- Scope: Give protected deploy validation a fresh shared local D1 persistence directory through `npm run check`, with cleanup and regression coverage. Preserve exact published-tag identity, the production reviewer gate, secret preflight, migrations, Worker traffic, and live verification. Recover deployment through the documented current-main manual workflow.
- Non-goals: Move or delete a published tag, republish v0.29.1, bypass production protection, or record deployment before it succeeds.
- Acceptance: Protected validation passes against migrated local D1 state and the existing published v0.29.1 tag can complete the controlled production workflow.
- Validation: Pinned `npm ci`, focused deploy workflow tests, credential-free `npm run check`, dependency advisories, committed-range whitespace, exact-head CI, and post-merge CI.
- Authorities: `AGENTS.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`, `.github/workflows/deploy.yml`.

### DEMO-402 — [OPS] Record the verified v0.29.1 production deployment

- Dependency: DEMO-399 merged and v0.29.1 deployed and verified.
- Why: The deployment record requires actual production evidence and cannot be written before release and deployment complete.
- Scope: Add the verified deployment to `docs/history/DEPLOYMENTS.md` with exact tag, commit, workflow run, environment, validation, previous release, and rollback target.
- Non-goals: Invent validation evidence, modify a published tag, or change production configuration.
- Acceptance: A separate controlled record captures only checks observed after the protected deploy succeeds.
- Validation: Credential-free `npm run check`, committed-range whitespace, exact-head CI, and post-merge CI.
- Authorities: `AGENTS.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`.
