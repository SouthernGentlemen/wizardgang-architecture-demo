import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gitEvidenceResponse } from '../src/api/git-evidence';
import { clearGitHubEvidenceCacheForTest, collectGitHubEvidence } from '../src/lib/github-api';
import type { Env } from '../src/types';

const repo = 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo';
const env = {
  GITHUB_REPO_URL: repo,
  GITHUB_BRANCH: 'main',
} as Env;

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

function installFixtures(overrides: Partial<Record<string, Response | Error>> = {}) {
  const fixtures: Record<string, Response | Error> = {
    '/repos/SouthernGentlemen/wizardgang-architecture-demo': json({ default_branch: 'main' }),
    '/branches?per_page=10': json([{ name: 'main', protected: true, commit: { sha: 'a'.repeat(40) } }, { name: 'feature/demo', protected: false, commit: { sha: 'b'.repeat(40) } }]),
    '/commits?sha=main&per_page=5': json([{ sha: 'a'.repeat(40), html_url: `${repo}/commit/${'a'.repeat(40)}`, commit: { message: 'Controlled change', author: { name: 'Jacob', date: '2026-09-01T12:00:00Z' } }, author: { login: 'SouthernGentlemen' } }]),
    '/pulls?state=open&sort=updated&direction=desc&per_page=1': json([{ number: 43, title: 'Open evidence PR', state: 'open', html_url: `${repo}/pull/43`, user: { login: 'SouthernGentlemen' }, base: { ref: 'main' }, head: { ref: 'feature/evidence' } }]),
    '/pulls?state=closed&sort=updated&direction=desc&per_page=10': json([{ number: 42, title: 'Merged webhook PR', state: 'closed', merged_at: '2026-09-01T12:30:00Z', html_url: `${repo}/pull/42`, user: { login: 'SouthernGentlemen' }, base: { ref: 'main' }, head: { ref: 'feature/webhooks' } }]),
    '/actions/runs?per_page=5': json({ workflow_runs: [{ name: 'CI', event: 'pull_request', status: 'completed', conclusion: 'success', head_branch: 'feature/evidence', head_sha: 'a'.repeat(40), updated_at: '2026-09-01T12:40:00Z', html_url: `${repo}/actions/runs/1`, actor: { login: 'SouthernGentlemen' } }] }),
    '/tags?per_page=5': json([{ name: 'v0.4.1', commit: { sha: 'c'.repeat(40) } }]),
    '/releases?per_page=1': json([{ name: 'v0.4.1', tag_name: 'v0.4.1', published_at: '2026-08-31T12:00:00Z', prerelease: false, html_url: `${repo}/releases/tag/v0.4.1` }]),
    '/branches/main/protection': json({ required_pull_request_reviews: {}, required_status_checks: {}, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } }),
    ...overrides,
  };
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input));
    const key = url.pathname.includes('/repos/SouthernGentlemen/wizardgang-architecture-demo')
      ? `${url.pathname.slice('/repos/SouthernGentlemen/wizardgang-architecture-demo'.length)}${url.search}` || '/repos/SouthernGentlemen/wizardgang-architecture-demo'
      : url.pathname;
    const fixture = fixtures[key];
    if (fixture instanceof Error) throw fixture;
    if (!fixture) return json({ error: 'fixture missing' }, 500);
    return fixture.clone();
  });
}

beforeEach(() => clearGitHubEvidenceCacheForTest());
afterEach(() => vi.restoreAllMocks());

describe('GitHub delivery evidence', () => {
  it('sanitizes live branch, commit, pull request, Actions, tag, release, and protection evidence', async () => {
    const fetchMock = installFixtures();
    const evidence = await collectGitHubEvidence(env);
    expect(evidence.repository).toMatchObject({ fullName: 'SouthernGentlemen/wizardgang-architecture-demo', defaultBranch: 'main' });
    expect(evidence.cards.branches.status).toBe('available');
    expect(evidence.cards.branches.items[0]).toMatchObject({ name: 'main', protected: true });
    expect(evidence.cards.commits.items[0]).toMatchObject({ message: 'Controlled change', author: 'SouthernGentlemen' });
    expect(evidence.cards.openPullRequest.items[0]).toMatchObject({ number: 43, head: 'feature/evidence' });
    expect(evidence.cards.mergedPullRequest.items[0]).toMatchObject({ number: 42 });
    expect(evidence.cards.actions.items[0]).toMatchObject({ name: 'CI', conclusion: 'success' });
    expect(evidence.cards.release.items[0]).toMatchObject({ tag: 'v0.4.1' });
    expect(evidence.controls).toMatchObject({ status: 'verified', details: { pullRequestReviews: true, statusChecks: true, forcePushBlocked: true } });
    expect(evidence.pipeline).toEqual(['Commit', 'Pull request', 'Typecheck', 'Unit tests', 'WCAG scan', 'Build', 'Annotated tag', 'Deploy', 'Health check', 'GitHub Release']);
    expect(fetchMock).toHaveBeenCalledTimes(9);
    await collectGitHubEvidence(env);
    expect(fetchMock).toHaveBeenCalledTimes(9);
    for (const value of Object.values(evidence.cards).flatMap((card) => card.items)) {
      if (value.url) expect(String(value.url)).toMatch(/^https:\/\/github\.com\/SouthernGentlemen\/wizardgang-architecture-demo(?:\/|$)/);
    }
  });

  it('reports empty and partial-failure states without inventing unavailable controls', async () => {
    installFixtures({
      '/pulls?state=open&sort=updated&direction=desc&per_page=1': json([]),
      '/releases?per_page=1': json([]),
      '/actions/runs?per_page=5': new Error('upstream details must not leak'),
      '/branches/main/protection': json({ message: 'Not Found' }, 404),
    });
    const response = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence'), env);
    const evidence = await response.json() as Awaited<ReturnType<typeof collectGitHubEvidence>>;
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=60');
    expect(evidence.cards.openPullRequest.status).toBe('empty');
    expect(evidence.cards.release.status).toBe('empty');
    expect(evidence.cards.actions).toMatchObject({ status: 'unavailable', error: 'GitHub evidence unavailable' });
    expect(evidence.partialFailures).toContain('actions');
    expect(evidence.controls).toMatchObject({ status: 'not-publicly-verifiable', details: null });
    expect(JSON.stringify(evidence)).not.toContain('upstream details must not leak');
  });

  it('rejects a configured repository outside the GitHub allowlist', async () => {
    const response = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence'), { ...env, GITHUB_REPO_URL: 'https://example.com/owner/repo' });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'github_evidence_unavailable', detail: 'The configured public repository could not be queried.' });
  });
});
