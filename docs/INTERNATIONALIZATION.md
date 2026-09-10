# Application internationalization runtime

Internationalization is an application capability, not a mode owned by `/interfaces/i18n`. Every ordinary server-rendered HTML request resolves a localization context before its route handler emits the shared page shell. The interface route remains an inspection and teaching surface for that same runtime.

The canonical implementation is `src/i18n/runtime.ts`. `config/i18n.json` owns the configured default, fallback, supported-locale inventory, and RTL inventory. The synchronized resources remain under `src/i18n/locales/`.

## Locale resolution

The runtime uses one deterministic precedence order:

1. An explicit `lang` query parameter, when present.
2. The `wg-lang` same-site preference cookie when the query parameter is absent.
3. The configured default locale.

A supported explicit locale becomes the request locale and is persisted for later application navigation. An unsupported explicit locale safely resolves to the configured default. Selecting the default locale or supplying an invalid locale removes the unnecessary `lang` parameter while preserving unrelated query parameters and persists the resolved default preference.

The current supported inventory is English (`en`), Spanish (`es`), French (`fr`), German (`de`), Japanese (`ja`), and Arabic (`ar`). English is the configured default and fallback. Arabic is the configured RTL locale.

Canonical route identity does not include locale state. The shared shell keeps canonical links on the registered route pathname while locale-aware navigation carries non-default state for the reader. The route hierarchy is unchanged.

## Request and rendering boundary

The intended request flow is:

```text
request
  -> resolve application localization context
  -> match registered route
  -> provide request-scoped environment/context
  -> render page content
  -> render shared localized/accessibility-aware shell
```

`src/router.ts` binds the resolved context to page requests. Shared rendering reads that context with `localizationForEnv()`. Page renderers that need human-facing translations or locale-aware formatting consume the same context rather than importing and resolving locale resources independently.

The context provides translation lookup with configured fallback, plural-category selection, number formatting, date/time formatting, currency formatting, list formatting, `lang`, `dir`, and locale-aware internal URL propagation.

## Shared shell ownership

`src/ui/page.ts` owns shell language. Locale resources provide the skip-link text, landmark names, shell navigation labels, breadcrumb and related-destination labels, brand/home accessible name, main-site text, source labels, theme-control state text, and the global language selector.

The language selector is a native `select` in a GET form. It is available without JavaScript, preserves unrelated query parameters, and submits before the next server-rendered document is emitted. Theme switching remains keyboard operable and preserves focus on the activating button.

The HTML document always emits the active `lang`. It also emits an explicit direction; Arabic resolves to `dir="rtl"`, while the other configured locales resolve to `dir="ltr"`.

## RTL and accessibility relationship

RTL is owned by the application localization context, not by the i18n demonstration. Shared layout uses logical CSS properties where direction matters, including navigation separation and inline spacing. `/interfaces/i18n` shows the resolved direction and formatting behavior, but it does not create an alternate application shell.

Likewise, accessibility is not a locale-specific or demonstration-only mode. The same shared shell is expected to remain keyboard operable, focus visible, reflow safe, reduced-motion aware, and usable in forced-colors environments for every supported locale.

## Validation and limits

`npm run validate:locales` requires every configured locale to exist and to expose the same non-empty key inventory as the fallback resource. Runtime and interface tests cover representative server-rendered language/direction behavior, shell translations, query preservation, persistence, and RTL-safe shared layout.

Translations in this repository are engineering demonstration resources and are not claimed to be professionally certified. Localization infrastructure also does not establish WCAG conformance. Manual language review, bidi review, assistive-technology testing, zoom/reflow testing, and release accessibility verification remain required where applicable.
