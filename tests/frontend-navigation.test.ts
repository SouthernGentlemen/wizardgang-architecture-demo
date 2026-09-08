import { describe, expect, it } from 'vitest';
import { renderAssurance } from '../src/demos/assurance';
import { renderPlatform } from '../src/demos/platform';
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

  it('keeps exactly one page-current link on /platform?view=d1', async () => {
    const html = await (await renderPlatform(new Request('https://demo.wizardgang.ai/platform?view=d1'), env)).text();
    expect(currentPageCount(html)).toBe(1);
    expect(html).toContain('<a href="/platform" aria-current="page">Platform</a>');
    expect(html).toContain('<a href="/platform?view=d1" data-view-current>D1</a>');
  });

  it('keeps exactly one page-current link on /assurance?view=risks', async () => {
    const html = await (await renderAssurance(new Request('https://demo.wizardgang.ai/assurance?view=risks'), env)).text();
    expect(currentPageCount(html)).toBe(1);
    expect(html).toContain('<a href="/assurance" aria-current="page">Assurance</a>');
    expect(html).toContain('<a href="/assurance?view=risks" data-view-current>Risks</a>');
  });
});
