# Site-wide accessibility and localization verification

Accessibility and localization are application-wide invariants. They are not capabilities confined to the demonstrations at `/demos#accessibility` and `/demos#i18n`, and a new public route does not opt out of either invariant.

The verification model has four separate evidence levels:

1. **Deterministic repository checks** derive public page coverage from the canonical application route registry, verify generated route-manifest parity, exercise structural HTML requirements, and render critical states across every supported locale.
2. **Browser automation** starts the repository-built Worker locally, drives installed Chromium through the DevTools protocol, and runs the locked `axe-core` dependency against the actual rendered application. It covers every public route in English and Arabic plus the configured state fixtures.
3. **Scripted browser evaluation** exercises the DEMO-289 matrix over the declared English/Arabic scope for 320 CSS-pixel reflow, 200%/400% zoom-equivalent viewports, WCAG text-spacing overrides, rendered target geometry, computed contrast, focus traversal/visibility/obscuring, reduced motion, and forced colors. These checks are deterministic browser evidence; they are not represented as human observation.
4. **Manual/source/environment verification** is recorded in `docs/accessibility-manual-verification.json`. A procedure that was not actually performed remains `pending`; it is never inferred from CI. Source/content reviews are distinguished from human browser, real-environment, and assistive-technology procedures.

A green automated/scripted run means **the complete bounded matrix executed successfully and produced no new or unrecorded regression beyond explicitly documented expected findings**. It does not mean WCAG conformance, Level AAA conformance, certification, or completion of unperformed manual success-criterion review.

## Commands

Run the deterministic gates with:

```sh
npm run validate:site-accessibility
npm run validate:site-i18n
```

Run the real-browser gate with:

```sh
npm run validate:migrations
npm run test:site-accessibility
```

The browser command requires Chrome or Chromium. CI uses the Chrome installation supplied by the GitHub-hosted Ubuntu runner. Locally, set `CHROME_BIN` when the browser executable is not discoverable as `google-chrome`, `google-chrome-stable`, `chromium`, or `chromium-browser`.

`npm run check` includes the deterministic accessibility and localization gates. CI additionally executes the real-browser gate against the local Worker; it does not crawl production or depend on an external accessibility SaaS.

## Route coverage

`tests/site-accessibility-i18n.test.ts` reads `applicationRouteRegistry` and automatically inherits every public `GET` page. `docs/route-manifest.json` is checked against that inventory so the browser harness can consume the generated registry projection without introducing a second hand-maintained page list.

`config/site-audit-states.json` contains only **additional state fixtures** and representative browser-pattern samples. It is not a public route inventory. Use it when a bare route does not exercise an important deterministic state such as framework filtering, search/filter combinations, the accessibility lab, OpenAPI interaction, or a narrow-layout sample.

A new fixed public route is automatically included in the deterministic and browser sweeps. A new parameterized public surface must provide a concrete state fixture; the intended failure is:

```text
new public surface requires accessibility/i18n coverage
```

Do not solve that failure by adding the route to a separate page list. Either make the route directly auditable or add the smallest representative state fixture owned by its canonical route.

## Adding or changing translations

`config/i18n.json` owns the default locale, fallback locale, supported locale inventory, and RTL inventory. Core locale resources live under `src/i18n/locales/`; the site-wide presentation catalog lives at `src/i18n/presentation.json`.

When adding a translation key:

1. add the key to every configured locale resource or every locale entry in the presentation catalog, as appropriate;
2. preserve placeholders and canonical technical tokens;
3. use the existing narrow allowlist only for intentionally canonical English or technical terms;
4. run `npm run validate:locales`, `npm run validate:site-i18n`, and the normal test suite.

Do not introduce a broad English-text regex exemption. Ordinary untranslated user-facing copy is a regression.

When adding a locale:

1. add the locale to `config/i18n.json`;
2. add its synchronized core resource;
3. add it to every presentation-catalog entry;
4. add the runtime import/resource mapping and localized display name;
5. declare RTL only when the locale requires it;
6. run locale validation, deterministic site validation, and the browser audit;
7. add manual language/bidi review evidence before strengthening any accessibility status that depends on that review.

## What automation checks

The deterministic gate protects, among other things:

- canonical public-route coverage;
- route-manifest parity;
- public rendering in the configured locale matrix;
- document `lang` and `dir`;
- one `main` landmark and a resolving skip link;
- non-empty heading structure at the document entry point;
- duplicate IDs;
- image alternative attributes;
- locale-selector naming and locale-state preservation;
- RTL technical-content isolation expectations;
- shared focus, target-size, reduced-motion, forced-colors, reflow, and bidi CSS contracts.

The Chromium gates add rendered-browser evidence for:

- `axe-core` WCAG-tagged rules;
- English and Arabic RTL on every canonical public route and configured state;
- both themes on the base site audit's representative coverage;
- page-level horizontal overflow and horizontally clipped controls;
- image alternatives, table headers, duplicate IDs, landmarks, skip target, and locale selector;
- 320 CSS-pixel reflow and 200%/400% zoom-equivalent layout checks;
- WCAG text-spacing overrides;
- rendered target geometry, including the 24 CSS-pixel minimum gate and a 44 CSS-pixel enhanced-target inventory;
- computed text contrast through `axe-core`'s rendered color-contrast rule;
- forward/reverse keyboard traversal, focus visibility, focus obscuring, and trap detection;
- reduced-motion behavior with active-animation inspection;
- forced-colors emulation with rendered focusable-state inspection;
- browser-derived heading, link, language-part, terminology, abbreviation, and reading-complexity inventories used by the bounded content/source review.

The browser harness deliberately uses the locked `axe-core` dependency and Chromium already available in CI instead of adding a large browser-test framework or external service.

## What remains manual or environment-dependent

Automation cannot establish whether every success criterion is satisfied in context. The structured manual matrix therefore remains authoritative.

DEMO-289 records these content/source review procedures as completed because they were actually reviewed over the declared English/Arabic page/state inventory and recorded with evaluator/date/result/reference:

- link purpose/context;
- section heading structure/usefulness;
- language of parts;
- unusual words, abbreviations, and supplemental explanation;
- reading-level content review.

The following procedures remain pending unless and until their structured rows record a real execution:

- complete human keyboard sequence and focus-order review;
- named screen-reader testing and announcement quality;
- human visible-focus and focus-not-obscured review;
- 400% zoom and 320 CSS-pixel human reflow review;
- human text-resize/text-spacing observation beyond scripted geometry;
- rendered contrast interpretation beyond the automated rule;
- forced-colors and reduced-motion human observation;
- Arabic RTL visual/focus-order review;
- target-size exception review for enhanced 44 CSS-pixel coverage;
- accessible authentication behavior in the required password-manager/credential environment;
- error identification/recovery;
- consistent-help review.

Never fill `reviewer`, `reviewDate`, `observedResult`, or evidence references unless that procedure was actually executed. An automated green build does not convert a pending manual row into a pass, and source review is not represented as screen-reader or human browser testing.

## WCAG assurance evidence

`assurance/compliance/wcag-2.2.json` registers the application-wide automated test and the manual verification matrix as framework-level evidence. `assurance/evidence/evidence.json` owns the corresponding evidence records.

That relationship does **not** change criterion semantics. In particular:

- a clean axe sweep does not make a criterion `pass`;
- a criterion that depends on an unperformed manual, environment, or assistive-technology procedure remains `partial` when the current evidence cannot support a pass;
- applicability stays explicit;
- known `gap` results remain gaps until resolved and evidenced;
- `not-applicable` is used only when the triggering content or behavior is absent from the evaluated scope and must be reassessed when that scope changes;
- evidence references must resolve through the canonical evidence registry;
- freshness requirements continue to apply.

Only strengthen a canonical WCAG status after the implementation exists, the required automated/scripted/manual evidence has actually been produced, and the criterion-specific gap text can truthfully be narrowed. Automated tools identify a bounded set of machine-detectable failures; they cannot evaluate all WCAG requirements or certify Level AAA.
