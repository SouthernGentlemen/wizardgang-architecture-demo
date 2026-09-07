import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assuranceEvidenceResponse } from '../src/api/assurance-registry';
import { dashboardReportingRequestUrl } from '../src/demos/reporting-dashboard';
import type { Principal } from '../src/lib/authorization';
import type { ReportingCursorContext } from '../src/reporting/pagination';
import {
  exportGitHubReporting,
  queryGitHubReportingPage,
} from '../src/reporting/github-query';
import { paginateReportingRecords } from '../src/reporting/query';
import type { Env } from '../src/types';

const repository = 'SouthernGentlemen/wizardgang-architecture-demo';
const repositoryApi = `/repos/${repository}`;
const fixture = JSON.parse(readFileSync('tests/fixtures/github-reporting.json', 'utf8')) as {
  repository: Record<string, unknown>;
  issues: Array<Record<string, unknown>>;
  securityAdvisory: Record<string, unknown>;
};
const publicPrincipal: Principal = {
  subject: 'public',
  authentication: 'anonymous',
  permissions: ['demo:read'],
};
const viewerPrincipal: Principal = {
  subject: 'viewer',
  authentication: 'oidc',
  provider: 'microsoft',
  permissions: ['demo:read'],
};
const operatorPrincipal: Principal = {
  subject: 'operator',
  authentication: 'oidc',
  provider: 'microsoft',
  permissions: ['demo:read', 'reporting:private'],
};

function environment(overrides: Partial<Env> = {}): Env {
  return {
    GITHUB_REPO_URL: `https://github.com/${repository}`,
    GITHUB_BRANCH: 'main',
    DEMO_SESSION_SECRET: 'DEMO-177-integration-cursor-secret',
    ...overrides,
  } as Env;
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function providerLink(path: string): string {
  return `<https://api.github.com${path}>; rel="next"`;
}

afterEach(() => vi.restoreAllMocks());

describe('DEMO-177 reporting pagination integration', () => {
  it('passes an API cursor through the dashboard unchanged and rejects invalid cursors', async () => {
    const env = environment();
    const firstResponse = await assuranceEvidenceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/evidence?limit=1'),
      env,
    );
    expect(firstResponse.status).toBe(200);
    const first = await firstResponse.json() as {
      records: Array<{ id: string }>;
      query: { pagination: { nextCursor: string | null } };
    };
    const cursor = first.query.pagination.nextCursor;
    expect(cursor).toMatch(/^rpc1\./);

    const dashboardUrl = new URL('https://demo.wizardgang.ai/dashboard?report=evidence&limit=1');
    dashboardUrl.searchParams.set('cursor', cursor!);
    const target = dashboardReportingRequestUrl('/v1/assurance/evidence', dashboardUrl);
    expect(target.searchParams.get('cursor')).toBe(cursor);

    const secondResponse = await assuranceEvidenceResponse(new Request(target), env);
    expect(secondResponse.status).toBe(200);
    const second = await secondResponse.json() as { records: Array<{ id: string }> };
    expect(second.records[0]?.id).not.toBe(first.records[0]?.id);

    const invalid = await assuranceEvidenceResponse(
      new Request('https://demo.wizardgang.ai/v1/assurance/evidence?limit=1&cursor=not-a-cursor'),
      env,
    );
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: 'reporting_cursor_malformed', parameter: 'cursor' });
  });

  it('binds continuation to filters and sources', async () => {
    const secret = 'DEMO-177-query-context-secret';
    const context: ReportingCursorContext = {
      schemaVersion: 1,
      collection: 'integration',
      source: 'source-a',
      filters: { state: 'open' },
      ordering: [{ field: 'id', direction: 'asc' }],
    };
    const first = await paginateReportingRecords(['a', 'b'], {
      context,
      limit: 1,
      secret,
    });
    const cursor = first.pagination.nextCursor!;

    await expect(paginateReportingRecords(['a', 'b'], {
      context: { ...context, filters: { state: 'closed' } },
      limit: 1,
      cursor,
      secret,
    })).rejects.toMatchObject({ code: 'reporting_cursor_mismatch', detail: 'filters' });

    await expect(paginateReportingRecords(['a', 'b'], {
      context: { ...context, source: 'source-b' },
      limit: 1,
      cursor,
      secret,
    })).rejects.toMatchObject({ code: 'reporting_cursor_mismatch', detail: 'source' });
  });

  it('hides provider cursors while following native pagination', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === repositoryApi) return json(fixture.repository);
      if (url.pathname === `${repositoryApi}/issues`) {
        if (url.searchParams.get('page') === '1') {
          return json([fixture.issues[0]], 200, {
            link: providerLink(`${repositoryApi}/issues?page=2`),
          });
        }
        return json([fixture.issues[1]]);
      }
      return json({ message: 'unexpected fixture request' }, 500);
    });

    const env = environment({ GITHUB_REPORTING_MAX_PAGES: '3' });
    const first = await queryGitHubReportingPage(env, publicPrincipal, {
      sourceIds: ['github.issues'],
      limit: 1,
    });
    const cursor = first.result.query.pagination?.nextCursor;
    expect(first.result.records.map((record) => record.nativeId)).toEqual(['158']);
    expect(cursor).toMatch(/^rpc1\./);
    expect(cursor).not.toContain('page:2');
    expect(Object.keys(first.result.qualifications).some((key) => key.endsWith('.nextCursor'))).toBe(false);

    const second = await queryGitHubReportingPage(env, publicPrincipal, {
      sourceIds: ['github.issues'],
      limit: 1,
      cursor,
    });
    expect(second.result.records.map((record) => record.nativeId)).toEqual(['157']);
    expect(second.result.query.pagination?.nextCursor).toBeNull();
    expect(second.result.query.pagination?.completeness).toBe('complete');
  });

  it('rechecks authorization before accepting a protected continuation', async () => {
    let fetchCount = 0;
    const secondAdvisory = {
      ...fixture.securityAdvisory,
      ghsa_id: 'GHSA-ffff-eeee-dddd',
      updated_at: '2026-09-04T17:59:00Z',
      html_url: `https://github.com/${repository}/security/advisories/GHSA-ffff-eeee-dddd`,
    };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      fetchCount += 1;
      const url = new URL(String(input));
      if (url.pathname === repositoryApi) return json(fixture.repository);
      if (url.pathname === `${repositoryApi}/security-advisories`) {
        return json([fixture.securityAdvisory, secondAdvisory]);
      }
      return json({ message: 'unexpected fixture request' }, 500);
    });

    const env = environment({ GITHUB_READ_TOKEN: 'protected-read' });
    const first = await queryGitHubReportingPage(env, operatorPrincipal, {
      sourceIds: ['github.repository-security-advisories'],
      limit: 1,
    });
    const cursor = first.result.query.pagination?.nextCursor;
    expect(cursor).toMatch(/^rpc1\./);
    const authorizedFetches = fetchCount;

    await expect(queryGitHubReportingPage(env, viewerPrincipal, {
      sourceIds: ['github.repository-security-advisories'],
      limit: 1,
      cursor,
    })).rejects.toMatchObject({ code: 'permission_denied' });
    expect(fetchCount).toBe(authorizedFetches);
  });

  it('keeps provider safety-bound exhaustion explicitly partial during export', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === repositoryApi) return json(fixture.repository);
      if (url.pathname === `${repositoryApi}/issues`) {
        return json([fixture.issues[0]], 200, {
          link: providerLink(`${repositoryApi}/issues?page=2`),
        });
      }
      return json({ message: 'unexpected fixture request' }, 500);
    });

    const exported = await exportGitHubReporting(
      environment({ GITHUB_REPORTING_MAX_PAGES: '1' }),
      publicPrincipal,
      { sourceIds: ['github.issues'], limit: 1 },
    );
    expect(exported.result.records.map((record) => record.nativeId)).toEqual(['158']);
    expect(exported.result.query.pagination).toMatchObject({
      nextCursor: null,
      completeness: 'partial',
      partialReason: 'provider-export-bound',
    });
  });
});
