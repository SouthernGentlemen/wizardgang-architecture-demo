# Implementation plan

## Open tasks

Each task is one bounded controlled delivery. If its listed scope proves too large for one session, split it through a plan-only change before implementation. Preserve the public product and the four required CI statuses. TypeScript-only means authored executable source; ignored build output and third-party packages still contain JavaScript.

### DEMO-411 — [TEST] Replace Spanish and French text snapshots
- Dependency: DEMO-410.
- Why: Two text inventories duplicate broad localization checks.
- Scope: Replace es and fr snapshots with focused text and fallback assertions.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Both locales remain in the full public-surface inventory; their snapshots are removed.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/presentation-baseline.test.ts; tests/fixtures/presentation-baseline/es-text.json; tests/fixtures/presentation-baseline/fr-text.json

### DEMO-412 — [TEST] Replace German and Japanese text snapshots
- Dependency: DEMO-411.
- Why: The remaining text snapshots are large compared with their unique checks.
- Scope: Replace de and ja snapshots with focused text and fallback assertions.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: All six locales retain deterministic checks; remaining text snapshots are removed.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/presentation-baseline.test.ts; tests/fixtures/presentation-baseline/de-text.json; tests/fixtures/presentation-baseline/ja-text.json

### DEMO-414 — [CHORE] Remove the uncalled one-time codemod
- Dependency: DEMO-412.
- Why: The historical DEMO-174 rewrite script has no tracked caller.
- Scope: Delete only the uncalled codemod and any stale references to it.
- Non-goals: Do not disturb current tooling or published history.
- Acceptance: No command, test, workflow, or document still invokes the deleted file.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/demo-174-codemod.mjs

### DEMO-415 — [TEST] Retire superseded architecture documentation tests
- Dependency: DEMO-414.
- Why: DEMO-314 and DEMO-315 tests encode completed documentation consolidation.
- Scope: Compare their assertions with current documentation validators and keep only unique current rules.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: No historical filename assertion remains solely to recount the migration.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-314-architecture-documentation-consolidation.test.mjs; tests/demo-315-accessibility-documentation-consolidation.test.mjs; scripts/validate-documentation-cleanup.mjs

### DEMO-416 — [TEST] Retire superseded governance documentation tests
- Dependency: DEMO-415.
- Why: DEMO-316 through DEMO-318 test completed file consolidation.
- Scope: Move any unique current reference rule to the owning validator and remove duplicate historical assertions.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Current governance reference and retired-path policy still fail on regression.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-316-management-system-governance-consolidation.test.mjs; tests/demo-317-security-operations-governance-consolidation.test.mjs; tests/demo-318-retire-historical-assessment-markdown.test.mjs

### DEMO-417 — [TEST] Remove duplicate documentation validator tests
- Dependency: DEMO-416.
- Why: DEMO-319 reruns a validator already owned by check.
- Scope: Keep unique policy assertions and remove redundant subprocess execution and script-text checks.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Documentation cleanup remains in check and unique failures remain detectable.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-319-documentation-cleanup-acceptance.test.mjs; scripts/validate-documentation-cleanup.mjs

### DEMO-418 — [DOCS] Trim duplicated setup and CI prose
- Dependency: DEMO-417.
- Why: README and CI diagnostics repeat command details available from package scripts.
- Scope: Shorten repeated explanations in README and CI diagnostics while retaining run and failure-recovery instructions.
- Non-goals: Do not remove current authority, linked controls, or required operating records.
- Acceptance: All documented commands, prerequisites, and diagnostic links remain usable.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: README.md; docs/CI-DIAGNOSTICS.md

### DEMO-419 — [DOCS] Trim duplicated assurance and reporting prose
- Dependency: DEMO-418.
- Why: Assurance and reporting docs repeat structured contract and registry details.
- Scope: Remove prose that merely restates canonical schemas or records; preserve boundaries and reader guidance.
- Non-goals: Do not remove current authority, linked controls, or required operating records.
- Acceptance: Compliance documentation references and public contract explanations still resolve.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: docs/ASSURANCE.md; docs/REPORTING.md; contracts/assurance/

### DEMO-420 — [DOCS] Audit assurance evidence locators for unused records
- Dependency: DEMO-419.
- Why: Evidence data may contain locators no current public record or contract uses.
- Scope: Trace evidence IDs through registry relationships and public projections; remove only orphaned or superseded records with coordinated references.
- Non-goals: Do not remove current authority, linked controls, or required operating records.
- Acceptance: All remaining evidence locators are reachable and disclosure-safe; no public record loses required evidence.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: assurance/evidence/evidence.json; assurance/registry.json; scripts/validate-assurance-integrity.mjs

### DEMO-421 — [REFACTOR] Prune unused browser assets and direct dependencies
- Dependency: DEMO-420.
- Why: Vendored assets and browser entries are emitted even when their consumers may have changed.
- Scope: Trace Vite asset-map consumers and remove only unused emitted assets or direct dependencies.
- Non-goals: Do not change public functionality, contracts, or provider boundaries.
- Acceptance: Generated asset manifest, browser routes, and build remain equivalent after each removal.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: vite.config.ts; src/ui/asset-map.ts; package.json

### DEMO-422 — [REFACTOR] Prune unused route and reporting symbols
- Dependency: DEMO-421.
- Why: File-level reachability cannot establish whether exports and branches remain used.
- Scope: Trace route and reporting consumers and delete only proven unused symbols or branches in those modules.
- Non-goals: Do not change public functionality, contracts, or provider boundaries.
- Acceptance: Routing, reporting, and protocol contracts remain equivalent with a recorded reachability rationale.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: src/routing/; src/reporting/; src/router.ts

### DEMO-423 — [REFACTOR] Port observation and risk helpers to TypeScript
- Dependency: DEMO-422.
- Why: Two authored JavaScript assurance helpers rely on companion declarations.
- Scope: Convert observation-window and risk-rating implementations to typed TS and remove their redundant declarations.
- Non-goals: Do not change public functionality, contracts, or provider boundaries.
- Acceptance: Runtime exports and assurance tests are equivalent; four JS/declaration files are replaced.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: src/assurance/observation-window.js; src/assurance/observation-window.d.ts; src/assurance/risk-rating.js; src/assurance/risk-rating.d.ts

### DEMO-424 — [REFACTOR] Port discovery and route contracts to TypeScript
- Dependency: DEMO-423.
- Why: Record discovery and route contract helpers remain authored JavaScript.
- Scope: Convert these two modules to TS with explicit types and remove declaration companions.
- Non-goals: Do not change public functionality, contracts, or provider boundaries.
- Acceptance: Record IDs, route contracts, and imports retain their behavior.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: src/assurance/record-discovery.js; src/assurance/record-discovery.d.ts; src/assurance/route-contract.js; src/assurance/route-contract.d.ts

### DEMO-425 — [REFACTOR] Port relationship and publication policies to TypeScript
- Dependency: DEMO-424.
- Why: The remaining assurance policies split JavaScript implementation from types.
- Scope: Convert these two modules to typed TS and remove declaration companions.
- Non-goals: Do not change public functionality, contracts, or provider boundaries.
- Acceptance: Assurance publication and relationship validation pass with no authored JS under src.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: src/assurance/relationship-contract.js; src/assurance/relationship-contract.d.ts; src/assurance/publication-policy.js; src/assurance/publication-policy.d.ts

### DEMO-426 — [BUILD] Pin the TypeScript execution path for Node tools
- Dependency: DEMO-425.
- Why: Node scripts need a reliable TS runner before conversion.
- Scope: Choose one Node 26 compatible direct TS execution approach and prove ESM imports, CLI args, exit codes, and stack traces with a small representative tool.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: The runner works in local check and CI without committed compiled JS.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: package.json; .node-version; scripts/validate-toolchain.mjs; docs/REPOSITORY-BOUNDARIES.md

### DEMO-427 — [BUILD] Port generated-artifact tools to TypeScript
- Dependency: DEMO-426.
- Why: Five generators and parity scripts form one bounded tool family.
- Scope: Convert route, asset, OpenAPI, assurance binding/snapshot, and artifact parity entry points and update their npm references.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Generated bytes and idempotence match the pre-port baseline.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/generate-route-manifest.mjs; scripts/generate-assurance-runtime-binding.mjs; scripts/generate-assurance-snapshot.mjs; scripts/sync-openapi-schemas.mjs; scripts/validate-generated-artifacts.mjs

### DEMO-428 — [BUILD] Port CI diagnostics and acceptance plan tools
- Dependency: DEMO-427.
- Why: The CI runner and diagnostic helpers are authored MJS.
- Scope: Convert ci-validation, acceptance-plan, and ci-diagnostics with unchanged streamed logs and exit codes.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: CI still emits bounded failure artifacts and uses shared local D1 state.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/ci-validation.mjs; scripts/lib/acceptance-plan.mjs; scripts/lib/ci-diagnostics.mjs

### DEMO-429 — [BUILD] Port plan and change-identity tools
- Dependency: DEMO-428.
- Why: Queue and controlled-history validation must survive script conversion.
- Scope: Convert portfolio, implementation-plan, PR identity, history, and whitespace validators in one bounded identity group.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Exact-head change-id and history policy remain unchanged.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/check-portfolio-contract.mjs; scripts/validate-implementation-plan.mjs; scripts/validate-pull-request-identity.mjs; scripts/validate-history.mjs; scripts/validate-patch-whitespace.mjs; scripts/lib/controlled-pr-identity.mjs

### DEMO-430 — [BUILD] Port GitHub settings tools
- Dependency: DEMO-429.
- Why: Settings-as-code tooling needs the same read/write boundary after conversion.
- Scope: Convert policy, provider, verify, apply, and local settings validator modules.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Read-only verification and bounded apply retain independent re-read behavior.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/github-settings-policy.mjs; scripts/github-settings-provider.mjs; scripts/verify-github-settings.mjs; scripts/apply-github-settings.mjs; scripts/validate-github-repository-settings.mjs

### DEMO-431 — [BUILD] Port release and deployment tools
- Dependency: DEMO-430.
- Why: Release identity helpers and deployment preflight remain authored MJS.
- Scope: Convert cutter, release identity helpers, secret provisioning, deploy refusal, and Cloudflare verification.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Annotated-tag and exact-deploy gates remain unchanged; no release or deployment occurs for this task.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/cut-main-release.mjs; scripts/lib/exact-tag-release.mjs; scripts/lib/live-release-identity.mjs; scripts/provision-worker-secret.mjs; scripts/refuse-production-deploy.mjs; scripts/verify-cloudflare-deployment.mjs

### DEMO-432 — [BUILD] Port assurance registry tooling
- Dependency: DEMO-431.
- Why: Registry and relationship validators share one schema-loading boundary.
- Scope: Convert registry, relationship, schema, and core assurance validators to TS.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Registry discovery and schema validation return equivalent results and messages.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lib/assurance-registry.mjs; scripts/lib/assurance-relationships.mjs; scripts/lib/assurance-validation.mjs; scripts/lib/json-schema.mjs; scripts/validate-assurance-registry.mjs; scripts/validate-assurance.mjs

### DEMO-433 — [BUILD] Port assurance compliance validators
- Dependency: DEMO-432.
- Why: Framework validation is a separate bounded assurance family.
- Scope: Convert normalized ISO helper and ISO, WCAG, documentation, and projection validators.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: All published compliance IDs, links, and statuses validate identically.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lib/validate-normalized-iso.mjs; scripts/validate-iso27001-compliance.mjs; scripts/validate-iso42001-compliance.mjs; scripts/validate-wcag-compliance.mjs; scripts/validate-assurance-documentation.mjs; scripts/validate-assurance-projection.mjs

### DEMO-434 — [BUILD] Port assurance lifecycle validators
- Dependency: DEMO-433.
- Why: Lifecycle, advisory, publication, and operations checks form a separate policy boundary.
- Scope: Convert lifecycle history helper and the advisory, integrity, lifecycle, publication, and operations validators.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Immutable IDs, source approvals, disclosure, and operational checks remain unchanged.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lib/assurance-lifecycle-history.mjs; scripts/validate-advisories.mjs; scripts/validate-assurance-integrity.mjs; scripts/validate-assurance-lifecycle.mjs; scripts/validate-assurance-publication.mjs; scripts/validate-assurance-operations.mjs

### DEMO-435 — [BUILD] Port security and locale validators
- Dependency: DEMO-434.
- Why: Secret scanning and locale/governance checks are distinct from release tools.
- Scope: Convert public-history secret helper and security, worker-secret, locale, and governance validators.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: History scanning, redaction, Worker inventory, and locale inventory retain behavior.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lib/public-history-secrets.mjs; scripts/validate-security.mjs; scripts/validate-worker-secrets.mjs; scripts/validate-locales.mjs; scripts/validate-governance-metadata.mjs

### DEMO-436 — [BUILD] Port the main browser audit to TypeScript
- Dependency: DEMO-435.
- Why: The main browser audit is a large single executable module.
- Scope: Convert only site-browser-audit to TS using the chosen runner; retain every audit assertion and timing signal.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Browser matrix and CI browser run pass with unchanged coverage.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/site-browser-audit.mjs; scripts/site-browser-audit.ts

### DEMO-437 — [BUILD] Port browser audit support to TypeScript
- Dependency: DEMO-436.
- Why: Browser helper and runner modules remain authored MJS.
- Scope: Convert browser-audit helper, audit runner, and Chromium verifier to TS.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: One browser lifecycle remains executable and diagnostic errors stay actionable.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lib/browser-audit.mjs; scripts/run-site-accessibility-audits.mjs; scripts/verify-chromium.mjs

### DEMO-438 — [BUILD] Port local development tools to TypeScript
- Dependency: DEMO-437.
- Why: Local dev command and process helpers are still MJS.
- Scope: Convert dev entry point, process identity, cleanup, and readiness helpers.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Headless dev reports the same ready URL and cleans up only checkout-owned processes.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/dev.mjs; scripts/lib/dev-process-identity.mjs; scripts/lib/dev-process-cleanup.mjs; scripts/lib/dev-readiness.mjs

### DEMO-439 — [BUILD] Port contract and migration validators to TypeScript
- Dependency: DEMO-438.
- Why: Remaining contract and migration tools are a bounded operational family.
- Scope: Convert contracts, migrations, React presentation, repository baseline, and scaffold validators.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Local D1 migrations and dry-run build checks remain credential-free and equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/validate-contracts.mjs; scripts/validate-migrations.mjs; scripts/validate-react-presentation.mjs; scripts/validate-repository-baseline.mjs; scripts/validate-scaffold.mjs

### DEMO-440 — [BUILD] Port lint and documentation validators to TypeScript
- Dependency: DEMO-439.
- Why: Lint and simple source-policy validators are the remaining general tooling group.
- Scope: Convert lint, lint-rules, documentation cleanup, stylesheet-class, and toolchain validators.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: Lint and documentation checks retain current failure conditions; all scripts under scripts are TS.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: scripts/lint.mjs; scripts/lint-rules.mjs; scripts/validate-documentation-cleanup.mjs; scripts/validate-stylesheet-classes.mjs; scripts/validate-toolchain.mjs

### DEMO-441 — [BUILD] Move live Git workflow logic to TypeScript
- Dependency: DEMO-440.
- Why: The live Git workflow embeds JavaScript for release identity and PR checks.
- Scope: Move only git-demo workflow application logic into typed scripts; keep its trigger, token, and protected merge boundary.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No inline authored JavaScript remains in git-demo.yml; live release identity checks remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: .github/workflows/git-demo.yml; scripts/lib/live-release-identity.mjs; docs/RELEASE-MANAGEMENT.md

### DEMO-442 — [BUILD] Move Release workflow logic to TypeScript
- Dependency: DEMO-441.
- Why: Release workflow embeds a separate exact-tag and main-CI JavaScript preflight.
- Scope: Move only release.yml application logic into typed scripts without changing tag or publication requirements.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No inline authored JavaScript remains in release.yml; exact-tag reproduction and release structure remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: .github/workflows/release.yml; scripts/lib/exact-tag-release.mjs; docs/RELEASE-MANAGEMENT.md

### DEMO-443 — [BUILD] Move Deploy workflow logic to TypeScript
- Dependency: DEMO-442.
- Why: Deploy workflow contains several inline JavaScript provider and identity checks.
- Scope: Move only deploy.yml application logic into typed scripts while keeping preflight before mutation and post-deploy verification.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No inline authored JavaScript remains in deploy.yml; protected deployment checks and permissions remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: .github/workflows/deploy.yml; scripts/verify-cloudflare-deployment.mjs; docs/RELEASE-MANAGEMENT.md

### DEMO-444 — [TEST] Port assurance contract tests to TypeScript
- Dependency: DEMO-443.
- Why: Two assurance test files remain MJS.
- Scope: Convert the filter-vocabulary and schema-contract tests to TS without changing assertions.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Both tests run under the standard suite; no MJS assurance test remains.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/assurance-filter-vocabulary.test.mjs; tests/assurance-schema-contracts.test.mjs

### DEMO-445 — [TEST] Port architecture documentation tests to TypeScript
- Dependency: DEMO-444.
- Why: A small set of retained documentation tests still use MJS.
- Scope: Convert retained DEMO-312, 314, and 315 tests after earlier pruning; remove those already retired.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Current architecture documentation checks run from TS.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-312-retire-checked-in-release-history.test.mjs; tests/demo-314-architecture-documentation-consolidation.test.mjs; tests/demo-315-accessibility-documentation-consolidation.test.mjs

### DEMO-446 — [TEST] Port governance documentation tests to TypeScript
- Dependency: DEMO-445.
- Why: Retained governance and cleanup tests still use MJS.
- Scope: Convert retained DEMO-316 through 319 tests after their dedicated pruning tasks.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Current governance reference checks run from TS.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-316-management-system-governance-consolidation.test.mjs; tests/demo-317-security-operations-governance-consolidation.test.mjs; tests/demo-318-retire-historical-assessment-markdown.test.mjs; tests/demo-319-documentation-cleanup-acceptance.test.mjs

### DEMO-447 — [TEST] Port queue and CI tests to TypeScript
- Dependency: DEMO-446.
- Why: CI diagnostics, queue, and check-ownership tests remain MJS.
- Scope: Convert the controlled-PR, plan policy, diagnostics, queue, acceptance ownership, and required-check tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Identity, exact-head, and check ownership assertions remain intact.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/controlled-pr-identity.test.mjs; tests/implementation-plan-policy.test.mjs; tests/demo-269-ci-diagnostics.test.mjs; tests/demo-322-temporary-implementation-plan.test.mjs; tests/demo-354-acceptance-ownership.test.mjs; tests/demo-379-required-checks.test.mjs

### DEMO-448 — [TEST] Port local development and lint tests to TypeScript
- Dependency: DEMO-447.
- Why: Development-process tests remain MJS.
- Scope: Convert retained dev identity, cleanup, readiness, toolchain, history recovery, baseline, and lint tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Local process and scaffold behavior remains covered with TS test files.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-355-dev-process-identity.test.mjs; tests/demo-356-dev-process-cleanup.test.mjs; tests/demo-358-dev-readiness.test.mjs; tests/demo-359-toolchain.test.mjs; tests/demo-360-history-recovery.test.mjs; tests/demo-361-repository-baseline.test.mjs; tests/lint.test.mjs

### DEMO-449 — [TEST] Port release-history tests to TypeScript
- Dependency: DEMO-448.
- Why: Release identity and history tests remain MJS.
- Scope: Convert DEMO-305, 307, 309, 365, and post-merge DEMO-366 tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Release identity, reproduction, and historical exception behavior remains covered.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-305-release-operations-acceptance.test.mjs; tests/demo-307-release-identity-baseline-module-fix.test.mjs; tests/demo-309-release-identity-baseline-challenge-retry.test.mjs; tests/demo-365-release-reproduction-command-ownership.test.mjs; tests/demo-366-post-merge-history-recovery.test.mjs

### DEMO-450 — [TEST] Port release and deployment tests to TypeScript
- Dependency: DEMO-449.
- Why: Protected release and deploy tests remain MJS.
- Scope: Convert published-release, provider-identity, live-release, and exact-tag tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: Protected release and deploy structural checks remain equivalent.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-366-published-immutable-release-deployment.test.mjs; tests/demo-367-release-deployment-provider-identity.test.mjs; tests/demo-391-history.test.mjs; tests/demo-391-live-release.test.mjs; tests/demo-395-exact-tag-release.test.mjs

### DEMO-451 — [TEST] Port remaining security and settings tests to TypeScript
- Dependency: DEMO-450.
- Why: A small residual test set still uses MJS.
- Scope: Convert Worker-secret, public-history-secret, GitHub settings, and footer-contract tests.
- Non-goals: Do not remove unique behavioral, security, or release regression coverage.
- Acceptance: All retained executable tests are TS and security/settings assertions remain.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: tests/demo-297-worker-secret-verification.test.mjs; tests/demo-368-public-history-secrets.test.mjs; tests/github-settings.cases.mjs; tests/demo-277-footer-contract.test.mjs

### DEMO-452 — [BUILD] Enforce the TypeScript-only authored-source boundary
- Dependency: DEMO-451.
- Why: Without a guard, authored JavaScript can return after migration.
- Scope: Add a tracked-source check for src, scripts, tests, and workflow application logic; permit only explicit non-executable fixtures and ignored generated/third-party output.
- Non-goals: Do not change required CI names, credential boundaries, release identity, or deployment protection.
- Acceptance: No authored executable .js, .mjs, or .cjs remains; guard fails on a new one; check and required CI pass.
- Validation: Focused affected checks; pinned npm ci; credential-free npm run check; separate advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: src/; scripts/; tests/; .github/workflows/; package.json; docs/REPOSITORY-BOUNDARIES.md
