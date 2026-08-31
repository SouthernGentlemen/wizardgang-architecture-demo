import { describe, expect, it } from 'vitest';
import { demos } from '../src/demos/registry';
import { bypassOfflineGate, isApiLike, wantsHtml } from '../src/router';

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
});

describe('intentional offline gate', () => {
  it('keeps operations, status, offline, and admin routes reachable', () => {
    for (const route of ['/dashboard', '/dashboard/uptime', '/dashboard/health', '/dashboard/docs', '/dashboard/logs', '/dashboard/billing', '/health', '/version', '/__api/operations/logs', '/offline', '/admin']) {
      expect(bypassOfflineGate(route)).toBe(true);
    }
  });

  it('does not bypass ordinary demo routes', () => {
    for (const route of ['/edge', '/d1', '/api/rest', '/identity/oauth', '/mcp']) {
      expect(bypassOfflineGate(route)).toBe(false);
    }
  });

  it('identifies machine/API-like paths', () => {
    expect(isApiLike('/__api/demo/run')).toBe(true);
    expect(isApiLike('/v1/things')).toBe(true);
    expect(isApiLike('/__api/operations/logs')).toBe(true);
    expect(isApiLike('/graphql')).toBe(true);
    expect(isApiLike('/edge')).toBe(false);
  });

  it('only treats browser-style GETs as HTML redirects', () => {
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/edge', { headers: { accept: 'text/html' } }), '/edge')).toBe(true);
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/__api/demo/events', { headers: { accept: 'application/json' } }), '/__api/demo/events')).toBe(false);
    expect(wantsHtml(new Request('https://demo.wizardgang.ai/edge', { method: 'POST' }), '/edge')).toBe(false);
  });
});
