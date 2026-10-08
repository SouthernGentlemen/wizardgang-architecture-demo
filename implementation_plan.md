# Implementation plan

## Open tasks

Each task is one bounded controlled delivery. If its listed scope proves too large for one session, split it through a plan-only change before implementation. Preserve the public product and the four required CI statuses. TypeScript-only means authored executable source; ignored build output and third-party packages still contain JavaScript.

### DEMO-494 — [BUILD] Release v0.32.0 after the TypeScript migration
- Dependency: DEMO-492.
- Why: The owner authorizes one final release after all preceding queued implementation work is complete.
- Scope: Bump only package.json and package-lock.json version metadata to 0.32.0, retiring this task from the queue in its controlled delivery. Reproduce and publish the immutable release through the protected workflow; deploy only on Jacob's approval once the queue is empty. After deployment verification, record DEP-DEMO-017 in docs/history/DEPLOYMENTS.md as a separate controlled OPS delivery and read back the production version and /api/reporting/operations usage report.
- Non-goals: No intermediate release/deploy, unrelated source changes, credential changes, or weakened release/deployment protection.
- Acceptance: All preceding queue tasks are delivered; v0.32.0 identifies the exact accepted release commit; Jacob-approved production deployment is verified and recorded as DEP-DEMO-017 with actual version and usage read-back evidence.
- Validation: Pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR and merged-main CI; protected exact-tag release/deploy reproduction; production version and usage read-back.
- Authorities: package.json; package-lock.json; implementation_plan.md; docs/RELEASE-MANAGEMENT.md; .github/workflows/release.yml; docs/history/DEPLOYMENTS.md
