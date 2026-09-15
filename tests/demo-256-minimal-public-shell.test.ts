import { describe, expect, it } from 'vitest';
import { applicationRouteRegistry, routeUrl } from '../src/routing/application-routes';
import { architectureMapEntries, primaryNavigation } from '../src/routing/navigation';
import type { Env } from '../src/types';

const repositoryUrl = 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo';
const env = {
  DEMO_DB: {
    prepare: () => ({
      bind() { return this; },
      async all() {
        return { results: [{ verified: 101, operational: 99, intentional: 1 }] };
      },
      async run() { return { meta: {} }; },
    }),
  },
  GITHUB_REPO_URL: repositoryUrl,
  GITHUB_BRANCH: 'main',
  DEPLOYED_VERSION: 'v0.21.0-test',
  DEPLOYED_SHA: 'abcdef0123456789',
} as Env;

async function homeHtml(): Promise<string> {
  const route = applicationRouteRegistry.declarations.find((candidate) => candidate.id === 'interfaces.frontend.index');
  if (!route) throw new Error('Missing homepage route');
  return (await route.handler(new Request('https://demo.wizardgang.ai/'), { env }, {})).text();
}

describe('DEMO-256 minimal public shell', () => {
  it('limits primary navigation to Demos and Assurance while keeping Source direct', async () => {
    expect(primaryNavigation().map((route) => route.id)).toEqual(['demos.index', 'assurance.index']);
    const html = await homeHtml();
    const header = html.match(/<header class="site-header">([\s\S]*?)<\/header>/)?.[0] ?? '';
    const nav = header.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/)?.[0] ?? '';
    expect(nav).toContain(`href="${routeUrl('demos.index')}"`);
    expect(nav).toContain(`href="${routeUrl('assurance.index')}"`);
    expect(nav).not.toContain('href="/operations"');
    expect(nav).not.toContain(`href="${routeUrl('security.index')}"`);
    expect(header).toContain(`href="${repositoryUrl}">Source`);
  });

  it('uses one primary CTA, one secondary CTA, and a compact live proof strip', async () => {
    const html = await homeHtml();
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[0] ?? '';
    expect(main).toContain(`class="button-primary" href="${routeUrl('demos.index')}">Explore demos</a>`);
    expect(main).toContain(`href="${routeUrl('assurance.index')}">View assurance</a>`);
    expect(main).toContain('aria-label="Live proof"');
    expect(main).toContain('Current service state');
    expect(main).toContain('99.000%');
    expect(main).toContain('100 measured intervals · planned offline excluded');
    expect(main).toContain('v0.21.0-test');
    expect(main).toContain('Commit abcdef0');
    expect(main).not.toContain('href="/operations"');
  });

  it('keeps Security discoverable while operations stays out of visitor-facing projections', async () => {
    const html = await homeHtml();
    expect(html).toContain(`href="${routeUrl('security.index')}">Security boundary</a>`);
    expect(primaryNavigation().map((route) => route.id)).not.toContain('security.index');
    expect(primaryNavigation().map((route) => route.id)).not.toContain('operations.index');
    expect(architectureMapEntries().map((route) => route.id)).toEqual(['demos.index', 'assurance.index']);

    const security = applicationRouteRegistry.declarations.find((route) => route.id === 'security.index');
    const operations = applicationRouteRegistry.declarations.find((route) => route.id === 'operations.index');
    expect(security?.pattern).toBe(routeUrl('security.index'));
    expect(operations).toBeUndefined();
  });
});
