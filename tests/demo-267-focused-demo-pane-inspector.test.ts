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

describe('DEMO-267 focused demo pane and inspector', () => {
  it('renders one focused D1 pane with purpose, task framing, inspector, and compact tools', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('data-demo-active-title>D1</h2>');
    expect(html).toContain('data-demo-purpose>Run relational CRUD against resettable shared demo state.</p>');
    expect(html).toContain('<strong>Try this:</strong><span data-demo-try>Create or edit a row, then inspect the exact SQL and response.</span>');
    expect((html.match(/data-demo-inspector aria-label=/g) ?? [])).toHaveLength(1);
    expect(html).toContain('data-demo-inspector-mode="Guide"');
    expect(html).toContain('data-demo-inspector-mode="Request"');
    expect(html).toContain('data-demo-inspector-mode="Evidence"');
    expect(html).toContain('data-demo-reset hidden>Reset demo</button>');
    expect(html).toContain('data-demo-source>View source</a>');
    expect(html).not.toContain('<details');
    expect(html).not.toContain('All demos');
  });

  it('keeps demo-specific inspector material honest and does not invent Request modes for every demo', () => {
    const d1 = demonstrations.find((demo) => demo.id === 'd1');
    const rest = demonstrations.find((demo) => demo.id === 'rest');
    expect(d1?.request?.fields.map((field) => field.selector)).toEqual([
      '[data-inspector-status]',
      '[data-inspector-sql]',
      '[data-state-output]',
    ]);
    expect(rest?.request).toBeUndefined();
    expect(demonstrations.filter((demo) => demo.request).map((demo) => demo.id)).toEqual(['d1']);
  });

  it('keeps the live demonstration primary and stacks the inspector below it on narrow layouts', () => {
    const source = readFileSync('src/demos/demos-page.ts', 'utf8');
    expect(source).toContain('grid-template-columns:minmax(0,7fr) minmax(16rem,3fr)');
    expect(source).toContain('@media(max-width:900px){.demo-workbench-layout{grid-template-columns:minmax(0,1fr)}');
    expect(source).toContain('.demo-panel{min-width:0;min-height:20rem;padding:1rem;overflow-x:auto}');
  });

  it('mirrors real D1 request evidence and delegates reset to the mounted demo instead of fabricating state', () => {
    const source = readFileSync('src/demos/demos-page.ts', 'utf8');
    expect(source).toContain('const target = panel.querySelector(field.selector)');
    expect(source).toContain("requestObserver.observe(panel, { subtree: true, childList: true, characterData: true })");
    expect(source).toContain("const target = panel.querySelector('[data-reset]')");
    expect(source).toContain('if (target instanceof HTMLButtonElement) target.click()');
  });

  it('preserves the DEMO-265 mounting, cancellation, history, and bounded-cache contract', () => {
    const source = readFileSync('src/demos/demos-page.ts', 'utf8');
    expect(source).toContain('if (controller) controller.abort()');
    expect(source).toContain("section.dispatchEvent(new CustomEvent('demo:deactivate'))");
    expect(source).toContain('if (activeId !== id || controller.signal.aborted) return');
    expect(source).toContain('if (htmlCache.size >= demos.length');
    expect(source).toContain("window.addEventListener('hashchange', () => applySelection(true))");
    expect(source).toContain("window.addEventListener('popstate', () => applySelection(true))");
    expect(source).toContain("history.pushState(null, '', nextHash)");
    expect((source.match(/const DEFAULT_DEMO_ID = 'd1'/g) ?? [])).toHaveLength(1);
  });
});
