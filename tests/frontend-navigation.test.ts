import { describe, expect, it } from 'vitest';
import { renderAssurance } from '../src/demos/assurance';
import { renderPlatform } from '../src/demos/platform';
import { applicationRouteRegistry } from '../src/routing/application-routes';
import type { Env } from '../src/types';

const env: Env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
};

function currentPageCount(html: string): number {
  return (html.match(/<[a-z][^>]*\baria-current="page"[^>]*>/gi) ?? []).length;
}

describe('derived frontend navigation', () => {
  it('renders all six public domains in the primary header', async () => {
    const html = await (await renderPlatform(new Request('https://demo.wizardgang.ai/platform'), env)).text();
    for (const label of ['Architecture', 'Platform', 'Interfaces', 'Assurance', 'Operations', 'Security']) {
      expect(html).toContain(`>${label}</a>`);
    }
  });

  it('marks Platform as the current section on /platform/d1', async () => {
    const route = applicationRouteRegistry.declarations.find((candidate) => candidate.id === 'platform.d1');
    if (!route) throw new Error('Missing platform.d1 route');
    const html = await (await route.handler(new Request('https://demo.wizardgang.ai/platform/d1'), { env }, {})).text();
    expect(currentPageCount(html)).toBe(0);
    expect(html).toContain('<a href="/platform" data-section-current');
    expect(html).not.toContain('data-view-current');
  });

  it('keeps exactly one page-current link on /assurance?view=risks', async () => {
    const html = await (await renderAssurance(new Request('https://demo.wizardgang.ai/assurance?view=risks'), env)).text();
    expect(currentPageCount(html)).toBe(1);
    expect(html).toContain('<a href="/assurance" aria-current="page">Assurance</a>');
    expect(html).toContain('<a href="/assurance?view=risks" data-view-current>Risks</a>');
  });
});
