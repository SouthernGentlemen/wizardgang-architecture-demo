import { acceptanceStages } from '../scripts/lib/acceptance-plan.ts';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const tool = path.join(root, 'scripts', 'validate-typescript-execution.ts');

function run(args: string[]) {
  return spawnSync(process.execPath, [tool, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

describe('DEMO-426 native TypeScript execution path', () => {
  it('pins one dependency-free Node runner in package authority and canonical check', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    expect(packageJson.scripts['validate:typescript-execution'])
      .toBe('node scripts/validate-typescript-execution.ts --self-check');
    expect(`npm run ${acceptanceStages[0].script}`)
      .toBe('npm run validate:typescript-execution');
    expect(dependencies).not.toHaveProperty('tsx');
    expect(dependencies).not.toHaveProperty('ts-node');
  });

  it('executes TypeScript directly as ESM and forwards CLI arguments', () => {
    const selfCheck = run(['--self-check']);
    expect(selfCheck.status).toBe(0);
    expect(selfCheck.stdout).toContain('Native TypeScript execution OK via ESM import: evidence.');

    const echo = run(['--echo', 'cli-argument-proof']);
    expect(echo.status).toBe(0);
    expect(echo.stdout.trim()).toBe('cli-argument-proof');
  });

  it('preserves explicit non-zero exit codes', () => {
    const result = run(['--exit', '23']);
    expect(result.status).toBe(23);
    expect(result.signal).toBeNull();
  });

  it('keeps useful TypeScript file locations in thrown-error stack traces', () => {
    const result = run(['--throw', 'stack-trace-proof']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Error: stack-trace-proof');
    expect(result.stderr).toMatch(/validate-typescript-execution\.ts:\d+:\d+/);
  });
});
