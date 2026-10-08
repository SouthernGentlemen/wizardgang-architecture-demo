import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ACCEPTED_HISTORY_BOUNDARY, rawAcceptedIds, validateCheckpointAncestry,
  validateForwardRecords,
} from '../scripts/lib/forward-history.ts';
import { parsePlanTasks } from '../scripts/lib/controlled-pr-identity.ts';

const created = [];
const body = (extra = '') => ['Change:', 'Forward change.', 'Reason:', 'Current delivery.',
  'Impact:', 'Current history.', 'Risk:', 'Low', 'Controls:', '- Check.', 'Validation:',
  '- Test.', 'Evidence:', '- Source.', 'Source:', 'direct.', 'Release:', 'Unreleased', extra].join('\n');
const task = (id, dependency = 'none.') =>
  '### ' + id + ' — [BUILD] Implement ' + id + '\n\n- Dependency: ' + dependency + '\n- Why: Current requirement.\n- Scope: New change.\n- Non-goals: No rewrite.\n- Acceptance: Forward delivery.\n- Validation: Tests.\n- Authorities: AGENTS.md.\n';
const plan = (...ids) => '# Implementation plan\n\n## Open tasks\n\n' + ids.map((id) => task(id)).join('\n');
const initial = plan('DEMO-499', 'DEMO-500', 'DEMO-501');
const next = plan('DEMO-500', 'DEMO-501');
const baseline = { checkpoint: ACCEPTED_HISTORY_BOUNDARY.checkpoint, sequentialFloor: 498, consumedAboveFloor: [] };
const record = (overrides = {}) => ({
  sha: 'a'.repeat(40), parents: [baseline.checkpoint],
  subject: '[DEMO-499] [BUILD] Implement DEMO-499', body: body(),
  basePlanMarkdown: initial, headPlanMarkdown: next, ...overrides,
});
const check = (records, options = {}) => validateForwardRecords({
  records, boundary: baseline, acceptedBefore: new Set(['DEMO-498']), ...options,
});
const run = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function repo() {
  const cwd = mkdtempSync(join(tmpdir(), 'demo-499-'));
  created.push(cwd);
  run(cwd, ['init', '-q']);
  run(cwd, ['config', 'user.name', 'Fixture']);
  run(cwd, ['config', 'user.email', 'fixture@example.test']);
  writeFileSync(join(cwd, 'note.txt'), 'initial ' + created.length + '\n');
  run(cwd, ['add', '.']);
  run(cwd, ['commit', '-qm', 'fixture']);
  return cwd;
}
afterEach(() => { for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('DEMO-499 fixed forward-only controlled history', () => {
  it('pins the immutable accepted boundary rather than moving it to HEAD', () => {
    expect(ACCEPTED_HISTORY_BOUNDARY).toEqual(baseline);
    const cwd = repo();
    const sha = run(cwd, ['rev-parse', 'HEAD']);
    expect(validateCheckpointAncestry((args) => run(cwd, args), 'HEAD', { ...baseline, checkpoint: sha })).toEqual([]);
    expect(validateCheckpointAncestry((args) => run(cwd, args), 'HEAD', { ...baseline, checkpoint: 'f'.repeat(40) }).join(' ')).toContain('checkpoint is missing');
    const unrelated = repo();
    const otherSha = run(unrelated, ['rev-parse', 'HEAD']);
    expect(validateCheckpointAncestry((args) => run(cwd, args), 'HEAD', { ...baseline, checkpoint: otherSha }).join(' ')).toContain('checkpoint is missing');
    writeFileSync(join(cwd, 'note.txt'), 'later\n');
    run(cwd, ['commit', '-qam', 'later']);
    expect(validateCheckpointAncestry((args) => run(cwd, args), sha, { ...baseline, checkpoint: run(cwd, ['rev-parse', 'HEAD']) }).join(' ')).toContain('not an ancestor');
  });

  it('uses old subjects only for accepted ID lookup without old body validation', () => {
    expect(rawAcceptedIds(['[DEMO-497] [TEST] Accepted', '[DEMO-498] old malformed (#123)', 'Other'])).toEqual(new Set(['DEMO-497', 'DEMO-498']));
    expect(check([record()]).errors).toEqual([]);
    expect(check([record()]).next).toBe(500);
  });

  it('fails for new body sections, wrong risk, malformed title, suffix, duplicate and gap', () => {
    const inputs = [
      record({ body: body().replace('Reason:', 'Rationale:') }),
      record({ body: body().replace('Risk:\nLow', 'Risk:\nUnknown') }),
      record({ subject: 'Uncontrolled work' }),
      record({ subject: '[DEMO-499] [BUILD] Implement DEMO-499 (#443)' }),
      record({ subject: '[DEMO-498] [BUILD] Duplicate', headPlanMarkdown: next }),
      record({ subject: '[DEMO-501] [BUILD] Skip one' }),
    ];
    for (const input of inputs) {
      expect(check([input]).errors.length, input.subject).toBeGreaterThan(0);
    }
    expect(check([record(), record({ sha: 'b'.repeat(40) })]).errors.join(' ')).toContain('reuses an accepted');
    expect(check([record({ body: body('\nPost-Merge-Recovery: ' + baseline.checkpoint) })]).errors.join(' ')).toContain('must use a new controlled identity');
  });

  it('enforces current queue order, dependencies, and later-task preservation', () => {
    expect(check([record({ headPlanMarkdown: initial })]).errors.join(' ')).toContain('must be retired');
    expect(check([record({ headPlanMarkdown: plan('DEMO-501') })]).errors.join(' ')).toContain('Future queued tasks');
    expect(check([record({ basePlanMarkdown: plan('DEMO-499'), headPlanMarkdown: plan() ,
      body: body() })]).errors).toEqual([]);
    const blocked = initial.replace('- Dependency: none.', '- Dependency: DEMO-498 and DEMO-509.', 1);
    expect(check([record({ basePlanMarkdown: blocked })]).errors.join(' ')).toContain('DEMO-509');
    expect(parsePlanTasks(initial).map((t) => t.id)).toEqual(['DEMO-499', 'DEMO-500', 'DEMO-501']);
  });

  it('accepts forward corrections only under fresh reserved-free identities', () => {
    const correction = record({
      subject: '[DEMO-499] [BUILD] Correct accepted behavior',
      body: body('Corrects: DEMO-498'),
    });
    expect(check([correction]).errors).toEqual([]);
    const early = record({
      subject: '[DEMO-510] [DOCS] Update current policy',
      body: body('\nPortfolio-Plan-Maintenance: true'),
      headPlanMarkdown: initial,
    });
    const complete = record();
    expect(check([early, complete]).errors).toEqual([]);
    expect(check([early, complete]).next).toBe(500);
    const reserved = record({ ...early, subject: '[DEMO-500] [DOCS] Reuse queued identity' });
    expect(check([reserved]).errors.join(' ')).toContain('already accepted or reserved');
  });

  it('keeps supported live-release version-only identity, with no old suffix fallback', () => {
    const pkg = (version) => JSON.stringify({ name: 'demo', version });
    const lock = (version) => JSON.stringify({ name: 'demo', version, packages: { '': { name: 'demo', version } } });
    const release = record({
      subject: '[DEMO-510] [BUILD] Demonstrate v0.33.0 release lifecycle',
      body: body('Live-Release: true').replace('Release:\nUnreleased', 'Release:\nv0.33.0'),
      headPlanMarkdown: initial,
    });
    const opts = { commitInputs: () => ({
      changedFiles: ['package-lock.json', 'package.json'], beforePackage: pkg('0.32.0'),
      afterPackage: pkg('0.33.0'), beforeLock: lock('0.32.0'), afterLock: lock('0.33.0'),
    }) };
    expect(check([release], opts).errors).toEqual([]);
    expect(check([record({ ...release, subject: release.subject + ' (#99)' })], opts).errors.join(' ')).toContain('invalid forward controlled title');
    expect(check([record({ ...release, body: release.body.replace('Live-Release: true', '') })], opts).errors.length).toBeGreaterThan(0);
  });
});
