# Internationalization runtime

Internationalization is an application runtime capability, not a mode owned by `/demos#i18n`. Every ordinary server-rendered HTML request resolves one localization context before route content is rendered. The demonstration exposes that same runtime for inspection.

`src/i18n/runtime.ts` is the runtime implementation. `config/i18n.json` owns the configured default locale, fallback locale, supported-locale inventory, and RTL inventory. Core locale resources live under `src/i18n/locales/`; site presentation strings live in `src/i18n/presentation.json`.

## Locale resolution

Requests resolve locale in this order:

1. supported explicit `lang` query parameter;
2. `wg-lang` same-site preference cookie when the query parameter is absent;
3. configured default locale.

A supported explicit locale becomes the request locale and is persisted for later navigation. An unsupported explicit locale resolves safely to the configured default. Selecting the default locale or supplying an invalid locale removes the unnecessary `lang` parameter while preserving unrelated query parameters and persists the resolved default preference.

The current configured locales are English (`en`), Spanish (`es`), French (`fr`), German (`de`), Japanese (`ja`), and Arabic (`ar`). English is the default and fallback. Arabic is the configured RTL locale.

Locale state does not change canonical route identity. Canonical links remain on the registered route pathname while locale-aware internal navigation carries non-default reader state.

## Request-scoped rendering contract

The application request flow is:

```text
request
  -> resolve localization context
  -> match registered route
  -> provide request-scoped context
  -> render page content
  -> render shared localized shell
```

`src/router.ts` binds the resolved context to page requests. Shared rendering reads it with `localizationForEnv()`. Page renderers consume the request-scoped context instead of independently resolving locale resources.

The localization context provides translation lookup with configured fallback, plural-category selection, number formatting, date/time formatting, currency formatting, list formatting, document `lang`, document `dir`, and locale-aware internal URL propagation.

## Shared shell and resource ownership

`src/ui/page.ts` consumes localized shell strings for navigation, global controls, the skip link, source labels, and the language selector. The selector is a native `select` submitted with GET, works without JavaScript, and preserves unrelated query parameters.

The HTML document always emits the active `lang` and an explicit direction. Arabic resolves to `dir="rtl"`; the other configured locales resolve to `dir="ltr"`.

Direction-sensitive shared layout uses logical CSS properties. Technical identifiers remain isolated where bidi reordering would make machine-oriented content ambiguous.

A new user-facing key must exist in every configured locale resource or every locale entry in the presentation catalog, as appropriate. Placeholders must remain identical across translations. Intentional canonical English or technical tokens use the existing narrow allowlist; broad English-text exemptions are not permitted.

## Adding a locale

A new locale requires all of the following in the same controlled change:

1. add the locale to `config/i18n.json`;
2. add its synchronized core resource;
3. add it to every presentation-catalog entry;
4. add the runtime resource mapping and localized display name;
5. add it to `rtlLocales` only when the locale requires RTL presentation;
6. provide any route-state fixture required for meaningful site-wide coverage.

The runtime must continue to resolve unsupported locales safely and preserve the configured fallback behavior.

## Verification

`npm run validate:locales` requires every configured locale resource to exist and expose the same non-empty key inventory as the fallback resource.

`npm run validate:site-i18n` derives public route coverage from the canonical route registry and exercises configured route states across the supported locale inventory. Runtime and interface tests cover representative language/direction rendering, translated shell strings, query preservation, preference persistence, formatting, and RTL-safe layout behavior.

Accessibility evidence that crosses the localization boundary is governed by `docs/ACCESSIBILITY.md`; this document does not maintain a second accessibility verification model.

Translations are engineering demonstration resources and are not claimed to have professional translation certification. Human language-quality or bidi review is recorded only when it is actually performed.
