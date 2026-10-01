# Implementation plan

## Open tasks

### DEMO-402 — [OPS] Record the verified v0.29.1 production deployment

- Dependency: DEMO-399 merged and v0.29.1 deployed and verified.
- Why: The deployment record requires actual production evidence and cannot be written before release and deployment complete.
- Scope: Add the verified deployment to `docs/history/DEPLOYMENTS.md` with exact tag, commit, workflow run, environment, validation, previous release, and rollback target.
- Non-goals: Invent validation evidence, modify a published tag, or change production configuration.
- Acceptance: A separate controlled record captures only checks observed after the protected deploy succeeds.
- Validation: Credential-free `npm run check`, committed-range whitespace, exact-head CI, and post-merge CI.
- Authorities: `AGENTS.md`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`.
