import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import assetManifest from '../docs/asset-manifest.json';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class AssuranceStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-20T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const deployedSha = '0123456789abcdef0123456789abcdef01234567';
const environment = {
  DEMO_DB: { prepare: (sql: string) => new AssuranceStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: deployedSha,
} as Env;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('DEMO-330 React assurance workbench', () => {
  it('renders the workbench and focused record API from React without legacy string localization', async () => {
    const renderer = readFileSync('src/demos/assurance-workbench.tsx', 'utf8');
    expect(renderer).toContain('reactPageResponse');
    expect(renderer).toContain('renderToStaticMarkup(<AssuranceRecordPane');
    expect(renderer).not.toContain('escapeHtml');
    expect(renderer).not.toContain('localizePresentation');

    const page = await routeRequest(new Request('https://demo.wizardgang.ai/assurance?lang=ar', { headers: { accept: 'text/html' } }), environment);
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html.match(/<script(?![^>]*src=)/g)).toHaveLength(1);
    expect(html).toContain(assetManifest.assets['scripts.assurance']);
    expect(html).toContain('data-assurance-record="ISO27001-A.5.1"');

    const fragment = await routeRequest(new Request(`https://demo.wizardgang.ai/api/assurance/WCAG-2.4.7?lang=ar&rev=${deployedSha}`), environment);
    const fragmentHtml = await fragment.text();
    expect(fragment.status).toBe(200);
    expect(fragment.headers.get('content-language')).toBe('ar');
    expect(fragment.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(fragmentHtml).toContain('data-assurance-record="WCAG-2.4.7"');
    expect(fragmentHtml).toContain('عارض السجل');
    expect(fragmentHtml).toContain('lang="en"');
  });

  it('ships a DOM-building module with localized message data and no client HTML construction', () => {
    const source = readFileSync('src/browser/assurance.ts', 'utf8');
    expect(assetManifest.assets['scripts.assurance']).toMatch(/^\/assets\/assurance-browser-[A-Za-z0-9_-]+\.js$/);
    expect(source).toContain("document.createElement('a')");
    expect(source).toContain('replaceChildren');
    expect(source).toContain('new Map<string, DocumentFragment>()');
    expect(source).not.toContain('innerHTML');
    expect(source).not.toContain('outerHTML');
    expect(source).not.toContain('insertAdjacentHTML');
    expect(source).not.toContain('document.write');
    expect(readFileSync('src/demos/assurance-workbench.tsx', 'utf8')).toContain('data-messages={messages}');
  });

  it('preserves Arabic WCAG deep links, announcements, fragment caching, and inspector markup', async () => {
    const window = new Window({ url: 'https://demo.wizardgang.ai/assurance?lang=ar#WCAG-2.4.7' });
    const records = [
      { id: 'ISO27001-A.5.1', framework: 'iso-27001', frameworkLabel: 'ISO/IEC 27001:2022', section: 'Annex A', reference: 'A.5.1', title: 'Security policy governance', status: 'partial' },
      { id: 'WCAG-2.4.7', framework: 'wcag-2.2', frameworkLabel: 'WCAG 2.2', section: '2. Operable', reference: '2.4.7', title: 'Focus Visible', status: 'pass' },
    ];
    const config = JSON.stringify({
      records,
      statuses: ['pass', 'partial', 'gap', 'not-applicable'],
      defaultId: 'ISO27001-A.5.1',
      deployedSha,
      endpointTemplate: '/api/assurance/__record__',
    });
    const messages = JSON.stringify({
      loading: 'جارٍ التحميل…',
      loaded: 'تم التحميل.',
      failed: 'تعذر التحميل.',
      statusLabels: { pass: 'ناجح', partial: 'جزئي', gap: 'فجوة', 'not-applicable': 'لا ينطبق' },
    });
    window.document.body.innerHTML = `
      <button data-assurance-framework="iso-27001" aria-selected="true"></button>
      <button data-assurance-framework="wcag-2.2" aria-selected="false"></button>
      <select data-assurance-section></select>
      <div data-assurance-record-grid></div>
      <div data-assurance-record-count></div>
      <div data-assurance-section-posture>${['pass', 'partial', 'gap', 'not-applicable'].map((status) => `<span data-posture-count="${status}"></span>`).join('')}</div>
      <div data-assurance-framework-posture>${['pass', 'partial', 'gap', 'not-applicable'].map((status) => `<span data-posture-count="${status}"></span>`).join('')}</div>
      <p data-assurance-status></p>
      <section data-assurance-detail aria-busy="false"></section>
      <script type="module" data-assurance-browser data-config='${config}' data-messages='${messages}'></script>`;

    const requested: string[] = [];
    const fetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      requested.push(url);
      const id = url.includes('WCAG-2.4.7') ? 'WCAG-2.4.7' : 'ISO27001-A.5.1';
      return new Response(`<article data-assurance-record="${id}"><h2>${id}</h2><section class="assurance-inspector"><button data-assurance-inspector-mode="documentation"></button><div data-assurance-inspector-panel="documentation"></div></section></article>`);
    });
    vi.stubGlobal('window', window);
    vi.stubGlobal('document', window.document);
    vi.stubGlobal('Element', window.Element);
    vi.stubGlobal('Node', window.Node);
    vi.stubGlobal('DOMParser', window.DOMParser);
    vi.stubGlobal('fetch', fetch);

    await import('../src/browser/assurance');
    await vi.waitFor(() => expect(window.document.querySelector('[data-assurance-record="WCAG-2.4.7"]')).not.toBeNull());
    expect(window.location.hash).toBe('#WCAG-2.4.7');
    expect(requested[0]).toContain('/api/assurance/WCAG-2.4.7?lang=ar&rev=');
    expect(window.document.querySelector('[data-assurance-status]')?.textContent).toBe('تم التحميل.');

    window.document.querySelector<HTMLButtonElement>('[data-assurance-framework="iso-27001"]')!.click();
    await vi.waitFor(() => expect(window.document.querySelector('[data-assurance-record="ISO27001-A.5.1"]')).not.toBeNull());
    window.document.querySelector<HTMLButtonElement>('[data-assurance-framework="wcag-2.2"]')!.click();
    await vi.waitFor(() => expect(window.document.querySelector('[data-assurance-record="WCAG-2.4.7"]')).not.toBeNull());
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
