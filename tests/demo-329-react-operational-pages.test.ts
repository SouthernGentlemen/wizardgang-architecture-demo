import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import assetManifest from '../docs/asset-manifest.json';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class OperationalStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1, changes: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-19T12:00:00.000Z', updated_by: 'operator' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'enabled', updated_at: '2026-09-19T12:00:00.000Z', updated_by: 'operator' }] as T[] };
    }
    if (this.sql.includes('COUNT(*) AS verified')) {
      return { results: [{ verified: 11, operational: 10, intentional: 1 }] as T[] };
    }
    if (this.sql.trim() === 'SELECT 1') return { results: [{ value: 1 }] as T[] };
    return { results: [] as T[] };
  }
}

const password = 'local-admin-password-that-must-not-render';
const environment = {
  DEMO_DB: { prepare: (sql: string) => new OperationalStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_ADMIN_USER: 'operator',
  DEMO_ADMIN_PASSWORD: password,
} as Env;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('DEMO-329 React homepage and operational pages', () => {
  it('keeps data loading in handlers and renders each migrated page from synchronous TSX', () => {
    const frontendRoutes = readFileSync('src/interfaces/route-capabilities/frontend.ts', 'utf8');
    const assuranceRoutes = readFileSync('src/assurance/route-capabilities/advisories.ts', 'utf8');
    const operationalRoutes = readFileSync('src/routing/operational-routes.ts', 'utf8');
    for (const path of ['src/ui/home.tsx', 'src/ui/security.tsx', 'src/ui/admin.tsx', 'src/ui/offline.tsx', 'src/ui/not-found.tsx']) {
      const source = readFileSync(path, 'utf8');
      expect(source, path).toContain('reactPageResponse');
      expect(source, path).not.toContain('pageResponse(');
      expect(source, path).not.toContain('localizePresentation');
    }
    expect(frontendRoutes).toContain('renderHome(env, await loadHomePageData(env))');
    expect(assuranceRoutes).toContain('renderSecurity(env, loadSecurityPageData())');
    expect(operationalRoutes).toContain('renderAdmin(env, demoControl, crawlerControl, notice)');
    expect(operationalRoutes).toContain('renderOffline(env, await getDemoControl(env)');
    expect(readFileSync('src/ui/home.tsx', 'utf8')).toContain('export function renderHome(');
    expect(readFileSync('src/ui/security.tsx', 'utf8')).toContain('export function renderSecurity(');
  });

  it('preserves the protected admin boundary without rendering credentials', async () => {
    const unauthenticated = await routeRequest(new Request('https://demo.wizardgang.ai/admin'), environment);
    expect(unauthenticated.status).toBe(401);

    const authenticated = await routeRequest(new Request('https://demo.wizardgang.ai/admin', {
      headers: { authorization: `Basic ${btoa(`operator:${password}`)}`, accept: 'text/html' },
    }), environment);
    const html = await authenticated.text();
    expect(authenticated.status).toBe(200);
    expect(authenticated.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(html).not.toContain(password);
    expect(html).not.toContain(btoa(`operator:${password}`));
    expect(html.match(/<script(?![^>]*src=)/g)).toHaveLength(1);
    expect(html).toContain(assetManifest.assets['scripts.admin']);
  });

  it('keeps the offline page and ordinary 404 status and crawler contracts', async () => {
    const offline = await routeRequest(new Request('https://demo.wizardgang.ai/offline', { headers: { accept: 'text/html' } }), environment);
    expect(offline.status).toBe(200);
    expect(offline.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(await offline.text()).toContain('The demo is running.');

    const missing = await routeRequest(new Request('https://demo.wizardgang.ai/not-a-registered-route', { headers: { accept: 'text/html' } }), environment);
    expect(missing.status).toBe(404);
    expect(missing.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(await missing.text()).toContain('That route does not exist.');
  });

  it('ships admin behavior as a hashed browser module and enhances preview and confirmation controls', async () => {
    expect(assetManifest.assets['scripts.admin']).toMatch(/^\/assets\/admin-browser-[A-Za-z0-9_-]+\.js$/);
    const window = new Window({ url: 'https://demo.wizardgang.ai/admin' });
    window.document.body.innerHTML = `
      <textarea id="message">Available.</textarea>
      <p data-offline-message-preview>Available.</p>
      <button data-confirm-change="Confirm this change">Change</button>
      <script type="module" data-admin-browser data-messages='{"emptyMessage":"Nothing supplied.","confirm":"Continue?"}'></script>`;
    vi.stubGlobal('window', window);
    vi.stubGlobal('document', window.document);
    const confirm = vi.fn(() => false);
    Object.defineProperty(window, 'confirm', { configurable: true, value: confirm });

    await import('../src/browser/admin');

    const message = window.document.querySelector<HTMLTextAreaElement>('#message')!;
    const preview = window.document.querySelector<HTMLElement>('[data-offline-message-preview]')!;
    message.value = '';
    message.dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(preview.textContent).toBe('Nothing supplied.');

    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    window.document.querySelector<HTMLButtonElement>('[data-confirm-change]')!.dispatchEvent(event);
    expect(confirm).toHaveBeenCalledWith('Confirm this change');
    expect(event.defaultPrevented).toBe(true);
  });
});
