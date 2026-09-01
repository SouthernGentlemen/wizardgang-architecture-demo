import type { Env } from '../types';
import ar from '../i18n/locales/ar.json';
import de from '../i18n/locales/de.json';
import en from '../i18n/locales/en.json';
import es from '../i18n/locales/es.json';
import fr from '../i18n/locales/fr.json';
import ja from '../i18n/locales/ja.json';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

const resources = { en, es, fr, de, ja, ar } as const;
type Locale = keyof typeof resources;

const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ar: 'العربية',
};

function localeFor(value: string | null): Locale {
  return value === 'es' || value === 'fr' || value === 'de' || value === 'ja' || value === 'ar' ? value : 'en';
}

function message(locale: Locale, key: string): string {
  const selected = resources[locale] as Record<string, string>;
  return selected[key] ?? (en as Record<string, string>)[key] ?? key;
}

function pluralKey(locale: Locale, count: number): string {
  return `items_${new Intl.PluralRules(locale).select(count)}`;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export async function renderI18nDemo(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const locale = localeFor(url.searchParams.get('locale'));
  const count = Math.max(0, Math.min(Number(url.searchParams.get('count') || '3') || 0, 9999));
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const m = (key: string) => message(locale, key);
  const selectedPluralKey = pluralKey(locale, count);
  const formattedItems = m(selectedPluralKey).replace('{count}', new Intl.NumberFormat(locale).format(count));
  const fixedDate = new Date('2026-09-01T12:00:00Z');
  const resourceHref = sourceUrl(env, `src/i18n/locales/${locale}.json`);
  const localeButtons = (Object.keys(resources) as Locale[]).map((code) => `<button type="button" data-locale="${code}" aria-pressed="${code === locale}">${escapeHtml(localeNames[code])}</button>`).join('');
  const localeOptions = (Object.keys(resources) as Locale[]).map((code) => `<option value="${code}"${code === locale ? ' selected' : ''}>${escapeHtml(localeNames[code])}</option>`).join('');
  const initialExcerpt = { [selectedPluralKey]: m(selectedPluralKey) };
  const body = `<section class="page-header">
    <div class="eyebrow" data-copy="demo.eyebrow">${escapeHtml(m('demo.eyebrow'))}</div>
    <h1 data-copy="demo.title">${escapeHtml(m('demo.title'))}</h1>
    <p data-copy="demo.summary">${escapeHtml(m('demo.summary'))}</p>
    <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/i18n.ts'))}">Route source</a>${referenceDetails([
      { label: m('source'), href: sourceUrl(env, 'src/demos/i18n-page.ts') },
      { label: m('resource'), href: resourceHref },
    ])}</div>
  </section>
  <section class="panel i18n-controls" aria-labelledby="i18n-controls-title">
    <div class="lab-heading"><div><p class="eyebrow">Six synchronized resources</p><h2 id="i18n-controls-title" data-copy="controls">${escapeHtml(m('controls'))}</h2></div><code data-direction>${direction}</code></div>
    <div class="locale-switcher" role="group" aria-label="${escapeHtml(m('language'))}">${localeButtons}</div>
    <form method="get" class="filters" data-i18n-form>
      <label for="locale"><span data-copy="language">${escapeHtml(m('language'))}</span><select id="locale" name="locale">${localeOptions}</select></label>
      <label for="count"><span data-copy="count">${escapeHtml(m('count'))}</span><input id="count" name="count" type="number" min="0" max="9999" value="${count}"></label>
      <button type="submit" data-copy="apply">${escapeHtml(m('apply'))}</button>
    </form>
  </section>
  <div class="lab-grid i18n-lab">
    <section class="panel locale-app" dir="${direction}" aria-labelledby="localized-card-title">
      <p class="eyebrow" tabindex="0" data-inspect="card.kicker" data-copy="card.kicker">${escapeHtml(m('card.kicker'))}</p>
      <h2 id="localized-card-title" tabindex="0" data-inspect="card.title" data-copy="card.title">${escapeHtml(m('card.title'))}</h2>
      <p tabindex="0" data-inspect="card.body" data-copy="card.body">${escapeHtml(m('card.body'))}</p>
      <p class="stat" tabindex="0" data-inspect="plural" data-plural>${escapeHtml(formattedItems)}</p>
      <dl>
        <dt data-copy="format.number">${escapeHtml(m('format.number'))}</dt><dd tabindex="0" data-inspect="number" data-number>${escapeHtml(new Intl.NumberFormat(locale).format(1234567.89))}</dd>
        <dt data-copy="date">${escapeHtml(m('date'))}</dt><dd tabindex="0" data-inspect="date" data-date>${escapeHtml(new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(fixedDate))}</dd>
        <dt data-copy="currency">${escapeHtml(m('currency'))}</dt><dd tabindex="0" data-inspect="currency" data-currency>${escapeHtml(new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(1234.56))}</dd>
      </dl>
      <button class="button-primary" type="button" tabindex="0" data-inspect="card.action" data-copy="card.action">${escapeHtml(m('card.action'))}</button>
    </section>
    <aside class="panel technical-state" aria-live="polite">
      <p class="eyebrow">Translation inspector</p>
      <h2 data-copy="inspector.title">${escapeHtml(m('inspector.title'))}</h2>
      <dl>
        <dt>key</dt><dd><code data-inspector-key>${escapeHtml(selectedPluralKey)}</code></dd>
        <dt>locale</dt><dd><code data-inspector-locale>${locale}</code></dd>
        <dt>fallback</dt><dd><code data-inspector-fallback>not used</code></dd>
        <dt>plural category</dt><dd><code data-inspector-plural>${new Intl.PluralRules(locale).select(count)}</code></dd>
      </dl>
      <pre data-resource-excerpt>${escapeHtml(JSON.stringify(initialExcerpt, null, 2))}</pre>
      <a class="text-link" data-resource-link href="${escapeHtml(resourceHref)}">${escapeHtml(m('resource'))}</a>
    </aside>
  </div>
  <script>
  (() => {
    const resources = ${safeJson(resources)};
    const supported = Object.keys(resources);
    const fixedDate = new Date('2026-09-01T12:00:00Z');
    const resourceBase = ${safeJson(sourceUrl(env, 'src/i18n/locales/__LOCALE__.json'))};
    let locale = supported.includes(${safeJson(locale)}) ? ${safeJson(locale)} : 'en';
    const form = document.querySelector('[data-i18n-form]');
    const localeSelect = document.querySelector('#locale');
    const countInput = document.querySelector('#count');
    const getCount = () => Math.max(0, Math.min(Number(countInput.value) || 0, 9999));
    const resolve = (key) => (resources[locale] && resources[locale][key]) || resources.en[key] || key;
    const resourceUrl = () => resourceBase.replace('__LOCALE__', locale);
    const setInspector = (kind) => {
      const count = getCount();
      const category = new Intl.PluralRules(locale).select(count);
      let key = kind;
      let value = '';
      let plural = 'not applicable';
      if (kind === 'plural') {
        key = 'items_' + category;
        value = resolve(key).replace('{count}', new Intl.NumberFormat(locale).format(count));
        plural = category;
      } else if (kind === 'number') {
        key = 'Intl.NumberFormat';
        value = new Intl.NumberFormat(locale).format(1234567.89);
      } else if (kind === 'date') {
        key = 'Intl.DateTimeFormat';
        value = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(fixedDate);
      } else if (kind === 'currency') {
        key = 'Intl.NumberFormat.currency';
        value = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(1234.56);
      } else {
        value = resolve(key);
      }
      document.querySelector('[data-inspector-key]').textContent = key;
      document.querySelector('[data-inspector-locale]').textContent = locale;
      document.querySelector('[data-inspector-fallback]').textContent = (resources[locale][key] || key.startsWith('Intl.')) ? 'not used' : 'en';
      document.querySelector('[data-inspector-plural]').textContent = plural;
      document.querySelector('[data-resource-excerpt]').textContent = JSON.stringify({ [key]: value }, null, 2);
    };
    const render = (inspect = 'card.title') => {
      const count = getCount();
      const direction = locale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
      document.querySelector('.locale-app').dir = direction;
      document.querySelector('[data-direction]').textContent = direction;
      document.querySelectorAll('[data-copy]').forEach((node) => { node.textContent = resolve(node.dataset.copy); });
      document.querySelector('[data-plural]').textContent = resolve('items_' + new Intl.PluralRules(locale).select(count)).replace('{count}', new Intl.NumberFormat(locale).format(count));
      document.querySelector('[data-number]').textContent = new Intl.NumberFormat(locale).format(1234567.89);
      document.querySelector('[data-date]').textContent = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(fixedDate);
      document.querySelector('[data-currency]').textContent = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(1234.56);
      document.querySelector('[data-resource-link]').href = resourceUrl();
      document.querySelector('[data-resource-link]').textContent = resolve('resource');
      document.querySelectorAll('[data-locale]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.locale === locale)));
      localeSelect.value = locale;
      const next = new URL(location.href);
      next.searchParams.set('locale', locale);
      next.searchParams.set('count', String(count));
      history.replaceState(null, '', next);
      setInspector(inspect);
    };
    document.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => { locale = button.dataset.locale; render(); }));
    localeSelect.addEventListener('change', () => { locale = supported.includes(localeSelect.value) ? localeSelect.value : 'en'; render(); });
    countInput.addEventListener('input', () => render('plural'));
    form.addEventListener('submit', (event) => { event.preventDefault(); render('plural'); });
    document.querySelectorAll('[data-inspect]').forEach((node) => {
      node.addEventListener('click', () => setInspector(node.dataset.inspect));
      node.addEventListener('focus', () => setInspector(node.dataset.inspect));
    });
  })();
  </script>`;
  const response = shell(env, m('demo.title'), body, { cacheControl: 'no-store', activeRoute: '/i18n' });
  const html = await response.text();
  return new Response(html.replace('<html lang="en">', `<html lang="${locale}" dir="${direction}">`), { headers: response.headers });
}
