import { describe, expect, it } from 'vitest';
import { validateImplementationPlan } from '../scripts/validate-implementation-plan.mjs';
import { readFileSync } from 'node:fs';

const task = (id = 'DEMO-999') => `# Active implementation plan

## Open tasks

### ${id} — [TEST] Enforce one future outcome

- Dependency: Prior accepted change on main.
- Why: A specific gap exists.
- Scope: Add one narrow test.
- Non-goals: Do not change production.
- Acceptance: The test detects drift.
- Validation: npm run check.
- Authorities: scripts/validate-implementation-plan.mjs.
`;

describe('active implementation plan policy', () => {
  it('allows the shared empty queue and a structured future task', () => {
    expect(validateImplementationPlan(readFileSync('implementation_plan.md', 'utf8'))).toEqual([]);
    expect(validateImplementationPlan(task())).toEqual([]);
  });

  it('requires delivery to retire its own accepted task', () => {
    expect(validateImplementationPlan(task(), new Set(['DEMO-999']))).toContain(
      'DEMO-999: an accepted controlled change cannot remain in the active plan; retire it in the delivering PR.',
    );
  });

  it('rejects an arbitrary empty, historical, or incomplete plan', () => {
    expect(validateImplementationPlan('# Active implementation plan\n')).toContain(
      'An empty implementation plan must use the shared permanent queue template.',
    );
    expect(validateImplementationPlan(`${task()}\n## Completed tasks\n`)).toContain(
      'An active plan cannot retain completed work or historical sections.',
    );
    expect(validateImplementationPlan(task().replace('- Validation: npm run check.\n', ''))).toContain(
      'DEMO-999: missing non-empty Validation field.',
    );
  });

  it('rejects duplicate, out-of-order, and malformed task headings', () => {
    expect(validateImplementationPlan(`${task()}\n${task()}`)).toContain('DEMO-999: tasks must have unique ascending IDs.');
    expect(validateImplementationPlan(task().replace('### DEMO-999', '### Other'))).toContain(
      'Every task heading must be ### DEMO-### — [TYPE] Imperative title.',
    );
  });
});
