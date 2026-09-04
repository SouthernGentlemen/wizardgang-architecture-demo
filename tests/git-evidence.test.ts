import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gitEvidenceResponse } from '../src/api/git-evidence';
import {
  GitHubReportingError,
  importGitHubReporting,
  queryGitHubReporting,
} from '../src/reporting/github';
import type { Principal } from '../src/lib/authorization';
import type { D1Database, Env } from '../src/types';

const repo = 'SouthernGentlemen/wizardgang-architecture-demo';
const repoUrl = `https://github.com/${repo}`;
const repoApi = `/repos/${repo}`;
const fixture = JSON.parse(readFileSync('tests/fixtures/github-reporting.json', 'utf8')) as {
  repository: Record<string, unknown>;
  issues: Array<Record<string, unknown>>;
  workflowRun: Record<string, unknown>;
  expiredArtifact: Record<string, unknown>;
  securityAdvisory: Record<string, unknown>;
};

const publicPrincipal: Principal = { subject: 'public', authentication: 'anonymous', permissions: ['demo:read'] };
const viewerPrincipal: Principal = { subject: 'viewer', authentication: 'oidc', provider: 'microsoft', permissions: ['demo:read'] };
const operatorPrincipal: Principal = { subject: 'operator', authentication: 'oidc', provider: 'microsoft', permissions: ['demo:read', 'demo:write', 'reporting:private', 'reporting:write'] };

function memoryDb(): D1Database {
  return { prepare: () => ({ bind() { return this; }, async run() { return { meta: { changes: 0 } }; }, async all<T>() { return { results: [] as T[] }; } }) };
}

function environment(overrides: Partial<Env> = {}): Env {
  return { DEMO_DB: memoryDb(), GITHUB_REPO_URL: repoUrl, GITHUB_BRANCH: 'main', ...overrides };
}

function response(value: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json', ...headers } });
}

function requestKey(input: RequestInfo | URL): string {
  const url = new URL(String(input));
  return `${url.pathname}${url.search}`;
}

afterEach(() => vi.restoreAllMocks());

describe('registered GitHub reporting provider', () => {
  it('preserves native identity, repository scope, revision, URL, timestamps, and closed provider state', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const key = requestKey(input);
      if (key === repoApi) return response(fixture.repository);
      if (key.startsWith(`${repoApi}/issues?`)) return response(fixture.issues);
      return response({ error: 'missing fixture', key }, 500);
    });
    const outcome = await queryGitHubReporting(environment(), publicPrincipal, { sourceIds: ['github.issues'], mode: 'export' });
    expect(outcome.protected).toBe(false);
    expect(outcome.result.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(outcome.result.records).toHaveLength(2);
    expect(outcome.result.records[0]).toMatchObject({
      source: 'github.issues', repository: repo, nativeId: '158', status: 'open',
      revision: '2026-09-04T19:00:00Z', url: `${repoUrl}/issues/158`,
      createdAt: '2026-09-04T18:00:00Z', updatedAt: '2026-09-04T19:00:00Z',
    });
    expect(outcome.result.records[1]).toMatchObject({ nativeId: '157', status: 'closed' });
    expect(outcome.result.records[0].identity.native).toBe(`${repo}|github.issues|158`);
  });

  it('marks a dashboard page partial and follows complete bounded pagination for export', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === repoApi) return response(fixture.repository);
      if (url.pathname === `${repoApi}/issues`) {
        const page = url.searchParams.get('page');
        if (page === '1') return response([fixture.issues[0]], 200, { link: `<${repoUrl.replace('github.com', 'api.github.com/repos')}/issues?page=2>; rel="next"` });
        return response([fixture.issues[1]]);
      }
      return response({}, 500);
    });

    const sample = await queryGitHubReporting(environment(), publicPrincipal, { sourceIds: ['github.issues'], mode: 'sample', limit: 1 });
    expect(sample.result.records).toHaveLength(1);
    expect(sample.result.availability['github.issues']).toBe('partial');
    expect(sample.result.qualifications['github.issues.completeness']).toBe('partial');
    expect(sample.result.query.pagination?.nextCursor).not.toBeNull();

    const exported = await queryGitHubReporting(environment(), publicPrincipal, { sourceIds: ['github.issues'], mode: 'export', limit: 1 });
    expect(exported.result.records.map((record) => record.nativeId)).toEqual(['158', '157']);
    expect(exported.result.availability['github.issues']).toBe('available');
    expect(exported.result.qualifications['github.issues.completeness']).toBe('complete');
    expect(fetchMock.mock.calls.filter(([input]) => new URL(String(input)).pathname.endsWith('/issues')).length).toBe(3);
  });

  it('prevents duplicate native identities across provider pages', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === repoApi) return response(fixture.repository);
      if (url.pathname === `${repoApi}/issues`) {
        if (url.searchParams.get('page') === '1') return response([fixture.issues[0]], 200, { link: '<https://api.github.com/next>; rel="next"' });
        return response([fixture.issues[0]]);
      }
      return response({}, 500);
    });
    const outcome = await queryGitHubReporting(environment(), publicPrincipal, { sourceIds: ['github.issues'], mode: 'export' });
    expect(outcome.result.records).toHaveLength(1);
    expect(outcome.result.availability['github.issues']).toBe('partial');
    expect(outcome.result.qualifications['github.issues.detail']).toBe('duplicate_native_identity');
  });

  it('surfaces rate-limited and expired provider states without replacing provider meaning', async () => {
    let phase: 'rate' | 'artifact' = 'rate';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === repoApi) return response(fixture.repository);
      if (phase === 'rate' && url.pathname === `${repoApi}/issues`) return response({ message: 'rate' }, 403, { 'x-ratelimit-remaining': '0' });
      if (phase === 'artifact' && url.pathname === `${repoApi}/actions/artifacts`) return response({ total_count: 1, artifacts: [fixture.expiredArtifact] });
      return response({}, 500);
    });
    const limited = await queryGitHubReporting(environment(), publicPrincipal, { sourceIds: ['github.issues'] });
    expect(limited.result.availability['github.issues']).toBe('rate-limited');
    phase = 'artifact';
    const artifacts = await queryGitHubReporting(environment(), publicPrincipal, { sourceIds: ['github.workflow-artifacts'], mode: 'export' });
    expect(artifacts.result.records[0]).toMatchObject({ nativeId: '8001', availability: 'expired', status: 'expired' });
    expect(artifacts.result.records[0].relationships[0]?.to.native).toBe(`${repo}|github.workflow-runs|7001`);
  });

  it('keeps repository-security advisories protected and never converts them into issues', async () => {
    const calls: Array<{ key: string; authorization: string | null }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const key = requestKey(input);
      calls.push({ key, authorization: new Headers(init?.headers).get('authorization') });
      if (key === repoApi) return response(fixture.repository);
      if (key.startsWith(`${repoApi}/security-advisories?`)) return response([fixture.securityAdvisory]);
      return response({}, 500);
    });

    await expect(queryGitHubReporting(environment({ GITHUB_READ_TOKEN: 'protected-read' }), publicPrincipal, { sourceIds: ['github.repository-security-advisories'] }))
      .rejects.toMatchObject({ code: 'authentication_required' });
    expect(calls).toHaveLength(0);

    await expect(queryGitHubReporting(environment({ GITHUB_READ_TOKEN: 'protected-read' }), viewerPrincipal, { sourceIds: ['github.repository-security-advisories'] }))
      .rejects.toMatchObject({ code: 'permission_denied' });
    expect(calls).toHaveLength(0);

    const outcome = await queryGitHubReporting(environment({ GITHUB_READ_TOKEN: 'protected-read' }), operatorPrincipal, { sourceIds: ['github.repository-security-advisories'], mode: 'export' });
    expect(outcome.protected).toBe(true);
    expect(outcome.result.records[0]).toMatchObject({ source: 'github.repository-security-advisories', nativeId: 'GHSA-abcd-1234-5678', status: 'draft' });
    expect(outcome.result.records.every((record) => record.source !== 'github.issues')).toBe(true);
    expect(calls.some((call) => call.key.includes('/security-advisories') && call.authorization === 'Bearer protected-read')).toBe(true);
  });

  it('isolates private repositories before content fetch and reports missing credentials precisely', async () => {
    const calls: Array<{ key: string; authorization: string | null }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const key = requestKey(input);
      const authorization = new Headers(init?.headers).get('authorization');
      calls.push({ key, authorization });
      if (key === repoApi && !authorization) return response({ message: 'Not Found' }, 404);
      if (key === repoApi && authorization) return response({ ...fixture.repository, private: true });
      if (key.startsWith(`${repoApi}/issues?`) && authorization) return response(fixture.issues);
      return response({}, 500);
    });

    await expect(queryGitHubReporting(environment({ GITHUB_READ_TOKEN: 'private-read' }), publicPrincipal, { sourceIds: ['github.issues'] }))
      .rejects.toMatchObject({ code: 'authentication_required' });
    expect(calls).toEqual([{ key: repoApi, authorization: null }]);

    calls.length = 0;
    await expect(queryGitHubReporting(environment(), operatorPrincipal, { sourceIds: ['github.issues'] }))
      .rejects.toMatchObject({ code: 'github_read_credential_missing' });
    expect(calls).toEqual([{ key: repoApi, authorization: null }]);

    calls.length = 0;
    const outcome = await queryGitHubReporting(environment({ GITHUB_READ_TOKEN: 'private-read' }), operatorPrincipal, { sourceIds: ['github.issues'], mode: 'export' });
    expect(outcome.protected).toBe(true);
    expect(calls.some((call) => call.key.includes('/issues?') && call.authorization === 'Bearer private-read')).toBe(true);
  });

  it('updates only supported issue fields with optimistic native revision and rejects create-like or unsupported writes', async () => {
    const patched: unknown[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname === `${repoApi}/issues/158` && (init?.method || 'GET') === 'GET') return response(fixture.issues[0]);
      if (url.pathname === `${repoApi}/issues/158` && init?.method === 'PATCH') {
        patched.push(JSON.parse(String(init.body)));
        return response({ ...fixture.issues[0], title: 'Updated corrective action', updated_at: '2026-09-04T19:10:00Z' });
      }
      return response({}, 500);
    });
    const env = environment({ GITHUB_REPORTING_WRITE_TOKEN: 'issues-write' });
    const record = await importGitHubReporting(env, operatorPrincipal, {
      source: 'github.issues', repository: repo, operation: 'update', nativeId: '158', revision: '2026-09-04T19:00:00Z', fields: { title: 'Updated corrective action', state: 'open' },
    });
    expect(patched).toEqual([{ title: 'Updated corrective action', state: 'open' }]);
    expect(record.revision).toBe('2026-09-04T19:10:00Z');

    await expect(importGitHubReporting(env, operatorPrincipal, {
      source: 'github.issues', repository: repo, operation: 'update', nativeId: '158', revision: '2026-09-04T19:00:00Z', fields: { url: 'https://example.com' },
    })).rejects.toMatchObject({ code: 'github_import_field_unsupported' });

    await expect(importGitHubReporting(env, operatorPrincipal, {
      source: 'github.releases', repository: repo, operation: 'update', nativeId: '1', revision: 'x', fields: { name: 'nope' },
    })).rejects.toMatchObject({ code: 'github_import_not_supported' });

    await expect(importGitHubReporting(env, operatorPrincipal, {
      source: 'github.issues', repository: repo, operation: 'update', nativeId: '158', revision: 'stale', fields: { title: 'stale' },
    })).rejects.toMatchObject({ code: 'github_revision_conflict' });
  });

  it('returns the current query contract from the existing Git evidence route without legacy cards', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const key = requestKey(input);
      if (key === repoApi) return response(fixture.repository);
      if (key.startsWith(`${repoApi}/issues?`)) return response(fixture.issues);
      return response([], 200);
    });
    const responseValue = await gitEvidenceResponse(new Request('https://demo.example/__api/git/evidence?source=github.issues&mode=export'), environment());
    const body = await responseValue.json() as Record<string, unknown>;
    expect(responseValue.status).toBe(200);
    expect(responseValue.headers.get('cache-control')).toContain('public');
    expect(body.contract).toBe('contracts/assurance/reporting.schema.json');
    expect(body.dataset).toBe('github');
    expect(body).not.toHaveProperty('cards');
    expect(body).not.toHaveProperty('controls');
  });

  it('does not add internal pagination metadata to the native repository object', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => requestKey(input) === repoApi ? response(fixture.repository) : response([], 200));
    const outcome = await queryGitHubReporting(environment({ GITHUB_REPORTING_MAX_PAGES: '2' }), publicPrincipal, { sourceIds: ['github.repositories'], mode: 'export' });
    expect(outcome.result.records[0].native).toEqual(fixture.repository);
    expect(outcome.result.records[0].native).not.toHaveProperty('__reportingMaxPages');
  });

  it('requires a dedicated reporting write credential and operator permission', async () => {
    await expect(importGitHubReporting(environment(), operatorPrincipal, {
      source: 'github.issues', repository: repo, operation: 'update', nativeId: '158', revision: '2026-09-04T19:00:00Z', fields: { title: 'x' },
    })).rejects.toMatchObject({ code: 'github_write_credential_missing' });
    await expect(importGitHubReporting(environment({ GITHUB_REPORTING_WRITE_TOKEN: 'x' }), viewerPrincipal, {
      source: 'github.issues', repository: repo, operation: 'update', nativeId: '158', revision: '2026-09-04T19:00:00Z', fields: { title: 'x' },
    })).rejects.toBeInstanceOf(GitHubReportingError);
  });
});
