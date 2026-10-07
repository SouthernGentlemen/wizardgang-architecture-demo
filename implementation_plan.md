# Implementation plan

## Open tasks

Each task is one bounded controlled delivery. If its listed scope proves too large for one session, split it through a plan-only change before implementation. Preserve the public product and the four required CI statuses. TypeScript-only means authored executable source; ignored build output and third-party packages still contain JavaScript.

### DEMO-482 — [FIX] Restore Cloudflare usage reporting on the demo Worker and release v0.31.2
- Dependency: DEMO-481.
- Why: Since DEMO-459 moved the deploy to baseline deploy-worker.yml, the Worker no longer receives CLOUDFLARE_ACCOUNT_ID (the old deploy passed it with --var), so live /api/reporting/operations reports Cloudflare analytics as not configured although CLOUDFLARE_BILLING_TOKEN is set.
- Scope: Commit the non-secret account ID as a wrangler.jsonc var, add a regression test that the Worker configuration supplies every value the usage report needs, and bump the version to 0.31.2 so the merge cuts a release.
- Non-goals: No secret, token, provider permission, or deploy workflow change.
- Acceptance: After the owner-approved deploy, live /api/reporting/operations reports cloudflare.operations as available.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI; owner-approved production deploy and a public read-back.
- Authorities: wrangler.jsonc; src/lib/cloudflare-usage.ts; package.json; package-lock.json

### DEMO-483 — [DOCS] Record the v0.30.0 to v0.31.2 production deployments
- Dependency: DEMO-482 deployed.
- Why: docs/history/DEPLOYMENTS.md stops at v0.29.1; v0.30.0, v0.31.1 and v0.31.2 were deployed and v0.31.0 was published but never deployed.
- Scope: Add one record per release in the existing format, from the release and deploy workflow runs and the live version read-back.
- Non-goals: No product, workflow, or provider change.
- Acceptance: Each release since v0.29.1 has a record with commit, runs, Worker version, previous release and rollback; v0.31.0 is recorded as published and not deployed.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: docs/history/DEPLOYMENTS.md

### DEMO-484 — [TEST] Port release-history tests to TypeScript
- Dependency: DEMO-483.
- Why: Release identity and history tests remain MJS.
- Scope: Convert DEMO-305, 307, 309, 365, and post-merge DEMO-366 tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Release identity, reproduction, and historical exception behavior remains covered.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-305-release-operations-acceptance.test.mjs; tests/demo-307-release-identity-baseline-module-fix.test.mjs; tests/demo-309-release-identity-baseline-challenge-retry.test.mjs; tests/demo-365-release-reproduction-command-ownership.test.mjs; tests/demo-366-post-merge-history-recovery.test.mjs

### DEMO-485 — [TEST] Port release and deployment tests to TypeScript
- Dependency: DEMO-484.
- Why: Protected release and deploy tests remain MJS.
- Scope: Convert published-release, provider-identity, live-release, and exact-tag tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Protected release and deploy structural checks remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-366-published-immutable-release-deployment.test.mjs; tests/demo-367-release-deployment-provider-identity.test.mjs; tests/demo-391-history.test.mjs; tests/demo-391-live-release.test.mjs; tests/demo-395-exact-tag-release.test.mjs

### DEMO-486 — [TEST] Port remaining security and settings tests to TypeScript
- Dependency: DEMO-485.
- Why: A small residual test set still uses MJS.
- Scope: Convert Worker-secret, public-history-secret, GitHub settings, and footer-contract tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: All retained executable tests are TS and security/settings assertions remain.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-297-worker-secret-verification.test.mjs; tests/demo-368-public-history-secrets.test.mjs; tests/github-settings.cases.mjs; tests/demo-277-footer-contract.test.mjs

### DEMO-487 — [BUILD] Enforce the TypeScript-only authored-source boundary
- Dependency: DEMO-486.
- Why: Without a guard, authored JavaScript can return after migration.
- Scope: Add a tracked-source check for src, scripts, tests, and workflow application logic; permit only explicit non-executable fixtures, ignored generated/third-party output, and the vendored baseline platform/ that DEMO-455 adds and platform/vendor.lock.json pins.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No authored executable .js, .mjs, or .cjs remains; guard fails on a new one; check and required CI pass.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: src/; scripts/; tests/; .github/workflows/; package.json; docs/REPOSITORY-BOUNDARIES.md
