import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import registry from '../assurance/registry.json';

const repository = 'SouthernGentlemen/wizardgang-architecture-demo';
const originalFetch = globalThis.fetch;

function githubResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function withFixtureProvider<T>(fixtures: Record<string, unknown>, action: (origin: string) => Promise<T>): Promise<T> {
  const server = createServer((request, response) => {
    const path = request.url ?? '/';
    if (!(path in fixtures)) {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end('{}');
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(fixtures[path]));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('fixture server unavailable');
  const realFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
    const replacement = new URL(url.pathname + url.search, `http://127.0.0.1:${address.port}`);
    return realFetch(replacement, init);
  };
  try {
    return await action(`http://127.0.0.1:${address.port}`);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function runFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 7001,
    name: 'CI',
    event: 'push',
    status: 'completed',
    conclusion: 'failure',
    run_attempt: 2,
    head_sha: '1234567890abcdef1234567890abcdef12345678',
    head_branch: 'main',
    updated_at: '2026-09-04T18:00:00Z',
    html_url: `https://github.com/${repository}/actions/runs/7001`,
    head_repository: { full_name: repository },
    ...overrides,
  };
}

function jobFixture() {
  return {
    id: 8001,
    name: 'validate',
    status: 'completed',
    conclusion: 'failure',
    started_at: '2026-09-04T17:55:00Z',
    completed_at: '2026-09-04T18:00:00Z',
    html_url: `https://github.com/${repository}/actions/runs/7001/job/8001`,
    steps: [
      { number: 1, name: 'npm ci', status: 'completed', conclusion: 'success', started_at: '2026-09-04T17:55:00Z', completed_at: '2026-09-04T17:56:00Z' },
      { number: 2, name: 'build', status: 'completed', conclusion: 'skipped', started_at: null, completed_at: null },
      { number: 3, name: 'post', status: 'in_progress', conclusion: null, started_at: '2026-09-04T17:59:00Z', completed_at: null },
    ],
  };
}

async function generateReport(run: Record<string, unknown>) {
  const directory = mkdtempSync(join(tmpdir(), 'retained-report-'));
  const output = join(directory, 'report.json');
  try {
    const fixtures = {
      '/repos/SouthernGentlemen/wizardgang-architecture-demo/actions/runs/7001': run,
      '/repos/SouthernGentlemen/wizardgang-architecture-demo/actions/runs/7001/attempts/2/jobs?per_page=100': { total_count: 1, jobs: [jobFixture()] },
    };
    return await withFixtureProvider(fixtures, async (origin) => {
      const bridge = `
        const realFetch = globalThis.fetch;
        globalThis.fetch = (input, init) => {
          const url = new URL(typeof input === 'string' ? input : input.url);
          return realFetch(new URL(url.pathname + url.search, ${JSON.stringify(origin)}), init);
        };
        process.argv = ['node', 'scripts/generate-retained-report.mjs', ${JSON.stringify(output)}];
        await import('./scripts/generate-retained-report.mjs');
      `;
      const child = spawn(process.execPath, ['--input-type=module', '--eval', bridge], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          GITHUB_REPOSITORY: repository,
          GITHUB_TOKEN: 'fixture-token',
          REPORT_WORKFLOW_RUN_ID: '7001',
          REPORT_DEFAULT_BRANCH: 'main',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      const status = await new Promise<number>((resolve) => child.on('close', (code) => resolve(code ?? 1)));
      return {
        status,
        stdout,
        stderr,
        report: status === 0 ? JSON.parse(readFileSync(output, 'utf8')) as Record<string, unknown> : null,
      };
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('canonical retained report production', () => {
  it('preserves failed, skipped, and incomplete provider outcomes with run provenance', async () => {
    const result = await generateReport(runFixture());
    expect(result.status, result.stderr).toBe(0);
    const report = result.report as {
      id: string;
      status: string;
      producer: { workflowRunId: number; runAttempt: number };
      sourceRevision: { commit: string };
      checks: Array<{ outcome: string; steps: Array<{ outcome: string }> }>;
      relationships: Array<{ relation: string }>;
    };
    expect(report.id).toBe('RPT-CI-7001-A2');
    expect(report.status).toBe('failed');
    expect(report.producer).toMatchObject({ workflowRunId: 7001, runAttempt: 2 });
    expect(report.sourceRevision.commit).toBe('1234567890abcdef1234567890abcdef12345678');
    expect(report.checks[0].outcome).toBe('failed');
    expect(report.checks[0].steps.map((step) => step.outcome)).toEqual(['passed', 'skipped', 'incomplete']);
    expect(report.relationships.map((relationship) => relationship.relation)).toEqual(['producedBy', 'evaluatesRevision']);
  });

  it('preserves cancellation rather than inferring a pass', async () => {
    const result = await generateReport(runFixture({ conclusion: 'cancelled' }));
    expect(result.status, result.stderr).toBe(0);
    expect(result.report?.status).toBe('cancelled');
  });

  it('rejects pull-request execution as a durable report producer', async () => {
    const result = await generateReport(runFixture({ event: 'pull_request' }));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('CI retained reports must come from a trusted push run');
  });

  it('declares durable Git history retention separately from transient artifact transport', () => {
    expect(registry.reporting.retainedReports.id).toBe('github.retained-reports');
    expect(registry.reporting.retainedReports.scope.branch).toBe('assurance-reports');
    expect(registry.reporting.retainedReports.retention).toMatchObject({
      mode: 'git-history',
      minimumDays: 400,
      transportDays: 30,
      deletion: 'controlled-change',
    });
  });

  it('keeps the privileged publisher on trusted default-branch code and provider APIs', () => {
    const workflow = readFileSync('.github/workflows/report-publisher.yml', 'utf8');
    expect(workflow).toContain('workflow_run:');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain("github.event.workflow_run.event != 'pull_request'");
    expect(workflow).toContain('ref: ${{ github.event.repository.default_branch }}');
    expect(workflow).not.toContain('download-artifact');
    expect(workflow).not.toContain('github.event.workflow_run.head_sha }}');
    expect(workflow).not.toContain('pull_request_target');
  });

  it('stores only bounded AI evaluation metadata in D1 audit/log tables', () => {
    const source = readFileSync('src/api/governance.ts', 'utf8');
    expect(source).toContain('checkCount: results.length');
    expect(source).toContain('detail: { auditEventId: event.id }');
    expect(source).not.toContain("'ai_boundary_evaluation', { passed, results }");
    expect(source).not.toContain('detail: { passed, results, eventId: event.id }');
  });
});
