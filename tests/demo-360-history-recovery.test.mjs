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

  it('keeps DEMO-360 retired as future tasks are appended or delivered', () => {
    if (!fs.existsSync(path.join(root, 'IMPLEMENTATION_PLAN.md'))) return;
    const plan = read('IMPLEMENTATION_PLAN.md');
    const headings = [...plan.matchAll(/^### (DEMO-\d{3,}) —/gm)].map((match) => Number(match[1].slice(5)));
    expect(headings.every((id) => id > 360)).toBe(true);
    expect(headings).toEqual([...new Set(headings)].sort((a, b) => a - b));
    expect(plan).not.toMatch(/^### DEMO-360 —/m);
  });
});
