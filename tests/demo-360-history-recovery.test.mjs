import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

describe('DEMO-360 immutable history recovery', () => {
  it('records the merged DEMO-359 metadata exception without rewriting main', () => {
    const history = read('scripts/validate-history.mjs');
    expect(history).toContain("'80590b8c367e8d927c2861902182e79eccd41dda'");
    expect(history).toContain('DEMO-359 was squash-merged with a valid controlled title');
  });

  it('keeps the active queue sequential after the recovery consumes DEMO-360', () => {
    const plan = read('IMPLEMENTATION_PLAN.md');
    const headings = [...plan.matchAll(/^### (DEMO-\d{3,}) —/gm)].map((match) => match[1]);
    expect(headings).toEqual([
      'DEMO-361',
      'DEMO-364',
      'DEMO-365',
      'DEMO-366',
      'DEMO-367',
      'DEMO-368',
      'DEMO-369',
    ]);
    expect(plan).not.toMatch(/^### DEMO-360 —/m);
    expect(plan).toContain('### DEMO-361 — [REFACTOR] Split universal process checks from reference-stack checks');
    expect(plan).toContain('- Dependency: none; first open task.');
  });
});
