import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gitDemoReleaseResponse, gitDemoStartResponse, gitDemoStatusResponse } from '../src/api/git-demo';
import { clearGitDemoCacheForTest, collectGitDemoStatus } from '../src/lib/git-demo';
import type { D1PreparedStatement, Env } from '../src/types';

const repositoryUrl = 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo';
const apiPrefix = '/repos/SouthernGentlemen/wizardgang-architecture-demo';
const requestId = '123e4567-e89b-42d3-a456-426614174000';
const headSha = 'a'.repeat(40);

class DemoStatement implements D1PreparedStatement {
  constructor(private readonly database: DemoDatabase) {}
  bind(...values: unknown[]) { this.database.binds.push(...values); return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() { return { results: [] as T[] }; }
}

class DemoDatabase {
  binds: unknown[] = [];
  prepare() { return new DemoStatement(this); }
}

function environment(): Env & { DEMO_DB: DemoDatabase } {
  return {
    DEMO_DB: new DemoDatabase(),
    GITHUB_REPO_URL: repositoryUrl,
    GITHUB_BRANCH: 'main',
    GITHUB_READ_TOKEN: 'read-only-fixture-token',
    GITHUB_DEMO_TOKEN: 'actions-write-fixture-token',
    DEMO_ADMIN_USER: 'operator',
    DEMO_ADMIN_PASSWORD: 'test-admin-password',
  };
}

const basic = `Basic ${btoa('operator:test-admin-password')}`;

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

function openPullRequest() {
  return {
    number: 54,
    title: '[DEMO-055] [BUILD] Demonstrate v0.7.1 release lifecycle',
    state: 'open',
    body: `Controlled demo\n- Previous version: \`0.7.0\`\n<!-- git-demo-request:${requestId} -->`,
    html_url: `${repositoryUrl}/pull/54`,
    head: { ref: 'demo/live-v0.7.1-123e4567', sha: headSha },
    base: { ref: 'main' },
    merge_commit_sha: null,
    merged_at: null,
  };
}

function fixtures(options: { pulls?: unknown[]; ciConclusion?: string | null } = {}) {
  const pulls = options.pulls ?? [openPullRequest()];
  const ciConclusion = options.ciConclusion === undefined ? 'success' : options.ciConclusion;
  const values = new Map<string, Response>([
    [`${apiPrefix}/contents/package.json?ref=main`, json({ content: btoa(JSON.stringify({ version: '0.7.0' })) })],
    [`${apiPrefix}/pulls?state=all&sort=updated&direction=desc&per_page=100`, json(pulls)],
    [`${apiPrefix}/actions/workflows/git-demo.yml/runs?event=workflow_dispatch&per_page=30`, json({ workflow_runs: [{
      id: 100,
      name: 'Live Git Demo',
      display_title: `Live Git demo · start · ${requestId}`,
      status: 'completed',
      conclusion: 'success',
      event: 'workflow_dispatch',
      head_branch: 'main',
      head_sha: 'b'.repeat(40),
      created_at: '2026-09-01T12:00:00Z',
      updated_at: '2026-09-01T12:01:00Z',
      html_url: `${repositoryUrl}/actions/runs/100`,
    }] })],
    [`${apiPrefix}/actions/runs?head_sha=${headSha}&per_page=30`, json({ workflow_runs: [{
      id: 101,
      name: 'CI',
      display_title: '[DEMO-055] [BUILD] Demonstrate v0.7.1 release lifecycle',
      status: ciConclusion === null ? 'in_progress' : 'completed',
      conclusion: ciConclusion,
      event: 'pull_request',
      head_branch: 'demo/live-v0.7.1-123e4567',
      head_sha: headSha,
      created_at: '2026-09-01T12:01:00Z',
      updated_at: '2026-09-01T12:02:00Z',
      html_url: `${repositoryUrl}/actions/runs/101`,
    }] })],
    [`${apiPrefix}/actions/runs/101/jobs?filter=latest&per_page=100`, json({ jobs: [{
      name: 'validate',
      status: ciConclusion === null ? 'in_progress' : 'completed',
      conclusion: ciConclusion,
      html_url: `${repositoryUrl}/actions/runs/101/job/1`,
      steps: [
        { name: 'Install locked dependencies', status: 'completed', conclusion: 'success', number: 1 },
        { name: 'Typecheck', status: ciConclusion === null ? 'in_progress' : 'completed', conclusion: ciConclusion, number: 2 },
      ],
    }] })],
    [`${apiPrefix}/releases/tags/v0.7.1`, json({ message: 'Not Found' }, 404)],
  ]);
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/dispatches') && init?.method === 'POST') return new Response(null, { status: 204 });
    return (values.get(`${url.pathname}${url.search}`) ?? json({ missing: `${url.pathname}${url.search}` }, 500)).clone();
  });
}

function adminRequest(path: string, body: unknown): Request {
  return new Request(`https://demo.wizardgang.ai${path}`, {
    method: 'POST',
    headers: { authorization: basic, origin: 'https://demo.wizardgang.ai', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => clearGitDemoCacheForTest());
afterEach(() => vi.restoreAllMocks());

describe('live Git delivery lifecycle', () => {
  it('reports the exact active pull request, CI run, and real job steps', async () => {
    fixtures();
    const status = await collectGitDemoStatus(environment(), requestId);
    expect(status).toMatchObject({
      active: true,
      stage: 'review',
      requestId,
      currentVersion: '0.7.0',
      targetVersion: '0.7.1',
      pollAfterMs: 500,
      releaseReady: true,
      pullRequest: { number: 54, branch: 'demo/live-v0.7.1-123e4567', ciReady: true },
      ci: { run: { name: 'CI', conclusion: 'success' } },
    });
    expect(status.ci.jobs[0].steps.map((step) => step.name)).toEqual(['Install locked dependencies', 'Typecheck']);
    expect(status.stages.find((stage) => stage.key === 'ci')?.state).toBe('complete');
    expect(status.stages.find((stage) => stage.key === 'review')?.state).toBe('current');
    expect(JSON.stringify(status)).not.toContain('fixture-token');
  });

  it('keeps status public and rejects malformed correlation identifiers', async () => {
    fixtures();
    const response = await gitDemoStatusResponse(new Request(`https://demo.wizardgang.ai/__api/git/demo?request_id=${requestId}`), environment());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const invalid = await gitDemoStatusResponse(new Request('https://demo.wizardgang.ai/__api/git/demo?request_id=not-a-uuid'), environment());
    expect(invalid.status).toBe(400);
  });

  it('requires same-origin admin authentication before a dispatch', async () => {
    fixtures({ pulls: [] });
    const env = environment();
    const crossOrigin = await gitDemoStartResponse(new Request('https://demo.wizardgang.ai/__api/git/demo', {
      method: 'POST',
      headers: { authorization: basic, origin: 'https://attacker.example', 'content-type': 'application/json' },
      body: JSON.stringify({ bump: 'patch' }),
    }), env);
    expect(crossOrigin.status).toBe(403);
    const unauthenticated = await gitDemoStartResponse(new Request('https://demo.wizardgang.ai/__api/git/demo', {
      method: 'POST',
      headers: { origin: 'https://demo.wizardgang.ai', 'content-type': 'application/json' },
      body: JSON.stringify({ bump: 'patch' }),
    }), env);
    expect(unauthenticated.status).toBe(401);
  });

  it('dispatches only the allowlisted workflow with the server-side Actions token', async () => {
    const fetchMock = fixtures({ pulls: [] });
    const env = environment();
    const response = await gitDemoStartResponse(adminRequest('/__api/git/demo', { bump: 'patch' }), env);
    const payload = await response.json() as Record<string, unknown>;
    expect(response.status).toBe(202);
    expect(payload).toMatchObject({ accepted: true, bump: 'patch', currentVersion: '0.7.0', targetVersion: '0.7.1' });
    const dispatch = fetchMock.mock.calls.find(([input]) => String(input).endsWith('/actions/workflows/git-demo.yml/dispatches'));
    expect(dispatch).toBeTruthy();
    const init = dispatch?.[1] as RequestInit;
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer actions-write-fixture-token');
    expect(JSON.parse(String(init.body))).toMatchObject({ ref: 'main', inputs: { operation: 'start', bump: 'patch', pull_request: '' } });
    expect(env.DEMO_DB.binds.join(' ')).not.toContain('test-admin-password');
    expect(env.DEMO_DB.binds.join(' ')).not.toContain(basic);
    expect(env.DEMO_DB.binds.join(' ')).not.toContain('actions-write-fixture-token');
  });

  it('returns the active live-demo pull request instead of creating a collision', async () => {
    const fetchMock = fixtures();
    const response = await gitDemoStartResponse(adminRequest('/__api/git/demo', { bump: 'minor' }), environment());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: 'git_demo_already_active', requestId, pullRequest: { number: 54 } });
    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/dispatches'))).toBe(false);
  });

  it('dispatches merge and release only after the real CI workflow passes', async () => {
    const fetchMock = fixtures();
    const response = await gitDemoReleaseResponse(adminRequest('/__api/git/demo/release', { pullRequest: 54, requestId }), environment());
    expect(response.status).toBe(202);
    const dispatch = fetchMock.mock.calls.find(([input]) => String(input).endsWith('/actions/workflows/git-demo.yml/dispatches'));
    expect(JSON.parse(String((dispatch?.[1] as RequestInit).body))).toMatchObject({ inputs: { operation: 'release', request_id: requestId, pull_request: '54' } });
  });

  it('refuses release while CI is still running', async () => {
    const fetchMock = fixtures({ ciConclusion: null });
    const response = await gitDemoReleaseResponse(adminRequest('/__api/git/demo/release', { pullRequest: 54, requestId }), environment());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: 'git_demo_ci_not_ready' });
    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/dispatches'))).toBe(false);
  });
});
