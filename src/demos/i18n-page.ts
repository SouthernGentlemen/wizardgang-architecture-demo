import type { Env } from '../types';
import ar from '../i18n/locales/ar.json';
import en from '../i18n/locales/en.json';
import es from '../i18n/locales/es.json';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { shell } from '../ui/page';

const resources = { en, es, ar } as const;
type Locale = keyof typeof resources;

function localeFor(value: string | null): Locale {
  return value === 'es' || value === 'ar' ? value : 'en';
}

export async function renderI18nDemo(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const locale = localeFor(url.searchParams.get('locale'));
  const messages = resources[locale];
  const count = Math.max(0, Math.min(Number(url.searchParams.get('count') || '3') || 0, 9999));
  const plural = new Intl.PluralRules(locale).select(count) === 'one' ? messages['items.one'] : messages['items.other'];
  const formattedItems = plural.replace('{count}', new Intl.NumberFormat(locale).format(count));
  const body = `<section dir="${locale === 'ar' ? 'rtl' : 'ltr'}">
    <div class="eyebrow">${escapeHtml(messages['demo.eyebrow'])}</div>
    <h1>${escapeHtml(messages['demo.title'])}</h1>
    <p>${escapeHtml(messages['demo.summary'])}</p>
    <div class="meta"><span class="badge">working</span><a href="${escapeHtml(sourceUrl(env, 'src/demos/i18n-page.ts'))}">${escapeHtml(messages['source'])}</a><a href="${escapeHtml(sourceUrl(env, `src/i18n/locales/${locale}.json`))}">${escapeHtml(messages['resource'])}</a></div>
    <form method="get" class="filters" aria-label="${escapeHtml(messages['controls'])}">
      <label for="locale">${escapeHtml(messages['language'])}<select id="locale" name="locale"><option value="en"${locale === 'en' ? ' selected' : ''}>English</option><option value="es"${locale === 'es' ? ' selected' : ''}>Español</option><option value="ar"${locale === 'ar' ? ' selected' : ''}>العربية</option></select></label>
      <label for="count">${escapeHtml(messages['count'])}<input id="count" name="count" type="number" min="0" max="9999" value="${count}"></label>
      <button type="submit">${escapeHtml(messages['apply'])}</button>
    </form>
  </section>
  <section class="panel" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><h2>${escapeHtml(messages['output'])}</h2><dl><dt>${escapeHtml(messages['plural'])}</dt><dd>${escapeHtml(formattedItems)}</dd><dt>${escapeHtml(messages['date'])}</dt><dd>${escapeHtml(new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(new Date()))}</dd><dt>${escapeHtml(messages['currency'])}</dt><dd>${escapeHtml(new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(1234.56))}</dd><dt>dir</dt><dd><code>${locale === 'ar' ? 'rtl' : 'ltr'}</code></dd></dl></section>`;
  const response = shell(env, messages['demo.title'], body, { cacheControl: 'no-store' });
  const html = await response.text();
  return new Response(html.replace('<html lang="en">', `<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">`), { headers: response.headers });
}
