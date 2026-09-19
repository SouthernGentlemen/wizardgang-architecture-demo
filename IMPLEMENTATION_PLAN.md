# React Presentation and Repository Normalization Implementation Plan

Status: **Active**

Scope: move every HTML document and page presentation that `demo.wizardgang.ai` serves from template strings to server-rendered React components with first-party TypeScript browser modules, and publish the WizardGang repository baseline that this repository and the other WizardGang repositories normalize to.

This file is the active planning source of truth for DEMO-322 through DEMO-340. Runtime route declarations, `assurance/registry.json` and its registered schemas, and permanent contract documents remain authoritative for shipped behavior. The release that completes the sequence retires this plan.

## Context

Measured on 2026-09-19 at `main` `885c4f7`, with v0.26.0 deployed from `3ef667a`:

| Observation | Value |
|---|---|
| Modules that build HTML from template strings | `src/ui/page.ts` (the shell) and 22 live page, presentation, and document modules; every interpolated value relies on a hand-written `escapeHtml` call |
| HTML surfaces | `/`, `/demos`, `/assurance`, `/security`, `/admin`, `/offline`, and the ordinary 404; 12 demo presentations at `/api/demos/:demo`; assurance record panes at `/api/assurance/:record`; the accessibility-lab frames; the GraphiQL document; the safe error page |
| Inline `<script>` elements served | 3 on `/` and `/security`, 4 on `/demos` and `/assurance`, 1 in each demo presentation, and an inline `onchange` handler on every page's language selector |
| Inline `<style>` elements served | 2 on `/`, 3 on `/demos`, 2 on `/assurance`, 1 on `/security`, 1 in the REST presentation |
| Site-wide Content Security Policy | `script-src 'self' 'unsafe-inline'`; `style-src 'self' 'unsafe-inline'` |
| Stylesheet sources | `src/ui/styles.ts` (779 lines) and `src/ui/runtime-styles.ts` (116 lines) as template strings, cut into delivery surfaces at 5 text markers in `src/ui/style-delivery.ts`; a hand-minified critical sheet; 5 page and presentation modules with their own `<style>` blocks |
| Localization | `localizePresentation` rewrites rendered HTML, and string literals inside inline scripts, with regular expressions |
| Worker upload (`wrangler deploy --dry-run`) | 14,795.67 KiB, or 4,163.59 KiB gzip; 9,384,480 bytes of it are browser-only vendored files bundled as Text modules |
| Tests | 123 files and 656 tests, all passing; 14 files import presentation internals and at least 23 read source text |
| Toolchain | Node 22.23.2 and npm 10.9.8 under `engine-strict`; TypeScript 5.9.3; Vitest 5.0.0; Vite 8.2.2 only as a Vitest dependency; Wrangler 4.130.0; no React |
| Evidence records that locate presentation source | EVD-SRC-006 → `src/ui/accessibility-lab.ts`; EVD-SRC-007 → `src/ui/page.ts` |

`Wizard-Gang/WizardGang` (`wizardgang.ai`) has already moved its shell and every page to React 19 components with TypeScript 7, Vite 8, and Tailwind CSS 4 (WG-037 through WG-047). It renders at build time with `renderToStaticMarkup`, ships one generated browser module, hydrates nothing, and serves `style-src 'self'` with scripts allowed only from itself and Cloudflare Web Analytics. This sequence follows the same model, adapted to a Worker that renders on each request.

A spike on 2026-09-19 bundled a TSX Worker with this repository's Wrangler 4.130.0. esbuild applied the automatic JSX runtime from `tsconfig.json`, `react-dom/server` resolved to its `workerd` (edge) build, and in local workerd `renderToStaticMarkup` escaped text and JSON-valued data attributes. React 19.3.0 with the edge renderer added 103.54 KiB gzip. React serializes some markup differently from the current templates, for example `charSet`, `hidden=""`, and self-closing void elements.

## Product goal

Every HTML document the demo serves is composed from typed React components rendered on the server, and its Content Security Policy no longer allows `'unsafe-inline'`. Routes, fragments, languages, accessibility behavior, and machine contracts stay as they are. The same stack and delivery rules become the WizardGang repository baseline, so the other repositories can converge on one toolchain, one set of commands, and one change and release discipline.

## Decisions

These decisions apply to every change in the sequence; a change that needs to depart from one says so in its controlled record.

1. **Rendering.** React 19 components render in the Worker on each request through `renderToStaticMarkup`. Route handlers load data first; components are synchronous and pure. There is no client hydration and no client-side router; routing stays server-side through the route registry.
2. **Browser behavior.** First-party TypeScript modules under `src/browser/` progressively enhance server-rendered HTML. Every page still works without JavaScript wherever it does today. A module receives configuration through data attributes, never through executable inline script.
3. **Bundlers.** Wrangler stays the Worker bundler and deployer; its esbuild compiles TSX. Vite 8 builds only browser modules and stylesheets. No second Worker bundler is adopted in this sequence.
4. **Static assets.** Bytes that browsers download move to Workers Static Assets behind an `ASSETS` binding with `run_worker_first: true`: first-party modules and stylesheets, the vendored GraphiQL, Monaco worker, and axe-core files, and the social image. The registered asset routes keep serving them, so route declarations stay authoritative, and their responses keep the security and immutable-cache headers.
5. **Asset names.** Vite emits content-hashed file names. The Worker learns them from a generated asset map that is committed like `docs/route-manifest.json` and checked for drift by `npm run check`. If DEMO-327 shows that CI cannot reproduce the map byte for byte, the Worker reads Vite's manifest from `ASSETS` once per isolate instead. Build output is never imported into the Worker bundle.
6. **Stylesheets.** CSS moves to `.css` files: one shell stylesheet and one demos stylesheet, both render-blocking and immutable. The hand-minified critical sheet and the page-level `<style>` blocks are retired; because the shell stylesheet link already blocks rendering, the critical sheet cannot make first paint faster. Each duplicated token keeps the value that currently wins the cascade, so rendered colors do not change. Tailwind is not adopted in this sequence.
7. **Localization.** Moved components localize at render time through the request's localization context. They use the existing catalogs and exact-English lookup, and give browser modules their messages as data. Pages that have not moved keep the post-render localization. It is never applied to React output, because localizing the same text twice re-formats numbers that are already localized. The last presentation move deletes it.
8. **Raw HTML.** Components do not interpolate HTML strings. `dangerouslySetInnerHTML` appears only in one audited component, and only for the temporary legacy-body boundary in DEMO-328 or content a change proves is already trusted HTML.
9. **Safe error page.** The unexpected-failure document stays a dependency-free constant, so it still renders when presentation code is what failed.
10. **Acceptance.** Output is compared as parsed documents, not as bytes, because React serialization differs from the current templates without changing the document.
11. **Toolchain.** The baseline pins Node 26 and npm 11. Node 26 becomes the Active LTS line in late October 2026 and is supported until April 2029, while Node 22 support ends in April 2027. The repository's checks already pass on Node 26.7.0 and npm 11.19.0, and the current `22.x` and `10.x` engines under `engine-strict` make `npm install` fail with `notsup` on the maintainer's Node 26 machine.

## Findings this sequence closes

Findings are grouped by class:

- `PRESENTATION`: how HTML is produced.
- `SECURITY`: browser security policy.
- `STYLE`: how stylesheets are authored and delivered.
- `I18N`: how presentation is localized.
- `DELIVERY`: what the Worker bundle carries.
- `DEFECT`: incorrect behavior or metadata.
- `TOOLCHAIN`: the versions the repository pins.
- `DRIFT`: repositories that no longer share conventions.

### PRESENTATION — HTML is assembled from strings

- **F1.** Every HTML response is built from template strings: `src/ui/page.ts` and 22 page, presentation, and document modules. Safety depends on each interpolation remembering `escapeHtml`; nothing structural enforces it.
- **F2.** Demo presentations are HTML strings. Their IDs and ID references are rewritten with regular expressions (`namespaceIds` in `src/ui/demo-section.ts`). The workbench inserts them with `innerHTML` and re-creates their `<script>` elements to run them.

### SECURITY — the policy allows inline code

- **F3.** Every page ships inline scripts and styles, as the Context table counts, so the site-wide policy allows `'unsafe-inline'` for scripts and styles. `wizardgang.ai` already serves a policy without it.
- **F4.** The Cloudflare edge injects its Web Analytics beacon into every HTML response, and the Worker's policy blocks it. Each page load logs a Content Security Policy violation, the beacon never runs, and the demo's data governance does not declare that processing.

### STYLE — stylesheets are strings with drifted copies

- **F5.** The stylesheets are TypeScript template strings partitioned at hard-coded text markers, plus a hand-minified critical sheet and five page-level `<style>` blocks. The copies have drifted. `--violet` is `#a489ff` in the critical and base sheets but `#a98fff` in the runtime override that wins. The light theme's `--cyan` is `#006276` in the base sheet but `#005a6d` in the override.

### I18N — localization rewrites finished HTML

- **F6.** `localizePresentation` in `src/i18n/presentation.ts` splits finished markup into tags and text with regular expressions. It translates exact English strings and number patterns, rewrites internal links and GET forms, and substitutes string literals inside inline scripts.

### DELIVERY — the Worker carries browser files

- **F7.** 9,384,480 bytes of the Worker upload are files only browsers use, bundled as Text modules: the GraphiQL bundle (5,274,755 bytes), three Monaco editor workers (2,716,683 bytes), the GraphiQL stylesheet (812,551 bytes), and axe-core (580,491 bytes).

### DEFECT — incorrect source links and unreachable code

- **F8.** Two public source links name code the Worker never runs. The homepage route declaration names `src/ui/page.ts` `renderIndex`, but its handler renders `renderHome` from `src/ui/home.ts`, so the route manifest and the live homepage footer's "Route source" link point to dead code. The accessibility demonstration's route source names `src/demos/accessibility.ts`, which is not in the Worker bundle.
- **F9.** The source tree carries unreachable code:
  - `src/ui/page.ts` still exports `renderIndex`, `demoContent`, and a second `renderNotFound`. That copy links to the unregistered `operations.index` route, so `routeUrl` would throw if it ran. The `/demos` and `/assurance` handlers call it for `?view=`, which the router already answers with the ordinary 404.
  - `src/demos/mcp-page.ts` (249 lines) is imported by nothing since the MCP demonstration moved to `src/demos/mcp-curated.ts`. Its `.mcp-page-header` rules survive in `src/ui/styles.ts` only because the dead module still names the class.
  - Nine `DemoDefinition` modules (`src/demos/accessibility.ts`, `api.ts`, `d1.ts`, `graphql.ts`, `i18n.ts`, `identity.ts`, `mcp.ts`, `r2.ts`, `webhooks.ts`) and `src/routing/cursor-link.ts` are imported by nothing and absent from the Worker bundle.
- **F10.** The safe error page offers "View health" at `/operations`, which is an ordinary 404.

### TOOLCHAIN — the pinned toolchain has fallen behind

- **F11.** Under `engine-strict`, the `22.x` and `10.x` engines refuse installation on Node 26, which the maintainer's machine runs. TypeScript 5.9.3 trails the TypeScript 7.0.2 that `wizardgang.ai` and YarReader use, and `scripts/lint.mjs` depends on the compiler API that the TypeScript 7 package no longer exports.

### DRIFT — the repositories share no baseline

- **F12.** WG-ARCH-001 sets the commit format, branching, and release model, but not the toolchain, commands, presentation stack, repository files, or GitHub settings. The repositories have diverged on each; see *Repository normalization*.

## Boundaries and non-goals

This sequence must not:

- change a route pattern, route ID, method, or machine contract, including REST, OpenAPI, GraphQL, MCP, webhooks, identity, reporting, and operations; `/api/demos/:demo` and `/api/assurance/:record` keep their paths, statuses, and HTML response type;
- change visible content, wording, layout, or color, except where a change lists the difference and its reason;
- add client hydration, a client-side router, a public page route, or a third-party script;
- remove a demonstration or capability, or break a released fragment deep link such as `/demos#graphql` or `/assurance#ISO27001-A.5.19`;
- restructure or strip JSON evidence records. When a file that an evidence record locates moves, update only that record's `locator.repositoryPath`; keep its ID, title, description, and relationships, and refresh its lifecycle source approval;
- change an assurance status unless the change produces the evidence, or create, backdate, or simulate an operating record;
- change a Cloudflare or GitHub setting without the owner's explicit approval in that change's session; record the before and after state by name;
- adopt Tailwind, redesign the interface, or move this repository to another GitHub organization;
- change another repository. Adoption elsewhere runs in each repository under its own change IDs.

## Delivery sequence

Changes are sequential and branch from the latest merged `main`. Do not consume a later reserved ID before the prior controlled change is merged. A presentation change deletes the legacy code and stylesheet rules it replaces in the same change, and the last change to use a shared legacy helper deletes the helper.

### DEMO-322 — DOCS — Define React presentation and repository normalization plan

- create this active root implementation plan and reserve DEMO-323 through DEMO-340;
- let `scripts/validate-documentation-cleanup.mjs` accept change IDs in the root `IMPLEMENTATION_PLAN.md` only, because the plan is temporary coordination rather than current-state documentation; every other tracked Markdown file outside `docs/history/` stays covered, and a test proves both sides;
- state that rule in `AGENTS.md`;
- change no runtime, route, data, workflow, or provider configuration.

### DEMO-323 — DOCS — Publish the WG-ARCH-001 repository baseline

- add the *Repository baseline* section below to `docs/ARCHITECTURE-STANDARD.md` as a new numbered section after §26, without renumbering existing sections, because assurance documentation references target §03 and §08;
- name the presentation model in §01 and point to the new section;
- set WG-ARCH-001 to version 1.1 and update its issued date;
- record no repository's conformance in the standard; each repository's adoption stays in its own history;
- change no assurance status or documentation relationship.

Closes F12.

### DEMO-324 — FIX — Correct public source links and remove unreachable code

- point the homepage route declaration at `src/ui/home.ts` `renderHome`, point the accessibility demonstration's route source at the module that renders it, and regenerate `docs/route-manifest.json`;
- delete the unreachable code listed in F9, together with the unreachable `?view=` branches and the stylesheet rules that only the deleted markup used; keep the router's `?view=` 404;
- make the safe error page link only to a registered page;
- add tests: each page route's declared source module exports its declared function; every `src/` module is reachable from the Worker entry or listed as tooling-only; the safe error page links only to registered routes.

Closes F8, F9, F10.

### DEMO-325 — TEST — Capture the presentation acceptance baseline

- render every HTML surface through `routeRequest` in Vitest: the public pages and each route state in `config/site-audit-states.json`, `/admin` authenticated, `/offline`, the ordinary 404, all 12 demo presentations, and the record panes for ISO27001-A.5.19, ISO42001-A.9.4, and WCAG-2.4.7;
- parse each response with happy-dom, which later changes also use for browser-module tests, and record a normalized semantic inventory:
  - status and security headers;
  - `lang`, `dir`, title, description, and canonical and Open Graph metadata;
  - landmarks and the heading outline;
  - links and buttons with accessible names and targets;
  - form controls with labels, names, and values;
  - element IDs and fragment targets, and `data-*` behavior hooks;
  - the script and stylesheet inventory;
- record every surface in English and Arabic, and the translated text inventory (headings, accessible names, labels) in Spanish, French, German, and Japanese;
- normalize volatile values, such as timestamps, request IDs, commit SHAs, availability figures, and generated row IDs, so the inventories are deterministic;
- store the inventories as Vitest file snapshots under `tests/fixtures/presentation-baseline/`; a later change updates an entry only for a difference its controlled record lists;
- change no file under `src/`.

### DEMO-326 — BUILD — Adopt the baseline Node, npm, and TypeScript toolchain

- pin Node 26 exactly in `.node-version` with `engines.node` `26.x`, and npm 11 exactly in `packageManager` with `engines.npm` `11.x`; keep `engine-strict=true`;
- approve the dependency install scripts the build needs, such as `workerd`, `esbuild`, `sharp`, and `fsevents`, in `allowScripts`, so `npm ci` behaves the same locally and in CI; document the rule in `CONTRIBUTING.md`;
- move to TypeScript 7 and fix what it reports without weakening `strict` or other options;
- move `scripts/lint.mjs` from the TypeScript compiler API to a maintained TypeScript and TSX parser, for example `oxc-parser`, keeping every rule and its failure output;
- keep every workflow and `scripts/validate-toolchain.mjs` reading `.node-version`;
- run `npm run validate:ci`.

Closes F11.

### DEMO-327 — BUILD — Serve browser assets from Workers Static Assets

- add Vite 8 as a direct dev dependency and build stylesheets, and later browser modules, into `dist/client/assets/` with content-hashed names;
- move the stylesheet strings, the page-level `<style>` blocks, and the critical sheet into `src/styles/shell.css` and `src/styles/demos.css`, and retire the marker partitioning in `src/ui/style-delivery.ts`; consolidate each drifted token at its effective value;
- add the `ASSETS` binding (`directory` `./dist/client`, `run_worker_first: true`), serve built files through the registered asset routes, and move the vendored GraphiQL, Monaco worker, and axe-core files and the social image out of Worker Text and Data modules, keeping every published path;
- generate the asset map and check it in `npm run check`;
- make `npm run build` build client assets before the Worker, and make `npm run dev` run the Vite build in watch mode alongside `wrangler dev`; after deployment, `deploy.yml` verifies one hashed stylesheet and one vendored asset;
- update `scripts/validate-stylesheet-classes.mjs` to read the CSS files, and `vitest.config.ts` for the new imports;
- record the Worker upload before and after.

Closes F5, F7.

### DEMO-328 — REFACTOR — Move the shared shell into React

- add `react` and `react-dom` 19 with their types; compile TSX with the automatic runtime; keep Worker code on the `WebWorker` library, give browser modules their own `tsconfig` with DOM libraries, and make `npm run typecheck` check both;
- render the document from React:
  - `<html>` with `lang` and `dir`;
  - head metadata: title, description, robots, Open Graph, canonical, icon, stylesheets, and theme restoration;
  - the skip link;
  - the header: brand, primary navigation projected from route declarations, and utilities (source, theme toggle, language selector);
  - `<main>`;
  - the footer: security, issue, route source, and build identity;
- while page bodies are still strings, place them through one temporary legacy-body boundary, which DEMO-333 deletes;
- move the theme toggle, the language selector's submit on change, and the fragment-preserving form behavior from inline scripts and the inline `onchange` into a shell browser module. The selector keeps working without JavaScript through its `noscript` button. Theme restoration before first paint stays as it is until DEMO-338;
- give components the request's localization context, covering translation with fallback, the exact-English lookup of `src/i18n/presentation.json`, plurals, numbers, dates, currency, lists, locale-aware links and GET forms, and message bundles for browser modules. Resources and `npm run validate:locales` do not change, and shell text keeps its localization keys;
- update EVD-SRC-007's locator, and the sentences in `docs/ACCESSIBILITY.md` and `docs/INTERNATIONALIZATION.md` that name `src/ui/page.ts`;
- rewrite the tests that pin the string shell, such as `html-self-parsing-guard`, `document-composition`, and the DEMO-277, DEMO-279, and DEMO-280 tests, so they pin the React document.

### DEMO-329 — REFACTOR — Move the homepage and operational pages into React

- render `/` with its live proof, `/security`, `/admin` with its protected controls, `/offline`, and the ordinary 404 from React components; handlers load data and components render it;
- localize them at render time and move their inline behavior to browser modules;
- update route source declarations to the new modules and regenerate the manifest.

### DEMO-330 — REFACTOR — Move the assurance workbench into React

- render `/assurance` (framework tabs, section selection, record grid, and focused record pane) and the record presentation at `/api/assurance/:record` from React, localized at render time;
- move the workbench script to a browser module that builds DOM nodes instead of concatenating HTML and receives its messages as data; keep record deep links, loading announcements, and caching;
- keep JSON evidence and Markdown documentation references presented side by side, exactly as today.

### DEMO-331 — BUILD — Release the React document shell as v0.27.0

After DEMO-323 through DEMO-330 are merged and green:

- release as `v0.27.0`, with v0.26.0 as the previous release and rollback target; name the new `ASSETS` binding in the release record;
- run the Worker-secret preflight before the tag is pushed; this release adds no Worker secret;
- after deployment, verify:
  - version and commit;
  - the four public pages and the 404 in English and Arabic;
  - one hashed stylesheet and one vendored asset, with immutable caching;
  - the D1 and REST presentations and the three record panes;
  - theme, language, and deep-link behavior in a browser;
  - server response time and CPU time for `/`, `/demos`, and `/assurance`, compared with v0.26.0;
- stop and ask the owner before pushing the tag.

### DEMO-332 — OPS — Record the verified v0.27.0 deployment

- add the v0.27.0 record to `docs/history/DEPLOYMENTS.md` from the release verification, in the format `docs/RELEASE-MANAGEMENT.md` defines.

### DEMO-333 — REFACTOR — Move the demos workbench into React

- render `/demos` (category tabs, local selectors, active-demonstration header, inspector, and tools) from React, localized at render time;
- move the workbench script to a browser module. A migrated presentation names its browser module in a data attribute on its root, and the workbench imports the module and mounts it on the inserted fragment. The workbench keeps re-executing inline scripts only for presentations that have not moved yet, and DEMO-337 deletes that path;
- render migrated presentations inside a React scope that prefixes IDs and ID references and sets heading levels, replacing `namespaceIds` for them;
- delete the temporary legacy-body boundary, now that every full page renders from React.

### DEMO-334 — REFACTOR — Move the D1 and R2 demonstrations into React

- render the D1 and R2 presentations from React, localized at render time, and move their behavior into workbench-mounted browser modules that receive their messages as data;
- keep every request, the SQL and response inspector fields, reset, upload, and D1 as the default demonstration;
- update each demonstration's `sourcePath` and route source.

### DEMO-335 — REFACTOR — Move the REST and GraphQL demonstrations into React

- render the REST and OpenAPI console and the GraphQL console from React, localized at render time, with their behavior in browser modules;
- render the GraphiQL document from React and move its setup script into a module; the GraphiQL route keeps its own policy, because Monaco injects styles and runs `blob:` workers.

### DEMO-336 — REFACTOR — Move the webhook and identity demonstrations into React

- render the signed-webhook and OAuth, OpenID Connect, and SAML presentations from React, localized at render time, with their behavior in browser modules;
- keep every identity flow, provider-readiness state, and error path exactly as it behaves today.

### DEMO-337 — REFACTOR — Move the MCP, platform, and quality demonstrations into React

- render the MCP, Edge, Workers, Durable Objects, accessibility, and internationalization presentations, and the accessibility-lab frame documents, from React, localized at render time; the deliberately failing fixture stays as failing and as inert as it is today;
- update EVD-SRC-006's locator;
- delete the workbench's inline-script re-execution, `namespaceIds`, the HTML string builders, the string `pageContent` and `renderPage` paths, and `localizePresentation` with its regular expressions, now that nothing uses them;
- the presentation baseline stays unchanged in all six locales, apart from differences the controlled record lists.

Closes F1, F2, F6.

### DEMO-338 — SEC — Remove unsafe-inline from the Content Security Policy

- remove `'unsafe-inline'` from `script-src` and `style-src` in the site-wide policy; restore the theme before first paint without inline script, through an external blocking asset or a hash-listed script;
- keep GraphiQL on its own route policy;
- with the owner, decide Cloudflare Web Analytics for this hostname. The recommended option is to turn off automatic beacon injection, because the demo's data governance does not declare that processing. The alternative is to declare it and allow its script and connect origins. Record the provider state before and after;
- test that no HTML response contains an inline event handler, an inline style, or an inline script that the policy does not list by hash, and that browsing every audited state logs no policy violation.

Closes F3, F4.

### DEMO-339 — TEST — Enforce React presentation and baseline conformance

Lock the contract so the sequence cannot silently regress:

- every HTML response except the safe error page renders from React, through the shared document or a declared standalone document;
- `src/` builds no HTML with template strings, and uses `dangerouslySetInnerHTML` only in the audited component;
- no hydration API, such as `hydrateRoot` or `createRoot`, and no client-side router ships to browsers;
- stylesheets come only from `src/styles/`, and the stylesheet-class validator reads CSS and TSX;
- browser assets are content-hashed, immutable, and served from static assets, and the Worker bundle carries no browser-only vendored file;
- the site-wide policy contains no `'unsafe-inline'`;
- the presentation baseline passes in all six locales;
- `scripts/validate-repository-baseline.mjs` checks the WG-ARCH-001 baseline: toolchain pins, commands, root files, and workflows. Other repositories can copy the script.

### DEMO-340 — BUILD — Release React presentation as v0.28.0

After DEMO-332 through DEMO-339 are merged and green:

- release as `v0.28.0`, with v0.27.0 as the previous release and rollback target;
- run the Worker-secret preflight before the tag is pushed; this release adds no Worker secret;
- move the durable rules into the `AGENTS.md` architecture invariants: React presentation, no `'unsafe-inline'`, and static assets. Then retire this plan; the validator rule for an active root plan stays for later plans;
- stop and ask the owner before pushing the tag;
- afterwards, record the v0.28.0 deployment under the next ID.

## Repository baseline

DEMO-323 publishes this section in WG-ARCH-001.

**Applicability.** The baseline applies to every WizardGang product repository, meaning any repository that deploys a production surface or publishes releases. Laboratory repositories that never deploy production adopt only the toolchain and command rules. Repositories without executable source are out of scope.

**Toolchain.**

- Node.js 26: the exact version in `.node-version`, and `engines.node` `26.x`.
- npm 11: the exact version in `packageManager`, and `engines.npm` `11.x`. `.npmrc` sets `engine-strict=true`, and dependency install scripts run only when `allowScripts` approves them.
- `"type": "module"` and a committed `package-lock.json`. CI installs with `npm ci`.
- TypeScript 7 in `strict` mode; `npm run typecheck` checks every TypeScript program in the repository. Tooling does not depend on the TypeScript compiler API.
- Cloudflare Workers through Wrangler 4, configured in `wrangler.jsonc`. Files that browsers download are served from Workers Static Assets, not bundled into Worker code.
- Vite 8 builds browser modules and stylesheets into content-hashed files.
- Vitest 5 runs tests that need TypeScript, TSX, or a DOM; `node:test` is acceptable for plain Node scripts.

**Presentation.**

- HTML documents render from React 19 components, on the server or at build time, and are complete and usable without JavaScript.
- Browser behavior is first-party TypeScript that progressively enhances that HTML, without client hydration or a client-side router. A repository that needs a client application, such as a game, a canvas, or an offline reader, records that boundary in its architecture document.
- The Content Security Policy does not allow `'unsafe-inline'`. HTML carries no inline event-handler attributes, and any inline script or style is allowed only by hash or nonce. Raw HTML insertion is confined to one audited component.
- Stylesheets are CSS files processed by Vite, not strings. Tailwind CSS 4 may be used through Vite.

**Commands.** `package.json` defines:

- `dev`: local development only; it never deploys or selects a production environment;
- `build`: the production build, without deploying;
- `typecheck` and `test`;
- `check`: every repository validation that needs no provider credentials; CI runs it on every pull request and on `main`.

Deployment commands run only in the tag-driven release workflow; local use is limited to dry runs.

**Repository contents.**

- The root holds `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`, `.gitignore`, `.node-version`, `.npmrc`, `package.json`, `package-lock.json`, and `tsconfig.json`, plus `wrangler.jsonc` in a Workers project.
- `.github/workflows/ci.yml` runs `check`; a repository that releases also has `release.yml`.
- There is no `CHANGELOG.md` or per-version Markdown archive; annotated tags and GitHub Releases are the release history.

**Change control.**

- Each repository declares one change-ID prefix.
- Commit and pull-request titles use `[PREFIX-###] [TYPE] Imperative summary` with exactly one type from the §16 list, which is the complete vocabulary. CI validates pull-request titles, and `npm run check` validates that IDs are sequential.
- Branches are named `prefix-###-imperative-summary`.
- Commit bodies carry the controlled record that the repository's change-management document defines.

**GitHub settings.**

- `main` is the default branch.
- A `main` ruleset requires a pull request and the CI status checks, and blocks force pushes and deletion.
- A `v*` tag ruleset blocks updates and deletion.
- Only merge commits are allowed, and head branches are deleted on merge.
- The expected settings are committed, for example in `config/github-repository-settings.json`, and a documented command verifies them.

**Release.**

- Releases are annotated semantic-version tags, each with one GitHub Release, and `package.json` carries the tagged version.
- Production deploys only from a release tag, through a workflow with a protected environment.

## Repository normalization

Measured on 2026-09-19 from each default branch and the GitHub API:

| Repository | Node and npm pins | TypeScript | Stack and tests | CI and releases | Settings | Missing baseline files |
|---|---|---|---|---|---|---|
| `Wizard-Gang/WizardGang` | none | 7.0.2 | React 19.3, Vite 8.3, Tailwind 4.3; `node:test` | no workflow on `main`; no tags; production still serves the 2026-09-02 build `ccb93e3` | no rules or protection; all merge methods; merged branches kept, 23 on origin | `AGENTS.md`, `CONTRIBUTING.md`, `LICENSE` |
| `Wizard-Gang/SharkTank` | `.nvmrc` 24; engines `^22.12.0 \|\| >=24.0.0` | ^5.6 | React 18.3 with `@react-three/fiber` 8, Vite 8.2; Vitest 4.1 | CI and release; tags `v1.3.5` and `v1.3.7` carry `package.json` version 1.3.4 | classic protection; all merge methods | none; has `CHANGELOG.md` |
| `Wizard-Gang/Hexframe` | none; `allowScripts` present | ^5.9 | Vite 7; Vitest 3.2 | CI, deploy, and release; `v0.7.9` | classic protection; all merge methods | none; has `CHANGELOG.md`; no `check` script |
| `Wizard-Gang/YarReader` | engines `>=22.12.0` | 7.0.2 | `node:test` | CI and release; `v1.0.1` | classic protection; merge commits disabled | `AGENTS.md` |
| `SouthernGentlemen/wizardgang-architecture-demo` | Node 22.23.2, npm 10.9.8 | 5.9.3 | Vitest 5 | CI, deploy, release, and monitors; `v0.26.0` | rulesets for `main` and `v*`; merge commits only | none |
| `SouthernGentlemen/FightLab`, `Boneyard`, `SVGLab` | none | ^5.9 | Vite 7; Vitest 5 | verification workflows in FightLab only; no releases | all merge methods; merged branches kept | laboratories; SVGLab's `AGENTS.md` excludes CI/CD, release trains, and change IDs |
| `SouthernGentlemen/RealEstate`, `House` | — | — | no `package.json` | — | — | out of scope |

Open dependency pull requests on 2026-09-19: SharkTank 4, Hexframe 2, YarReader 1.

Change control has drifted as well. WG-ARCH-001 §16 defines 17 change types, but Hexframe's pull-request title check accepts 12 of them, and YarReader's accepts 12 that include `CI`, which the standard does not define. WizardGang's history also uses `COPY`, `UI`, and `SEO`. YarReader names branches `yr/YR-###-slug`; the others use `prefix-###-slug`. The CI workflows of Hexframe and YarReader pin Node 22 inline, and SharkTank's reads `.nvmrc`.

Adoption happens in each repository under its own change IDs, after DEMO-323 publishes the baseline:

- **WizardGang**, only after its WG-053 through WG-061 sequence has landed: add a permanent CI workflow in place of per-change temporary ones; adopt tag-driven release and deployment; add `AGENTS.md`, `CONTRIBUTING.md`, and `LICENSE`; pin the toolchain; use only §16 change types; commit its settings, with rulesets and branch deletion; clean up merged branches.
- **SharkTank**: replace `.nvmrc` with `.node-version`; pin npm; move to TypeScript 7 and Vitest 5; rename `verify` to `check`; bring `package.json` in line with its tags; retire `CHANGELOG.md`; replace classic protection with rulesets; allow only merge commits. React 19 needs `@react-three/fiber` 9 and is a separate change.
- **Hexframe**: pin Node and npm; move to TypeScript 7, Vite 8, and Vitest 5; add a `check` gate; accept the full §16 type list; retire `CHANGELOG.md`; use rulesets and merge commits only.
- **YarReader**: add `AGENTS.md`; pin Node and npm; add a `check` gate; replace `CI` with §16 types and use `yr-###-slug` branches; enable merge commits and disable squash and rebase merges; use rulesets.
- **Laboratories** (FightLab, Boneyard, SVGLab): adopt the toolchain and command rules only.

## Validation expectations

Every controlled change follows `AGENTS.md` and `docs/CHANGE-MANAGEMENT.md`.

At minimum, repository-changing tasks complete the standard validation loop:

- `npm run check`
- `npm run validate:migrations`
- `npm run security:dependencies`
- `npm run build`
- `git diff --check`

Further validation depends on what a change touches:

- **Presentation** (DEMO-328 through DEMO-338): also run `npm run test:site-accessibility`, `npm run validate:site-accessibility`, `npm run validate:site-i18n`, and `npm run validate:locales`. Exercise each moved surface in a browser in English and Arabic: keyboard use, deep links, and the demonstration's actions. List every presentation-baseline difference in the controlled record.
- **Build, workflow, or toolchain** (DEMO-326, DEMO-327, DEMO-338, DEMO-339): also run `npm run validate:ci`.
- **Evidence locators** (DEMO-328, DEMO-337): also run `npm run validate:assurance` after refreshing the lifecycle source approvals.
- **Provider settings** (DEMO-327, DEMO-338): record the before and after state by name, and confirm it with the provider's CLI or API.
- **Releases** (DEMO-331, DEMO-340): follow `docs/RELEASE-MANAGEMENT.md`, and stop for the owner's approval before the tag is pushed.

## After this sequence

- Moving this repository into the `Wizard-Gang` organization, next to the other public WizardGang repositories, needs an owner decision. Source links in deployed pages and evidence would change, although GitHub redirects the old URLs.
- A shared `.github` repository could host reusable CI workflows and community-health files once several repositories run the same CI.
- SharkTank's move to React 19 depends on `@react-three/fiber` 9.
- WizardGang and YarReader move to Vitest only when a suite needs it.
