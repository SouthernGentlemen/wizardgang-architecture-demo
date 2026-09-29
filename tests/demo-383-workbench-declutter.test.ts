import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';
import { demonstrations, hasDemoInspector } from '../src/demos/demos-page';
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

const withoutInspector = ['rest', 'graphql', 'webhooks', 'oauth', 'sso', 'saml', 'mcp', 'edge', 'accessibility'];

describe('DEMO-383 phone workbench', () => {
  it('keeps the fourteen released fragments and only the five retained inspectors', () => {
    expect(demonstrations).toHaveLength(14);
    expect(demonstrations.filter(hasDemoInspector).map((demo) => demo.id)).toEqual([
      'd1', 'r2', 'workers', 'durable-objects', 'i18n',
    ]);
    for (const demo of demonstrations) expect(demo).not.toHaveProperty('tryThis');
  });

  it.each(withoutInspector)('server-renders %s without visible inspector chrome or task copy', async (id) => {
    const response = await routeRequest(new Request(`https://demo.wizardgang.ai/demos?demo=${id}`, { headers: { accept: 'text/html' } }), env);
    expect(response.status).toBe(200);
    const html = await response.text();
    const window = new Window();
    try {
      window.document.documentElement.innerHTML = html;
      const document = window.document;
      expect(document.querySelector('[data-demo-workbench]')?.getAttribute('data-demo-id')).toBe(id);
      expect(document.querySelectorAll('[data-demo-panel] [data-demo-section]')).toHaveLength(1);
      expect(document.querySelector('[data-demo-panel] [data-demo-section]')?.getAttribute('data-demo-section')).toBe(id);
      expect(document.querySelector('[data-demo-inspector]')).toBeNull();
      expect(document.querySelector('[data-demo-source]')).toBeNull();
      expect(document.querySelector('.demo-workbench-layout')?.getAttribute('data-demo-inspector-enabled')).toBe('false');
      expect(document.querySelector('[data-demo-active-context]')).toBeNull();
      expect(document.querySelector('[data-demo-try]')).toBeNull();
      expect(html).not.toContain('Try this:');
      expect(html).toContain(`demo=${id}#${id}`);
    } finally {
      await window.happyDOM.abort();
    }
  });

  it('keeps every REST operation form and removes its repeated tutorial and code samples', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos?demo=rest', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(html.match(/data-rest-form=""/g)).toHaveLength(6);
    for (const removed of ['Focused browser tutorial.', 'Operation selector', 'Choose one request', 'Code samples for this operation']) {
      expect(html).not.toContain(removed);
    }
  });
});
