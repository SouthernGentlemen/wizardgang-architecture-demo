# Implementation plan

## Execution rules

Goal: a clean restart. Delete the assurance, evidence and documentation system, APIs that overlap or have no caller, and the operational machinery around them. Compliance will be rebuilt later from zero.

- DEMO-512 through DEMO-519 run in order. Each is one controlled delivery: one branch, one PR, one squash commit. Start the next task only on the owner's instruction.
- Delete, don't consolidate. Add no tombstone tests, "removed route" fixtures, aliases, redirects, compatibility shims, replacement docs or new validators. A removed route returns the ordinary 404 and needs no test proving it.
- Delete a test when its subject is deleted. Edit a shared test only to drop cases for removed things.
- Regenerate the route manifest, asset manifest and OpenAPI document with their generators; never hand-edit them.
- `platform/` stays vendored and untouched. Production secrets, provider settings, DNS, traffic, versions, tags and Releases are out of scope for every task.
- A task is done when `git grep` for the names it removed finds nothing outside `platform/` and `package-lock.json`, and exact-head CI is green on `validate` and `browser`.

## Open tasks

### DEMO-512 — [CHORE] Remove the assurance, reporting and security-page system

- Dependency: DEMO-511
- Why: The ISO/IEC 27001, ISO/IEC 42001 and WCAG 2.2 records, the evidence/reporting API and their validators are upkeep with no product value. Compliance restarts from zero later.
- Scope: Routes `/assurance`, `/api/assurance/{record}`, `/api/reporting`, `/api/reporting/{collection}`, `/api/reporting/{collection}/{recordId}` and `/security`, plus every file, script, npm script, acceptance stage, workflow step and test that exists only for them.
- Non-goals: Keep `/.well-known/security.txt` and root `SECURITY.md`. Leave the rest of `docs/` for DEMO-513. Keep automated accessibility testing (axe site audit and the accessibility tests); only the WCAG records go.
- Acceptance: The six routes return 404. `assurance/`, `contracts/assurance/`, `src/assurance/` and `src/reporting/` are gone. `git grep -iE "assurance|/api/reporting"` finds nothing outside `platform/` and `docs/`. `npm run check` has no governance, assurance or TypeScript-execution stage; `validate:security` keeps only its tracked-file and public-history secret scan. No workflow runs an assurance step.
- Validation: Regenerate the route manifest and OpenAPI; run the focused router, route-registry, navigation, sitemap and i18n tests; final exact-head CI.
- Authorities: src/routing/application-routes.ts; src/router.ts; src/routing/navigation.ts; scripts/lib/acceptance-plan.ts; package.json; .github/workflows/release.yml; contracts/openapi/openapi.json.

#### Work

- [ ] Delete data and schemas: `assurance/` (32 files) and `contracts/assurance/` (19 schemas).
- [ ] Delete runtime code: `src/assurance/`, `src/reporting/`, `src/api/reporting.ts`, `src/api/reporting-response.ts`, `src/api/assurance-contract.ts`, `src/routing/assurance-routes.ts`, `src/routing/reporting-routes.ts`, `src/demos/assurance-workbench.tsx`, `src/ui/security.tsx` and `src/lib/cloudflare-usage.ts` (reporting is its only consumer). Unwire them from routing, navigation, sitemap, offline/recovery copy, i18n strings and `assurance-*` stylesheet classes.
- [ ] Delete scripts: all `scripts/validate-assurance*.ts`, `validate-iso27001-compliance.ts`, `validate-iso42001-compliance.ts`, `validate-wcag-compliance.ts`, `validate-advisories.ts`, `validate-governance-metadata.ts`, `validate-documentation-cleanup.ts`, `validate-typescript-execution.ts` (its probe imports assurance code), `generate-assurance-runtime-binding.ts`, `generate-assurance-snapshot.ts`, `scripts/lib/assurance-*.ts` and `scripts/lib/validate-normalized-iso.ts`. In `scripts/validate-security.ts`, remove only the broad-credential assertions that read `assurance/` and `docs/` files; keep the secret scan. Also delete `scripts/lib/markdown-headings.ts` if nothing else imports it.
- [ ] Remove npm scripts `validate:assurance`, `monitor:assurance`, `snapshot:assurance`, `validate:wcag`, `validate:governance`, `validate:typescript-execution` and `generate:assurance-runtime-binding`, and their acceptance stages. Drop assurance inputs from `validate-generated-artifacts.ts`, `validate-contracts.ts`, `validate-react-presentation.ts`, `validate-repository-baseline.ts`, `site-browser-audit.ts` and `vite.config.ts`.
- [ ] Delete `.github/workflows/assurance-monitor.yml` and the assurance snapshot steps in `release.yml`.
- [ ] Remove the `/api/reporting*` paths and reporting schemas from OpenAPI with `npm run generate:openapi`, then regenerate the route manifest.
- [ ] Delete the 55 test files that cover only this system: `tests/assurance-*`, `tests/reporting-*`, `advisory-validation`, `risk-rating`, `governance-records`, `security`, `incidents-page`, `concerns-page` and `github-reporting-native`, plus `demo-258`, `demo-290`, `demo-313`, `demo-330`, `demo-426`, `demo-482` and `demo-507`. Drop assurance, reporting and `/security` cases from the shared route, navigation, presentation, i18n and accessibility tests.
- [ ] Remove the "Governance or assurance evidence" option from `.github/ISSUE_TEMPLATE/concern.yml`.

### DEMO-513 — [DOCS] Delete docs/ and keep only root Markdown

- Dependency: DEMO-512
- Why: The `docs/` tree restates what code, scripts and workflows already enforce, and it has to be kept in sync with them by hand.
- Scope: Everything under `docs/`; the `docs` link on every route declaration; README, SECURITY.md, AGENTS.md and issue-template references.
- Non-goals: Add no replacement docs, wiki or docs site. Leave `CONTRIBUTING.md` unchanged, because `scripts/check-portfolio-contract.ts` hash-locks it as the shared portfolio contract.
- Acceptance: `docs/` does not exist and `git grep "docs/"` finds nothing outside `platform/`. The build, browser audit and contract validation read the relocated manifests. README is a short orientation covering what this is, the public routes, local setup, commands and a delivery pointer.
- Validation: `npm run generate:assets` and `npm run generate:routes` write the new paths with no drift; run the focused route-artifact, generated-artifact and react-presentation tests; final exact-head CI.
- Authorities: vite.config.ts; src/ui/asset-map.ts; scripts/generate-route-manifest.ts; scripts/validate-generated-artifacts.ts; README.md; SECURITY.md; AGENTS.md.

#### Work

- [ ] Move the two generated manifests out of `docs/`. `docs/asset-manifest.json` becomes `src/generated/asset-manifest.json` (imported at runtime by `src/ui/asset-map.ts`), and `docs/route-manifest.json` becomes `src/generated/route-manifest.json`. Update `vite.config.ts`, `generate-route-manifest.ts`, `validate-generated-artifacts.ts`, `validate-react-presentation.ts`, `validate-contracts.ts`, `validate-scaffold.ts`, `validate-repository-baseline.ts`, `site-browser-audit.ts` and the tests that read them.
- [ ] Remove the `docs` field from route declarations, the route-manifest serializer and every route-capability module.
- [ ] Remove docs source links from demo pages (for example `src/demos/accessibility-presentation.tsx`).
- [ ] Delete the remaining files under `docs/`: the 12 Markdown files, `governance/`, `history/CHANGE-MAP.csv` (nothing reads it) and `accessibility-manual-verification.json`.
- [ ] Rewrite `README.md` to under 60 lines. Remove the ISO/IEC and WCAG "aligned — uncertified" claims, the Assurance section and the Start-here list.
- [ ] Trim `SECURITY.md` to private reporting through GitHub and the disclosure steps.
- [ ] In `AGENTS.md`, point the change-management, release-management and provider-settings authority references at the scripts and workflows that implement them. Keep every sentence `scripts/check-portfolio-contract.ts` requires.
- [ ] Remove the `docs/ASSURANCE.md` placeholder from `concern.yml`. Delete or edit the tests that read `docs/`.

### DEMO-514 — [API] Remove redundant and uncalled APIs

- Dependency: DEMO-513
- Why: Several API surfaces overlap or have no caller, and each one carries its own route declaration, OpenAPI entry, tests and logging.
- Scope: `POST /api/operations/budget`; `GET /api/operations/logs`; `/api/labs/rest-records`, `/api/labs/rest-records/{id}` and `/api/labs/rest-records-reset`; `GET /api/labs/rest-demo-openapi.json`.
- Non-goals: Do not remove or redesign the D1, R2, REST, GraphQL, webhook (including the live Git delivery feed), identity, MCP, edge, Workers or Durable Objects demos. Do not change baseline's shared D1 schema.
- Acceptance: The removed routes return 404. The REST demo is described by the single `/api/openapi.json`. MCP `list_demo_records` reads records a demo actually writes. The D1 and REST demos still pass the browser audit.
- Validation: Focused API-records, D1-lab, MCP-client, contracts and router tests; regenerated OpenAPI and route manifest; final exact-head CI.
- Authorities: src/platform/route-capabilities/d1.ts; src/routing/operational-routes.ts; src/api/mcp.ts; src/api/openapi.ts; src/api/rest-demo-openapi.ts; contracts/openapi/openapi.json; contracts/mcp/tools.json.

#### Work

- [ ] Delete `/api/operations/budget`, `src/api/billing.ts`, `src/lib/billing.ts` and the `BILLING_DEMO_MONTHLY_BUDGET_USD` variable. No UI or client calls it.
- [ ] Delete `/api/operations/logs` and its handler; no UI or client reads it. Then remove the `recordApplicationLog` writes, log TTL handling and `src/lib/logs.ts` unless `/admin` still reads them (`/admin` goes in DEMO-515).
- [ ] Delete the third D1 record API: `/api/labs/rest-records`, `/api/labs/rest-records/{id}`, `/api/labs/rest-records-reset`, `src/api/records.ts` and `src/lib/demo-records.ts`. The D1 demo uses `d1-users`/`d1-tasks` and the REST demo uses `rest-demo-records`. Point MCP `list_demo_records` at the REST demo records.
- [ ] Delete the second OpenAPI document, `/api/labs/rest-demo-openapi.json`. Fold the REST demo operations into `/api/openapi.json` and render the REST demo from it.
- [ ] Delete the matching tests and OpenAPI/MCP contract entries, and regenerate the artifacts.

### DEMO-515 — [OPS] Remove offline mode, admin controls and availability history

- Dependency: DEMO-514
- Why: Per-route offline declarations, the `/offline` recovery page, admin availability and crawler toggles, and 365-day scheduled availability history are operational ceremony for a demo site.
- Scope: `/offline`; the `offline` field on every route declaration and capability; `src/lib/demo-control.ts`; `src/lib/crawler-control.ts`; the `/admin` page (`src/ui/admin.tsx`, `src/browser/admin.ts`) and its availability and crawler controls; scheduled `collectHealth`, availability retention and the homepage's measured-availability panel.
- Non-goals: Keep the live webhook demo working: the `wg-ops` Basic-auth provider, `src/lib/admin-auth.ts`, `/admin/api/labs/git-delivery`, `/admin/api/labs/git-release`, `/api/labs/git-delivery`, `.github/workflows/git-demo.yml` and its GitHub App all stay. Keep the cron trigger for `sweepDemoStorage`, which removes expired shared-D1 rows. Keep `/api/operations/health` and `/api/operations/version` as live reads. Do not change the protected deployment environment.
- Acceptance: `/offline` and the `/admin` page return 404 while the live webhook demo still starts and releases through the `wg-ops`-authenticated lab APIs; `robots.txt` is static; route declarations have no offline field; the cron only sweeps expired rows; the homepage shows live health and version only.
- Validation: Focused operations, router, route-registry, worker-shell, storage and git-demo tests; browser audit; final exact-head CI.
- Authorities: src/index.ts; src/router.ts; src/routing/registry.ts; src/routing/operational-routes.ts; src/api/operations.ts; src/ui/home.tsx; wrangler.jsonc.

#### Work

- [ ] Remove offline gating from the router and the `offline` field from route declarations, capabilities and the manifest serializer; delete `/offline` and `src/ui/offline.tsx`.
- [ ] Replace dynamic crawler control with a static `robots.txt`; delete `src/lib/crawler-control.ts` and `src/lib/demo-control.ts`.
- [ ] Delete the `/admin` page and its browser module; keep `wg-ops` authentication for the live Git delivery lab APIs.
- [ ] Remove scheduled health collection and availability history; render live health and version on the homepage.
- [ ] Delete `availability-history`, `operations-acceptance`, `demo-329` and the offline and admin-page cases in shared tests.

### DEMO-516 — [BUILD] Reduce Release to tag, deploy and publish

- Dependency: DEMO-515
- Why: Release reruns the full acceptance suite on a commit that main already validated, then records the deployment result back onto the Release, and a separate cutter workflow drives it.
- Scope: `.github/workflows/release.yml` (285 lines: reproduce, deploy, record), `.github/workflows/release-cutter.yml`, `scripts/cut-main-release.ts`, `scripts/release-workflow.ts`, `scripts/lib/exact-tag-release.ts` and their tests.
- Non-goals: Keep annotated semantic tags, the immutable release-tag ruleset, protected production-environment approval, the identity-bound production Worker build and `npm run deploy` refusing arbitrary checkouts. Create no version, tag, Release or deployment in this task.
- Acceptance: One workflow goes from an owner-authorized annotated tag to a build, then an approved deploy, then a GitHub Release. It has no full-suite reproduction and no follow-up record job. The release-cutter is removed unless the owner keeps automatic cutting during delivery.
- Validation: Workflow structural review; focused release tests that remain; final exact-head CI. The next real release is the end-to-end proof.
- Authorities: .github/workflows/release.yml; .github/workflows/release-cutter.yml; scripts/lib/release-intent.ts; platform/deploy.

#### Work

- [ ] Remove the `reproduce` and `record` jobs and the deployment-result recording; keep tag verification, build, approved deploy and Release creation.
- [ ] Remove `release-cutter.yml` and `scripts/cut-main-release.ts` unless the owner keeps automatic cutting.
- [ ] Delete `demo-305`, `demo-365`, `demo-366`, `demo-367`, `demo-395`, `demo-468`, `demo-504` and `demo-506`, and keep one focused current release test.

### DEMO-517 — [BUILD] Cut acceptance to product gates

- Dependency: DEMO-516
- Why: `npm run check` still runs repository-policing validators that check commit history, scaffold shape and settings files rather than the product.
- Scope: Acceptance stages and npm scripts `validate:history`, `validate:repository-baseline`, `validate:typescript-source-boundary`, `validate:repository-settings` and `test:github-settings`, and their scripts (`validate-history.ts`, `scripts/lib/forward-history.ts`, `validate-repository-baseline.ts`, `validate-scaffold.ts`, `validate-typescript-source-boundary.ts`, `validate-github-repository-settings.ts`).
- Non-goals: Keep the delivery process: PR identity validation, plan-queue and implementation-plan checks, patch-whitespace, the advisory query, the toolchain pin, the required `validate` and `browser` checks, and the manual `verify:github-settings` and `apply:github-settings` commands. Keep lint, typecheck, unit tests, the browser accessibility audit, migrations, the platform pin, generated-artifact freshness, Worker bundle and secret checks, contracts, locales, React presentation and stylesheet classes.
- Acceptance: `npm run check` runs only product gates plus the plan checks; the CI job layout and required check names are unchanged.
- Validation: Focused acceptance-plan tests; compare CI stage timings with the last green main run; final exact-head CI.
- Authorities: scripts/lib/acceptance-plan.ts; package.json; .github/workflows/ci.yml.

#### Work

- [ ] Remove the five stages and npm scripts, and delete their scripts and libraries.
- [ ] Delete `demo-361`, `demo-492` and `demo-499`, and delete the github-settings case file if no remaining command uses it.
- [ ] Update `acceptance-plan.ts` and its ownership tests.

### DEMO-518 — [TEST] Delete change-ID tests and tombstones

- Dependency: DEMO-517
- Why: The remaining `tests/demo-NNN-*` files are named after the change that added them rather than the behavior they cover, and several pin things that no longer exist.
- Scope: Every remaining `tests/demo-*` file; `tests/removed-routes.test.ts`, `tests/removed-api-routes.test.ts` and `tests/fixtures/removed-html-pathnames.ts`; any test asserting that a deleted file, route or workflow is absent.
- Non-goals: Do not reduce coverage of live behavior or change product code.
- Acceptance: No `tests/demo-*` files remain. No test asserts the absence of removed things. Every assertion about live behavior that was kept lives in a domain-named test file.
- Validation: Coverage of moved assertions reviewed per file; final exact-head CI.
- Authorities: tests/; vitest.config.ts.

#### Work

- [ ] Delete the tombstone tests and fixture. Keep the historical test-path exceptions in `scripts/lib/public-history-secrets.ts`, because the history scan still reads those paths.
- [ ] For each remaining `demo-*` file, move any live-behavior case that no domain test covers into its domain test (identity, router, interface, i18n, presentation, toolchain, dev), then delete the file.

### DEMO-519 — [CHORE] Sweep orphans left by the removals

- Dependency: DEMO-518
- Why: Large deletions leave unreferenced helpers, CSS, locale keys, environment variables and dependencies behind.
- Scope: Unreferenced modules under `src/` and `scripts/`, unused stylesheet classes and i18n keys, `.dev.vars.example` and `wrangler.jsonc` variables no code reads, and npm dependencies no code imports.
- Non-goals: No refactors or renames of live code; no dependency upgrades.
- Acceptance: Every tracked source file is reachable from an entry point, test, npm script or workflow; every locale key and declared variable has a reader; `package.json` lists only imported dependencies.
- Validation: Import-reachability scan; `npm ci` from the updated lock file; final exact-head CI.
- Authorities: package.json; src/i18n; src/styles; wrangler.jsonc; .dev.vars.example.

#### Work

- [ ] Run an import-reachability scan and delete unreachable modules.
- [ ] Remove unused locale keys, stylesheet classes and environment variables.
- [ ] Remove unused dependencies and refresh `package-lock.json` with the pinned npm.
