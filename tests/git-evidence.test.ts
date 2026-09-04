import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gitEvidenceResponse } from '../src/api/git-evidence';
import { clearGitHubEvidenceCacheForTest, collectGitHubEvidence } from '../src/lib/github-api';
import { createIdentitySession, revokeIdentitySession, type IdentitySession } from '../src/lib/identity-session';
import type { D1Database, Env } from '../src/types';

const repo = 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo';
const repoPath = '/repos/SouthernGentlemen/wizardgang-architecture-demo';
const identitySecret = 'a-test-secret-that-is-at-least-thirty-two-characters';

function memoryDb(): D1Database {
  const sessions = new Map<string, { payload: string; expiresAt: string; revokedAt: string | null }>();
  return {
    prepare(sql: string) {
      let values: unknown[] = [];
      return {
        bind(...bound: unknown[]) { values = bound; return this; },
        async run() {
          if (sql.includes('INSERT INTO identity_sessions')) sessions.set(String(values[0]), { payload: String(values[1]), expiresAt: String(values[3]), revokedAt: null });
          if (sql.includes('UPDATE identity_sessions')) {
            const row = sessions.get(String(values[1]));
            if (row) row.revokedAt = String(values[0]);
          }
          return { meta: { changes: 1 } };
        },
        async all<T>() {
          if (sql.includes('FROM identity_sessions')) {
            const row = sessions.get(String(values[0]));
            const results = row && !row.revokedAt && row.expiresAt > String(values[1]) ? [{ payload_ciphertext: row.payload, expires_at: row.expiresAt }] : [];
            return { results: results as T[] };
          }
          return { results: [] as T[] };
        },
      };
    },
  };
}

function environment(overrides: Partial<Env> = {}): Env {
  return {
    DEMO_DB: memoryDb(),
    GITHUB_REPO_URL: repo,
    GITHUB_BRANCH: 'main',
    ...overrides,
  };
}

function session(role: 'operator' | 'viewer', subject = role): IdentitySession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60_000).toISOString();
  return {
    identity: {
      provider: 'microsoft', protocol: 'oidc', subject, displayName: subject, assurance: 'mfa', role,
      authenticatedAt: now.toISOString(), expiresAt,
    },
    providerPayloadLabel: 'Validated ID token claims', providerPayload: {}, validation: [],
    protocol: { name: 'OpenID Connect', steps: ['Validated'] }, issuedAt: now.toISOString(), expiresAt,
  };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

interface FixtureOptions {
  privateRepo?: boolean;
  overrides?: Partial<Record<string, Response | Error>>;
}

function installFixtures(options: FixtureOptions = {}) {
  const state = { revision: 'a'.repeat(40), commitMessage: options.privateRepo ? 'private commit detail' : 'Controlled change' };
  const mock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    const key = url.pathname === repoPath ? 'repository' : `${url.pathname.slice(repoPath.length)}${url.search}`;
    const authorization = new Headers(init?.headers).get('authorization');
    if (options.privateRepo && !authorization) return json({ message: 'Not Found' }, 404);
    const override = options.overrides?.[key];
    if (override instanceof Error) throw override;
    if (override) return override.clone();

    if (key === 'repository') return json({ default_branch: 'main', private: options.privateRepo === true });
    if (key === '/branches/main') return json({ name: 'main', commit: { sha: state.revision } });
    if (key === '/branches?per_page=10') return json([{ name: 'main', protected: true, commit: { sha: state.revision } }, { name: 'feature/demo', protected: false, commit: { sha: 'b'.repeat(40) } }]);
    if (key === '/commits?sha=main&per_page=5') return json([{ sha: state.revision, html_url: `${repo}/commit/${state.revision}`, commit: { message: state.commitMessage, author: { name: 'Jacob', date: '2026-09-01T12:00:00Z' } }, author: { login: 'SouthernGentlemen' } }]);
    if (key === '/pulls?state=open&sort=updated&direction=desc&per_page=1') return json([{ number: 43, title: 'Open evidence PR', state: 'open', html_url: `${repo}/pull/43`, user: { login: 'SouthernGentlemen' }, base: { ref: 'main' }, head: { ref: 'feature/evidence' } }]);
    if (key === '/pulls?state=closed&sort=updated&direction=desc&per_page=10') return json([{ number: 42, title: 'Merged webhook PR', state: 'closed', merged_at: '2026-09-01T12:30:00Z', html_url: `${repo}/pull/42`, user: { login: 'SouthernGentlemen' }, base: { ref: 'main' }, head: { ref: 'feature/webhooks' } }]);
    if (key === '/actions/runs?per_page=5') return json({ workflow_runs: [{ name: 'CI', event: 'pull_request', status: 'completed', conclusion: 'success', head_branch: 'feature/evidence', head_sha: state.revision, updated_at: '2026-09-01T12:40:00Z', html_url: `${repo}/actions/runs/1`, actor: { login: 'SouthernGentlemen' } }] });
    if (key === '/tags?per_page=5') return json([{ name: 'v0.4.1', commit: { sha: 'c'.repeat(40) } }]);
    if (key === '/releases?per_page=1') return json([{ name: 'v0.4.1', tag_name: 'v0.4.1', published_at: '2026-08-31T12:00:00Z', prerelease: false, html_url: `${repo}/releases/tag/v0.4.1` }]);
    if (key === '/branches/main/protection') return json({ required_pull_request_reviews: {}, required_status_checks: {}, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } });
    return json({ error: 'fixture missing', key }, 500);
  });
  return { mock, state };
}

beforeEach(() => clearGitHubEvidenceCacheForTest());
afterEach(() => vi.restoreAllMocks());

describe('GitHub delivery evidence', () => {
  it('uses only the public GitHub context for a public repository and caches by current revision', async () => {
    const env = environment({ GITHUB_READ_TOKEN: 'server-token-must-not-be-used-for-public' });
    const { mock } = installFixtures();
    const evidence = await collectGitHubEvidence(env);
    expect(evidence.repository).toMatchObject({ fullName: 'SouthernGentlemen/wizardgang-architecture-demo', defaultBranch: 'main', private: false });
    expect(evidence.cards.commits.items[0]).toMatchObject({ message: 'Controlled change' });
    expect(mock).toHaveBeenCalledTimes(10);
    await collectGitHubEvidence(env);
    expect(mock).toHaveBeenCalledTimes(12);
    for (const [, init] of mock.mock.calls) expect(new Headers(init?.headers).get('authorization')).toBeNull();
  });

  it('reports public empty and partial-failure states without leaking upstream details', async () => {
    installFixtures({ overrides: {
      '/pulls?state=open&sort=updated&direction=desc&per_page=1': json([]),
      '/releases?per_page=1': json([]),
      '/actions/runs?per_page=5': new Error('upstream details must not leak'),
      '/branches/main/protection': json({ message: 'Not Found' }, 404),
    } });
    const response = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence'), environment());
    const evidence = await response.json() as Awaited<ReturnType<typeof collectGitHubEvidence>>;
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('public');
    expect(evidence.cards.openPullRequest.status).toBe('empty');
    expect(evidence.cards.release.status).toBe('empty');
    expect(evidence.cards.actions).toMatchObject({ status: 'unavailable', error: 'GitHub evidence unavailable' });
    expect(JSON.stringify(evidence)).not.toContain('upstream details must not leak');
  });

  it('rejects a configured repository outside the GitHub allowlist', async () => {
    const response = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence'), environment({ GITHUB_REPO_URL: 'https://example.com/owner/repo' }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'github_evidence_unavailable', detail: 'The configured repository could not be queried.' });
  });

  it('does not fetch private report content for an anonymous visitor even when a server credential exists', async () => {
    const { mock } = installFixtures({ privateRepo: true });
    const response = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence'), environment({ GITHUB_READ_TOKEN: 'github-private-read-token' }));
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'authentication_required' });
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('allows a verified operator session and keeps the protected HTTP response out of shared caches', async () => {
    const env = environment({ GITHUB_READ_TOKEN: 'github-private-read-token', IDENTITY_SESSION_SECRET: identitySecret });
    const cookie = (await createIdentitySession(env, session('operator'))).split(';')[0];
    const { mock } = installFixtures({ privateRepo: true });
    const response = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence', { headers: { cookie } }), env);
    const body = await response.json() as Awaited<ReturnType<typeof collectGitHubEvidence>>;
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('vary')).toContain('Authorization');
    expect(body.repository.private).toBe(true);
    expect(body.cards.commits.items[0]).toMatchObject({ message: 'private commit detail' });
    expect(JSON.stringify(body)).not.toContain('github-private-read-token');
    expect(mock).toHaveBeenCalledTimes(11);
  });

  it('denies an authenticated viewer and a legacy static demo token as insufficient permission', async () => {
    const viewerEnv = environment({ GITHUB_READ_TOKEN: 'github-private-read-token', IDENTITY_SESSION_SECRET: identitySecret });
    const viewerCookie = (await createIdentitySession(viewerEnv, session('viewer'))).split(';')[0];
    let fixtures = installFixtures({ privateRepo: true });
    const viewerResponse = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence', { headers: { cookie: viewerCookie } }), viewerEnv);
    expect(viewerResponse.status).toBe(403);
    expect(await viewerResponse.json()).toEqual({ error: 'permission_denied' });
    expect(fixtures.mock).toHaveBeenCalledTimes(2);

    vi.restoreAllMocks();
    fixtures = installFixtures({ privateRepo: true });
    const staticEnv = environment({ GITHUB_READ_TOKEN: 'github-private-read-token', DEMO_API_TOKEN: 'legacy-static-token' });
    const staticResponse = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence', { headers: { authorization: 'Bearer legacy-static-token' } }), staticEnv);
    expect(staticResponse.status).toBe(403);
    expect(fixtures.mock).toHaveBeenCalledTimes(2);
  });

  it('treats a revoked operator session as anonymous before private content is fetched', async () => {
    const env = environment({ GITHUB_READ_TOKEN: 'github-private-read-token', IDENTITY_SESSION_SECRET: identitySecret });
    const cookie = (await createIdentitySession(env, session('operator', 'revoked-operator'))).split(';')[0];
    await revokeIdentitySession(new Request('https://demo.example/identity/logout', { headers: { cookie } }), env);
    const { mock } = installFixtures({ privateRepo: true });
    const response = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence', { headers: { cookie } }), env);
    expect(response.status).toBe(401);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it('isolates private caches across source revisions and server-credential changes, and never serves cache after credential removal', async () => {
    const env = environment({ GITHUB_READ_TOKEN: 'github-private-read-token-a', IDENTITY_SESSION_SECRET: identitySecret });
    const cookie = (await createIdentitySession(env, session('operator', 'cache-operator'))).split(';')[0];
    const { mock, state } = installFixtures({ privateRepo: true });
    const request = (environmentValue: Env) => gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence', { headers: { cookie } }), environmentValue);

    expect((await request(env)).status).toBe(200);
    expect(mock).toHaveBeenCalledTimes(11);

    state.revision = 'd'.repeat(40);
    state.commitMessage = 'new private source revision';
    const revised = await request(env);
    expect((await revised.json() as Awaited<ReturnType<typeof collectGitHubEvidence>>).cards.commits.items[0]).toMatchObject({ message: 'new private source revision' });
    expect(mock).toHaveBeenCalledTimes(22);

    const changedCredential = { ...env, GITHUB_READ_TOKEN: 'github-private-read-token-b' };
    expect((await request(changedCredential)).status).toBe(200);
    expect(mock).toHaveBeenCalledTimes(33);

    const removedCredential = { ...env, GITHUB_READ_TOKEN: undefined };
    const unavailable = await request(removedCredential);
    expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toEqual({ error: 'github_evidence_unavailable', detail: 'The configured repository could not be queried.' });
    expect(mock).toHaveBeenCalledTimes(34);
  });
});
