import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const malformedMerge = '68968b6d0419cf3de6abc410b9a0a264097fe136';

describe('DEMO-422 post-merge history recovery', () => {
  it('records only the immutable malformed DEMO-422 squash commit as a body exception', () => {
    const history = read('scripts/validate-history.ts');
    expect(history).toContain(`'${malformedMerge}'`);
    expect(history).toContain('DEMO-422 was squash-merged with a valid controlled title');
    expect(history).toContain('post-merge CI #1504');
  });

  it('bounds the same-task recovery to the one direct child of the exact malformed merge', () => {
    const history = read('scripts/validate-history.ts');
    expect(history).toContain(`marker: 'Post-Merge-Recovery: ${malformedMerge}'`);
    expect(history).toContain('id: 422');
    expect(history).toContain('does not consume DEMO-423');
  });

  it('keeps DEMO-422 retired as later implementation work advances the queue', () => {
    const plan = read('implementation_plan.md');
    const headings = [...plan.matchAll(/^### (DEMO-\d{3,}) —/gm)].map((match) => match[1]);
    expect(headings.length).toBeGreaterThan(0);
    expect(Number(headings[0].slice('DEMO-'.length))).toBeGreaterThan(422);
    expect(headings).not.toContain('DEMO-422');
  });

  it('accepts immutable history through the bounded DEMO-422 recovery', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-history.ts'], {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('immutable published-history exception');
    expect(result.stderr).toBe('');
  });
});
