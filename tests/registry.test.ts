import { describe, expect, it } from 'vitest';
import { demos } from '../src/demos/registry';
import { bypassOfflineGate, isApiLike, wantsHtml } from '../src/router';
import { sitemapResponse } from '../src/api/sitemap';
import { readFileSync } from 'node:fs';

describe('architecture demo registry', () => {
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
    for (const route of ['/dashboard', '/dashboard/uptime', '/dashboard/health', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing']) {
      expect(routes.has(route)).toBe(true);
    }
  });

  it('keeps registry metadata synchronized with the machine route manifest', () => {
    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{ route: string; source: string; status: string }>;
    for (const demo of demos) {
      const entry = manifest.find((candidate) => candidate.route === demo.route);
      expect(entry, `missing manifest entry for ${demo.route}`).toBeDefined();
      expect(entry?.source).toBe(demo.sourcePath);
      expect(entry?.status).toBe(demo.status);
    }
    expect(demos.every((demo) => demo.status === 'working')).toBe(true);
  });
});

describe('intentional offline gate', () => {
  it('keeps operations, status, offline, and admin routes reachable', () => {
    for (const route of ['/dashboard', '/dashboard/uptime', '/dashboard/health', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing', '/health', '/version', '/__api/operations/logs', '/__api/operations/billing', '/offline', '/admin']) {
      expect(bypassOfflineGate(route)).toBe(true);
    }
  });

  it('does not bypass ordinary demo routes', () => {
    for (const route of ['/edge', '/d1', '/api/rest', '/identity/oauth', '/mcp']) {
      expect(bypassOfflineGate(route)).toBe(false);
    }
  });

  it('identifies machine/API-like paths', () => {
    expect(isApiLike('/__api/edge/inspect')).toBe(true);
    expect(isApiLike('/v1/things')).toBe(true);
    expect(isApiLike('/__api/operations/logs')).toBe(true);
    expect(isApiLike('/graphql')).toBe(true);
    expect(isApiLike('/edge')).toBe(false);
  });

  it('only treats browser-style GETs as HTML redirects', () => {
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/edge', { headers: { accept: 'text/html' } }), '/edge')).toBe(true);
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/__api/evidence/traceability', { headers: { accept: 'application/json' } }), '/__api/evidence/traceability')).toBe(false);
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/edge', { method: 'POST' }), '/edge')).toBe(false);
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/mcp', { headers: { accept: 'text/html' } }), '/mcp')).toBe(true);
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/mcp', { headers: { accept: 'application/json' } }), '/mcp')).toBe(false);
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/graphql/schema'), '/graphql/schema')).toBe(false);
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
