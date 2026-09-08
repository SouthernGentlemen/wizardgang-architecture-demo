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
  it('publishes canonical child resources without a query-view route inventory', () => {
    const canonicalChildren = [
      ['platform.edge', '/platform/edge'], ['platform.workers', '/platform/workers'],
      ['platform.durable-objects', '/platform/durable-objects'], ['platform.d1', '/platform/d1'],
      ['platform.r2', '/platform/r2'], ['interfaces.rest', '/interfaces/rest'],
      ['interfaces.graphql.console', '/interfaces/graphql'], ['interfaces.webhooks.console', '/interfaces/webhooks'],
      ['interfaces.identity.page', '/interfaces/identity'], ['interfaces.mcp.console', '/interfaces/mcp'],
      ['interfaces.i18n', '/interfaces/i18n'], ['interfaces.accessibility', '/interfaces/accessibility'],
      ['assurance.delivery', '/assurance/delivery'], ['assurance.governance', '/assurance/governance'],
      ['assurance.evidence', '/assurance/evidence'], ['assurance.compliance', '/assurance/compliance'],
      ['assurance.risks', '/assurance/risks'], ['assurance.incidents', '/assurance/incidents'],
      ['assurance.concerns', '/assurance/concerns'],
      ['operations.availability', '/operations/availability'], ['operations.logs', '/operations/logs'],
      ['operations.usage', '/operations/usage'], ['operations.reports', '/operations/reports'],
      ['operations.docs', '/operations/docs'],
    ] as const;
    for (const [routeId, path] of canonicalChildren) expect(routeUrl(routeId)).toBe(path);
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

  it('keeps protocol URLs out of the frontend page registry', () => {
    const graphql = applicationRouteRegistry.declarations.find((route) => route.pattern === '/graphql');
    expect(graphql).toMatchObject({ kind: 'protocol', browserHtml: 'never' });
    expect(applicationRouteRegistry.declarations.some((route) => route.pattern === '/graphql/console')).toBe(false);
    expect(removedHtmlPathnames).toContainEqual({ pathname: '/graphql', outcome: 'protocol' });
  });

  it('preserves stable assurance record fragments', () => {
    expect(assuranceRecordUrls('evidence', 'EV-001').html).toBe('/assurance/evidence#EV-001');
    expect(assuranceRecordUrls('risks', 'SEC-RISK-001').html).toBe('/assurance/risks#SEC-RISK-001');
    expect(assuranceRecordUrls('incidents', 'INC-001').html).toBe('/assurance/incidents#INC-001');
    expect(assuranceRecordUrls('advisories', 'ADV-001').html).toBe('/security#ADV-001');
  });

  it('has no client-side router dependency or history-based route dispatcher', () => {
    const packageJson = readFileSync('package.json', 'utf8');
    const routerSource = readFileSync('src/router.ts', 'utf8');
    expect(packageJson).not.toMatch(/react-router|@tanstack\/router|wouter/);
    expect(routerSource).not.toMatch(/pushState|replaceState|popstate|window\.location/);
  });
});
