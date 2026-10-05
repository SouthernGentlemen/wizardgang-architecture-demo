import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  updateGitHubReporting,
  queryGitHubReporting,
  validateGitHubReportingUpdateRequest,
} from '../src/reporting/github';
import { reportingJsonResponse } from '../src/api/reporting-response';
import type { Principal } from '../src/lib/authorization';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';
import { clearGitHubAppTokensForTest } from '../src/lib/github-app';
import { appToken, appTokenResponse, githubAppEnv, mintedPermissions } from './helpers/github-app';

const repository = 'Wizard-Gang/wizardgang-architecture-demo';
const repositoryApi = `/repos/${repository}`;
const operator: Principal = {
  subject: 'operator',
  authentication: 'oidc',
  provider: 'microsoft',
  permissions: ['demo:read', 'demo:write', 'reporting:private', 'reporting:write'],
};
const visitor: Principal = { subject: 'public', authentication: 'anonymous', permissions: ['demo:read'] };


function environment(overrides: Partial<Env> = {}): Env {
  return {
    WG_DB: new SqliteD1(),
    GITHUB_REPO_URL: `https://github.com/${repository}`,
    GITHUB_BRANCH: 'main',
    ...githubAppEnv,
    ...overrides,
  };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

function requestPath(input: RequestInfo | URL): string {
  const url = new URL(String(input));
  return `${url.pathname}${url.search}`;
}

afterEach(() => {
  vi.restoreAllMocks();
  clearGitHubAppTokensForTest();
});

describe('reporting trust-boundary validation', () => {
  it('rejects an invalid successful response before serialization', () => {
    expect(() => reportingJsonResponse(
      new Request('https://demo.example/api/reporting/risks'),
      {
        schemaVersion: 1,
        contract: 'contracts/assurance/reporting.schema.json',
        dataset: 'risks',
        datasets: ['risks'],
        availability: { risks: 'available' },
        sources: [],
        qualifications: {},
        query: { filters: {} },
        records: [],
        derived: { count: 'zero', totalAvailable: 0, facets: {} },
      },
      'queryResult',
    )).toThrowError(/Reporting response violates queryResult/);
  });

  it('rejects malformed native write bodies before repository or provider access', async () => {
    expect(() => validateGitHubReportingUpdateRequest(null)).toThrowError('github_update_payload_invalid');
    expect(() => validateGitHubReportingUpdateRequest({
      source: 'github.issues',
      repository,
      operation: 'update',
      nativeId: '158',
      revision: '2026-09-04T19:00:00Z',
      fields: [],
    })).toThrowError('github_update_payload_invalid');
    expect(() => validateGitHubReportingUpdateRequest({
      source: 'github.issues',
      repository,
      operation: 'update',
      nativeId: '158',
      revision: '2026-09-04T19:00:00Z',
      fields: { title: 'x' },
      ignored: true,
    })).toThrowError('github_update_payload_invalid');

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await expect(updateGitHubReporting(environment(), operator, {
      source: 'github.issues',
      repository,
      operation: 'update',
      nativeId: 158,
      revision: '2026-09-04T19:00:00Z',
      fields: { title: 'x' },
    })).rejects.toMatchObject({ status: 400, code: 'github_update_payload_invalid', detail: 'nativeId' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserves the unsupported-operation error after structural request validation', () => {
    expect(() => validateGitHubReportingUpdateRequest({
      source: 'github.issues',
      repository,
      operation: 'create',
      nativeId: '158',
      revision: '2026-09-04T19:00:00Z',
      fields: { title: 'x' },
    })).toThrowError('github_update_operation_unsupported');
  });

  it('does not reinterpret malformed provider collections as available empty data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const path = requestPath(input);
      if (path === repositoryApi) return json({ id: 1, default_branch: 'main', private: false });
      if (path.startsWith(`${repositoryApi}/issues?`)) return json({ items: [] });
      return json({ message: 'missing fixture' }, 500);
    });

    const outcome = await queryGitHubReporting(environment(), visitor, { sourceIds: ['github.issues'] });
    expect(outcome.result.records).toEqual([]);
    expect(outcome.result.availability['github.issues']).toBe('unavailable');
    expect(outcome.result.qualifications['github.issues.completeness']).toBe('partial');
    expect(outcome.result.qualifications['github.issues.detail']).toBe('github_provider_invalid_response');
    expect(JSON.stringify(outcome.result)).not.toContain('nextCursor');
  });

  it('rejects mixed-shape provider arrays instead of silently dropping malformed entries', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const path = requestPath(input);
      if (path === repositoryApi) return json({ id: 1, default_branch: 'main', private: false });
      if (path.startsWith(`${repositoryApi}/issues?`)) return json([
        { number: 158, updated_at: '2026-09-04T19:00:00Z' },
        'not-an-object',
      ]);
      return json({ message: 'missing fixture' }, 500);
    });

    const outcome = await queryGitHubReporting(environment(), visitor, { sourceIds: ['github.issues'] });
    expect(outcome.result.records).toEqual([]);
    expect(outcome.result.availability['github.issues']).toBe('unavailable');
    expect(outcome.result.qualifications['github.issues.detail']).toBe('github_provider_invalid_response');
  });

  it('updates a GitHub issue through an Issues-write App installation token', async () => {
    const issue = {
      id: 9158,
      number: 158,
      title: 'Before',
      state: 'open',
      updated_at: '2026-09-04T19:00:00Z',
      html_url: `https://github.com/${repository}/issues/158`,
      labels: [],
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const exchange = appTokenResponse(input, init);
      if (exchange) return exchange;
      if (requestPath(input) !== `${repositoryApi}/issues/158`) return json({ message: 'missing fixture' }, 500);
      return init?.method === 'PATCH'
        ? json({ ...issue, title: 'After', updated_at: '2026-09-04T19:05:00Z' })
        : json(issue);
    });

    const record = await updateGitHubReporting(environment(), operator, {
      source: 'github.issues',
      repository,
      operation: 'update',
      nativeId: '158',
      revision: '2026-09-04T19:00:00Z',
      fields: { title: 'After' },
    });
    expect(record).toMatchObject({ nativeId: '158' });
    expect(mintedPermissions(fetchMock.mock.calls)).toEqual([{ issues: 'write' }]);
    const issueCalls = fetchMock.mock.calls.filter(([input]) => requestPath(input) === `${repositoryApi}/issues/158`);
    expect(issueCalls.map(([, init]) => (init as RequestInit | undefined)?.method ?? 'GET')).toEqual(['GET', 'PATCH']);
    for (const [, init] of issueCalls) {
      expect(new Headers((init as RequestInit).headers).get('authorization')).toBe(`Bearer ${appToken({ issues: 'write' })}`);
    }
  });

  it('refuses a GitHub issue update when the GitHub App is not configured', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await expect(updateGitHubReporting(environment({ GITHUB_APP_PRIVATE_KEY: undefined }), operator, {
      source: 'github.issues',
      repository,
      operation: 'update',
      nativeId: '158',
      revision: '2026-09-04T19:00:00Z',
      fields: { title: 'x' },
    })).rejects.toMatchObject({ status: 503, code: 'github_write_credential_missing' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads a private repository with App tokens holding only Metadata or the source permission', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const exchange = appTokenResponse(input, init);
      if (exchange) return exchange;
      const path = requestPath(input);
      const authorization = new Headers(init?.headers).get('authorization');
      if (path === repositoryApi) {
        return authorization ? json({ id: 1, default_branch: 'main', private: true }) : json({ message: 'Not Found' }, 404);
      }
      if (path.startsWith(`${repositoryApi}/issues?`)) return json([]);
      return json({ message: 'missing fixture' }, 500);
    });

    await expect(queryGitHubReporting(environment({ GITHUB_APP_PRIVATE_KEY: undefined }), operator, { sourceIds: ['github.issues'] }))
      .rejects.toMatchObject({ status: 503, code: 'github_read_credential_missing' });
    const outcome = await queryGitHubReporting(environment(), operator, { sourceIds: ['github.issues'] });
    expect(outcome.protected).toBe(true);
    expect(outcome.result.availability['github.issues']).toBe('available');
    expect(mintedPermissions(fetchMock.mock.calls)).toEqual([{ metadata: 'read' }, { issues: 'read' }]);
    const issues = fetchMock.mock.calls.find(([input]) => requestPath(input).startsWith(`${repositoryApi}/issues?`));
    expect(new Headers((issues?.[1] as RequestInit).headers).get('authorization')).toBe(`Bearer ${appToken({ issues: 'read' })}`);
  });
});
