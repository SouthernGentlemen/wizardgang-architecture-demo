# Implementation plan

## Open tasks

Each task is one bounded controlled delivery. If its listed scope proves too large for one session, split it through a plan-only change before implementation. Preserve the public product and the four required CI statuses. TypeScript-only means authored executable source; ignored build output and third-party packages still contain JavaScript.

### DEMO-489 — [FIX] Restore Durable Objects usage reporting and release v0.31.3
- Dependency: DEMO-488.
- Why: Live /api/reporting/operations is partial: Durable Objects analytics is unavailable because the Worker has no CLOUDFLARE_DO_NAMESPACE. The demo Worker's DemoCoordinator namespace 2a8431fd59b342799b74518e1bcc7b6d survived the DEMO-459 in-place rename, and the Worker's own GraphQL query with that ID returns data.
- Scope: Commit CLOUDFLARE_DO_NAMESPACE as a wrangler.jsonc var, beside the committed D1 database ID; replace the DEMO-455 assertion that the var is absent (its new-namespace premise no longer holds) with one that pins the live namespace; bump the version to 0.31.3 so the merge cuts a release.
- Non-goals: No secret, token, provider permission, or deploy workflow change. Billable usage stays as it is until the owner confirms the billing token's permissions.
- Acceptance: After the owner-approved deploy, live /api/reporting/operations reports Durable Objects requests and CPU time.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI; owner-approved production deploy and a public read-back.
- Authorities: wrangler.jsonc; tests/demo-455-secret-registry.test.ts; src/lib/cloudflare-usage.ts; package.json; package-lock.json

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
