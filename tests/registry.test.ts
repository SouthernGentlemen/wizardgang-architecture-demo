import { describe, expect, it } from 'vitest';
import { demos } from '../src/demos/registry';
import { sitemapResponse } from '../src/api/sitemap';
import {
  applicationRouteRegistry,
  type ApplicationRouteDeclaration,
} from '../src/routing/application-routes';
import { operationalRouteRegistry } from '../src/routing/operational-routes';
import { matchRoute } from '../src/routing/registry';
import { readFileSync } from 'node:fs';

const applicationRoutes = applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[];

describe('architecture demo registry', () => {
  it('publishes the consolidated HTML routes in four architecture groups', () => {
    expect(demos).toHaveLength(9);
    expect([...new Set(demos.map((demo) => demo.group))]).toEqual([
      'Platform', 'Interfaces', 'Delivery & Governance', 'Operations',
    ]);
  });

  it('uses unique public routes', () => {
    expect(new Set(demos.map((demo) => demo.route)).size).toBe(demos.length);
  });

  it('uses one source module per architecture demo route', () => {
    expect(new Set(demos.map((demo) => demo.sourcePath)).size).toBe(demos.length);
  });

  it('keeps every architecture route absolute', () => {
    expect(demos.every((demo) => demo.route.startsWith('/'))).toBe(true);
  });

  it('includes the complete operations dashboard route family', () => {
    const routes = new Set(demos.map((demo) => demo.route));
    expect([...routes].filter((route) => route.startsWith('/dashboard'))).toEqual([
      '/dashboard', '/dashboard/uptime', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing',
    ]);
  });

  it('places consolidated assurance and separate security in delivery and governance', () => {
    const assurance = demos.find((demo) => demo.route === '/assurance');
    expect(assurance).toMatchObject({ group: 'Delivery & Governance', sourcePath: 'src/demos/assurance.ts', status: 'working' });
    const security = demos.find((demo) => demo.route === '/security');
    expect(security).toMatchObject({ group: 'Delivery & Governance', sourcePath: 'src/demos/security.ts', status: 'working' });
    for (const retired of ['/git', '/governance', '/evidence', '/compliance', '/governance/concerns', '/governance/risks', '/governance/incidents']) {
      expect(demos.some((demo) => demo.route === retired), retired).toBe(false);
    }
    expect(demos.some((demo) => demo.route === '/dashboard/compliance')).toBe(false);
  });

  it('keeps registry metadata synchronized with the machine route manifest', () => {
    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{
      route: string;
      source: { module: string };
      status: string;
      navigation?: { group: string; label: string; index: boolean; sitemap: boolean };
    }>;
    for (const demo of demos) {
      const entry = manifest.find((candidate) => candidate.route === demo.route);
      expect(entry, `missing manifest entry for ${demo.route}`).toBeDefined();
      expect(entry?.source.module).toMatch(/^src\//);
      expect(entry?.status).toBe(demo.status);
      expect(entry?.navigation).toMatchObject({
        group: demo.group,
        label: demo.title,
        index: true,
        sitemap: true,
      });
    }
    expect(demos.every((demo) => demo.status === 'working')).toBe(true);
    expect(manifest.filter((entry) => entry.navigation?.index)).toHaveLength(demos.length);
  });
});

describe('intentional offline route policies', () => {
  it('keeps registered operational recovery surfaces reachable', () => {
    for (const route of [
      '/dashboard', '/dashboard/uptime', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing',
      '/health', '/version', '/__api/operations/logs', '/__api/operations/cloudflare-usage',
      '/__api/operations/billing', '/offline', '/admin', '/robots.txt', '/.well-known/security.txt', '/og.png',
    ]) {
      const declaration = operationalRouteRegistry.declarations.find((candidate) => candidate.pattern === route);
      expect(declaration, route).toBeDefined();
      expect(declaration?.offline.mode, route).toBe('available');
    }
  });

  it('keeps sitemap gated and ordinary demo routes outside the operational registry', () => {
    const sitemap = operationalRouteRegistry.declarations.find((candidate) => candidate.pattern === '/sitemap.xml');
    expect(sitemap?.offline.mode).toBe('gated');

    for (const route of ['/edge', '/d1', '/api', '/graphql', '/webhooks', '/identity', '/mcp', '/evidence', '/governance/risks', '/governance/incidents']) {
      expect(matchRoute(operationalRouteRegistry, 'GET', route), route).toEqual({ status: 'not-found', statusCode: 404 });
    }
  });

  it('declares browser response behavior without API-prefix or HTML-path inference', () => {
    const browserPolicy = (pattern: string) => applicationRoutes.find((route) => route.pattern === pattern)?.browserHtml;
    for (const pattern of [
      '/__api/edge/inspect',
      '/v1/assurance',
      '/v1/assurance/evidence',
      '/v1/assurance/risks',
      '/v1/assurance/incidents',
      '/__api/operations/logs',
      '/mcp/server',
      '/graphql/schema',
    ]) expect(browserPolicy(pattern), pattern).toBe('never');
    expect(browserPolicy('/graphql')).toBe('never');
    expect(browserPolicy('/mcp')).toBeUndefined();
    expect(browserPolicy('/interfaces')).toBe('page');
    expect(browserPolicy('/platform')).toBe('page');
    expect(browserPolicy('/edge')).toBeUndefined();
    expect(applicationRoutes.some((route) => route.pattern === '/v1/things')).toBe(false);
  });
});

describe('public sitemap', () => {
  it('publishes every registered route over https', async () => {
    const xml = await sitemapResponse(new Request('https://demo.wizardgang.ai/sitemap.xml'), demos).text();
    expect(xml).toContain('<loc>https://demo.wizardgang.ai/</loc>');
    for (const demo of demos) {
      expect(xml, demo.route).toContain(`<loc>https://demo.wizardgang.ai${demo.route}</loc>`);
    }
    expect((xml.match(/<loc>/g) ?? []).length).toBe(demos.length + 1);
  });
});
