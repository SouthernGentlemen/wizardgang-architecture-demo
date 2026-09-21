# Active implementation plan

This is the current/future queue. Reconcile against authoritative `main` and open PRs before acting. Deliver only the first unblocked task per `do needful` turn; the delivering PR removes its own block and updates later blocks if discoveries change them. Git/GitHub hold completed work. Delete this file in the PR delivering its last task. The wave is limited to confirmed near-term process and lifecycle gaps; audit fresh state before authoring another wave.

## Open tasks

### DEMO-343 — [BUILD] Prevent live Git demo from consuming a queued change ID

- Dependency: DEMO-342 merged on `main`.
- Why: `.github/workflows/git-demo.yml` calculates the next DEMO ID from Git history without consulting the active plan, so an on-demand live demonstration can collide with its first reserved task.
- Scope: Fail the live-demo start operation before branch/version mutation when an active implementation plan has open tasks; make the reason and recovery explicit and add focused policy coverage. Preserve the existing release operation for a previously opened authoritative live-demo PR.
- Non-goals: Do not start a demonstration, publish a release, deploy, or reassign queued IDs.
- Acceptance: While the plan has open tasks, start cannot create a competing controlled branch/PR; without a plan, the existing controlled demonstration remains available.
- Validation: Focused workflow/policy test; `npm run check`; `git diff --check`.
- Authorities: `.github/workflows/git-demo.yml`, `IMPLEMENTATION_PLAN.md`, `scripts/validate-implementation-plan.mjs`.

### DEMO-344 — [TEST] Exercise GitHub settings comparison without credentials

- Dependency: DEMO-343 merged on `main`.
- Why: `scripts/validate-github-repository-settings.mjs` combines hard-coded baseline assertions, live API projection, and comparison without isolated behavioral cases.
- Scope: Extract pure normalization/comparison functions and add focused fixture tests for missing/changed main checks, merge methods, tag protection, and matching state; retain the committed settings and live command behavior.
- Non-goals: Do not change provider settings, merge policy, or production deployment.
- Acceptance: Pure tests fail on each material drift and pass on the committed baseline; `check` includes them; live verification still matches current GitHub state.
- Validation: `npm run test -- tests/github-repository-settings.test.mjs`; `npm run check`; `npm run validate:repository-settings -- --live`; `git diff --check`.
- Authorities: `config/github-repository-settings.json`, `scripts/validate-github-repository-settings.mjs`, `.github/workflows/ci.yml`.

### DEMO-345 — [SEC] Restrict production deployments to release tags

- Dependency: DEMO-344 merged; confirm current environment/provider state again.
- Why: GitHub's live `production` environment currently reports no protection rules and no deployment branch/tag policy, despite the release-only production contract.
- Scope: Research supported GitHub environment tag restrictions, encode the intended release-tag-only policy in settings-as-code, add pure comparison coverage, apply only the reviewed environment setting, and verify live state. Preserve the current successful release path.
- Non-goals: Do not publish a release, deploy, change secrets, require a self-blocking reviewer, or alter main/tag rulesets or merge method.
- Acceptance: A non-release ref cannot enter `production`; an immutable annotated `v*` release ref remains eligible; committed and live environment state agree. If provider capability cannot express this safely, report the exact constraint rather than claiming protection.
- Validation: Focused settings tests; `npm run check`; live read before/after and `npm run validate:repository-settings -- --live`; `git diff --check`.
- Authorities: `config/github-repository-settings.json`, `scripts/validate-github-repository-settings.mjs`, `.github/workflows/deploy.yml`, `docs/RELEASE-MANAGEMENT.md`.

### DEMO-346 — [BUILD] Bind deploy verification to the requested exact tag

- Dependency: DEMO-345 merged.
- Why: `.github/workflows/deploy.yml` derives a tag with `git describe --exact-match HEAD` but does not explicitly compare that identity to `inputs.ref` before production mutation; its pattern also accepts an unprefixed version.
- Scope: Validate `inputs.ref` as `vMAJOR.MINOR.PATCH`, verify that exact annotated ref resolves to checked-out HEAD and matches `package.json`, and test rejection of a mismatched or ambiguous input before secrets/migrations/deploy.
- Non-goals: Do not publish or deploy a version and do not change application behavior.
- Acceptance: The selected immutable tag, checkout, and package version must agree; a different tag on the same commit and non-`v` input fail closed.
- Validation: Focused release-boundary test; `npm run check`; workflow syntax inspection; `git diff --check`.
- Authorities: `.github/workflows/deploy.yml`, `.github/workflows/release.yml`, `docs/RELEASE-MANAGEMENT.md`.

### DEMO-347 — [BUILD] Include dependency security audit in the canonical check

- Dependency: DEMO-346 merged.
- Why: `security:dependencies` is a separate CI-wrapper/release step but absent from the credential-free `check` command.
- Scope: Compose the existing high-severity dependency audit into `npm run check`; preserve useful failure diagnostics and remove redundant wrapper invocation only if parity is proven.
- Non-goals: Do not upgrade dependencies or change audit policy to hide findings.
- Acceptance: A high-severity advisory fails local `check` and CI with the same policy; provider credentials are not required.
- Validation: `npm run security:dependencies`; `npm run check`; `npm run validate:ci`; `git diff --check`.
- Authorities: `package.json`, `scripts/ci-validation.mjs`, `.github/workflows/ci.yml`.

### DEMO-348 — [BUILD] Include clean local D1 migration acceptance in check

- Dependency: DEMO-347 merged.
- Why: migration validation runs in CI/release separately from `check`, while the canonical credential-free gate should include applicable local acceptance.
- Scope: Make `check` exercise migrations against an isolated local D1 state, retaining fail-closed behavior and avoiding developer or production database mutation; reconcile CI-wrapper duplication.
- Non-goals: Do not edit applied migrations, alter remote D1, or change schema semantics.
- Acceptance: A broken migration fails `check`; repeated runs are isolated and do not require provider credentials.
- Validation: `npm run validate:migrations` with an isolated local state; `npm run check`; `npm run validate:ci`; `git diff --check`.
- Authorities: `migrations/`, `package.json`, `wrangler.jsonc`, `scripts/ci-validation.mjs`.

### DEMO-349 — [BUILD] Include Worker dry-run build acceptance in check

- Dependency: DEMO-348 merged.
- Why: `check` validates React/assets and types but the Worker production dry-run and bundle boundary are separately run by CI/release.
- Scope: Add the existing credential-free Worker dry-run/bundle validation to `check` and reconcile duplicate CI execution without invoking a deploy.
- Non-goals: Do not change Worker routes, assets, or production deployment.
- Acceptance: A Worker bundling failure is caught by `check`, and CI/release maintain equivalent fail-closed build evidence.
- Validation: `npm run build:worker`; `npm run check`; `npm run validate:ci`; `git diff --check`.
- Authorities: `package.json`, `scripts/ci-validation.mjs`, `.github/workflows/ci.yml`.

### DEMO-350 — [TEST] Bring generated-artifact parity into check

- Dependency: DEMO-349 merged.
- Why: the two-pass routes/assets/OpenAPI/assurance artifact drift check runs only through `validate:ci`, not the canonical local gate.
- Scope: Integrate `validate:generated-artifacts` into `check` without dirtying a clean worktree on success; keep bounded diagnostics and generator idempotence proof.
- Non-goals: Do not change generated source formats or manually edit projections.
- Acceptance: First-pass drift, second-pass drift, and unexpected files fail `check`; a clean checkout remains clean on success.
- Validation: `npm run validate:generated-artifacts`; `npm run check`; `npm run validate:ci`; `git status --short`; `git diff --check`.
- Authorities: `scripts/validate-generated-artifacts.mjs`, `scripts/ci-validation.mjs`, `package.json`.

### DEMO-351 — [A11Y] Include site-wide browser accessibility acceptance in check

- Dependency: DEMO-350 merged.
- Why: the site-wide Chromium audit is credential-free but currently runs only in the CI wrapper; DOM-only checks inside `check` do not replace rendered browser evidence.
- Scope: Compose the existing browser accessibility audit and its explicit Chromium prerequisite into `check`, with bounded output and no production request.
- Non-goals: Do not claim manual assistive-technology or WCAG certification evidence, and do not change UI behavior without a demonstrated failure.
- Acceptance: Local and CI `check` execute the same site-wide accessibility gate; missing Chromium fails with actionable setup guidance.
- Validation: `npm run verify:chromium`; `npm run test:site-accessibility`; `npm run check`; `git diff --check`.
- Authorities: `scripts/run-site-accessibility-audits.mjs`, `scripts/verify-chromium.mjs`, `package.json`, `docs/ACCESSIBILITY.md`.

### DEMO-352 — [I18N] Confirm browser localization acceptance across locales

- Dependency: DEMO-351 merged.
- Why: the browser audit covers localization alongside accessibility, but canonical-check integration needs explicit all-locale/RTL acceptance and no duplicate execution.
- Scope: Prove existing browser localization cases exercise released routes, language/RTL, and deep links; close only demonstrated coverage gaps and keep one shared browser audit invocation.
- Non-goals: Do not rewrite translations wholesale or add locales.
- Acceptance: A browser-level locale/RTL regression fails `check` and CI; acceptance remains bounded and deterministic.
- Validation: Focused site-i18n tests; `npm run test:site-accessibility`; `npm run check`; `git diff --check`.
- Authorities: `tests/site-accessibility-i18n.test.ts`, `scripts/run-site-accessibility-audits.mjs`, `src/i18n/`, `docs/INTERNATIONALIZATION.md`.

### DEMO-353 — [FIX] Stop the complete local dev process tree

- Dependency: DEMO-352 merged.
- Why: `scripts/dev.mjs` starts npm wrappers for Vite watch and Wrangler but signals only direct children, leaving grandchild cleanup unproven when a child exits or the session is interrupted.
- Scope: Add a local-only lifecycle test and robust cross-platform shutdown for both processes, preserving the existing asset-watch/Worker dev behavior.
- Non-goals: Do not start a production deploy, change Worker configuration, or refactor unrelated build tooling.
- Acceptance: Interrupting `npm run dev` or one child exits without orphaned Vite/Wrangler processes; startup errors remain visible. Delete this plan in the delivering PR if no new future requirement is proven.
- Validation: Focused process-lifecycle test; `npm run check`; manual local start/interrupt with process inspection; `git diff --check`.
- Authorities: `scripts/dev.mjs`, `package.json`, `.gitignore`.
