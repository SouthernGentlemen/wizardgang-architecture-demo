# Site-wide accessibility and localization verification

Accessibility and localization are application-wide invariants. They are not capabilities confined to the demonstrations at `/demos#accessibility` and `/demos#i18n`, and a new public route does not opt out of either invariant.

DEMO-238 verifies the application at three separate evidence levels:

1. **Deterministic repository checks** derive public page coverage from the canonical application route registry, verify generated route-manifest parity, exercise structural HTML requirements, and render critical states across every supported locale.
2. **Browser automation** starts the repository-built Worker locally, drives installed Chromium through the DevTools protocol, and runs the locked `axe-core` dependency against the actual rendered application. It covers every public route in English and Arabic, critical state fixtures, representative dark/light themes, 320 CSS-pixel reflow samples, reduced-motion and forced-colors media features, and representative keyboard interaction patterns.
3. **Manual verification** is recorded in `docs/accessibility-manual-verification.json`. A procedure that was not actually performed remains `pending`; it is never inferred from CI.

A clean automated result means **no automatically detectable violation observed in the bounded automated matrix**. It does not mean WCAG conformance, Level AAA conformance, certification, or completion of manual success-criterion review.

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

The Chromium gate adds rendered-browser evidence for:

- `axe-core` WCAG-tagged rules;
- English and Arabic RTL on every public route;
- explicit critical state fixtures;
- both themes on representative coverage;
- page-level horizontal overflow and horizontally clipped controls;
- image alternatives, table headers, duplicate IDs, landmarks, skip target, and locale selector;
- 320 CSS-pixel viewport samples;
- reduced-motion and forced-colors media activation;
- keyboard focus progression and representative theme, language-selector, and disclosure activation.

The browser harness deliberately uses the locked `axe-core` dependency and Chromium already available in CI instead of adding a large browser-test framework or external service.

## What remains manual

Automation cannot establish whether every success criterion is satisfied in context. The structured manual matrix therefore remains authoritative for procedures such as:

- complete keyboard sequence and focus-order review;
- named screen-reader testing and announcement quality;
- visible focus and focus-not-obscured review;
- 400% zoom and 320 CSS-pixel human reflow review;
- text resizing and text-spacing overrides;
- actual rendered contrast interpretation in both themes;
- forced-colors and reduced-motion human observation;
- Arabic RTL visual/focus-order review;
- target-size measurement and exception review;
- accessible authentication behavior in the required environment;
- error identification/recovery;
- link purpose, section headings, consistent help, unusual words, abbreviations, and supplemental explanations.

Never fill `reviewer`, `reviewDate`, `observedResult`, or evidence references unless that procedure was actually executed. An automated green build does not convert a pending manual row into a pass.

## WCAG assurance evidence

`assurance/compliance/wcag-2.2.json` registers the application-wide automated test and the manual verification matrix as framework-level evidence. `assurance/evidence/evidence.json` owns the corresponding evidence records.

That relationship does **not** change criterion semantics. In particular:

- a clean axe sweep does not make a criterion `demonstrated`;
- manual-only criteria require actual manual evidence;
- applicability stays explicit;
- known gaps remain gaps until resolved and evidenced;
- `not-observed` is not a substitute for evaluating applicable content;
- evidence references must resolve through the canonical evidence registry;
- freshness requirements continue to apply.

Only strengthen a canonical WCAG status after the implementation exists, the required automated/manual evidence has actually been produced, and the criterion-specific gap text can truthfully be narrowed. Automated tools identify a bounded set of machine-detectable failures; they cannot evaluate all WCAG requirements or certify Level AAA.
