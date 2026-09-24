import { describe, expect, it } from 'vitest';
import { validateControlledPullRequestIdentity } from '../scripts/lib/controlled-pr-identity.mjs';

const task = (id, type = 'TEST', dependency = 'none; first open task.') => `### ${id} — [${type}] Validate ${id}\n\n- Dependency: ${dependency}\n- Why: A deterministic process gap exists.\n- Scope: Validate the controlled PR boundary.\n- Non-goals: No provider mutation.\n- Acceptance: Invalid identity fails.\n- Validation: npm run check.\n- Authorities: AGENTS.md.\n`;
const plan = (...tasks) => `# Active implementation plan\n\n## Open tasks\n\n${tasks.join('\n')}`;
const validBase = plan(task('DEMO-364'), task('DEMO-365', 'FIX', 'DEMO-364 merged.'));
const validHead = plan(task('DEMO-365', 'FIX', 'DEMO-364 merged.'));
const valid = (overrides = {}) => ({
  branchName: 'demo-364-bind-controlled-pr-identity-and-queue-sequence',
  title: '[DEMO-364] [TEST] Bind controlled PR identity and queue sequence',
  headSubject: '[DEMO-364] [TEST] Bind controlled PR identity and queue sequence',
  rangeSubjects: ['[DEMO-364] [TEST] Bind controlled PR identity and queue sequence'],
  basePlanMarkdown: validBase,
  headPlanMarkdown: validHead,
  baseAcceptedIds: new Set(['DEMO-363']),
  ...overrides,
});

describe('controlled PR identity and queue sequence', () => {
  it('accepts one exact controlled commit for the first unblocked task and same-delivery retirement', () => {
    expect(validateControlledPullRequestIdentity(valid())).toEqual([]);
  });

  it('rejects duplicate or out-of-sequence queue selection', () => {
    const duplicate = plan(task('DEMO-364'), task('DEMO-364'));
    expect(validateControlledPullRequestIdentity(valid({ basePlanMarkdown: duplicate }))).toContain(
      'Base plan task IDs must be unique and strictly ascending; found DEMO-364 out of sequence.',
    );
    expect(validateControlledPullRequestIdentity(valid({
      branchName: 'demo-365-skip-head',
      title: '[DEMO-365] [FIX] Skip head',
      headSubject: '[DEMO-365] [FIX] Skip head',
      rangeSubjects: ['[DEMO-365] [FIX] Skip head'],
    }))).toContain('Selected DEMO-365 skips first open task DEMO-364.');
  });

  it('binds branch, PR title, exact head identity, and plan type', () => {
    expect(validateControlledPullRequestIdentity(valid({ branchName: 'demo-365-wrong-id' }))).toContain(
      'Branch identifies DEMO-365 but PR title identifies DEMO-364.',
    );
    expect(validateControlledPullRequestIdentity(valid({
      headSubject: '[DEMO-364] [FIX] Bind controlled PR identity and queue sequence',
    }))).toContain('PR title identity DEMO-364 [TEST] does not match exact head DEMO-364 [FIX].');
    expect(validateControlledPullRequestIdentity(valid({
      title: '[DEMO-364] [FIX] Wrong type',
      headSubject: '[DEMO-364] [FIX] Wrong type',
      rangeSubjects: ['[DEMO-364] [FIX] Wrong type'],
    }))).toContain('Selected DEMO-364 must use plan type [TEST], not [FIX].');
  });

  it('rejects multiple commits or multiple controlled identities in the PR range', () => {
    const errors = validateControlledPullRequestIdentity(valid({
      rangeSubjects: [
        '[DEMO-364] [TEST] First controlled commit',
        '[DEMO-364] [TEST] Second controlled commit',
      ],
    }));
    expect(errors).toContain('PR range must contain exactly one commit; found 2.');
    expect(errors).toContain('PR range must contain exactly one controlled DEMO commit; found 2.');
  });

  it('requires task retirement while preserving future queued IDs', () => {
    expect(validateControlledPullRequestIdentity(valid({ headPlanMarkdown: validBase }))).toContain(
      'DEMO-364 must be retired from IMPLEMENTATION_PLAN.md in the same delivery.',
    );
    expect(validateControlledPullRequestIdentity(valid({ headPlanMarkdown: plan(task('DEMO-366')) }))).toContain(
      'Future queued tasks must remain after delivery; missing DEMO-365.',
    );
  });

  it('fails a blocked head and does not permit selecting a later task', () => {
    const blocked = plan(
      task('DEMO-364', 'TEST', 'DEMO-363 must be merged.'),
      task('DEMO-365', 'FIX', 'none.'),
    );
    const errors = validateControlledPullRequestIdentity(valid({
      branchName: 'demo-365-skip-blocked-head',
      title: '[DEMO-365] [FIX] Skip blocked head',
      headSubject: '[DEMO-365] [FIX] Skip blocked head',
      rangeSubjects: ['[DEMO-365] [FIX] Skip blocked head'],
      basePlanMarkdown: blocked,
      baseAcceptedIds: new Set(),
    }));
    expect(errors).toContain('First open task DEMO-364 is blocked by unmet controlled dependency: DEMO-363.');
    expect(errors).toContain('Selected DEMO-365 skips first open task DEMO-364.');

    const externalBlocked = plan(
      task('DEMO-364', 'TEST', 'External provider prerequisite is unresolved.'),
      task('DEMO-365', 'FIX', 'DEMO-364 merged.'),
    );
    expect(validateControlledPullRequestIdentity(valid({
      basePlanMarkdown: externalBlocked,
    }))).toContain('First open task DEMO-364 is blocked by unresolved dependency: External provider prerequisite is unresolved.');
  });

  it('preserves the explicit portfolio-plan maintenance exception', () => {
    expect(validateControlledPullRequestIdentity(valid({
      branchName: 'demo-370-maintain-plan',
      title: '[DEMO-370] [DOCS] Maintain portfolio plan',
      headSubject: '[DEMO-370] [DOCS] Maintain portfolio plan',
      headBody: 'Portfolio-Plan-Maintenance: true',
      rangeSubjects: ['[DEMO-370] [DOCS] Maintain portfolio plan'],
      basePlanMarkdown: null,
      headPlanMarkdown: plan(task('DEMO-371')),
    }))).toEqual([]);
  });
});
