# Implementation plan

## Open tasks

### DEMO-404 — [PERF] Execute each acceptance test once
- Dependency: None.
- Why: `check` runs targeted route, accessibility, and localization tests before the full Vitest suite runs those files again; generated route parity also invokes its test twice.
- Scope: Measure current CI stages and test inventory; remove repeated executions while retaining every distinct assertion, generated-artifact parity, and useful focused commands. Update command ownership tests and docs.
- Non-goals: Do not rename the four required CI statuses, drop assertions, or move network and provider checks into `check`.
- Acceptance: Each current assertion runs at least once in `check`; parity and idempotence remain enforced; exact-head CI passes; report before/after CI time and test counts.
- Validation: Focused command-plan tests, pinned `npm ci`, `npm run check`, advisory and committed-patch gates, exact-head PR CI, merged-main CI.
- Authorities: `package.json`, `.github/workflows/ci.yml`, `scripts/validate-generated-artifacts.mjs`, `tests/demo-354-acceptance-ownership.test.mjs`, `docs/CI-DIAGNOSTICS.md`.

### DEMO-405 — [PERF] Consolidate the Chromium browser audits
- Dependency: DEMO-404.
- Why: Three serial browser programs took about 117 seconds in the 2026-10-01 main CI run and repeat server, browser, page, and locale setup.
- Scope: Inventory unique assertions and route/state/locale/viewport coverage; share one server and browser lifecycle and eliminate duplicate visits with equivalent coverage.
- Non-goals: Do not discard axe, keyboard, focus, reflow, text-spacing, localization, no-JavaScript, or live demo workflow checks for speed.
- Acceptance: Preserve every unique browser assertion and useful failure diagnostic; improve measured browser time against the 117-second baseline without shrinking the coverage matrix.
- Validation: Fresh local D1 browser audit, pinned `npm ci`, `npm run check`, advisory and committed-patch gates, exact-head PR CI, merged-main CI.
- Authorities: `scripts/run-site-accessibility-audits.mjs`, `scripts/site-browser-audit.mjs`, `scripts/demo-268-rest-browser-audit.mjs`, `scripts/demo-289-site-evaluation.mjs`, `config/site-audit-states.json`, `docs/ACCESSIBILITY.md`.

### DEMO-406 — [TEST] Replace exhaustive presentation snapshots with focused contracts
- Dependency: DEMO-405.
- Why: Six presentation fixtures contain 57,242 lines, about 37 percent of tracked repository LOC, while their test costs about six seconds of CI.
- Scope: Map unique regressions in each fixture; keep compact assertions for route and locale inventory, translated text, accessible names, semantic structure, security headers, and volatile-value normalization; delete superseded snapshots.
- Non-goals: Do not reduce supported routes/locales, remove the CSP boundary, or accept unreviewed UI drift.
- Acceptance: Deterministic checks cover all released surfaces and locales; full fixtures are retired or reduced to justified minimal data; report LOC and test-time changes.
- Validation: Focused presentation, localization, accessibility, and routing tests; pinned `npm ci`; `npm run check`; advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: `tests/presentation-baseline.test.ts`, `tests/fixtures/presentation-baseline/`, `tests/site-accessibility-i18n.test.ts`, `src/routing/application-routes.ts`, `docs/INTERNATIONALIZATION.md`.

### DEMO-407 — [REFACTOR] Retire obsolete codemods and change-era tests
- Dependency: DEMO-406.
- Why: The one-time `demo-174-codemod` has no tracked caller, and some numbered tests repeat current validators or completed migrations.
- Scope: Remove the uncalled codemod; classify numbered tests by unique current behavior or duplicate historical assertion; consolidate only those without a distinct current contract.
- Non-goals: Do not discard live release, deployment, authorization, secrets, disclosure, or provider-boundary tests or rewrite Git history.
- Acceptance: Each removed test has a documented replacement or no remaining contract; retained tests express current behavior; report test file, LOC, and runtime changes.
- Validation: Focused validators and tests, pinned `npm ci`, `npm run check`, advisory and committed-patch gates, exact-head PR CI, merged-main CI.
- Authorities: `tests/demo-*.test.*`, `scripts/demo-174-codemod.mjs`, `scripts/validate-documentation-cleanup.mjs`, `docs/CHANGE-MANAGEMENT.md`, `docs/RELEASE-MANAGEMENT.md`.

### DEMO-408 — [DOCS] Remove redundant prose and unneeded evidence projections
- Dependency: DEMO-407.
- Why: Current docs should describe the live system without copying generated inventories, structured assurance data, or Git/GitHub history.
- Scope: Map readers of Markdown links, 307 compliance documentation references, operating records, generated artifacts, and public routes; trim only duplicated or unreferenced prose/projections and update links and validators together.
- Non-goals: Do not delete canonical assurance records, schemas, governance procedures, deployment records, or release history merely to reduce LOC.
- Acceptance: Every remaining document has an authority role or reader; all links and assurance references resolve; prose and LOC decrease without lost functionality or evidence.
- Validation: Documentation, governance, assurance, reporting, contract, and generated-artifact checks; pinned `npm ci`; `npm run check`; advisory and committed-patch gates; exact-head PR CI and merged-main CI.
- Authorities: `docs/ARCHITECTURE-STANDARD.md`, `docs/ASSURANCE.md`, `docs/governance/`, `assurance/registry.json`, `scripts/validate-assurance-documentation.mjs`.

### DEMO-409 — [REFACTOR] Remove proven unused source symbols and dependencies
- Dependency: DEMO-408.
- Why: Runtime modules are reachable at file level, but exports, conditional branches, assets, and dependencies need consumer-aware review.
- Scope: Trace Worker, Vite, routes, dynamic imports, tooling, tests, workflows, and deployed assets; remove only proven unused elements and simplify unchanged call paths.
- Non-goals: Do not remove supported demos, routes, contracts, locales, Cloudflare bindings, or dynamic/provider use based on static imports alone.
- Acceptance: Each removal has a reachability rationale; public routes, assets, protocols, and behavior remain equivalent; report source LOC and dependency changes.
- Validation: Focused tests, route and artifact parity, dry-run build, pinned `npm ci`, `npm run check`, advisory and committed-patch gates, exact-head PR CI, merged-main CI.
- Authorities: `src/`, `vite.config.ts`, `wrangler.jsonc`, `package.json`, `docs/ROUTE-REGISTRY.md`, `docs/REPOSITORY-BOUNDARIES.md`.

### DEMO-410 — [REFACTOR] Convert authored Worker and browser JavaScript to TypeScript
- Dependency: DEMO-409.
- Why: Authored `.js` modules and companion `.d.ts` files under `src/assurance` split implementation from types.
- Scope: Port these and any other authored JavaScript in `src/` to typed `.ts`; update imports and remove redundant declaration companions while preserving runtime contracts.
- Non-goals: Do not remove generated JavaScript required by browsers and Workers, third-party packages, or the JavaScript runtime.
- Acceptance: No authored `.js`, `.mjs`, or `.cjs` remains under `src/`; strict typechecks, builds, assurance behavior, and route contracts pass.
- Validation: Focused assurance tests, `npm run typecheck`, `npm run build`, pinned `npm ci`, `npm run check`, advisory and committed-patch gates, exact-head PR CI, merged-main CI.
- Authorities: `src/assurance/`, `tsconfig.json`, `src/browser/tsconfig.json`, `docs/ASSURANCE.md`, `docs/ARCHITECTURE-STANDARD.md`.

### DEMO-411 — [BUILD] Port Node tools and workflow logic to TypeScript
- Dependency: DEMO-410.
- Why: Authored `.mjs` scripts and workflow-embedded JavaScript remain outside the TypeScript source boundary.
- Scope: Choose and pin a Node 26 compatible TypeScript execution path; convert `scripts/**/*.mjs` and workflow application logic to `.ts`; update npm/workflow entry points while preserving arguments, exits, generated bytes, diagnostics, secrets handling, and provider boundaries.
- Non-goals: Do not change required status names, release identity, protected deployment, provider permissions, or generated artifacts for extension parity.
- Acceptance: Repository-owned tooling and workflow application logic are TypeScript; `check`, advisory, release/deploy preflight, and exact-head CI retain their documented boundaries; no compiled JavaScript is committed as replacement source.
- Validation: Focused tool/workflow tests and command parity, pinned `npm ci`, `npm run check`, advisory and committed-patch gates, dry-run build, exact-head PR CI, merged-main CI; no release or deployment.
- Authorities: `scripts/`, `.github/workflows/`, `package.json`, `.node-version`, `docs/CI-DIAGNOSTICS.md`, `docs/RELEASE-MANAGEMENT.md`, `SECURITY.md`.

### DEMO-412 — [TEST] Port JavaScript tests and enforce TypeScript-only authored source
- Dependency: DEMO-411.
- Why: Remaining `.mjs` tests and executable fixtures would retain an authored JavaScript island and permit reintroduction.
- Scope: Convert owned JavaScript tests and executable fixtures to TypeScript; run them without committed compiled files; add a tracked-source guard for `src/`, `scripts/`, `tests/`, and workflow application logic. Document that generated build output and third-party JavaScript are outside this authored-source rule.
- Non-goals: Do not delete meaningful tests for extension parity or ban JavaScript emitted for browser/Worker execution.
- Acceptance: Authored executable source, tooling, tests, and workflow application logic are TypeScript; guard rejects new checked-in `.js`, `.mjs`, and `.cjs` in those scopes unless a non-executable fixture exception is justified; required CI statuses remain intact.
- Validation: Focused converted tests and guard failure cases, strict typechecks, pinned `npm ci`, `npm run check`, advisory and committed-patch gates, exact-head PR CI, merged-main CI.
- Authorities: `tests/`, `scripts/`, `src/`, `.github/workflows/`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `docs/REPOSITORY-BOUNDARIES.md`.
