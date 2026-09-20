import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demoCategories, demonstrations } from '../src/demos/demos-page';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class Statement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-15T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const env = {
  DEMO_DB: { prepare: (sql: string) => new Statement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

const expectedByCategory = {
  Data: ['d1', 'r2'],
  APIs: ['rest', 'graphql'],
  Integrations: ['webhooks'],
  Identity: ['identity'],
  AI: ['mcp'],
  Platform: ['edge', 'workers', 'durable-objects'],
  Quality: ['accessibility', 'i18n'],
} as const;

describe('DEMO-265 tabbed demo workbench', () => {
  it('defines the seven-category workbench taxonomy without an all-demos category', () => {
    expect(demoCategories).toEqual(['Data', 'APIs', 'Integrations', 'Identity', 'AI', 'Platform', 'Quality']);
    expect(demoCategories).not.toContain('All demos');
    for (const category of demoCategories) {
      expect(demonstrations.filter((demo) => demo.category === category).map((demo) => demo.id)).toEqual(expectedByCategory[category]);
    }
  });

  it('renders navigation plus one persistent empty workbench instead of a trailing demo inventory', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<h1>Architecture Demos</h1>');
    expect(html).toContain('aria-label="Demo categories"');
    expect(html).toContain('data-demo-id="d1"');
    expect((html.match(/<section id="demo-workbench" class="demo-workbench" data-demo-workbench/g) ?? [])).toHaveLength(1);
    expect((html.match(/<div class="demo-panel" data-demo-panel\b/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain('<details');
    expect(html).not.toContain('Primary demonstrations');
    expect(html).not.toContain('Supporting proof');
    for (const demo of demonstrations) expect(html).toContain(`href="#${demo.id}"`);
  });

  it('keeps category-local selectors only for categories with more than one demo', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    for (const category of ['Data', 'APIs', 'Platform', 'Quality']) {
      expect(html).toContain(`aria-label="${category} demos"`);
    }
    for (const category of ['Integrations', 'Identity', 'AI']) {
      expect(html).not.toContain(`aria-label="${category} demos"`);
    }
    expect(html).toContain('>REST</a>');
    expect(html).toContain('>Durable Objects</a>');
    expect(html).toContain('>Internationalization</a>');
  });

  it('defaults invalid or missing fragments to D1 and synchronizes hash and history selection', () => {
    const registrySource = readFileSync('src/demos/demos-page.ts', 'utf8');
    const browserSource = readFileSync('src/browser/demos.ts', 'utf8');
    expect(registrySource).toContain("export const DEFAULT_DEMO_ID = 'd1'");
    expect(browserSource).toContain('return byId.has(id) ? id : config.defaultDemoId');
    expect(browserSource).toContain("window.addEventListener('hashchange', applySelection)");
    expect(browserSource).toContain("window.addEventListener('popstate', applySelection)");
    expect(browserSource).toContain("history.pushState(null, '', nextHash)");
  });

  it('deactivates the previous demo and aborts stale work before mounting the next presentation', () => {
    const source = readFileSync('src/browser/demos.ts', 'utf8');
    expect(source).toContain('pending.get(activeId)?.abort()');
    expect(source).toContain("panel.querySelector('[data-demo-section]')?.dispatchEvent(new CustomEvent('demo:deactivate'))");
    expect(source).toContain('panel.replaceChildren()');
    expect(source).toContain('if (activeId !== id || controller.signal.aborted) return');
    expect(source).toContain('const htmlCache = new Map<string, string>()');
    expect(source).toContain('if (htmlCache.size >= config.demos.length');
  });
});
