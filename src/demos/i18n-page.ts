import type { Env } from '../types';
import { localeResources, localizationForEnv } from '../i18n/runtime';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';

export function i18nContent(request: Request, env: Env): PageContent {
  const url = new URL(request.url);
  const i18nUrl = `${routeUrl('demos.index')}#i18n`;
  const localization = localizationForEnv(env);
  const locale = localization.locale;
  const count = Math.max(0, Math.min(Number(url.searchParams.get('count') || '3') || 0, 9999));
  const m = localization.t;
  const selectedPluralKey = `items_${localization.pluralCategory(count)}`;
  const formattedItems = m(selectedPluralKey).replace('{count}', localization.number(count));
  const fixedDate = new Date('2026-09-01T12:00:00Z');
  const resourceHref = sourceUrl(env, `src/i18n/locales/${locale}.json`);
  const resolvedResource = localeResources[locale] as Readonly<Record<string, string>>;
  const body = `<section class="page-header">
    <h1>${escapeHtml(m('demo.title'))}</h1>
    <p>${escapeHtml(m('demo.summary'))}</p>
    <p class="subtle">This page inspects the same request-scoped localization context used by the global shell. Changing language reloads the route so the document language, direction, navigation, controls, and this demonstration resolve together.</p>
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/i18n/runtime.ts'))}">Global runtime source</a>${referenceDetails([
      { label: m('source'), href: sourceUrl(env, 'src/demos/i18n-page.ts') },
      { label: m('resource'), href: resourceHref },
      { label: 'Locale configuration', href: sourceUrl(env, 'config/i18n.json') },
    ])}</div>
  </section>
  <section class="panel i18n-controls" aria-labelledby="i18n-controls-title">
    <div class="lab-heading"><div><p class="eyebrow">Shared application capability</p><h2 id="i18n-controls-title">${escapeHtml(m('controls'))}</h2></div><code data-direction>${localization.dir}</code></div>
    <p>Use the language control in the global header to change the document language and direction. This control only changes the count used to demonstrate plural rules.</p>
    <form method="get" action="${escapeHtml(i18nUrl)}" class="filters" data-i18n-form>
      ${locale === localization.defaultLocale ? '' : `<input type="hidden" name="lang" value="${escapeHtml(locale)}">`}
      <label for="count"><span>${escapeHtml(m('count'))}</span><input id="count" name="count" type="number" min="0" max="9999" value="${count}"></label>
      <button type="submit">${escapeHtml(m('apply'))}</button>
    </form>
  </section>
  <div class="lab-grid i18n-lab">
    <section class="panel locale-app" dir="${localization.dir}" aria-labelledby="localized-card-title">
      <p class="eyebrow">${escapeHtml(m('card.kicker'))}</p>
      <h2 id="localized-card-title" data-inspect-value="card.title">${escapeHtml(m('card.title'))}</h2>
      <p data-inspect-value="card.body">${escapeHtml(m('card.body'))}</p>
      <p class="stat" data-inspect-value="${escapeHtml(selectedPluralKey)}">${escapeHtml(formattedItems)}</p>
      <dl>
        <dt>${escapeHtml(m('format.number'))}</dt><dd data-inspect-value="Intl.NumberFormat">${escapeHtml(localization.number(1234567.89))}</dd>
        <dt>${escapeHtml(m('date'))}</dt><dd data-inspect-value="Intl.DateTimeFormat">${escapeHtml(localization.dateTime(fixedDate, { dateStyle: 'full', timeZone: 'UTC' }))}</dd>
        <dt>${escapeHtml(m('currency'))}</dt><dd data-inspect-value="Intl.NumberFormat.currency">${escapeHtml(localization.currency(1234.56, 'USD'))}</dd>
      </dl>
      <button class="button-primary" type="button" data-inspect-value="card.action">${escapeHtml(m('card.action'))}</button>
    </section>
    <aside class="panel technical-state" aria-live="polite">
      <p class="eyebrow">Global context inspector</p>
      <h2>${escapeHtml(m('inspector.title'))}</h2>
      <dl>
        <dt>locale</dt><dd><code>${locale}</code></dd>
        <dt>default</dt><dd><code>${localization.defaultLocale}</code></dd>
        <dt>fallback</dt><dd><code>${localization.fallbackLocale}</code></dd>
        <dt>direction</dt><dd><code>${localization.dir}</code></dd>
        <dt>plural category</dt><dd><code>${localization.pluralCategory(count)}</code></dd>
      </dl>
      <fieldset class="i18n-inspect-controls"><legend>Inspect a value</legend>${[
        ['card.title', 'Title'],
        [selectedPluralKey, 'Items'],
        ['Intl.NumberFormat', 'Number'],
        ['Intl.DateTimeFormat', 'Date'],
        ['Intl.NumberFormat.currency', 'Currency'],
        ['card.action', 'Action'],
      ].map(([key, label]) => `<button type="button" data-inspect-target="${escapeHtml(key)}">${label}</button>`).join('')}</fieldset>
      <pre data-resource-excerpt>${escapeHtml(JSON.stringify({ [selectedPluralKey]: resolvedResource[selectedPluralKey] }, null, 2))}</pre>
      <a class="text-link" href="${escapeHtml(resourceHref)}">${escapeHtml(m('resource'))}</a>
    </aside>
  </div>
  <script>
  (() => {
    const output = document.querySelector('[data-resource-excerpt]');
    document.querySelectorAll('[data-inspect-target]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!output) return;
        const key = button.dataset.inspectTarget;
        const node = [...document.querySelectorAll('[data-inspect-value]')].find((candidate) => candidate.dataset.inspectValue === key);
        output.textContent = JSON.stringify({ key, value: node?.textContent || '' }, null, 2);
      });
    });
  })();
  </script>`;
  return pageContent(env, m('demo.title'), body, {
    cacheControl: 'no-store',
    canonicalPath: i18nUrl,
    description: m('demo.summary'),
  });
}
