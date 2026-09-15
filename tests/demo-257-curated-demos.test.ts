import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { demonstrations } from '../src/demos/demos-page';
import type { D1PreparedStatement, Env } from '../src/types';

class Statement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-14T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const env = {
  DEMO_DB: { prepare: (sql: string) => new Statement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('DEMO-257 curated demos', () => {
  it('keeps the visitor-facing capability metadata ahead of runtime and quality proof', () => {
    const primary = demonstrations.filter((demo) => demo.tier === 'primary');
    const secondary = demonstrations.filter((demo) => demo.tier === 'secondary');
    expect([...new Set(primary.map((demo) => demo.group))]).toEqual([
      'Data', 'APIs', 'Integrations', 'Identity', 'AI / MCP',
    ]);
    expect(primary.map((demo) => demo.id)).toEqual(['d1', 'r2', 'rest', 'graphql', 'webhooks', 'identity', 'mcp']);
    expect([...new Set(secondary.map((demo) => demo.group))]).toEqual(['Runtime architecture', 'Quality']);
    expect(secondary.map((demo) => demo.id)).toEqual(['edge', 'workers', 'durable-objects', 'accessibility', 'i18n']);
  });

  it('keeps all released demonstrations reachable through stable fragments in the workbench navigation', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/demos', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('aria-label="Demo categories"');
    for (const category of ['Data', 'APIs', 'Integrations', 'Identity', 'AI', 'Platform', 'Quality']) {
      expect(html).toContain(`>${category}</strong>`);
    }
    for (const fragment of demonstrations.map((demo) => demo.id)) expect(html).toContain(`href="#${fragment}"`);
    expect((html.match(/<div class="demo-panel" data-demo-panel>/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain('Primary demonstrations');
    expect(html).not.toContain('Supporting proof');
  });

  it('makes MCP endpoint, tools, one run action, and connection guidance the default success path', async () => {
    const response = await routeRequest(new Request('https://demo.wizardgang.ai/api/demos/mcp', { headers: { accept: 'text/html' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('Model Context Protocol');
    expect(html).toContain('Available tools');
    expect(html).toContain('<code>ping</code>');
    expect(html).toContain('Run ping');
    expect(html).toContain('Connect a client');
    expect(html).toContain('Copy endpoint');
    expect(html).toContain('<summary>Advanced client setup and wire details</summary>');
    expect(html.indexOf('Run ping')).toBeLessThan(html.indexOf('Claude Code'));
  });
});
