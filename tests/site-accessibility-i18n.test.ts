import { describe, expect, it } from 'vitest';
import auditConfig from '../config/site-audit-states.json';
import routeManifest from '../docs/route-manifest.json';
import manualMatrix from '../docs/accessibility-manual-verification.json';
import {
  defaultLocale,
  localeResources,
  resolveLocalization,
  supportedLocales,
  type SupportedLocale,
} from '../src/i18n/runtime';
import { routeRequest } from '../src/router';
import {
  applicationRouteRegistry,
  type ApplicationRouteDeclaration,
} from '../src/routing/application-routes';
import { runtimeStyles } from '../src/ui/runtime-styles';
import type { D1PreparedStatement, Env } from '../src/types';

class AuditStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() { return { meta: { last_row_id: 1, changes: this.values.length ? 1 : 0 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-09T12:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'enabled', updated_at: '2026-09-09T12:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

class AuditD1 {
  prepare(sql: string) { return new AuditStatement(sql); }
}

function environment(): Env {
  return {
    DEMO_DB: new AuditD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

const publicPages = (applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[])
  .filter((route) => route.kind === 'page' && route.visibility === 'public' && route.methods.includes('GET'));

function patternMatches(pattern: string, pathname: string): boolean {
  const expected = pattern.split('/').filter(Boolean);
  const actual = pathname.split('/').filter(Boolean);
  if (expected.length !== actual.length) return false;
  return expected.every((segment, index) => segment.startsWith(':') || segment === actual[index]);
}

function configuredStatesFor(route: ApplicationRouteDeclaration): string[] {
  return auditConfig.states
    .map((state) => state.path)
    .filter((path) => patternMatches(route.pattern, new URL(path, 'https://demo.wizardgang.ai').pathname));
}

function inheritedPath(route: ApplicationRouteDeclaration): string {
  if (!route.pattern.includes(':')) return route.pattern;
  const fixture = configuredStatesFor(route)[0];
  if (!fixture) throw new Error(`new public surface requires accessibility/i18n coverage: ${route.id}`);
  return fixture;
}

function localizedPath(path: string, locale: SupportedLocale): string {
  const url = new URL(path, 'https://demo.wizardgang.ai');
  if (locale === defaultLocale) url.searchParams.delete('lang');
  else url.searchParams.set('lang', locale);
  return `${url.pathname}${url.search}`;
}

function count(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

function duplicateIds(html: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const match of html.matchAll(/\sid="([^"]+)"/g)) {
    if (seen.has(match[1])) duplicates.add(match[1]);
    seen.add(match[1]);
  }
  return [...duplicates];
}

function assertStructuralBaseline(html: string, locale: SupportedLocale, label: string): void {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  expect(html, label).toContain(`<html lang="${locale}" dir="${dir}">`);
  expect(count(html, /<main\b/g), `${label} main landmarks`).toBe(1);
  expect(html, `${label} skip link`).toContain('<a class="skip-link" href="#main">');
  expect(html, `${label} main target`).toContain('<main class="site-main" id="main">');
  expect(html, `${label} locale selector`).toContain('id="global-language"');
  expect(html, `${label} locale selector name`).toContain('aria-label=');
  expect(duplicateIds(html), `${label} duplicate ids`).toEqual([]);

  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  expect(headings.length, `${label} headings`).toBeGreaterThan(0);
  expect(headings[0]?.[1], `${label} starts with h1`).toBe('1');
  for (const heading of headings) {
    const text = heading[2].replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
    expect(text.length, `${label} empty heading`).toBeGreaterThan(0);
  }

  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    expect(image[0], `${label} image alternative`).toMatch(/\salt=("[^"]*"|'[^']*')/i);
  }
}

describe('DEMO-238 site-wide accessibility assurance', () => {
  it('inherits every canonical public page and requires explicit fixtures for parameterized surfaces', () => {
    const inventory = publicPages.map((route) => ({
      id: route.id,
      pathname: inheritedPath(route),
      parent: route.page?.parent ?? null,
      expectedPublicStatus: 200,
      stateFixtures: configuredStatesFor(route),
    }));
    expect(inventory.map((entry) => entry.id)).toContain('demos.index');
    expect(new Set(inventory.map((entry) => entry.id)).size).toBe(inventory.length);

    const manifestIds = (routeManifest as Array<{ id: string; kind: string; visibility: string; methods: string[] }>)
      .filter((route) => route.kind === 'page' && route.visibility === 'public' && route.methods.includes('GET'))
      .map((route) => route.id)
      .sort();
    expect(inventory.map((entry) => entry.id).sort()).toEqual(manifestIds);
  });

  it('enforces the structural shell on every public page in English and Arabic RTL', async () => {
    for (const route of publicPages) {
      for (const locale of [defaultLocale, 'ar'] as const) {
        const path = localizedPath(inheritedPath(route), locale);
        const response = await routeRequest(new Request(new URL(path, 'https://demo.wizardgang.ai'), { headers: { accept: 'text/html' } }), environment());
        expect(response.status, `${route.id} ${locale}`).toBe(200);
        const html = await response.text();
        assertStructuralBaseline(html, locale, `${route.id} ${locale}`);
      }
    }
  });

  it('protects the shared target, motion, forced-colors, reflow, focus, and bidi contracts', () => {
    expect(runtimeStyles).toContain('min-block-size: 44px !important');
    expect(runtimeStyles).toContain('outline: 3px solid var(--focus, #ffd84d)');
    expect(runtimeStyles).toContain('max-inline-size: 80ch');
    expect(runtimeStyles).toContain('unicode-bidi: isolate');
    expect(runtimeStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(runtimeStyles).toContain('@media (forced-colors: active)');
  });

  it('keeps manual-only evidence explicitly pending until a human performs it', () => {
    expect(manualMatrix.schemaVersion).toBe(1);
    expect(manualMatrix.records.length).toBeGreaterThanOrEqual(17);
    for (const record of manualMatrix.records) {
      expect(record.status).toBe('pending');
      expect(record.observedResult).toMatch(/pending/i);
      expect(record.reviewDate).toBeNull();
      expect(record.reviewer).toBeNull();
    }
  });
});

describe('DEMO-238 site-wide localization assurance', () => {
  it('keeps the configured locale matrix synchronized with runtime resources', () => {
    expect(supportedLocales).toEqual(['en', 'es', 'fr', 'de', 'ja', 'ar']);
    const expectedKeys = Object.keys(localeResources[defaultLocale]).sort();
    for (const locale of supportedLocales) {
      expect(Object.keys(localeResources[locale]).sort(), locale).toEqual(expectedKeys);
      const context = resolveLocalization(new Request(`https://demo.wizardgang.ai/?lang=${locale}`));
      expect(context.lang).toBe(locale);
      expect(context.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      expect(context.pluralCategory(2)).toBe(new Intl.PluralRules(locale).select(2));
      expect(context.number(12345.67)).toBe(new Intl.NumberFormat(locale).format(12345.67));
    }
  });

  it('renders every declared critical state in every supported locale without dropping route state', async () => {
    for (const state of auditConfig.states) {
      const pathname = new URL(state.path, 'https://demo.wizardgang.ai').pathname;
      const owner = publicPages.find((route) => patternMatches(route.pattern, pathname));
      expect(owner, `${state.name} owns a canonical public route`).toBeDefined();
      for (const locale of supportedLocales) {
        const path = localizedPath(state.path, locale);
        const response = await routeRequest(new Request(new URL(path, 'https://demo.wizardgang.ai'), { headers: { accept: 'text/html' } }), environment());
        expect(response.status, `${state.name} ${locale}`).toBe(200);
        expect(response.headers.get('content-language'), `${state.name} ${locale}`).toBe(locale);
        const html = await response.text();
        assertStructuralBaseline(html, locale, `${state.name} ${locale}`);
        if (locale !== defaultLocale) expect(html, `${state.name} ${locale} persistence`).toContain(`lang=${locale}`);
      }
    }
  });

  it('keeps mixed-direction technical material isolated on the Arabic API surface', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos?lang=ar#rest', { headers: { accept: 'text/html' } }), environment());
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toMatch(/<(?:bdi|code)\b[^>]*(?:dir="ltr"|data-canonical-source)|<code\b/);
  });
});
