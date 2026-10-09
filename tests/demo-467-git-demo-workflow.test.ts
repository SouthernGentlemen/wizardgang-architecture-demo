import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { liveIntentRecord, planLiveReleaseStart, verifyLiveIntentPull } from '../scripts/lib/git-demo-workflow.ts';
import { validateControlledRecord } from '../scripts/lib/controlled-record.ts';

const requestId = '123E4567-e89b-12d3-a456-426614174000';
const emptyPlan = '# Implementation plan\n';
const queuedPlan = '# Implementation plan\n\n## Open tasks\n\n### DEMO-468 — [BUILD] Queued change\n\n- Dependency: none.\n';
const start = (overrides = {}) => planLiveReleaseStart({
  packageJson: JSON.stringify({ version: '0.31.1' }), bump: 'minor', requestId,
  subjects: ['[DEMO-467] [BUILD] Accepted', ''], planMarkdown: emptyPlan, openPullRequests: [],
  existingTag: (tag) => tag === 'v0.31.1', ...overrides,
});
const pull = {
  state: 'OPEN',
  title: '[DEMO-468] [BUILD] Authorize v0.32.0 batch release',
  body: `Controlled\nRelease-Intent: v0.32.0\n<!-- git-demo-request:${requestId.toLowerCase()} -->`,
  baseRefName: 'main',
  headRefName: 'demo-468-release-v0-32-0-123e4567',
  headRefOid: 'a'.repeat(40),
};

describe('DEMO-467 live Git workflow logic on the shared release-intent primitives', () => {
  it('allocates the planning identity and target version for a completed batch', () => {
    expect(start()).toEqual({ current: '0.31.1', version: '0.32.0', change_id: 'DEMO-468', branch: 'demo-468-release-v0-32-0-123e4567' });
  });

  it('refuses an open queue, an unreleased intent and an existing target tag', () => {
    expect(() => start({ planMarkdown: queuedPlan })).toThrow('open tasks: DEMO-468');
    expect(() => start({ existingTag: () => false })).toThrow('unreleased authorized intent');
    expect(() => start({ existingTag: () => true })).toThrow('Release tag v0.32.0 already exists.');
    expect(() => start({ packageJson: JSON.stringify({ version: '0.31' }), existingTag: () => true })).toThrow('Invalid package version: 0.31');
  });

  it('renders one plan-maintenance intent record with the request correlation and range', () => {
    const record = liveIntentRecord({ id: 'DEMO-468', version: '0.32.0', requestId, previousTag: 'v0.31.1', commits: '- 123abc Controlled change' });
    expect(validateControlledRecord(record.subject, record.body)).toEqual([]);
    expect(record.subject).toBe(pull.title);
    expect(record.body).toContain('Portfolio-Plan-Maintenance: true');
    expect(record.body).toContain('Release-Intent: v0.32.0');
    expect(record.body).toContain(`<!-- git-demo-request:${requestId.toLowerCase()} -->`);
    expect(record.body).toContain('- 123abc Controlled change');
  });

  it('binds the release operation to the exact controlled intent pull request', () => {
    expect(verifyLiveIntentPull(pull, requestId)).toEqual({ branch: pull.headRefName, sha: pull.headRefOid, version: '0.32.0' });
    expect(() => verifyLiveIntentPull({ ...pull, state: 'CLOSED' }, requestId)).toThrow('not an open live-demo change');
    expect(() => verifyLiveIntentPull({ ...pull, title: pull.title.replace('468', '469') }, requestId)).toThrow('release-intent contract');
    expect(() => verifyLiveIntentPull({ ...pull, body: pull.body.replace('v0.32.0', 'v0.32.1') }, requestId)).toThrow('release-intent contract');
    expect(() => verifyLiveIntentPull({ ...pull, headRefName: 'demo-468-release-v0-32-0-zzzzzzzz' }, requestId)).toThrow('release-intent contract');
    expect(() => verifyLiveIntentPull(pull, '00000000-0000-0000-0000-000000000000')).toThrow('request ID does not match');
  });

  it('runs the workflow entrypoint natively from TypeScript', () => {
    const version = spawnSync(process.execPath, ['scripts/git-demo-workflow.ts', 'package-version'], { input: '{"version":"0.31.1"}', encoding: 'utf8' });
    expect(version.status, version.stderr).toBe(0);
    expect(version.stdout).toBe('0.31.1\n');
  });
});
