import { describe, expect, it } from 'vitest';
import { applicationRouteRegistry } from '../src/routing/application-routes';
import type { Env } from '../src/types';

const env: Env = {
  DEMO_DB: {
    prepare: () => ({
      bind() { return this; },
      async all() { return { results: [] }; },
      async run() { return { meta: {} }; },
    }),
  },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

function currentPageCount(html: string): number {
  return (html.match(/<[a-z][^>]*\baria-current="page"[^>]*>/gi) ?? []).length;
}

describe('derived frontend navigation', () => {
  it('renders the consolidated public domains in the primary header', async () => {
    const route = applicationRouteRegistry.declarations.find((candidate) => candidate.id === 'demos.index');
    if (!route) throw new Error('Missing demos.index route');
    const html = await (await route.handler(new Request('https://demo.wizardgang.ai/demos'), { env }, {})).text();
    const primary = html.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/)?.[0] ?? '';
    expect(primary).not.toBe('');
    for (const label of ['Demos', 'Assurance', 'Operations', 'Security']) {
      expect(primary).toContain(`>${label}</a>`);
    }
    for (const label of ['Architecture', 'Platform', 'Interfaces']) {
      expect(primary).not.toContain(`>${label}</a>`);
    }
    for (const label of ['Architecture', 'Demos', 'Assurance', 'Operations', 'Security']) {
      expect(html).toContain(`>${label}</a>`);
    }
  });

  it('marks Demos as the current task on /demos#d1', async () => {
    const route = applicationRouteRegistry.declarations.find((candidate) => candidate.id === 'demos.index');
    if (!route) throw new Error('Missing demos.index route');
    const html = await (await route.handler(new Request('https://demo.wizardgang.ai/demos#d1'), { env }, {})).text();
    expect(html).toContain('<li aria-current="page">Demos</li>');
    expect(html).toContain(`<a href="${route.pattern}" aria-current="page">Demos</a>`);
    expect(html).not.toContain('name="view"');
    expect(html).not.toContain(`${route.pattern}?view=`);
  });

  it('marks Assurance as the current task on the fragment-based workbench', async () => {
    const route = applicationRouteRegistry.declarations.find((candidate) => candidate.id === 'assurance.index');
    if (!route) throw new Error('Missing assurance.index route');
    const html = await (await route.handler(new Request('https://demo.wizardgang.ai/assurance#risks'), { env }, {})).text();
    expect(currentPageCount(html)).toBe(2);
    expect(html).toContain('<li aria-current="page">Assurance</li>');
    expect(html).toContain(`<a href="${route.pattern}" aria-current="page">Assurance</a>`);
    expect(html).toContain('href="#risks"');
    expect(html).not.toContain('data-view-current');
    expect(html).not.toContain('name="view"');
  });
});
