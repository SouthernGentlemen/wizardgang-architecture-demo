import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assuranceRecordUrls } from '../src/assurance/routes';
import { frontendViewUrl, htmlPagePathnames, surfaces } from '../src/demos/registry';
import { routeRequest } from '../src/router';
import { applicationRouteRegistry } from '../src/routing/application-routes';
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
  it('registers exactly the eight canonical HTML page pathnames', () => {
    const registeredPages = applicationRouteRegistry.declarations
      .filter((route) => route.kind === 'page')
      .map((route) => route.pattern)
      .sort();
    expect(registeredPages).toEqual([...htmlPagePathnames].sort());
    expect(htmlPagePathnames).toEqual([
      '/', '/platform', '/interfaces', '/assurance', '/security', '/operations', '/admin', '/offline',
    ]);
  });

  it('models every named view as query state on its owning surface', () => {
    for (const surface of surfaces) {
      for (const view of surface.views) {
        const href = frontendViewUrl(surface.routeId, view.id);
        const url = new URL(href, 'https://demo.wizardgang.ai');
        expect(url.pathname, `${surface.routeId}:${view.id}`).toBe(surface.route);
        expect(url.searchParams.get('view'), `${surface.routeId}:${view.id}`).toBe(view.id);
      }
    }
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
    expect(assuranceRecordUrls('evidence', 'EV-001').html).toBe('/assurance?view=evidence#EV-001');
    expect(assuranceRecordUrls('risks', 'SEC-RISK-001').html).toBe('/assurance?view=risks#SEC-RISK-001');
    expect(assuranceRecordUrls('incidents', 'INC-001').html).toBe('/assurance?view=incidents#INC-001');
    expect(assuranceRecordUrls('advisories', 'ADV-001').html).toBe('/security#ADV-001');
  });

  it('has no client-side router dependency or history-based route dispatcher', () => {
    const packageJson = readFileSync('package.json', 'utf8');
    const routerSource = readFileSync('src/router.ts', 'utf8');
    expect(packageJson).not.toMatch(/react-router|@tanstack\/router|wouter/);
    expect(routerSource).not.toMatch(/pushState|replaceState|popstate|window\.location/);
  });
});
