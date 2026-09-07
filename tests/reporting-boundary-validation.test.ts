import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  updateGitHubReporting,
  queryGitHubReporting,
  validateGitHubReportingUpdateRequest,
} from '../src/reporting/github';
import { reportingJsonResponse } from '../src/api/reporting-response';
import type { Principal } from '../src/lib/authorization';
import type { D1Database, Env } from '../src/types';

const repository = 'SouthernGentlemen/wizardgang-architecture-demo';
const repositoryApi = `/repos/${repository}`;
const operator: Principal = {
  subject: 'operator',
  authentication: 'oidc',
  provider: 'microsoft',
  permissions: ['demo:read', 'demo:write', 'reporting:private', 'reporting:write'],
};
const visitor: Principal = { subject: 'public', authentication: 'anonymous', permissions: ['demo:read'] };

function memoryDb(): D1Database {
  return {
    prepare: () => ({
      bind() { return this; },
      async run() { return { meta: { changes: 0 } }; },
      async all<T>() { return { results: [] as T[] }; },
    }),
  };
}

function environment(overrides: Partial<Env> = {}): Env {
  return {
    DEMO_DB: memoryDb(),
    GITHUB_REPO_URL: `https://github.com/${repository}`,
    GITHUB_BRANCH: 'main',
    GITHUB_REPORTING_WRITE_TOKEN: 'write-token',
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

afterEach(() => vi.restoreAllMocks());

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

});
