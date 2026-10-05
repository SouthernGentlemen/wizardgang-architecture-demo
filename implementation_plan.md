# Implementation plan

## Open tasks

Each task is one bounded controlled delivery. If its listed scope proves too large for one session, split it through a plan-only change before implementation. Preserve the public product and the four required CI statuses. TypeScript-only means authored executable source; ignored build output and third-party packages still contain JavaScript.

### DEMO-455 — [SEC] Normalize the demo's Worker secrets to the baseline registry
- Dependency: DEMO-434; Wizard-Gang/baseline BASE-030 merged. The owner moved the platform move ahead of the remaining TypeScript port on 2026-10-05. Each merge deploys automatically, so the owner sets every new name from baseline docs/SECRETS-RUNBOOK.md before this merges, and deletes the old names after the release verifies.
- Why: Baseline config/secrets.json is the one registry for every WizardGang secret. The demo stores public values as secrets, gives one name to three different credentials, and keeps three app keys that the platform derives from WG_SESSION_KEY.
- Scope: Vendor baseline platform/ verbatim from merged commit 67b4b86847e0d635a3f6fe4c21618a25d5bc71a0 (BASE-030) or later, with platform/vendor.lock.json. Rename CLOUDFLARE_API_TOKEN to CLOUDFLARE_BILLING_TOKEN, WEBHOOK_DEMO_SECRET to DEMO_WEBHOOK_SECRET, and the three OAuth client secrets to GITHUB_, GOOGLE_ and MICROSOFT_OAUTH_CLIENT_SECRET. Read GITHUB_, GOOGLE_ and MICROSOFT_OAUTH_CLIENT_ID, MICROSOFT_TENANT_ID, SAML_IDP_CERT, SAML_IDP_ISSUER and SAML_SSO_URL as wrangler vars. Replace DEMO_SESSION_SECRET, IDENTITY_SESSION_SECRET and IDENTITY_AUDIT_HMAC_SECRET with deriveKey labels demo-session, identity-session and identity-audit over a Secrets Store WG_SESSION_KEY binding. Make config/worker-secrets.json and .dev.vars.example match the registry. Register or remove the CLOUDFLARE_DO_NAMESPACE production variable, and remove the deleted preview R2 bucket from wrangler.jsonc. SAML stays supported.
- Non-goals: No GitHub App (DEMO-456), shell adoption (DEMO-459), data move or Worker rename.
- Acceptance: No old secret name is read; the worker-secret check matches the registry; derived keys are stable per label; identity sign-in works with the renamed values and SAML is enabled once its vars are set; existing demo sessions are signed out once.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: Wizard-Gang/baseline config/secrets.json, config/cloudflare.json, platform/wg-edge/ and docs/SECRETS-RUNBOOK.md; config/worker-secrets.json; src/types.ts

### DEMO-456 — [SEC] Replace the demo's GitHub tokens with the wg-github-app App
- Dependency: DEMO-455. The owner creates wg-github-app with minimum permissions from baseline docs/SECRETS-RUNBOOK.md and sets GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY (PKCS#8) on the Worker and in a git-demo environment before this merges.
- Why: Four personal GitHub tokens (GITHUB_DEMO_TOKEN, GITHUB_READ_TOKEN, the never-set GITHUB_REPORTING_WRITE_TOKEN, and the Actions secret GIT_DEMO_PR_TOKEN) serve one integration.
- Scope: Worker GitHub reads and writes use githubAppToken from the vendored wg-edge with per-call least permissions, and reporting issue updates are enabled through the App. git-demo.yml runs in a git-demo environment and mints an installation token from the App instead of reading GIT_DEMO_PR_TOKEN. Remove the four token names from code, config, examples and docs.
- Non-goals: No other workflow or permission change.
- Acceptance: The Git demo opens its pull request and reporting reads and writes succeed through the App; no personal token name remains; the old secrets are deleted after release.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: Wizard-Gang/baseline config/secrets.json, platform/wg-edge/README.md and docs/SECRETS-RUNBOOK.md; .github/workflows/git-demo.yml; src/lib/git-demo.ts; src/reporting/github.ts

### DEMO-457 — [OPS] Move the repository to Wizard-Gang
- Dependency: DEMO-456. A baseline task updates the demo's repository in config/cloudflare.json and config/secrets.json in the same window.
- Why: Owner default: all four deploying repositories share the Wizard-Gang org's rulesets before the demo's Phase 4 deploy.
- Scope: The owner transfers the repository to Wizard-Gang. Update the committed repository identity, settings-as-code, links, badges, workflow references and documentation; re-verify rulesets, environments, secrets and variables live after the transfer.
- Non-goals: No product change.
- Acceptance: The repository is Wizard-Gang/wizardgang-architecture-demo with identical protection, environments, secrets and variables; npm run check and the settings verifier pass against the new identity.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; live settings verification; exact-head PR CI and merged-main CI.
- Authorities: config/github-repository-settings.json; AGENTS.md; Wizard-Gang/baseline config/cloudflare.json and config/secrets.json

### DEMO-458 — [DB] Move demo data to the shared records and events tables and the shared R2 bucket
- Dependency: DEMO-457.
- Why: Baseline owns the only schema for D1 wizardgang. The demo's own demo-blob migrations are the last reason for its separate deploy token.
- Scope: Map the useful demo-blob data onto records and events with TTLs through the vendored wg-edge storage helpers (WG_DB, WG_R2, WG_APP demo), dropping the five-minute health history beyond its TTL. Read and write R2 objects under demo/, with uploads under demo/uploads/ (1-day lifecycle). Delete the demo's migrations directory and its d1 migrations apply step. Provide an owner-run copy step for any rows worth keeping.
- Non-goals: No Worker rename or shell adoption.
- Acceptance: The demo reads and writes only records, events and demo/ objects; no demo DDL remains; labs and reporting behave as before with TTLs.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: Wizard-Gang/baseline platform/migrations/0001_universal.sql, platform/wg-edge/README.md and config/cloudflare.json; migrations/; wrangler.jsonc

### DEMO-459 — [OPS] Become the demo Worker on the shared shell and baseline deploy workflow
- Dependency: DEMO-458.
- Why: Phase 4 cut-over: the Worker becomes demo on baseline's shell, conforming config and single deploy path.
- Scope: Make wrangler.jsonc conforming for demo: name and WG_APP demo, custom domain demo.wizardgang.ai, the shared compatibility settings, DemoCoordinator and the */5 cron, WG_DB by the UUID database_id from runbook step 3.2, WG_R2, and Secrets Store bindings. The entry uses createEdge, with WG_OPS_TOKEN's operator gate replacing DEMO_ADMIN_USER and DEMO_ADMIN_PASSWORD. release.yml calls Wizard-Gang/baseline deploy-worker.yml pinned to the same baseline commit as platform/ (BASE-030 or later) with secrets: inherit, which GitHub allows only within one organization, so it relies on DEMO-457's move to Wizard-Gang. deploy.yml with its scripts is deleted. demo.wizardgang.ai is a Worker custom domain on wizardgang-architecture-demo, which wrangler in CI moves without a prompt; a hand-made DNS record on the host would block it, so confirm there is none or the owner deletes it immediately before the deploy. The deploy token must hold Secrets Store Edit (baseline runbook step 3.6). Release the cut-over; DemoCoordinator holds only a counter and starts fresh.
- Non-goals: No product feature change.
- Acceptance: node platform/conformance/cli.mjs pin and wrangler --worker demo pass; https://demo.wizardgang.ai/version.json reports demo at the release; baseline npm run verify:cloudflare shows no demo drift. Owner follow-up from baseline runbooks: retire wizardgang-architecture-demo (R3), demo-blob and wizardgang-demo-r2 (R2), DEMO_ADMIN_* and the old runtime names; revoke wg-cloudflare-demo so the demo takes wg-cloudflare-deploy; delete the production secret CLOUDFLARE_ACCOUNT_ID.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI, merged-main CI and the deploy run's traffic and /version.json evidence.
- Authorities: Wizard-Gang/baseline config/cloudflare.json, platform/, .github/workflows/deploy-worker.yml and docs/CLOUDFLARE-RUNBOOK.md; wrangler.jsonc; .github/workflows/release.yml

### DEMO-461 — [BUILD] Port security and locale validators
- Dependency: DEMO-459.
- Why: Secret scanning and locale/governance checks are distinct from release tools.
- Scope: Convert public-history secret helper and security, worker-secret, locale, and governance validators.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: History scanning, redaction, Worker inventory, and locale inventory retain behavior.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lib/public-history-secrets.mjs; scripts/validate-security.mjs; scripts/validate-worker-secrets.mjs; scripts/validate-locales.mjs; scripts/validate-governance-metadata.mjs

### DEMO-462 — [BUILD] Port the main browser audit to TypeScript
- Dependency: DEMO-461.
- Why: The main browser audit is a large single executable module.
- Scope: Convert only site-browser-audit to TS using the chosen runner; retain every audit assertion and timing signal.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Browser matrix and CI browser run pass with unchanged coverage.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/site-browser-audit.mjs; scripts/site-browser-audit.ts

### DEMO-463 — [BUILD] Port browser audit support to TypeScript
- Dependency: DEMO-462.
- Why: Browser helper and runner modules remain authored MJS.
- Scope: Convert browser-audit helper, audit runner, and Chromium verifier to TS.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: One browser lifecycle remains executable and diagnostic errors stay actionable.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lib/browser-audit.mjs; scripts/run-site-accessibility-audits.mjs; scripts/verify-chromium.mjs

### DEMO-464 — [BUILD] Port local development tools to TypeScript
- Dependency: DEMO-463.
- Why: Local dev command and process helpers are still MJS.
- Scope: Convert dev entry point, process identity, cleanup, and readiness helpers.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Headless dev reports the same ready URL and cleans up only checkout-owned processes.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/dev.mjs; scripts/lib/dev-process-identity.mjs; scripts/lib/dev-process-cleanup.mjs; scripts/lib/dev-readiness.mjs

### DEMO-465 — [BUILD] Port contract and migration validators to TypeScript
- Dependency: DEMO-464.
- Why: Remaining contract and migration tools are a bounded operational family.
- Scope: Convert contracts, migrations, React presentation, repository baseline, and scaffold validators.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Local D1 migrations and dry-run build checks remain credential-free and equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/validate-contracts.mjs; scripts/validate-migrations.mjs; scripts/validate-react-presentation.mjs; scripts/validate-repository-baseline.mjs; scripts/validate-scaffold.mjs

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
