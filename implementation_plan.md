# Implementation plan

## Open tasks

Each task is one bounded controlled delivery. If its listed scope proves too large for one session, split it through a plan-only change before implementation. Preserve the public product and the four required CI statuses. TypeScript-only means authored executable source; ignored build output and third-party packages still contain JavaScript.

### DEMO-489 — [FIX] Restore Durable Objects usage reporting and qualify restricted billable usage
- Dependency: DEMO-488.
- Why: Live /api/reporting/operations is partial because DemoCoordinator analytics lacks its namespace var and Cloudflare's Alpha, Restricted billable usage endpoint is not offered to this account despite the dedicated token having Billing Read.
- Scope: Commit CLOUDFLARE_DO_NAMESPACE=2a8431fd59b342799b74518e1bcc7b6d for DemoCoordinator on Worker demo as a wrangler.jsonc var beside the D1 database ID; flip the DEMO-455 absence assertion to pin that namespace. Report billable usage as not offered by Cloudflare through a distinct qualification rather than a failure, so otherwise successful /api/reporting/operations is not partial. Keep version 0.31.2 and Release: Unreleased.
- Non-goals: No version bump, release, deploy, secret, token, provider permission, or deploy workflow change.
- Acceptance: Namespace configuration is pinned; restricted billable usage is qualified distinctly without masking genuine provider failures or making otherwise complete operations reports partial. Public production read-back follows the final DEMO-494 release.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check with local site-accessibility audit deferred to exact-head CI; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: wrangler.jsonc; tests/demo-455-secret-registry.test.ts; src/lib/cloudflare-usage.ts; src/reporting/; docs/OPERATIONS.md; docs/REPORTING.md

### DEMO-490 — [TEST] Port release and deployment tests to TypeScript
- Dependency: DEMO-489.
- Why: Protected release and deploy tests remain MJS.
- Scope: Convert published-release, provider-identity, live-release, and exact-tag tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Protected release and deploy structural checks remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-366-published-immutable-release-deployment.test.mjs; tests/demo-367-release-deployment-provider-identity.test.mjs; tests/demo-391-history.test.mjs; tests/demo-391-live-release.test.mjs; tests/demo-395-exact-tag-release.test.mjs

### DEMO-491 — [TEST] Port remaining security and settings tests to TypeScript
- Dependency: DEMO-490.
- Why: A small residual test set still uses MJS.
- Scope: Convert Worker-secret, public-history-secret, GitHub settings, and footer-contract tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: All retained executable tests are TS and security/settings assertions remain.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-297-worker-secret-verification.test.mjs; tests/demo-368-public-history-secrets.test.mjs; tests/github-settings.cases.mjs; tests/demo-277-footer-contract.test.mjs

### DEMO-492 — [BUILD] Enforce the TypeScript-only authored-source boundary
- Dependency: DEMO-491.
- Why: Without a guard, authored JavaScript can return after migration.
- Scope: Add a tracked-source check for src, scripts, tests, and workflow application logic; permit only explicit non-executable fixtures, ignored generated/third-party output, and the vendored baseline platform/ that DEMO-455 adds and platform/vendor.lock.json pins.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No authored executable .js, .mjs, or .cjs remains; guard fails on a new one; check and required CI pass.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: src/; scripts/; tests/; .github/workflows/; package.json; docs/REPOSITORY-BOUNDARIES.md

### DEMO-494 — [BUILD] Release v0.32.0 after the TypeScript migration
- Dependency: DEMO-492.
- Why: The owner authorizes one final release after all preceding queued implementation work is complete.
- Scope: Bump only package.json and package-lock.json version metadata to 0.32.0, retiring this task from the queue in its controlled delivery. Reproduce and publish the immutable release through the protected workflow; deploy only on Jacob's approval once the queue is empty. After deployment verification, record DEP-DEMO-017 in docs/history/DEPLOYMENTS.md as a separate controlled OPS delivery and read back the production version and /api/reporting/operations usage report.
- Non-goals: No intermediate release/deploy, unrelated source changes, credential changes, or weakened release/deployment protection.
- Acceptance: All preceding queue tasks are delivered; v0.32.0 identifies the exact accepted release commit; Jacob-approved production deployment is verified and recorded as DEP-DEMO-017 with actual version and usage read-back evidence.
- Validation: Pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR and merged-main CI; protected exact-tag release/deploy reproduction; production version and usage read-back.
- Authorities: package.json; package-lock.json; implementation_plan.md; docs/RELEASE-MANAGEMENT.md; .github/workflows/release.yml; docs/history/DEPLOYMENTS.md
