import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  importGitHubReporting,
  queryGitHubReporting,
  validateGitHubReportingImportRequest,
} from '../src/reporting/github';
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
  it('rejects malformed native write bodies before repository or provider access', async () => {
    expect(() => validateGitHubReportingImportRequest(null)).toThrowError('github_import_payload_invalid');
    expect(() => validateGitHubReportingImportRequest({
      source: 'github.issues',
      repository,
      operation: 'update',
      nativeId: '158',
      revision: '2026-09-04T19:00:00Z',
      fields: [],
    })).toThrowError('github_import_payload_invalid');
    expect(() => validateGitHubReportingImportRequest({
      source: 'github.issues',
      repository,
      operation: 'update',
      nativeId: '158',
      revision: '2026-09-04T19:00:00Z',
      fields: { title: 'x' },
      ignored: true,
    })).toThrowError('github_import_payload_invalid');

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await expect(importGitHubReporting(environment(), operator, {
      source: 'github.issues',
      repository,
      operation: 'update',
      nativeId: 158,
      revision: '2026-09-04T19:00:00Z',
      fields: { title: 'x' },
    })).rejects.toMatchObject({ status: 400, code: 'github_import_payload_invalid', detail: 'nativeId' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserves the unsupported-operation error after structural request validation', () => {
    expect(() => validateGitHubReportingImportRequest({
      source: 'github.issues',
      repository,
      operation: 'create',
      nativeId: '158',
      revision: '2026-09-04T19:00:00Z',
      fields: { title: 'x' },
    })).toThrowError('github_import_operation_unsupported');
  });

  it('does not reinterpret malformed provider collections as available empty data', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const path = requestPath(input);
      if (path === repositoryApi) return json({ id: 1, default_branch: 'main', private: false });
      if (path.startsWith(`${repositoryApi}/issues?`)) return json({ items: [] });
      return json({ message: 'missing fixture' }, 500);
    });

    const outcome = await queryGitHubReporting(environment(), visitor, { sourceIds: ['github.issues'], mode: 'export' });
    expect(outcome.result.records).toEqual([]);
    expect(outcome.result.availability['github.issues']).toBe('unavailable');
    expect(outcome.result.qualifications['github.issues.completeness']).toBe('partial');
    expect(outcome.result.qualifications['github.issues.detail']).toBe('github_provider_invalid_response');
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

    const outcome = await queryGitHubReporting(environment(), visitor, { sourceIds: ['github.issues'], mode: 'export' });
    expect(outcome.result.records).toEqual([]);
    expect(outcome.result.availability['github.issues']).toBe('unavailable');
    expect(outcome.result.qualifications['github.issues.detail']).toBe('github_provider_invalid_response');
  });

  it('marks malformed retained-report blobs partial instead of projecting invalid relationships', async () => {
    const invalidReport = {
      schemaVersion: 1,
      id: 'RPT-CI-7001-A2',
      source: 'github.retained-reports',
      sourceRevision: { commit: '1'.repeat(40), branch: 'main' },
      observedAt: '2026-09-04T18:00:00Z',
      status: 'failed',
      relationships: [{ relation: 'producedBy', from: 'invalid', to: { source: 'github.workflow-runs', native: `${repository}|github.workflow-runs|7001` } }],
    };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const path = requestPath(input);
      if (path === repositoryApi) return json({ id: 1, default_branch: 'main', private: false });
      if (path === `${repositoryApi}/branches/assurance-reports`) return json({ commit: { sha: '2'.repeat(40) } });
      if (path === `${repositoryApi}/git/trees/${'2'.repeat(40)}?recursive=1`) {
        return json({ truncated: false, tree: [{ path: 'reports/ci-7001.json', type: 'blob', sha: '3'.repeat(40) }] });
      }
      if (path === `${repositoryApi}/git/blobs/${'3'.repeat(40)}`) {
        return json({ encoding: 'base64', content: btoa(JSON.stringify(invalidReport)) });
      }
      return json({ message: 'missing fixture' }, 500);
    });

    const outcome = await queryGitHubReporting(environment(), visitor, { sourceIds: ['github.retained-reports'] });
    expect(outcome.result.records).toEqual([]);
    expect(outcome.result.availability['github.retained-reports']).toBe('partial');
    expect(outcome.result.qualifications['github.retained-reports.completeness']).toBe('partial');
    expect(outcome.result.qualifications['github.retained-reports.detail']).toBe('retained_report_invalid');
  });
});
