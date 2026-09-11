import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceRecordUrls } from '../src/assurance/routes';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import type { Env } from '../src/types';
import { removedHtml404Pathnames, removedHtmlPathnames } from './fixtures/removed-html-pathnames';

const environment: Env = {
  DEMO_DB: {
    prepare() {
      throw new Error('retired HTML paths must not consult application storage');
    },
  },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

describe('canonical frontend route contract', () => {
  it('publishes task-oriented pages without a query-view route inventory', () => {
    const canonicalChildren = [
      'demos.index',
      'assurance.index',
      'operations.availability', 'operations.logs', 'operations.usage', 'operations.reports', 'operations.docs',
    ] as const;
    for (const routeId of canonicalChildren) {
      const path = routeUrl(routeId);
      expect(path, routeId).not.toContain('?');
      expect(applicationRouteRegistry.declarations.some((route) => route.id === routeId && route.pattern === path), routeId).toBe(true);
    }
    const retiredIds = [
      'platform.index', 'platform.edge', 'platform.workers', 'platform.durable-objects', 'platform.d1', 'platform.r2',
      'interfaces.index', 'interfaces.rest', 'interfaces.graphql.console', 'interfaces.webhooks.console',
      'interfaces.identity.page', 'interfaces.mcp.console', 'interfaces.i18n', 'interfaces.accessibility',
      'assurance.delivery', 'assurance.governance', 'assurance.evidence', 'assurance.compliance',
      'assurance.risks', 'assurance.incidents', 'assurance.concerns',
    ];
    expect(applicationRouteRegistry.declarations.filter((route) => retiredIds.includes(route.id)).map((route) => route.id)).toEqual([]);
  });

  it('uses the normal 404 for every removed HTML pathname', async () => {
    for (const pathname of removedHtml404Pathnames) {
      expect(applicationRouteRegistry.declarations.some((route) => route.pattern === pathname), pathname).toBe(false);
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai${pathname}`, {
        headers: { accept: 'text/html' },
      }), environment);
      expect(response.status, pathname).toBe(404);
      expect(response.headers.get('location'), pathname).toBeNull();
    }
  });

  it('uses the ordinary 404 for every retired assurance ?view= URL', async () => {
    for (const view of ['overview', 'delivery', 'governance', 'evidence', 'compliance', 'risks', 'incidents', 'concerns', 'unknown']) {
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai/assurance?view=${view}`, {
        headers: { accept: 'text/html' },
      }), environment);
      expect(response.status, view).toBe(404);
      expect(response.headers.get('location'), view).toBeNull();
      expect(await response.text(), view).toContain('404 / unknown route');
    }
  });

  it('keeps protocol URLs out of the frontend page registry', () => {
    const graphql = applicationRouteRegistry.declarations.find((route) => route.pattern === '/graphql');
    expect(graphql).toMatchObject({ kind: 'protocol', browserHtml: 'never' });
    expect(applicationRouteRegistry.declarations.some((route) => route.pattern === '/graphql/console')).toBe(false);
    expect(removedHtmlPathnames).toContainEqual({ pathname: '/graphql', outcome: 'protocol' });
  });

  it('preserves stable assurance record fragments', () => {
    const assurance = routeUrl('assurance.index');
    expect(assuranceRecordUrls('evidence', 'EV-001').html).toBe(`${assurance}#EV-001`);
    expect(assuranceRecordUrls('risks', 'SEC-RISK-001').html).toBe(`${assurance}#SEC-RISK-001`);
    expect(assuranceRecordUrls('incidents', 'INC-001').html).toBe(`${assurance}#INC-001`);
    expect(assuranceRecordUrls('advisories', 'ADV-001').html).toBe(`${routeUrl('security.index')}#ADV-001`);
  });

  it('has no client-side router dependency or history-based route dispatcher', () => {
    const packageJson = readFileSync('package.json', 'utf8');
    const routerSource = readFileSync('src/router.ts', 'utf8');
    expect(packageJson).not.toMatch(/react-router|@tanstack\/router|wouter/);
    expect(routerSource).not.toMatch(/pushState|replaceState|popstate|window\.location/);
  });
});
