import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const releaseMerge = '52404a848a52dd012012b23b30fcd88ab9e54ed5';

describe('DEMO-478 post-merge live release recovery', () => {
  it('strips only the exact pull-request suffix from the one immutable v0.30.0 squash commit', () => {
    const history = read('scripts/validate-history.ts');
    expect(history).toContain(`'${releaseMerge}',\n    {\n      suffix: ' (#409)',`);
    expect(history).toContain('post-merge CI 37385592520');
    expect(history.match(/suffix: '/g)).toHaveLength(1);
  });

  it('bounds the same-task recovery to the one direct child of that squash commit', () => {
    const history = read('scripts/validate-history.ts');
    expect(history).toContain(`marker: 'Post-Merge-Recovery: ${releaseMerge}'`);
    expect(history).toContain('id: 478');
    expect(history).toContain('does not consume DEMO-479');
  });

  it('accepts immutable history through the bounded DEMO-478 recovery', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-history.ts'], { cwd: root, encoding: 'utf8', env: process.env });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('pull-request suffix on its live release title');
    expect(result.stderr).toBe('');
  });
});
