# Shell Consolidation Implementation Plan

Status: **Active**

Scope: post-v0.22.0 consolidation of the shared site header, footer, and stylesheet delivery.

This file is the active planning source of truth for DEMO-273 through DEMO-281. Runtime route declarations and permanent contract documents remain authoritative for shipped behavior. Retire or delete this plan after the sequence is released and its durable requirements have been absorbed by permanent contracts/tests.

## Context

v0.21.0 reduced the browser product to Home, Demos, Assurance, contextual Security, and hidden operational/recovery boundaries. v0.22.0 turned `/demos` into a focused workbench. Both passes consolidated **page bodies**. Neither touched the shared shell.

`src/ui/page.ts`, `src/ui/styles.ts`, `src/ui/navigation-styles.ts`, `src/ui/runtime-styles.ts`, and `src/routing/navigation.ts` are byte-identical between `38b23d9` (v0.21.0) and `39ed539` (v0.22.0). The shell still carries navigation machinery built for a page hierarchy that no longer exists, and every consolidation has left its retired CSS behind.

Measured against the deployed v0.22.0 build:

| Observation | Value |
|---|---|
| Shell navigation elements rendered on `/`, `/demos`, `/assurance`, `/security`, `/offline` | `0` |
| Header utilities width at 1024px | `381px` (brand is `137px`) |
| Language selector width alone | `212px` |
| Header height at 375px | `159px`, three wrapped rows |
| Inline `<style>` per response | `105,685 B`, uncacheable |
| `/demos` HTML response | `142,934 B` |
| Dead class selectors in the three style modules | `97` of `347` |
| Stylesheet rules matching no markup in `src/` | `257` rules, `24,071 B` — 24.5% of `styles.ts` |

The dead-CSS share grew from 16.4% at v0.21.0 to 24.5% at v0.22.0 because DEMO-268 removed the REST/OpenAPI evidence markup and left twenty-one `rest-*` and four `openapi-operation*` rule blocks in place. No previously-dead selector was revived by the workbench series. The pattern is consistent and accelerating: consolidation removes markup, CSS accumulates.

## Product goal

Make the shell cost what it is worth:

- the header is one row at every viewport width;
- utilities never outweigh product navigation;
- the footer satisfies the reachability contract that `docs/FRONTEND-ROUTES.md` already states;
- navigation projections derive from route declarations, with no hardcoded route allowlist;
- no shell code path renders nothing;
- the stylesheet stops shipping retired surfaces, and stops shipping uncacheably.

The visitor should experience the shell as: **know where you are, get to the source, get out of the way.**

## Findings this sequence closes

Findings are grouped by class. `DEAD` code executes and produces nothing. `A11Y` is a conformance failure. `DRIFT` is code disagreeing with a permanent contract. `WEIGHT` is payload.

### DEAD — the shell navigation layer never renders

- **F1.** No route declares `navigation: 'secondary'`. `secondaryNavigation()` returns `[]`, `secondaryNavigationHtml()` returns `''`, `shellNavigation()` returns `''`. `<div class="shell-navigation">` has never rendered in any published build. `RELATED_NAVIGATION` (assurance → security) is part of this layer and has never appeared.
- **F2.** `breadcrumbNavigation()` (`src/ui/page.ts:118`) walks the parent chain and detects cycles across 35 lines. The shell never calls it; its only caller is `tests/navigation-projection.test.ts:58`. With a one-level hierarchy every breadcrumb it could emit reads `Architecture / Demos` — the primary nav restated.
- **F3.** `ancestorRouteIds()` feeds `data-section-current`, but the only ancestor any page has is `interfaces.frontend.index`, which `primaryNavigation()` excludes as the hierarchy root. The attribute is never emitted.
- **F4.** `tests/navigation-projection.test.ts` asserts on stylesheet *text*, requiring `navigationStyles` to contain `.secondary-navigation a::after`, `border-radius: 999px`, and `body[data-route-id^='platform.'] main.site-main`. The last selector is unmatchable: no `platform.*` route has `kind: 'page'`. This test pins the dead CSS in place and will fail when it is removed.

The whole of `src/ui/navigation-styles.ts` (3,981 B) ships inline on every response and matches no markup.

### A11Y — the theme toggle fails WCAG 2.5.3 Label in Name (Level A)

- **F5.** Visible text is `Theme: Dark`; accessible name is `Switch to Light theme`. The accessible name does not contain the visible label, which is the failure condition, and voice control cannot reach the control by its visible name. The button additionally carries `aria-pressed` alongside a name that changes on toggle, encoding state twice and contradictorily. The control is in the shell, so the failure is present on every page, including `/assurance` where accessibility posture is published.

### DRIFT — code disagrees with permanent contracts

- **F6.** `docs/FRONTEND-ROUTES.md` states that `/security` "is reachable from footer or contextual security links rather than primary product navigation." There is no Security link in the footer on any page. The footer's only links are Report an issue and Route source.
- **F7.** `src/routing/navigation.ts:16` holds `MVP_PRODUCT_ROUTE_IDS = new Set(['demos.index', 'assurance.index'])`, and `primaryNavigation()` filters against it. `security.index` declares `navigation: 'primary'` in `src/assurance/route-capabilities/advisories.ts`. The declaration says primary, the contract says not primary, and the hardcoded set silently enforces the contract while hiding the disagreement. This is the only place where the AGENTS.md invariant "treat route declarations as the runtime route source of truth" is not true.
- **F8.** Header proportions invert the site's own thesis. At 1024px: brand 137px, nav 418px (roughly 110px of ink around a centred pair of links), utilities 381px, of which the language form alone is 212px. At ≤760px, `.header-utilities > a { display: none }` hides the Source link while the language form survives intact.
- **F9.** The mobile header has three compounding faults. (a) At ≤620px, `header { flex-direction: column }` combines with `.nav { flex: 0 0 100%; border-top: 1px solid }` — in a column container `flex-basis` sizes height, so `.nav` shrinks to content width and its `border-top` renders as a hairline that stops mid-header. (b) `.header-utilities { margin-inline-start: auto }` right-aligns row two between left-aligned rows one and three. (c) The ≤620px `.language-selector label` rule re-sets `display` and `min-height` but never clears the `position: absolute` / `width: 1px` / `clip` from the ≤760px rule, so it is inert.
- **F12.** Residue. `Route source` renders twice on `/security`, in `.page-tools` and in the footer, both resolving to `src/demos/security-page.ts`. `styles.ts` styles bare `header` / `main` / `footer` while `navigation-styles.ts` and `runtime-styles.ts` style `.site-header` / `.site-main` — two conventions, differing specificity, split across files. `.bar` in the shell width rule at `styles.ts:61` has no markup in `src/`. The footer carries `justify-content: space-between`, `flex-wrap: wrap`, and a ≤620px `flex-direction: column` rule for a single `<span>` child.

### WEIGHT — the stylesheet

- **F10.** The homepage is 112,477 bytes of HTML, of which 105,685 are the inline `<style>` block; the body content is roughly one kilobyte. Because it is inline it is never cached, so a visitor reading all four public pages downloads the same stylesheet four times.
- **F11.** 257 rules totalling 24,071 bytes reference only class names with no occurrence anywhere in `src/`. They cluster by retirement: the removed `/operations` dashboard (`operations-kpis`, `usage-products`, `availability-kpis`, `activity-list`), the removed API explorer (`api-explorer`, `api-sandbox`, `api-endpoint-nav`, `openapi-*`, `graphql-frame`), the removed platform hierarchy (`schema-*`, `section-nav`, `related-interfaces`, `machine-links`, `locale-switcher`), and the REST evidence removed by DEMO-268 (`rest-*`).

## Target shell composition

### Header

One row, three zones, at every width:

```
◧ WIZARDGANG        DEMOS   ASSURANCE            Source↗   ◐   [EN ▾]
```

- brand mark plus wordmark; the `Architecture demo` subtitle is removed, not merely hidden, since `<title>` and the page `h1` already carry it and it is already suppressed below 700px;
- primary navigation stays exactly Demos and Assurance, derived from declarations;
- `Source` remains visible at every width;
- the theme control becomes an icon button with a stable accessible name and `aria-pressed`, removing the Label in Name mismatch;
- the language control becomes a bare `<select>` that submits on change, with a `<noscript>` Apply fallback preserving no-JavaScript operation;
- the header must not wrap, which retires the ≤620px column rules and the partial-hairline defect.

### Footer

One row, two groups:

```
SECURITY · REPORT AN ISSUE · SOURCE · ROUTE SOURCE          v0.22.0 · 39ed539
```

- Security satisfies the reachability contract;
- version and commit are already computed by `versionProof()` in `src/ui/home.ts` but shown only on the homepage; in the shell every page becomes self-identifying, which is the point of an architecture demonstration;
- `Route source` leaves `.page-tools`, resolving the duplication — shell-level provenance belongs in the shell;
- `space-between` becomes meaningful once the footer has two real children.

### Stylesheet delivery

- purge the retired-surface rules;
- split the remainder into shell/shared primitives and demo-specific;
- serve the shell sheet content-hashed from the existing `/assets/{asset}` route (`operations.assets`, `GET`/`HEAD`, cacheable), retaining a small critical inline block so the header never flashes;
- inject demo CSS on `/demos` through `headExtra`, the mechanism `src/ui/home.ts` already uses.

## Boundaries and non-goals

This sequence must not:

- add, retire, or alias any public page route;
- broaden primary navigation beyond Demos and Assurance;
- move `/security` into primary navigation;
- restore breadcrumbs, secondary navigation, or related-destination navigation;
- reintroduce the retired `/operations` browser page;
- change machine, API, or protocol contracts;
- change canonical assurance data or reporting contracts;
- remove the brand mark, which is six lines of CSS, needs no image request, shares geometry with the favicon data URI, and correctly sets `forced-color-adjust: none` under `forced-colors: active`;
- weaken the 44px minimum target sizes in `src/ui/runtime-styles.ts`;
- remove localization capability while reducing the size of its control;
- claim standards certification.

## Delivery sequence

Changes are sequential and should normally branch from the latest merged `main`. Do not consume a later reserved ID before the prior controlled change is merged unless the work is intentionally stacked and its base is explicit.

### DEMO-273 — DOCS — Define shell consolidation plan

- create this active root implementation plan;
- bind `AGENTS.md` to it while active;
- reserve DEMO-274 through DEMO-281;
- no runtime or route changes.

### DEMO-274 — REFACTOR — Remove the unreachable shell navigation layer

Pure deletion. Output HTML is byte-identical apart from the reduced `<style>` block.

- delete `src/ui/navigation-styles.ts` and its import in `src/ui/page.ts`, salvaging only the `@media (max-width: 700px)` `.brand` and `.nav` rules that apply to live markup;
- delete `breadcrumbNavigation`, `secondaryParent`, `secondaryNavigationHtml`, `shellNavigation`, `ancestorRouteIds`, and `RELATED_NAVIGATION` from `src/ui/page.ts`, and the `data-section-current` attribute and its selector;
- delete `secondaryNavigation()` from `src/routing/navigation.ts`;
- remove `'secondary'` from the `PageMetadata.navigation` union, which no declaration uses;
- rewrite `tests/navigation-projection.test.ts`, dropping the breadcrumb and stylesheet-text assertions while keeping URL-projection and `aria-current` coverage.

Closes F1, F2, F3, F4.

### DEMO-275 — FIX — Restore declaration-driven primary navigation

- set `security.index` page metadata to a non-primary navigation value matching what `docs/FRONTEND-ROUTES.md` already states;
- delete `MVP_PRODUCT_ROUTE_IDS` so `primaryNavigation()` filters on the declaration alone;
- confirm `architectureMapEntries()` still projects exactly Demos and Assurance without the allowlist;
- run `npm run generate:routes` and commit both `docs/ROUTES.md` and `docs/route-manifest.json` before validation, per the cloud development contract in `AGENTS.md`.

Closes F7.

### DEMO-276 — A11Y — Consolidate the site header

- replace the theme toggle's changing accessible name with a stable one, retaining `aria-pressed`, so the accessible name and visible label agree;
- reduce the language selector to a `<select>` that submits on change, with a `<noscript>` Apply fallback;
- remove the brand subtitle;
- keep `Source` visible at every width;
- restructure the header so it does not wrap, retiring the ≤620px column rules, the `.nav` `border-top`, the `margin-inline-start: auto` utilities offset, and the inert ≤620px `.language-selector label` rule;
- unify on `.site-header` / `.site-main` / `.site-footer` and retire the bare-element selectors, including `.bar`;
- re-run `npm run validate:wcag`, `npm run validate:site-accessibility`, and `npm run validate:site-i18n`.

Closes F5, F8, F9, and the selector-convention and `.bar` parts of F12.

### DEMO-277 — FIX — Complete the site footer contract

- add the Security link, making `docs/FRONTEND-ROUTES.md` true;
- add version and commit, reusing the existing `versionProof()` projection rather than a second source;
- remove `Route source` from `.page-tools` now that the shell carries it;
- restore `space-between` as meaningful layout for two groups and remove the single-child wrap rules.

Closes F6 and the remainder of F12.

### DEMO-278 — REFACTOR — Purge retired-surface stylesheet rules

- remove the 257 rules whose selectors reference only classes absent from `src/`;
- retain `http-put`, `http-patch`, and `http-delete`, which are generated through `class="http-method http-${action.method.toLowerCase()}"`;
- confirm `status-pill` and `stat-ok` / `stat-warn` / `stat-down` are genuinely unreachable — the status helpers in `src/demos/assurance.ts`, `src/demos/assurance-minimal.ts`, and `src/demos/assurance-workbench-renderers.ts` emit only `badge badge-ok|warn|down`;
- add a repository check that fails when a stylesheet rule references only class names absent from `src/`, so the next consolidation cannot leave its CSS behind.

Closes F11, and prevents its recurrence.

### DEMO-279 — PERF — Serve the shell stylesheet from the cached asset route

- split the remaining stylesheet into shell/shared primitives and demo-specific;
- serve the shell sheet content-hashed through `operations.assets` with a long cache lifetime;
- retain a small critical inline block covering the header and above-fold so the shell never flashes;
- move demo CSS behind `headExtra` on `/demos`;
- confirm the content security policy in `src/lib/http.ts` admits the asset-served sheet;
- record before/after transferred bytes for `/`, `/demos`, `/assurance`, and `/security` in the controlled record.

Closes F10.

### DEMO-280 — TEST — Enforce shell consolidation acceptance

Lock the contract so this sequence cannot silently regress:

- the footer links to `security.index` on every page — the assertion that would have caught F6;
- primary navigation is exactly Demos and Assurance, derived from declarations with no allowlist;
- no response contains `shell-navigation`, `breadcrumb`, `secondary-navigation`, or `related-navigation`;
- the theme toggle's accessible name contains its visible label;
- the header does not wrap at 375px, 620px, 760px, or 1024px;
- version and commit appear in the footer on every page;
- `Route source` appears exactly once per page;
- the stylesheet contains no rule whose selectors are all absent from `src/`.

### DEMO-281 — BUILD — Release shell consolidation as v0.23.0

After DEMO-274 through DEMO-280 are merged and green:

- release as `v0.23.0`;
- record validation, deployment, rollback, and release evidence according to `docs/RELEASE-MANAGEMENT.md`;
- retain v0.22.0 as the previous release and rollback reference;
- retire this implementation plan after release once its durable requirements have moved into permanent contracts and tests.

## Validation expectations

Every controlled change follows `AGENTS.md` and `docs/CHANGE-MANAGEMENT.md`.

At minimum, repository-changing tasks complete the standard validation loop:

- `npm run check`
- `npm run validate:migrations`
- `npm run security:dependencies`
- `npm run build`
- `git diff --check`

Changes touching the shell additionally run `npm run validate:wcag`, `npm run validate:site-accessibility`, and `npm run validate:site-i18n`, because the header and footer appear on every audited page. Route-generation commands and generated artifacts are required only when authoritative route declarations change, which in this sequence is DEMO-275.
