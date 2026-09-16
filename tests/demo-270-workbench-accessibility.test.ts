import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demonstrations } from '../src/demos/demos-page';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class Statement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-16T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const env = {
  DEMO_DB: { prepare: (sql: string) => new Statement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('DEMO-270 accessible Demo Workbench interaction', () => {
  it('renders one correctly related category tab set and one inspector tab panel', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect((html.match(/role="tablist" aria-label="Demo categories"/g) ?? [])).toHaveLength(1);
    expect((html.match(/data-demo-category=/g) ?? [])).toHaveLength(7);
    expect((html.match(/class="demo-category-tab"[^>]+aria-selected="true"/g) ?? [])).toHaveLength(1);
    expect((html.match(/class="demo-category-tab"[^>]+tabindex="0"/g) ?? [])).toHaveLength(1);
    expect((html.match(/aria-controls="demo-workbench"/g) ?? [])).toHaveLength(7);
    expect(html).toContain('id="demo-inspector-panel"');
    expect(html).toContain('role="tabpanel" aria-labelledby="demo-inspector-tab-guide"');
  });

  it('preserves every released fragment and uses native links for category-local selection', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    const fragments = ['d1', 'r2', 'rest', 'graphql', 'webhooks', 'identity', 'mcp', 'edge', 'workers', 'durable-objects', 'accessibility', 'i18n'];

    expect(demonstrations.map((demo) => demo.id)).toEqual(fragments);
    for (const fragment of fragments) expect(html).toContain(`href="#${fragment}"`);
    expect(html).toContain('<nav class="demo-local-selector"');
    expect(html).not.toContain('All demos');
  });

  it('implements conventional keyboard, focus, history, loading, and stale-load controls', () => {
    const source = readFileSync('src/demos/demos-page.ts', 'utf8');
    const accessibilitySource = readFileSync('src/demos/accessibility-page.ts', 'utf8');

    expect(source).toContain("['ArrowLeft', 'ArrowRight', 'Home', 'End']");
    expect(source).toContain("categoryTabs.forEach((tab) => tab.addEventListener('keydown', activateCategoryFromKeyboard))");
    expect(source).toContain("window.addEventListener('hashchange', applySelection)");
    expect(source).toContain("window.addEventListener('popstate', applySelection)");
    expect(source).not.toContain('workbench.focus');
    expect(source).toContain("panel.setAttribute('aria-busy', String(!error))");
    expect(source).toContain("renderState(error instanceof Error ? error.message : 'The demonstration could not be loaded.', 'alert', true, id)");
    expect(source).toContain('if (activeId !== id || controller.signal.aborted) return');
    expect(accessibilitySource).toContain("frame.contentWindow.location.replace('data:text/html;charset=utf-8,'+encodeURIComponent(html))");
    expect(accessibilitySource).not.toContain('frame.srcdoc=await response.text()');
  });

  it('keeps technical content bounded and preserves locale fragments through the shared shell', () => {
    const demosSource = readFileSync('src/demos/demos-page.ts', 'utf8');
    const pageSource = readFileSync('src/ui/page.ts', 'utf8');

    expect(demosSource).toContain('.demo-workbench{min-width:0;max-width:100%');
    expect(demosSource).toContain('.demo-panel{min-width:0;max-width:100%');
    expect(demosSource).toContain('.demo-evidence-list code{direction:ltr;unicode-bidi:isolate');
    expect(demosSource).toContain('@media(max-width:900px){.demo-workbench-layout{grid-template-columns:minmax(0,1fr)}');
    expect(demosSource).toContain('@media(max-width:760px){.demo-category-tabs{flex-wrap:wrap;overflow-x:visible');
    expect(pageSource).toContain("form.action=location.pathname+location.hash");
  });
});
