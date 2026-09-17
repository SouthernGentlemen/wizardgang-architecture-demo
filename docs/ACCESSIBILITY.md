# Accessibility demonstration, global rendering baseline, criterion registry, and manual matrix

The whole site follows WCAG 2.2-oriented engineering practices, with Level AAA as the engineering target wherever the success criteria apply. Accessibility defaults belong to ordinary rendering: there is no separate accessible version of the site. `/demos#accessibility` makes twelve behaviors explicit through an operable interaction and an opt-in annotated-failure teaching preset. Failure examples are static code and explanation inside a titled `srcdoc` frame; intentionally inaccessible controls are not served as a normal public application state.

Status language is **WCAG 2.2 engineering evidence — no conformance claim**. The repository does not claim Level A, AA, or AAA conformance or certification. Criterion-level status records a bounded engineering assessment only; a `pass` record does not establish WCAG level conformance for the product as a whole. Automated checks are partial evidence and never prove AAA conformance.

## Global rendering baseline

`src/ui/page.ts` owns the ordinary HTML shell and `src/ui/runtime-styles.ts` owns the shared runtime accessibility additions. The shell provides the primary `main` landmark, a working skip link to that landmark, visible focus styling, a named primary navigation landmark, current-route state, a keyboard-operable theme control with programmatic state, and a native language selector. The request-scoped localization runtime supplies document `lang` and `dir` before HTML is emitted; Arabic therefore exercises the same shell in RTL rather than entering a separate accessibility or localization mode.

The shared runtime targets at least 44×44 CSS pixels for actionable controls where the enhanced target-size criterion applies, while preserving legitimate inline-link exceptions. Shared normal-text accent tokens are chosen to clear a 7:1 contrast ratio against their theme backgrounds; actual computed foreground/background combinations still require browser verification. Ordinary reading content is limited to a readable measure, technical content is isolated for bidi safety, and overflow containers are reserved for code/data presentations that may legitimately require horizontal scrolling.

Shared CSS removes nonessential animation and smooth scrolling when `prefers-reduced-motion: reduce` is active, preserves focus and boundaries in forced-colors environments, uses logical properties for direction-sensitive shared navigation, and keeps the shell responsive for narrow layouts and zoom/reflow. These are engineering defaults, not a conformance result.

The global baseline does not replace manual evaluation. Keyboard order, screen-reader semantics, focus visibility/obscuring, zoom and reflow, forced colors, target sizing, language/bidi behavior, actual computed contrast, text spacing, content comprehension, and other content-dependent success criteria still require manual verification on representative pages and releases.

## Public WCAG 2.2 criterion registry

`assurance/compliance/wcag-2.2.json` is the canonical public registry manifest. It points to four principle partitions under `assurance/compliance/wcag-2.2/` containing all current WCAG 2.2 Level A, AA, and AAA success criteria from W3C, excluding obsolete and removed 4.1.1 Parsing. Each criterion record carries the W3C criterion ID, name, level, implementation/evidence status, implementation note, automated/manual validation split, evidence IDs, known gaps, owner, and freshness rules.

`/assurance` exposes the WCAG 2.2 assessment records inside the shared assurance workbench. Stable criterion fragments such as `/assurance#WCAG-1.1.1` select one focused record; the record inspector exposes its published documentation and evidence while the exhaustive normalized records remain available from `GET /api/reporting/compliance?framework=wcag-2.2`, with exact lookup at `GET /api/reporting/compliance/WCAG-<criterionId>`. The workbench derives posture at request time and does not change the meaning of the canonical criterion status.

W3C remains the primary source for criterion identity and meaning:

- WCAG 2.2 Recommendation: `https://www.w3.org/TR/WCAG22/`
- W3C machine-readable WCAG 2.2 data: `https://www.w3.org/WAI/WCAG22/wcag.json`
- Understanding Conformance: `https://www.w3.org/WAI/WCAG22/Understanding/conformance.html`
- Understanding Techniques: `https://www.w3.org/WAI/WCAG22/Understanding/understanding-techniques.html`

The W3C criterion IDs, names, and levels are kept distinct from WizardGang-added implementation/evidence annotations. Techniques are informative; they are not substituted for the success criteria. Automated evidence is always marked partial or absent, and manual evaluation remains explicitly required.

### Registry status vocabulary

- `pass` — the criterion is self-evaluated as satisfied for the documented current scope with implementation, governing documentation, and current evidence; this does not establish framework-level conformance or certification.
- `partial` — meaningful implementation/evidence exists, but criterion-specific scope, manual evaluation, operating evidence, freshness, or another material part remains incomplete.
- `gap` — criterion-specific implementation or evaluation has a known failure or missing requirement.
- `not-applicable` — the triggering content or behavior is absent from the documented current scope; applicability must be reassessed when that scope changes.

The registry is reassessed before releases that change public accessibility behavior, on relevant content or interaction changes, and at least every 90 days for the documented manual review. These freshness rules describe when evidence must be revisited; they do not create a conformance claim.

## Current remediation baseline

The canonical public route registry and canonical WCAG registry are the audit inventories rather than a separate hand-written subset. The current baseline is grouped by WCAG principle:

- **Perceivable:** shared normal-text accent contrast targets the AAA enhanced threshold, ordinary reading measure stays bounded, technical overflow/bidi isolation is preserved, and forced-colors boundaries remain visible.
- **Operable:** shared actionable target sizing targets 44×44 CSS pixels where applicable, focus scroll clearance is preserved, nonessential motion is removed under reduced-motion preference, and OpenAPI code-sample tabs support Arrow/Home/End behavior with tab/tabpanel relationships.
- **Understandable:** intentionally broken accessibility examples remain accessible static annotations, help and authentication guidance stay consistent, and GraphQL has a plain-language first-party query workflow.
- **Robust:** the public surface uses first-party GraphQL interaction rather than embedded GraphiQL, native labels/status regions remain exposed, `/graphql` stays machine-only for browser HTML requests, and generated code-sample tabs retain explicit names/roles/relationships.

No criterion is promoted to conforming because of these engineering controls. Applicability and any N/A rationale remain owned by the canonical criterion records.

## Automated evidence

The isolated frame bundles `axe-core` from the locked application dependency and returns sanitized rule identifiers, impact levels, and duration through a validated `postMessage` envelope. Automated checking is partial coverage: a zero-violation result never establishes conformance. Annotated-failure mode is itself accessible and is scanned only as a teaching surface; the incorrect examples are inert code rather than live failures.

Repository regression coverage verifies the shared runtime baseline, inert teaching behavior, first-party GraphQL runner, OpenAPI tab semantics/keyboard code, public-route rendering, registry integrity, and the explicit no-conformance language. `npm run validate:wcag` validates canonical WCAG identity/evidence rules; `npm run validate:locales` validates the localized runtime. These checks do not decide manual success criteria.

## Manual verification matrix

| Area | Procedure | Expected accessible behavior | Release evidence |
|---|---|---|---|
| Keyboard sequence | Traverse representative public routes with Tab and Shift+Tab; exercise Enter, Space, Escape and widget-specific arrows | Logical order; every action operates without a pointer; no traps | Required |
| Visible focus | Traverse all interactive elements in both themes | A three CSS-pixel focus token remains visible and identifiable | Required |
| Focus not obscured | Traverse controls with persistent UI at 200% and 400% zoom | Focus is not fully hidden and remains reachable | Required |
| Dialog/disclosure | Open, traverse, dismiss, reopen and close each pattern | Correct initial focus, traversal, Escape behavior where appropriate, and trigger focus return | Required |
| Screen-reader semantics | Inspect landmarks, headings, form names, image text, tables, dialogs, status and relationships | Roles, names, descriptions, hierarchy and announcements are meaningful | Required |
| Target sizing | Inspect every actionable control at 100% zoom | Enhanced targets are at least 44×44 CSS pixels where 2.5.5 applies, with legitimate exceptions documented | Required |
| Accessible authentication | Paste into credential fields and use saved credentials/passkey where present | Paste/password managers are not blocked; no cognitive-function-only path is required | Required |
| Drag alternative | Complete any draggable action without dragging | A single-pointer/keyboard alternative provides the same outcome | Required |
| Zoom and reflow | Test 320 CSS-pixel width, 400% zoom and portrait/landscape changes | Ordinary content avoids two-dimensional scrolling; controls/content remain available | Required |
| Text resize/spacing | Test 200% text resize and WCAG text-spacing overrides | No clipping, overlap, lost controls or lost content | Required |
| Contrast | Inspect actual computed text/background, non-text, focus, helper and status combinations in both themes | Applicable AA/AAA contrast thresholds are met in real usage, not just token definitions | Required |
| Forced colors | Enable a forced-colors/high-contrast mode | Focus, controls, boundaries and state remain perceivable | Required |
| Reduced motion | Enable reduced motion and exercise interactive demos | Nonessential animation, transitions and smooth movement are removed or effectively disabled | Required |
| RTL | Exercise Arabic across navigation, forms, dialogs, tables, charts and code | Logical/visual order remains understandable; technical identifiers remain bidi-isolated | Required |
| Link purpose | Review repeated actions such as source/evidence/details links | Purpose is determinable from the link or its programmatic context as required | Required |
| Consistent help | Compare sibling routes and repeated view states | Help and repeated controls remain predictably located and named | Required |

### Verification evidence record

The current baseline includes source-level review of the canonical public route declarations, global page shell/runtime styles, accessibility laboratory, public GraphQL surface, OpenAPI generated UI, WCAG registry/validator, localization acceptance coverage, and accessibility regression tests.

The site-wide automated gate is described in `docs/SITE-ACCESSIBILITY-VERIFICATION.md`. Its deterministic checks and local Chromium/axe audit cover the canonical public-route inventory, configured critical states, all six locales, Arabic RTL, representative themes, 320 CSS-pixel reflow, reduced motion, forced colors, and keyboard smoke behavior. A green run means only that no automatically detectable violation was observed in that bounded matrix; it is not a WCAG 2.2 or Level AAA conformance claim.

Manual verification remains pending in `docs/accessibility-manual-verification.json`. Human keyboard traversal, named screen-reader review, 400% zoom and text-spacing review, rendered contrast interpretation, RTL visual/focus-order review, target-size exception review, dynamic announcement quality, and authenticated-state review must not be marked complete until actually performed and recorded with a reviewer, date, observed result, and evidence.

## Repository checks

`tests/interface.test.ts` verifies the shared localization/accessibility shell on representative ordinary pages as well as the sandbox boundary, accessible and annotated-failure fixtures, locally executed axe protocol, default mode, and all twelve criterion cards. `tests/wcag-aaa-remediation.test.ts` locks the shared baseline and prevents reintroduction of live broken controls or the public embedded GraphiQL UI. `tests/assurance-wcag.test.ts` verifies registry exhaustiveness, A/AA/AAA level counts, removal of obsolete 4.1.1, evidence resolution, W3C source identity, non-conformance wording, validation distinction, and freshness metadata. `tests/assurance-compliance-api.test.ts` verifies reporting filters, derived counts, relationships, and exact-record API lookup; `tests/demo-258-minimal-assurance.test.ts` locks the single-page assurance boundary, while `tests/assurance-workbench-accessibility.test.ts` covers framework/inspector tab semantics, keyboard history behavior, live announcements, and narrow layouts. `npm run validate:wcag` repeats the canonical ID/name/level validation and evidence checks from a standalone repository validator.

CI also validates types, localization, contracts, security, dependencies, migrations, the Worker build, and the site-wide local Chromium/axe audit. Automated browser evidence remains distinct from human browser and assistive-technology review; CI does not replace the pending manual matrix.


## Assurance workbench interaction

The assurance workbench follows the same interaction contract as the demos workbench: framework and inspector tablists use roving tabindex plus Arrow Left/Right, Home, and End (including RTL direction); record selection is reflected in the URL fragment and browser history; lazy record replacement does not steal focus; stale loads are aborted; status changes use a polite live region; canonical assessment content is marked `lang="en"` inside localized chrome; and the two-column layout collapses without hiding controls at narrow widths.
