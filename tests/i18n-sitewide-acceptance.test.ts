import { describe, expect, it } from 'vitest';
import {
  defaultLocale,
  localeResources,
  resolveLocalization,
  supportedLocales,
  type SupportedLocale,
} from '../src/i18n/runtime';
import { localizePresentation, presentationCatalog } from '../src/i18n/presentation';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

class AcceptanceStatement implements D1PreparedStatement {
  private values: unknown[] = [];

  constructor(private readonly sql: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async run() {
    return { meta: { last_row_id: 1, changes: this.values.length ? 1 : 0 } };
  }

  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return {
        results: [{
          state: 'online',
          public_message: 'Available.',
          updated_at: '2026-09-09T12:00:00.000Z',
          updated_by: 'test',
        }] as T[],
      };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return {
        results: [{
          state: 'enabled',
          updated_at: '2026-09-09T12:00:00.000Z',
          updated_by: 'test',
        }] as T[],
      };
    }
    return { results: [] as T[] };
  }
}

class AcceptanceD1 {
  prepare(sql: string) {
    return new AcceptanceStatement(sql);
  }
}

function environment(): Env {
  return {
    DEMO_DB: new AcceptanceD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

function localization(locale: SupportedLocale, pathname = `${routeUrl('demos.index')}#i18n`) {
  const url = new URL(pathname, 'https://demo.wizardgang.ai');
  if (locale !== defaultLocale) url.searchParams.set('lang', locale);
  return resolveLocalization(new Request(url));
}

const UNTRANSLATED_PRESENTATION_ALLOWLIST = new Set([
  'nav.platform.workers',
  'nav.platform.durable-objects',
  'nav.platform.d1',
  'nav.platform.r2',
  'nav.interfaces.rest',
  'nav.interfaces.graphql.console',
  'nav.interfaces.webhooks.console',
  'nav.interfaces.mcp.console',
  'platform.workers_title',
  'platform.do_title',
  'interfaces.mcp_title',
]);

const direction = (locale: SupportedLocale) => locale === 'ar' ? 'rtl' : 'ltr';

describe('DEMO-236 sitewide localization acceptance', () => {
  it('renders every registry-derived public page in every supported locale', async () => {
    const publicPages = applicationRouteRegistry.declarations.filter((route) =>
      route.kind === 'page'
      && route.visibility === 'public'
      && route.methods.includes('GET'),
    );

    expect(publicPages.map((route) => route.id)).toContain('demos.index');
    expect(publicPages.filter((route) => route.pattern.includes(':'))).toEqual([]);

    for (const route of publicPages) {
      for (const locale of supportedLocales) {
        const url = new URL(route.pattern, 'https://demo.wizardgang.ai');
        if (locale !== defaultLocale) url.searchParams.set('lang', locale);
        const response = await routeRequest(new Request(url, { headers: { accept: 'text/html' } }), environment());
        expect(response.status, `${route.id} ${locale}`).toBe(200);
        expect(response.headers.get('content-language'), `${route.id} ${locale}`).toBe(locale);
        const html = await response.text();
        expect(html, `${route.id} ${locale}`).toContain(`<html lang="${locale}" dir="${direction(locale)}">`);
        expect(html, `${route.id} ${locale}`).not.toContain('&amp%3B');
      }
    }
  });

  it('keeps runtime resources synchronized and requires an explicit allowlist for intentionally untranslated catalog entries', () => {
    const expectedKeys = Object.keys(localeResources[defaultLocale]).sort();
    for (const locale of supportedLocales) {
      const resource = localeResources[locale] as Readonly<Record<string, string>>;
      expect(Object.keys(resource).sort(), locale).toEqual(expectedKeys);
      for (const key of expectedKeys) expect(resource[key]?.trim(), `${locale}.${key}`).toBeTruthy();
    }

    for (const [key, entry] of Object.entries(presentationCatalog())) {
      const intentionallyUntranslated = supportedLocales.every((locale) => entry[locale] === entry[defaultLocale]);
      if (intentionallyUntranslated) {
        expect(UNTRANSLATED_PRESENTATION_ALLOWLIST.has(key), `unallowlisted untranslated token: ${key}`).toBe(true);
      }
    }
  });

  it('matches Intl formatting and plural selection across every locale', () => {
    const date = new Date('2026-09-01T12:00:00.000Z');
    const counts = [0, 1, 2, 3, 11, 101];

    for (const locale of supportedLocales) {
      const context = localization(locale);
      expect(context.number(1234567.89)).toBe(new Intl.NumberFormat(locale).format(1234567.89));
      expect(context.currency(1234.56, 'USD')).toBe(new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(1234.56));
      expect(context.dateTime(date, { dateStyle: 'full', timeZone: 'UTC' })).toBe(new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(date));
      expect(context.list(['edge', 'data', 'assurance'])).toBe(new Intl.ListFormat(locale).format(['edge', 'data', 'assurance']));

      for (const count of counts) {
        const category = new Intl.PluralRules(locale).select(count);
        expect(context.pluralCategory(count), `${locale} ${count}`).toBe(category);
        const key = `items_${category}`;
        const template = (localeResources[locale] as Readonly<Record<string, string>>)[key];
        expect(context.plural('items', count), `${locale} ${count}`).toBe(template.replace('{count}', String(count)));
      }
    }
  });

  it('preserves query state and explicit locale targets without duplicate or encoded locale parameters', async () => {
    const i18nUrl = new URL(`${routeUrl('demos.index')}#i18n`, 'https://demo.wizardgang.ai');
    i18nUrl.searchParams.set('lang', 'ja');
    i18nUrl.searchParams.set('count', '7');
    const response = await routeRequest(new Request(i18nUrl, { headers: { accept: 'text/html' } }), environment());
    expect(response.status).toBe(200);
    const html = await response.text();
    const presentationResponse = await routeRequest(new Request('https://demo.wizardgang.ai/api/demos/i18n?lang=ja&count=7', { headers: { accept: 'text/html' } }), environment());
    expect(presentationResponse.status).toBe(200);
    const presentation = await presentationResponse.text();

    expect(presentation).toContain('href="/demos?count=7&amp;lang=fr#i18n"');
    expect(presentation).toContain('href="/demos?count=7&amp;lang=de#i18n"');
    expect(presentation).toContain('aria-current="page">日本語</a>');
    expect(html).toContain('<input type="hidden" name="count" value="7">');
    expect(html + presentation).not.toContain('&amp%3B');
    expect(html + presentation).not.toContain('lang=fr&amp;lang=ja');
  });

  it('localizes accessible attributes and client-side feedback from the same catalog', () => {
    const catalog = presentationCatalog();
    const source = `<button aria-label="${catalog['client.request_failed'].en}">${catalog['client.request_failed'].en}</button><script>const failed=${JSON.stringify(catalog['client.request_failed'].en)};const waiting='${catalog['client.waiting_response'].en}';</script>`;

    for (const locale of supportedLocales.filter((candidate) => candidate !== defaultLocale)) {
      const localized = localizePresentation('Request failed', 'Waiting for response…', source, localization(locale));
      expect(localized.title, locale).toBe(catalog['client.request_failed'][locale]);
      expect(localized.description, locale).toBe(catalog['client.waiting_response'][locale]);
      expect(localized.body, locale).toContain(`aria-label="${catalog['client.request_failed'][locale]}"`);
      expect(localized.body, locale).toContain(`>${catalog['client.request_failed'][locale]}</button>`);
      expect(localized.body, locale).toContain(JSON.stringify(catalog['client.request_failed'][locale]));
      expect(localized.body, locale).toContain(catalog['client.waiting_response'][locale]);
    }
  });

  it('keeps canonical, technical, and machine-source content invariant while localizing human navigation', () => {
    const canonical = 'SEC-RISK-001 · open · $1,234.56';
    const body = `<p>Status <bdi data-canonical-source lang="en" dir="ltr">${canonical}</bdi></p><code>${canonical}</code><a href="/api/assurance/records?status=open&amp;limit=5">Machine source</a><a href="${routeUrl('assurance.index', {}, { riskStatus: 'open' })}#risks">Human route</a>`;

    for (const locale of supportedLocales.filter((candidate) => candidate !== defaultLocale)) {
      const localized = localizePresentation('Risk Assurance', 'Risk posture you can inspect.', body, localization(locale));
      expect(localized.body, locale).toContain(`<bdi data-canonical-source lang="en" dir="ltr">${canonical}</bdi>`);
      expect(localized.body, locale).toContain(`<code>${canonical}</code>`);
      expect(localized.body, locale).toContain('href="/api/assurance/records?status=open&amp;limit=5"');
      expect(localized.body, locale).toContain(`href="/assurance?riskStatus=open&amp;lang=${locale}#risks"`);
    }
  });
});
