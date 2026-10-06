# Implementation plan

## Open tasks

Each task is one bounded controlled delivery. If its listed scope proves too large for one session, split it through a plan-only change before implementation. Preserve the public product and the four required CI statuses. TypeScript-only means authored executable source; ignored build output and third-party packages still contain JavaScript.

### DEMO-466 — [BUILD] Port lint and documentation validators to TypeScript
- Dependency: DEMO-465.
- Why: Lint and simple source-policy validators are the remaining general tooling group.
- Scope: Convert lint, lint-rules, documentation cleanup, stylesheet-class, and toolchain validators.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Lint and documentation checks retain current failure conditions; all scripts under scripts are TS.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lint.mjs; scripts/lint-rules.mjs; scripts/validate-documentation-cleanup.mjs; scripts/validate-stylesheet-classes.mjs; scripts/validate-toolchain.mjs

### DEMO-467 — [BUILD] Move live Git workflow logic to TypeScript
- Dependency: DEMO-466.
- Why: The live Git workflow embeds JavaScript for release identity and PR checks.
- Scope: Move only git-demo workflow application logic into typed scripts; keep its trigger, token, and protected merge boundary.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No inline authored JavaScript remains in git-demo.yml; live release identity checks remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: .github/workflows/git-demo.yml; scripts/lib/live-release-identity.mjs; docs/RELEASE-MANAGEMENT.md

### DEMO-468 — [BUILD] Move Release workflow logic to TypeScript
- Dependency: DEMO-467.
- Why: Release workflow embeds a separate exact-tag and main-CI JavaScript preflight.
- Scope: Move only release.yml application logic into typed scripts without changing tag or publication requirements.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No inline authored JavaScript remains in release.yml; exact-tag reproduction and release structure remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: .github/workflows/release.yml; scripts/lib/exact-tag-release.mjs; docs/RELEASE-MANAGEMENT.md

### DEMO-469 — [TEST] Port assurance contract tests to TypeScript
- Dependency: DEMO-468.
- Why: Two assurance test files remain MJS.
- Scope: Convert the filter-vocabulary and schema-contract tests to TS without changing assertions.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Both tests run under the standard suite; no MJS assurance test remains.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/assurance-filter-vocabulary.test.mjs; tests/assurance-schema-contracts.test.mjs

### DEMO-470 — [TEST] Port architecture documentation tests to TypeScript
- Dependency: DEMO-469.
- Why: A small set of retained documentation tests still use MJS.
- Scope: Convert retained DEMO-312, 314, and 315 tests after earlier pruning; remove those already retired.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Current architecture documentation checks run from TS.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-312-retire-checked-in-release-history.test.mjs; tests/demo-314-architecture-documentation-consolidation.test.mjs; tests/demo-315-accessibility-documentation-consolidation.test.mjs

### DEMO-471 — [TEST] Port governance documentation tests to TypeScript
- Dependency: DEMO-470.
- Why: Retained governance and cleanup tests still use MJS.
- Scope: Convert retained DEMO-316 through 319 tests after their dedicated pruning tasks.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Current governance reference checks run from TS.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-316-management-system-governance-consolidation.test.mjs; tests/demo-317-security-operations-governance-consolidation.test.mjs; tests/demo-318-retire-historical-assessment-markdown.test.mjs; tests/demo-319-documentation-cleanup-acceptance.test.mjs

### DEMO-472 — [TEST] Port queue and CI tests to TypeScript
- Dependency: DEMO-471.
- Why: CI diagnostics, queue, and check-ownership tests remain MJS.
- Scope: Convert the controlled-PR, plan policy, diagnostics, queue, acceptance ownership, and required-check tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Identity, exact-head, and check ownership assertions remain intact.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/controlled-pr-identity.test.mjs; tests/implementation-plan-policy.test.mjs; tests/demo-269-ci-diagnostics.test.mjs; tests/demo-322-temporary-implementation-plan.test.mjs; tests/demo-354-acceptance-ownership.test.mjs; tests/demo-379-required-checks.test.mjs

### DEMO-473 — [TEST] Port local development and lint tests to TypeScript
- Dependency: DEMO-472.
- Why: Development-process tests remain MJS.
- Scope: Convert retained dev identity, cleanup, readiness, toolchain, history recovery, baseline, and lint tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Local process and scaffold behavior remains covered with TS test files.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-355-dev-process-identity.test.mjs; tests/demo-356-dev-process-cleanup.test.mjs; tests/demo-358-dev-readiness.test.mjs; tests/demo-359-toolchain.test.mjs; tests/demo-360-history-recovery.test.mjs; tests/demo-361-repository-baseline.test.mjs; tests/lint.test.mjs

### DEMO-474 — [TEST] Port release-history tests to TypeScript
- Dependency: DEMO-473.
- Why: Release identity and history tests remain MJS.
- Scope: Convert DEMO-305, 307, 309, 365, and post-merge DEMO-366 tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Release identity, reproduction, and historical exception behavior remains covered.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-305-release-operations-acceptance.test.mjs; tests/demo-307-release-identity-baseline-module-fix.test.mjs; tests/demo-309-release-identity-baseline-challenge-retry.test.mjs; tests/demo-365-release-reproduction-command-ownership.test.mjs; tests/demo-366-post-merge-history-recovery.test.mjs

### DEMO-475 — [TEST] Port release and deployment tests to TypeScript
- Dependency: DEMO-474.
- Why: Protected release and deploy tests remain MJS.
- Scope: Convert published-release, provider-identity, live-release, and exact-tag tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Protected release and deploy structural checks remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-366-published-immutable-release-deployment.test.mjs; tests/demo-367-release-deployment-provider-identity.test.mjs; tests/demo-391-history.test.mjs; tests/demo-391-live-release.test.mjs; tests/demo-395-exact-tag-release.test.mjs

### DEMO-476 — [TEST] Port remaining security and settings tests to TypeScript
- Dependency: DEMO-475.
- Why: A small residual test set still uses MJS.
- Scope: Convert Worker-secret, public-history-secret, GitHub settings, and footer-contract tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: All retained executable tests are TS and security/settings assertions remain.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-297-worker-secret-verification.test.mjs; tests/demo-368-public-history-secrets.test.mjs; tests/github-settings.cases.mjs; tests/demo-277-footer-contract.test.mjs

### DEMO-477 — [BUILD] Enforce the TypeScript-only authored-source boundary
- Dependency: DEMO-476.
- Why: Without a guard, authored JavaScript can return after migration.
- Scope: Add a tracked-source check for src, scripts, tests, and workflow application logic; permit only explicit non-executable fixtures, ignored generated/third-party output, and the vendored baseline platform/ that DEMO-455 adds and platform/vendor.lock.json pins.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No authored executable .js, .mjs, or .cjs remains; guard fails on a new one; check and required CI pass.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: src/; scripts/; tests/; .github/workflows/; package.json; docs/REPOSITORY-BOUNDARIES.md
