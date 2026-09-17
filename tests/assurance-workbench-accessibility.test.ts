import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class Statement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-16T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

const env = {
  DEMO_DB: { prepare: (sql: string) => new Statement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567',
} as Env;

describe('DEMO-286 accessible assurance workbench interaction', () => {
  it('renders related framework tabs, named selector, live status, and inspector tabs', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect((html.match(/role="tablist" aria-label="Frameworks"/g) ?? [])).toHaveLength(1);
    expect((html.match(/data-assurance-framework=/g) ?? [])).toHaveLength(3);
    expect((html.match(/class="assurance-framework-tab"[^>]+aria-selected="true"/g) ?? [])).toHaveLength(1);
    expect((html.match(/class="assurance-framework-tab"[^>]+tabindex="0"/g) ?? [])).toHaveLength(1);
    expect((html.match(/aria-controls="assurance-workbench-panel"/g) ?? [])).toHaveLength(3);
    expect(html).toContain('<select data-assurance-section>');
    expect(html).toContain('data-assurance-status role="status" aria-live="polite"');
    expect(html).toContain('role="tablist" aria-label="Record inspector"');
    expect(html).toContain('role="tabpanel"');
  });

  it('keeps canonical record content explicitly English inside localized chrome', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/assurance?lang=fr#ISO27001-A.5.1', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="fr"');
    expect(html).toContain('lang="en"');
  });

  it('implements conventional keyboard, history, loading, announcements, and stale-load controls', () => {
    const source = readFileSync('src/demos/assurance-workbench.ts', 'utf8');
    expect(source).toContain("['ArrowLeft','ArrowRight','Home','End']");
    expect(source).toContain("window.addEventListener('hashchange',applySelection)");
    expect(source).toContain("window.addEventListener('popstate',applySelection)");
    expect(source).toContain("detail.setAttribute('aria-busy','true')");
    expect(source).toContain('controller.abort()');
    expect(source).toContain('if(activeId!==id||local.signal.aborted)return');
    expect(source).toContain('status.textContent=message');
    expect(source).not.toContain('detail.focus');
  });

  it('keeps record/inspector content bounded on narrow layouts and never relies on color alone for status', () => {
    const source = readFileSync('src/demos/assurance-workbench.ts', 'utf8');
    expect(source).toContain('.assurance-workbench{min-width:0;max-width:100%');
    expect(source).toContain('.assurance-record-pane{min-width:0}');
    expect(source).toContain('@media(max-width:900px){.assurance-workbench-layout{grid-template-columns:minmax(0,1fr)}');
    expect(source).toContain('@media(max-width:760px){.assurance-framework-tabs{flex-wrap:wrap;overflow-x:visible}');
    expect(source).toContain("return '✓'");
    expect(source).toContain("return '◐'");
    expect(source).toContain("return '!'");
    expect(source).toContain('statusLabel');
  });
});
