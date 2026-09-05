import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryGitHubReporting } from '../src/reporting/github';
import type { Principal } from '../src/lib/authorization';
import type { D1Database, Env } from '../src/types';

const repository = 'SouthernGentlemen/wizardgang-architecture-demo';
const repositoryApi = `/repos/${repository}`;
const fixture = JSON.parse(readFileSync('tests/fixtures/github-reporting.json', 'utf8')) as {
  repository: Record<string, unknown>;
  workflowRun: Record<string, unknown>;
};
const principal: Principal = { subject: 'public', authentication: 'anonymous', permissions: ['demo:read'] };

function memoryDb(): D1Database {
  return {
    prepare: () => ({
      bind() { return this; },
      async run() { return { meta: { changes: 0 } }; },
      async all<T>() { return { results: [] as T[] }; },
    }),
  };
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    DEMO_DB: memoryDb(),
    GITHUB_REPO_URL: `https://github.com/${repository}`,
    GITHUB_BRANCH: 'main',
    ...overrides,
  };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}

afterEach(() => vi.restoreAllMocks());

describe('GitHub reporting native edge cases', () => {
  it('preserves every workflow attempt as a distinct native object and links attempts to the run', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === repositoryApi) return json(fixture.repository);
      if (url.pathname === `${repositoryApi}/actions/runs`) {
        return json({ total_count: 1, workflow_runs: [fixture.workflowRun] });
      }
      if (url.pathname === `${repositoryApi}/actions/runs/7001/attempts/1`) {
        return json({ ...fixture.workflowRun, run_attempt: 1, conclusion: 'failure', updated_at: '2026-09-04T18:45:00Z' });
      }
      return json({ message: 'unexpected fixture request' }, 500);
    });

    const outcome = await queryGitHubReporting(env(), principal, {
      sourceIds: ['github.workflow-attempts'],
      mode: 'export',
    });
    expect(outcome.result.records.map((record) => record.nativeId)).toEqual(['7001|1', '7001|2']);
    expect(outcome.result.records.map((record) => record.revision)).toEqual([
      '2026-09-04T18:45:00Z',
      '2026-09-04T18:50:00Z',
    ]);
    expect(outcome.result.records[0].status).toBe('completed');
    expect(outcome.result.records[0].native.conclusion).toBe('failure');
    expect(outcome.result.records[1].native.conclusion).toBe('success');
    expect(outcome.result.records.every((record) => record.relationships[0]?.relation === 'attemptOf')).toBe(true);
    expect(outcome.result.records.every((record) => record.relationships[0]?.to.native === `${repository}|github.workflow-runs|7001`)).toBe(true);
  });

  it('binds branch protection identity, scope, and revision to the configured branch', async () => {
    const branch = 'release/reporting';
    const revision = 'a'.repeat(40);
    let includeRevision = true;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      const path = decodeURIComponent(url.pathname);
      if (path === repositoryApi) return json(fixture.repository);
      if (path === `${repositoryApi}/branches/${branch}/protection`) {
        return json({ required_status_checks: { strict: true } });
      }
      if (path === `${repositoryApi}/branches/${branch}`) {
        return json(includeRevision ? { name: branch, commit: { sha: revision } } : { name: branch });
      }
      return json({ message: 'unexpected fixture request' }, 500);
    });

    const configured = env({
      GITHUB_REPORTING_BINDINGS: JSON.stringify([{
        repository,
        branch,
        sources: ['github.branch-protection'],
      }]),
    });
    const outcome = await queryGitHubReporting(configured, principal, {
      sourceIds: ['github.branch-protection'],
      mode: 'export',
    });
    expect(outcome.result.sources[0].scope).toMatchObject({ repository, branch });
    expect(outcome.result.records[0]).toMatchObject({
      nativeId: branch,
      revision,
      identity: {
        native: `${repository}|github.branch-protection|${branch}`,
        revision,
      },
    });
    expect(outcome.result.records[0].native).not.toHaveProperty('branchCommitSha');

    includeRevision = false;
    const incomplete = await queryGitHubReporting(configured, principal, {
      sourceIds: ['github.branch-protection'],
      mode: 'export',
    });
    expect(incomplete.result.records).toEqual([]);
    expect(incomplete.result.availability['github.branch-protection']).toBe('partial');
    expect(incomplete.result.qualifications['github.branch-protection.detail']).toBe('native_revision_missing');
  });

  it('marks a source partial instead of inventing a fallback provider identity', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === repositoryApi) return json({ ...fixture.repository, id: undefined });
      return json({ message: 'unexpected fixture request' }, 500);
    });

    const outcome = await queryGitHubReporting(env(), principal, {
      sourceIds: ['github.repositories'],
      mode: 'export',
    });
    expect(outcome.result.records).toEqual([]);
    expect(outcome.result.availability['github.repositories']).toBe('partial');
    expect(outcome.result.qualifications['github.repositories.detail']).toBe('native_identity_missing');
  });

  it('reports provider 404s as unavailable instead of fabricating a deleted object', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === repositoryApi) return json(fixture.repository);
      if (url.pathname === `${repositoryApi}/actions/artifacts`) return json({ message: 'Not Found' }, 404);
      return json({ message: 'unexpected fixture request' }, 500);
    });

    const outcome = await queryGitHubReporting(env(), principal, {
      sourceIds: ['github.workflow-artifacts'],
      mode: 'export',
    });
    expect(outcome.result.records).toEqual([]);
    expect(outcome.result.availability['github.workflow-artifacts']).toBe('unavailable');
    expect(outcome.result.qualifications['github.workflow-artifacts.detail']).toBe('github_resource_not_found');
    expect(outcome.result.qualifications['github.workflow-artifacts.completeness']).toBe('partial');
  });

  it('rejects unbound repositories and source IDs without silently discovering or creating provider resources', async () => {
    const configured = env({
      GITHUB_REPORTING_BINDINGS: JSON.stringify([{ repository, sources: ['github.issues'] }]),
    });
    await expect(queryGitHubReporting(configured, principal, {
      repository: 'SomebodyElse/private-repository',
      sourceIds: ['github.issues'],
    })).rejects.toMatchObject({ code: 'github_reporting_binding_not_found' });
    await expect(queryGitHubReporting(configured, principal, {
      sourceIds: ['github.repository-security-advisories'],
    })).rejects.toMatchObject({ code: 'github_reporting_source_not_bound' });
  });
});
