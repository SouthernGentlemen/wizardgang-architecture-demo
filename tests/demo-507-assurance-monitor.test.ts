import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AVAILABILITY_RETENTION_DAYS } from '../src/api/operations';
import { SECURITY_TXT_EXPIRES } from '../src/api/security-policy';
import { createAssuranceValidationContext } from '../scripts/lib/assurance-validation-context.ts';
import { runAssuranceOperationsValidation } from '../scripts/validate-assurance-operations.ts';

const read = (file: string) => readFileSync(file, 'utf8');
const workflow = read('.github/workflows/assurance-monitor.yml');
const pkg = JSON.parse(read('package.json'));
const monitoring = JSON.parse(read('assurance/operations/monitoring.json'));
const reporting = monitoring.securityReporting;
const policyUrl = `${monitoring.baseUrl}${reporting.policyRoute}`;
const securityTxtUrl = `${monitoring.baseUrl}${reporting.securityTxtRoute}`;
const now = '2026-10-09T12:00:00.000Z';

const securityTxt = (expires = SECURITY_TXT_EXPIRES) => [
  `Contact: ${reporting.privateReportingUrl}`, `Policy: ${policyUrl}`, `Canonical: ${securityTxtUrl}`, `Expires: ${expires}`, '',
].join('\n');

// A stand-in network: each URL answers from the table, or throws when it maps to an Error.
function network(overrides: Record<string, Response | Error> = {}) {
  const calls: string[] = [];
  const answers = (): Record<string, Response | Error> => ({
    [policyUrl]: new Response('<html></html>'),
    [securityTxtUrl]: new Response(securityTxt()),
    [reporting.privateReportingUrl]: new Response('<html></html>'),
    [reporting.privateReportingApi]: Response.json({ enabled: true }),
    ...overrides,
  });
  const fetch = async (url: string) => {
    calls.push(url);
    const answer = answers()[url];
    if (answer instanceof Error) throw answer;
    return answer ?? new Response('', { status: 404 });
  };
  return { fetch, calls };
}

async function monitor(options: { now?: string; overrides?: Record<string, Response | Error> } = {}) {
  const errors: string[] = [];
  const error = vi.spyOn(console, 'error').mockImplementation((line) => { errors.push(String(line)); });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const { fetch, calls } = network(options.overrides);
  const passed = await runAssuranceOperationsValidation(createAssuranceValidationContext({ now: options.now ?? now }), { live: true, fetch });
  error.mockRestore();
  return { passed, errors: errors.join('\n'), calls };
}
afterEach(() => { vi.restoreAllMocks(); });

// The tracking-issue script exactly as the workflow runs it, with a stand-in GitHub client.
function issueScript() {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line.trim() === 'script: |') + 1;
  const indent = lines[start].match(/^ */)?.[0] ?? '';
  const body: string[] = [];
  for (const line of lines.slice(start)) {
    if (line && !line.startsWith(indent)) break;
    body.push(line.slice(indent.length));
  }
  return body.join('\n');
}
async function track(env: { status: string; assertions: string }, existing?: { number: number; state: string }) {
  const actions: [string, Record<string, unknown>][] = [];
  const act = (name: string) => async (args: Record<string, unknown>) => { actions.push([name, args]); };
  const github = {
    paginate: async () => (existing ? [{ ...existing, title: 'Assurance Monitor failure' }] : []),
    rest: { issues: { listForRepo: {}, create: act('create'), update: act('update'), createComment: act('comment') } },
  };
  const context = {
    repo: { owner: 'Wizard-Gang', repo: 'wizardgang-architecture-demo' }, serverUrl: 'https://github.com', runId: 99, sha: 'e'.repeat(40), eventName: 'schedule',
  };
  const processEnv = { env: { MONITOR_STATUS: env.status, MONITOR_ASSERTIONS: env.assertions, MONITOR_ISSUE_TITLE: 'Assurance Monitor failure' } };
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  await new AsyncFunction('github', 'context', 'process', issueScript())(github, context, processEnv);
  return actions;
}

describe('DEMO-507 consolidated assurance monitoring', () => {
  it('runs one suite entrypoint whose operations owner adds the live checks instead of repeating static ones', () => {
    expect(pkg.scripts['monitor:assurance']).toBe('node scripts/validate-assurance-suite.ts --live');
    expect(pkg.scripts['validate:assurance']).toBe('node scripts/validate-assurance-suite.ts');
    const npmRuns = [...workflow.matchAll(/run: (npm run [^\n]+)/g)].map((match) => match[1]);
    expect(npmRuns).toEqual(['npm run monitor:assurance']);
    expect(read('scripts/validate-assurance-suite.ts')).toContain("['security disclosure/operations', (ctx) => runAssuranceOperationsValidation(ctx, { live })]");
    expect(read('scripts/validate-assurance-operations.ts')).not.toContain("'--live'");
    expect(workflow).toContain("cron: '17 9 * * *'");
  });

  it('passes current live reporting paths, following every security.txt URL', async () => {
    const run = await monitor();
    expect(run.errors).toBe('');
    expect(run.passed).toBe(true);
    expect(run.calls.sort()).toEqual([policyUrl, securityTxtUrl, reporting.privateReportingUrl, policyUrl, securityTxtUrl, reporting.privateReportingApi].sort());
  });

  it('evaluates security.txt expiry against the run clock, statically and live', async () => {
    const expired = await monitor({ now: '2027-03-02T00:00:01.000Z' });
    expect(expired.passed).toBe(false);
    expect(expired.errors).toContain(`security.txt expired at ${SECURITY_TXT_EXPIRES}`);
    expect(expired.calls).toEqual([]);
    const staleLive = await monitor({ overrides: { [securityTxtUrl]: new Response(securityTxt('2026-10-01T00:00:00Z')) } });
    expect(staleLive.passed).toBe(false);
    expect(staleLive.errors).toContain('live security.txt expired at 2026-10-01T00:00:00Z');
  });

  it('separates a failed live path from an unknown network outcome, and both fail', async () => {
    const failed = await monitor({ overrides: { [policyUrl]: new Response('', { status: 503 }) } });
    expect(failed.passed).toBe(false);
    expect(failed.errors).toContain(`reporting link failed: ${policyUrl} returned 503`);
    const unknown = await monitor({ overrides: { [reporting.privateReportingApi]: new Error('getaddrinfo ENOTFOUND') } });
    expect(unknown.passed).toBe(false);
    expect(unknown.errors).toContain(`reporting link unknown: ${reporting.privateReportingApi} could not be reached: getaddrinfo ENOTFOUND`);
    const disabled = await monitor({ overrides: { [reporting.privateReportingApi]: Response.json({ enabled: false }) } });
    expect(disabled.errors).toContain('GitHub private vulnerability reporting is not enabled');
    const mismatched = await monitor({ overrides: { [securityTxtUrl]: new Response(securityTxt().replace(policyUrl, 'https://example.invalid/security')) } });
    expect(mismatched.errors).toContain(`live security.txt Policy does not match ${policyUrl}`);
  });

  it('opens, reopens and comments on one tracking issue with run, head and owner guidance', async () => {
    const [[created, issue]] = await track({ status: 'failure', assertions: 'failure' });
    expect(created).toBe('create');
    expect(issue.body).toContain('An assurance assertion failed.');
    expect(issue.body).toContain('- Run: https://github.com/Wizard-Gang/wizardgang-architecture-demo/actions/runs/99');
    expect(issue.body).toContain(`- Head: https://github.com/Wizard-Gang/wizardgang-architecture-demo/commit/${'e'.repeat(40)}`);
    expect(issue.body).toContain('Responsible: the Operations Owner');
    const [[reopened, reopen]] = await track({ status: 'failure', assertions: 'failure' }, { number: 7, state: 'closed' });
    expect([reopened, reopen.state, reopen.issue_number]).toEqual(['update', 'open', 7]);
    const [[commented]] = await track({ status: 'failure', assertions: 'failure' }, { number: 7, state: 'open' });
    expect(commented).toBe('comment');
  });

  it('distinguishes a run that failed before any assertion from an assertion failure', async () => {
    const [[, setup]] = await track({ status: 'failure', assertions: 'skipped' });
    expect(setup.body).toContain('The monitor failed before any assurance assertion ran; no assertion was tested.');
    expect(setup.body).not.toContain('An assurance assertion failed.');
  });

  it('closes an open issue on recovery, leaves a closed one alone and skips cancelled runs', async () => {
    const recovered = await track({ status: 'success', assertions: 'success' }, { number: 7, state: 'open' });
    expect(recovered.map(([name]) => name)).toEqual(['comment', 'update']);
    expect(recovered[0][1].body).toBe(`Recovered in https://github.com/Wizard-Gang/wizardgang-architecture-demo/actions/runs/99 at https://github.com/Wizard-Gang/wizardgang-architecture-demo/commit/${'e'.repeat(40)}.`);
    expect(recovered[1][1].state).toBe('closed');
    expect(await track({ status: 'success', assertions: 'success' }, { number: 7, state: 'closed' })).toEqual([]);
    expect(await track({ status: 'success', assertions: 'success' })).toEqual([]);
    expect(workflow).toContain('if: ${{ always() && !cancelled() }}');
  });

  it('keeps five-minute availability collection and 365-day retention apart from the daily monitor', () => {
    expect(read('wrangler.jsonc')).toContain('"crons": ["*/5 * * * *"]');
    expect(AVAILABILITY_RETENTION_DAYS).toBe(365);
    expect(read('docs/OPERATIONS.md')).toContain('## Assurance monitor');
  });
});
