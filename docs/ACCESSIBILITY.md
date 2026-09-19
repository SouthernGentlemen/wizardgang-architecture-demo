# Accessibility architecture and verification

WCAG 2.2 is the accessibility engineering target for the public application, with Level AAA criteria treated as engineering targets where they apply. Accessibility belongs to the ordinary rendering path; there is no separate accessible version of the site.

This repository publishes **engineering evidence, not a WCAG conformance or certification claim**. A criterion-level assessment describes the bounded evidence recorded for that criterion. It does not establish product-wide Level A, AA, or AAA conformance.

## Authority and evidence separation

Accessibility architecture, criterion state, and operating evidence have separate authorities:

- `docs/ACCESSIBILITY.md` explains the current accessibility architecture, invariants, verification model, and evidence boundaries.
- `assurance/compliance/wcag-2.2.json` and the principle partitions under `assurance/compliance/wcag-2.2/` are authoritative for the current structured WCAG criterion inventory, status, rationale, validation requirements, evidence relationships, gaps, ownership, and freshness.
- `docs/accessibility-manual-verification.json` records the current manual, source/content, environment, and assistive-technology procedures that have actually been executed or remain pending.
- Executable tests and audit scripts produce bounded automated evidence.
- Dated accessibility assessments are operating evidence for their stated scope and date. They do not redefine current criterion state.

Do not copy the criterion inventory or criterion-by-criterion status into Markdown. The `/assurance` workbench and reporting APIs project the structured records without creating a second accessibility authority.

## Shared rendering architecture

`src/ui/page.ts` owns the ordinary HTML shell and `src/ui/runtime-styles.ts` owns shared runtime accessibility styles. The shared shell and page runtime preserve these invariants:

- one primary `main` landmark with a working skip link;
- visible keyboard focus and keyboard-operable shared controls;
- named primary navigation and programmatic current-state communication;
- native language selection with document `lang` and `dir` supplied by the request-scoped localization runtime;
- logical CSS properties where direction affects layout;
- actionable target sizing that supports the enhanced target-size engineering goal while preserving legitimate criterion exceptions;
- reduced nonessential motion when `prefers-reduced-motion: reduce` is active;
- perceivable focus, controls, and boundaries in forced-colors environments;
- responsive ordinary content that reflows without root-document horizontal overflow at narrow widths;
- horizontal overflow only for technical code/data regions that legitimately require it;
- bidi isolation for technical identifiers and machine-oriented content;
- repeated links and controls with names that identify their destination or purpose in context.

Shared color tokens are selected to support enhanced contrast targets, but token values alone are not evidence that every rendered foreground/background combination satisfies an applicable criterion. Computed rendering remains part of browser verification.

The accessibility demonstration at `/demos#accessibility` exposes the same application principles as a teaching surface. Its annotated-failure examples are inert code and explanation rather than intentionally broken live application controls.

## Verification model

Accessibility evidence is separated by how it was produced. One layer must not be reported as another.

### Automated repository and browser evidence

Deterministic repository checks derive public-route coverage from the application route registry, validate the generated route projection, render configured route states, and enforce structural and localization contracts.

The browser audit starts the repository-built Worker locally, drives Chromium through the DevTools protocol, and uses the locked `axe-core` dependency against rendered pages. The current browser scope includes the canonical public routes, configured state fixtures, English and Arabic/RTL coverage, representative themes, narrow reflow and zoom-equivalent viewports, text-spacing overrides, rendered target geometry, computed contrast rules, focus traversal/visibility/obscuring, reduced motion, and forced-colors emulation.

Automated checks are bounded machine evidence. A clean automated run does not establish that every applicable success criterion has been satisfied.

### Source and content review

Source/content review may inspect rendered inventories, source structure, wording, headings, links, language boundaries, terminology, or other content-dependent behavior. When such a review is actually performed, its scope, evaluator, date, result, and evidence reference belong in the structured verification record.

A source/content review is not a human browser usability review and is not assistive-technology testing.

### Human visual and manual browser review

Human browser review covers behavior that requires direct observation or judgement in the intended environment, including focus order and visibility, reflow and zoom usability, text spacing, forced-colors presentation, reduced-motion behavior, target-size exceptions, RTL presentation, error recovery, authentication flows, and other context-dependent checks.

A procedure remains `pending` until a person actually performs and records it. CI never converts a pending human procedure into a completed result.

### Assistive-technology and environment-specific testing

Screen-reader, password-manager, passkey, platform high-contrast, and other assistive-technology or environment-dependent results require testing in the named environment. They must not be inferred from DOM structure, `axe-core`, source review, or browser geometry.

No screen-reader result is recorded unless a named screen-reader procedure was actually executed.

## Site-wide coverage

`tests/site-accessibility-i18n.test.ts` derives fixed public `GET` page coverage from the application route registry. `docs/route-manifest.json` is the generated machine projection consumed by the audit path; it is not a second hand-maintained page inventory.

`config/site-audit-states.json` contains only additional states needed to exercise meaningful behavior that a bare route does not expose. New fixed public routes inherit the deterministic and browser sweeps automatically. A parameterized public surface must provide a concrete auditable state fixture rather than being added to a separate page list.

The main accessibility commands are:

```sh
npm run validate:wcag
npm run test:accessibility
npm run validate:site-accessibility
npm run test:site-accessibility
```

Localization coverage that materially affects accessibility is exercised through `npm run validate:site-i18n`; the localization runtime contract itself is documented in `docs/INTERNATIONALIZATION.md`.

The real-browser audit requires Chrome or Chromium. CI uses the browser installed on the GitHub-hosted runner. Local runs may set `CHROME_BIN` when the executable is not discoverable as `google-chrome`, `google-chrome-stable`, `chromium`, or `chromium-browser`.

A green automated run means the bounded automated matrix executed successfully without an unrecorded regression. It does not mean WCAG conformance, completion of pending manual procedures, or assistive-technology coverage that was not performed.

## Manual verification record

`docs/accessibility-manual-verification.json` is the structured record for executed and pending manual/source/environment procedures. Preserve the distinction between:

- completed source/content review;
- completed human browser review;
- completed assistive-technology or named-environment testing;
- pending procedures.

Do not populate reviewer, review date, observed result, or evidence references for work that was not actually performed. Criterion status may be strengthened only when the canonical structured assurance record can truthfully reference the implementation and the evidence required for that criterion.

## Conformance boundary

The repository does not claim WCAG 2.2 Level A, AA, or AAA conformance or certification. W3C conformance requires satisfying the applicable success criteria for the claimed scope and level; automated testing can evaluate only part of that requirement.

Level AAA remains an engineering target where applicable, not a published conformance statement.

## W3C authority

Use W3C material for WCAG identity and meaning:

- WCAG 2.2 Recommendation: `https://www.w3.org/TR/WCAG22/`
- WCAG 2 Overview and publication guidance: `https://www.w3.org/WAI/standards-guidelines/wcag/`
- W3C machine-readable WCAG 2.2 data: `https://www.w3.org/WAI/WCAG22/wcag.json`
- Understanding Conformance: `https://www.w3.org/WAI/WCAG22/Understanding/conformance.html`
- Understanding Techniques: `https://www.w3.org/WAI/WCAG22/Understanding/understanding-techniques.html`

W3C success criteria are normative. Understanding documents and techniques are supporting guidance and do not replace the success criteria.
