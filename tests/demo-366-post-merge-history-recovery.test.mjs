import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const malformedMerge = '4ec192c10dfefd9d119ac223ae599b7db948524c';

describe('DEMO-366 post-merge history recovery', () => {
  it('records only the immutable malformed DEMO-366 squash commit as a body exception', () => {
    const history = read('scripts/validate-history.mjs');
    expect(history).toContain(`'${malformedMerge}'`);
    expect(history).toContain('DEMO-366 was squash-merged with a valid controlled title');
    expect(history).toContain('post-merge CI #1370');
  });

  it('bounds the same-task recovery to the one direct child of the exact malformed merge', () => {
    const history = read('scripts/validate-history.mjs');
    expect(history).toContain('const boundedRecoveryContinuations = new Map([');
    expect(history).toContain(`marker: 'Post-Merge-Recovery: ${malformedMerge}'`);
    expect(history).toContain('parents.length === 1 ? boundedRecoveryContinuations.get(parents[0]) : null');
    expect(history).toContain('boundedRecovery.id === id');
  });

  it('keeps DEMO-367 as the first active queued task', () => {
    const plan = read('IMPLEMENTATION_PLAN.md');
    const headings = [...plan.matchAll(/^### (DEMO-\d{3,}) —/gm)].map((match) => match[1]);
    expect(headings[0]).toBe('DEMO-367');
    expect(headings).toEqual(['DEMO-367', 'DEMO-368', 'DEMO-369', 'DEMO-371']);
    expect(plan).not.toMatch(/^### DEMO-366 —/m);
  });

  it('accepts the complete immutable history including the bounded DEMO-366 recovery', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-history.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('immutable published-history exception');
    expect(result.stderr).toBe('');
  });
});
