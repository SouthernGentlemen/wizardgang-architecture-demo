import { createHash } from 'node:crypto';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import auditConfig from '../config/site-audit-states.json';
import { demonstrations } from '../src/demos/demos-page';
import { routeRequest } from '../src/router';
import {
  applicationRouteRegistry,
  routeUrl,
  type ApplicationRouteDeclaration,
} from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

const ORIGIN = 'https://demo.wizardgang.ai';
const TEST_SHA = '0123456789abcdef0123456789abcdef01234567';
const SECURITY_HEADERS = [
  'content-security-policy',
  'cross-origin-embedder-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'permissions-policy',
  'referrer-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'x-robots-tag',
] as const;
const FULL_INVENTORY_LOCALES = ['en', 'ar'] as const;
const TEXT_INVENTORY_LOCALES = ['es', 'fr', 'de', 'ja'] as const;
const ASSURANCE_RECORDS = ['ISO27001-A.5.19', 'ISO42001-A.9.4', 'WCAG-2.4.7'] as const;

class BaselineStatement implements D1PreparedStatement {
  private values: unknown[] = [];

  constructor(private readonly sql: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async run() {
    return { meta: { last_row_id: 731, changes: this.values.length ? 1 : 0 } };
  }

  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return {
        results: [{
          state: 'online',
          public_message: 'Available.',
          updated_at: '2026-09-18T12:34:56.000Z',
          updated_by: 'presentation-test',
        }] as T[],
      };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return {
        results: [{
          state: 'enabled',
          updated_at: '2026-09-18T12:34:56.000Z',
          updated_by: 'presentation-test',
        }] as T[],
      };
    }
    if (this.sql.includes('COUNT(*) AS verified') && this.sql.includes('FROM service_health_checks')) {
      return {
        results: [{ verified: 101, operational: 99, intentional: 1 }] as T[],
      };
    }
    if (this.sql.trim() === 'SELECT 1') return { results: [{ value: 1 }] as T[] };
    return { results: [] as T[] };
  }
}

function environment(): Env {
  return {
    DEMO_DB: { prepare: (sql: string) => new BaselineStatement(sql) },
    DEMO_SESSION_SECRET: 'presentation-session-secret-with-32-characters',
    IDENTITY_SESSION_SECRET: 'presentation-identity-secret-with-32-characters',
    IDENTITY_AUDIT_HMAC_SECRET: 'presentation-audit-secret-with-32-characters',
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    DEPLOYED_VERSION: 'v0.26.0-presentation-test',
    DEPLOYED_SHA: TEST_SHA,
    DEPLOYMENT_ENVIRONMENT: 'presentation-test',
    DEPLOYMENT_CI_STATUS: 'success',
    DEMO_ADMIN_USER: 'operator',
    DEMO_ADMIN_PASSWORD: 'test-admin-password',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

interface Surface {
  id: string;
  path: string;
  expectedStatus: number;
  authorization?: string;
}

function publicPageSurfaces(): Surface[] {
  return (applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[])
    .filter((route) => route.kind === 'page'
      && route.visibility === 'public'
      && route.methods.includes('GET')
      && route.id !== 'operations.offline')
    .map((route) => ({
      id: `page:${route.id}`,
      path: routeUrl(route.id),
      expectedStatus: 200,
    }));
}

function surfaces(): Surface[] {
  expect(demonstrations, 'released demo presentation count').toHaveLength(12);
  const inventory = [
    ...publicPageSurfaces(),
    ...auditConfig.states.map((state) => ({
      id: `audit:${state.name}`,
      path: state.path,
      expectedStatus: 200,
    })),
    {
      id: 'page:operations.admin',
      path: routeUrl('operations.admin'),
      expectedStatus: 200,
      authorization: `Basic ${btoa('operator:test-admin-password')}`,
    },
    {
      id: 'page:operations.offline',
      path: routeUrl('operations.offline'),
      expectedStatus: 200,
    },
    {
      id: 'page:ordinary-404',
      path: '/presentation-baseline-missing',
      expectedStatus: 404,
    },
    ...demonstrations.map((demo) => ({
      id: `demo:${demo.id}`,
      path: routeUrl('demos.presentation', { demo: demo.id }),
      expectedStatus: 200,
    })),
    ...ASSURANCE_RECORDS.map((record) => ({
      id: `assurance:${record}`,
      path: routeUrl('assurance.presentation', { record }, { rev: TEST_SHA }),
      expectedStatus: 200,
    })),
  ];
  expect(new Set(inventory.map((surface) => surface.id)).size, 'unique surface IDs').toBe(inventory.length);
  return inventory;
}

function localizedPath(path: string, locale: string): string {
  const url = new URL(path, ORIGIN);
  if (locale === 'en') url.searchParams.delete('lang');
  else url.searchParams.set('lang', locale);
  return `${url.pathname}${url.search}${url.hash}`;
}

function normalizeWhitespace(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeVolatile(value: string | null | undefined): string {
  return normalizeWhitespace(value)
    .replace(/\breq_[0-9a-f]{16,}\b/gi, '<REQUEST_ID>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '<UUID>')
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, '<TIMESTAMP>')
    .replace(new RegExp(TEST_SHA, 'gi'), '<COMMIT_SHA>')
    .replace(/\b[0-9a-f]{40}\b/gi, '<COMMIT_SHA>')
    .replace(/\b\d+\.\d{3}%/g, '<AVAILABILITY_PERCENT>')
    .replace(/\b\d+ measured intervals\b/g, '<AVAILABILITY_INTERVALS> measured intervals')
    .replace(/\b(?:row|record)[ _-]?(?:id)?[ :=#-]*\d+\b/gi, (match) => match.replace(/\d+/, '<ROW_ID>'));
}

function dataAttributes(element: Element): Record<string, string> {
  return Object.fromEntries([...element.attributes]
    .filter((attribute) => attribute.name.startsWith('data-'))
    .map((attribute) => [attribute.name, normalizeVolatile(attribute.value)]));
}

function elementText(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  for (const ignored of clone.querySelectorAll('[aria-hidden="true"], [hidden]')) ignored.remove();
  return normalizeVolatile(clone.textContent);
}

function referencedText(element: Element, document: Document): string {
  const references = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
  return normalizeVolatile(references
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' '));
}

function authorAccessibleName(element: Element, document: Document): string {
  return referencedText(element, document)
    || normalizeVolatile(element.getAttribute('aria-label'));
}

function accessibleName(element: Element, document: Document): string {
  const authored = authorAccessibleName(element, document);
  if (authored) return authored;
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
    const label = formLabel(element, document);
    if (label) return label;
  }
  if (element.tagName === 'IMG') return normalizeVolatile(element.getAttribute('alt'));
  if (element.tagName === 'INPUT') {
    const type = (element.getAttribute('type') ?? 'text').toLowerCase();
    if (['button', 'submit', 'reset'].includes(type)) return normalizeVolatile(element.getAttribute('value'));
  }
  return elementText(element);
}

function formLabel(element: Element, document: Document): string {
  const id = element.getAttribute('id');
  const explicit = id
    ? [...document.querySelectorAll('label')].filter((label) => label.getAttribute('for') === id)
    : [];
  const wrapping = element.closest('label');
  const labels = [...explicit, ...(wrapping && !explicit.includes(wrapping) ? [wrapping] : [])];
  return normalizeVolatile(labels.map((label) => {
    const clone = label.cloneNode(true) as Element;
    for (const control of clone.querySelectorAll('input, select, textarea, button')) control.remove();
    return clone.textContent ?? '';
  }).join(' '));
}

function semanticRole(element: Element, document: Document): string | null {
  const explicit = element.getAttribute('role');
  if (explicit && ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'region', 'form', 'search'].includes(explicit)) {
    return explicit;
  }
  if (element.tagName === 'NAV') return 'navigation';
  if (element.tagName === 'MAIN') return 'main';
  if (element.tagName === 'ASIDE') return 'complementary';
  if (element.tagName === 'HEADER' && !element.parentElement?.closest('article, aside, main, nav, section')) return 'banner';
  if (element.tagName === 'FOOTER' && !element.parentElement?.closest('article, aside, main, nav, section')) return 'contentinfo';
  if (element.tagName === 'SECTION' && authorAccessibleName(element, document)) return 'region';
  if (element.tagName === 'FORM' && authorAccessibleName(element, document)) return 'form';
  return null;
}

function headingLevel(heading: Element): number | string | null {
  const ariaLevel = heading.getAttribute('aria-level');
  if (ariaLevel) return ariaLevel;
  return /^H[1-6]$/.test(heading.tagName) ? Number(heading.tagName.slice(1)) : null;
}

function inlineFingerprint(value: string): string {
  return createHash('sha256').update(normalizeVolatile(value)).digest('hex').slice(0, 16);
}

function parseDocument(html: string, url: string): { window: Window; document: Document } {
  const window = new Window({
    url,
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  });
  window.document.write(html);
  return { window, document: window.document as unknown as Document };
}

function fullInventory(document: Document, response: Response) {
  const html = document.documentElement;
  const links = [...document.querySelectorAll('a[href]')];
  const controls = [...document.querySelectorAll('input, select, textarea')];
  const securityHeaders = Object.fromEntries(SECURITY_HEADERS
    .map((name) => [name, response.headers.get(name)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== null));
  return {
    status: response.status,
    headers: {
      contentType: response.headers.get('content-type'),
      contentLanguage: response.headers.get('content-language'),
      security: securityHeaders,
    },
    document: {
      lang: html?.getAttribute('lang') ?? null,
      dir: html?.getAttribute('dir') ?? null,
      title: normalizeVolatile(document.title),
      description: normalizeVolatile(document.querySelector('meta[name="description"]')?.getAttribute('content')) || null,
      canonical: normalizeVolatile(document.querySelector('link[rel="canonical"]')?.getAttribute('href')) || null,
      openGraph: Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')]
        .map((meta) => [meta.getAttribute('property') ?? '', normalizeVolatile(meta.getAttribute('content'))])),
    },
    landmarks: [...document.querySelectorAll('header, nav, main, aside, footer, section, form, [role]')]
      .map((element) => ({ element, role: semanticRole(element, document) }))
      .filter((entry): entry is { element: Element; role: string } => Boolean(entry.role))
      .map(({ element, role }) => ({
        role,
        name: authorAccessibleName(element, document) || null,
        id: element.getAttribute('id'),
      })),
    headings: [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')].map((heading) => ({
      level: headingLevel(heading),
      text: accessibleName(heading, document),
      id: heading.getAttribute('id'),
    })),
    links: links.map((link) => ({
      name: accessibleName(link, document),
      href: normalizeVolatile(link.getAttribute('href')),
      target: link.getAttribute('target'),
    })),
    buttons: [...document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]')]
      .map((button) => ({
        name: accessibleName(button, document),
        type: button.getAttribute('type') ?? (button.tagName === 'BUTTON' ? 'submit' : 'text'),
        value: normalizeVolatile(button.getAttribute('value')) || null,
      })),
    formControls: controls.map((control) => ({
      element: control.tagName.toLowerCase(),
      type: control.getAttribute('type'),
      label: formLabel(control, document) || null,
      accessibleName: accessibleName(control, document) || null,
      name: control.getAttribute('name'),
      value: normalizeVolatile((control as HTMLInputElement).value) || null,
    })),
    ids: [...document.querySelectorAll('[id]')].map((element) => element.getAttribute('id')),
    fragmentTargets: links.flatMap((link) => {
      const href = link.getAttribute('href');
      if (!href || !href.includes('#')) return [];
      const target = new URL(href, document.URL);
      const current = new URL(document.URL);
      if (target.origin !== current.origin || target.pathname !== current.pathname || !target.hash) return [];
      const fragment = decodeURIComponent(target.hash.slice(1));
      return [{ href: normalizeVolatile(href), fragment, present: Boolean(document.getElementById(fragment)) }];
    }),
    dataHooks: [...document.querySelectorAll('*')]
      .map((element) => ({
        element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`,
        attributes: dataAttributes(element),
      }))
      .filter((entry) => Object.keys(entry.attributes).length > 0),
    scripts: [...document.querySelectorAll('script')].map((script) => ({
      src: normalizeVolatile(script.getAttribute('src')) || null,
      type: script.getAttribute('type') || 'classic',
      async: script.hasAttribute('async'),
      defer: script.hasAttribute('defer'),
      inlineSha256: script.hasAttribute('src') ? null : inlineFingerprint(script.textContent ?? ''),
      data: dataAttributes(script),
    })),
    stylesheets: [
      ...[...document.querySelectorAll('link[rel~="stylesheet"]')].map((link) => ({
        kind: 'link',
        href: normalizeVolatile(link.getAttribute('href')),
        media: link.getAttribute('media'),
        inlineSha256: null,
        data: dataAttributes(link),
      })),
      ...[...document.querySelectorAll('style')].map((style) => ({
        kind: 'inline',
        href: null,
        media: style.getAttribute('media'),
        inlineSha256: inlineFingerprint(style.textContent ?? ''),
        data: dataAttributes(style),
      })),
    ],
  };
}

function textInventory(document: Document) {
  const named = [...document.querySelectorAll('a, button, input, select, textarea, nav, aside, form, [role="tab"], [role="dialog"], [role="region"], [role="tabpanel"]')]
    .map((element) => ({
      element: element.tagName.toLowerCase(),
      role: element.getAttribute('role') ?? semanticRole(element, document),
      name: accessibleName(element, document),
    }))
    .filter((entry) => entry.name);
  return {
    headings: [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')].map((heading) => ({
      level: headingLevel(heading),
      text: accessibleName(heading, document),
    })),
    accessibleNames: named,
    labels: [...document.querySelectorAll('input, select, textarea')].map((control) => ({
      name: control.getAttribute('name'),
      label: formLabel(control, document) || null,
    })),
  };
}

async function renderSurface(surface: Surface, locale: string) {
  const path = localizedPath(surface.path, locale);
  const headers = new Headers({ accept: 'text/html' });
  if (surface.authorization) headers.set('authorization', surface.authorization);
  const response = await routeRequest(new Request(new URL(path, ORIGIN), { headers }), environment());
  expect(response.status, `${surface.id} ${locale}`).toBe(surface.expectedStatus);
  const html = await response.text();
  const parsed = parseDocument(html, new URL(path, ORIGIN).toString());
  return { response, ...parsed };
}

async function localeInventory(locale: string, mode: 'full' | 'text') {
  const inventory: Record<string, unknown> = {};
  for (const surface of surfaces()) {
    const { response, window, document } = await renderSurface(surface, locale);
    try {
      inventory[surface.id] = mode === 'full'
        ? fullInventory(document, response)
        : textInventory(document);
    } finally {
      await window.happyDOM.close();
    }
  }
  return inventory;
}

/**
 * Update an accepted entry with:
 *   npx vitest run tests/presentation-baseline.test.ts -u
 *
 * Review the semantic diff instead of accepting the files wholesale. Every baseline
 * update requires its presentation difference and reason in the controlled record.
 */
describe('DEMO-325 presentation acceptance baseline', () => {
  it('normalizes every volatile presentation value class', () => {
    expect(normalizeVolatile([
      '2026-09-18T12:34:56.000Z',
      'req_0123456789abcdef',
      '123e4567-e89b-42d3-a456-426614174000',
      TEST_SHA,
      '99.000%',
      '100 measured intervals',
      'row id 731',
    ].join(' | '))).toBe([
      '<TIMESTAMP>',
      '<REQUEST_ID>',
      '<UUID>',
      '<COMMIT_SHA>',
      '<AVAILABILITY_PERCENT>',
      '<AVAILABILITY_INTERVALS> measured intervals',
      'row id <ROW_ID>',
    ].join(' | '));
  });

  for (const locale of FULL_INVENTORY_LOCALES) {
    it(`records every HTML surface semantic inventory in ${locale}`, async () => {
      const inventory = await localeInventory(locale, 'full');
      await expect(`${JSON.stringify(inventory, null, 2)}\n`).toMatchFileSnapshot(
        `./fixtures/presentation-baseline/${locale}.json`,
      );
    }, 60_000);
  }

  for (const locale of TEXT_INVENTORY_LOCALES) {
    it(`records every HTML surface translated text inventory in ${locale}`, async () => {
      const inventory = await localeInventory(locale, 'text');
      await expect(`${JSON.stringify(inventory, null, 2)}\n`).toMatchFileSnapshot(
        `./fixtures/presentation-baseline/${locale}-text.json`,
      );
    }, 60_000);
  }
});
