import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { demonstrations } from '../src/demos/demos-page';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

const env = {
  WG_DB: new SqliteD1(),
  GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('DEMO-257 curated demos', () => {
  it('keeps the visitor-facing capability metadata ahead of runtime and quality proof', () => {
    const primary = demonstrations.filter((demo) => demo.tier === 'primary');
    const secondary = demonstrations.filter((demo) => demo.tier === 'secondary');
    expect([...new Set(primary.map((demo) => demo.group))]).toEqual([
      'Data', 'APIs', 'Integrations', 'Identity', 'AI / MCP',
    ]);
    expect(primary.map((demo) => demo.id)).toEqual(['d1', 'r2', 'rest', 'graphql', 'webhooks', 'oauth', 'sso', 'saml', 'mcp']);
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
    for (const fragment of demonstrations.map((demo) => demo.id)) expect(html).toContain(`demo=${fragment}#${fragment}"`);
    expect((html.match(/<div class="demo-panel" data-demo-panel\b/g) ?? [])).toHaveLength(1);
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
