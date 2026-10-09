import { acceptanceStages } from '../scripts/lib/acceptance-plan.ts';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import {
  findAuthoredExecutableJavaScript,
  loadPinnedPlatformJavaScript,
} from '../scripts/validate-typescript-source-boundary.ts';

const root = process.cwd();
const validator = path.join(root, 'scripts', 'validate-typescript-source-boundary.ts');

describe('DEMO-492 TypeScript-only authored-source boundary', () => {
  it('rejects newly tracked executable JavaScript in every authored-source area', () => {
    const violations = findAuthoredExecutableJavaScript([
      'src/example.js',
      'scripts/example.mjs',
      'tests/example.cjs',
      '.github/workflows/example.js',
      'src/example.ts',
      'dist/generated.js',
      'node_modules/third-party.js',
    ], new Set());

    expect(violations).toEqual([
      '.github/workflows/example.js',
      'scripts/example.mjs',
      'src/example.js',
      'tests/example.cjs',
    ]);
  });

  it('permits only exact non-executable fixture exemptions', () => {
    const violations = findAuthoredExecutableJavaScript([
      'tests/fixtures/non-executable.js',
      'tests/fixtures/not-exempt.js',
    ], new Set(), new Set(['tests/fixtures/non-executable.js']));

    expect(violations).toEqual(['tests/fixtures/not-exempt.js']);
  });

  it('permits pinned platform JavaScript but rejects an unpinned platform file', () => {
    const pinned = loadPinnedPlatformJavaScript(root);
    expect(pinned.has('platform/wg-edge/index.mjs')).toBe(true);
    expect(findAuthoredExecutableJavaScript([
      'platform/wg-edge/index.mjs',
      'platform/wg-edge/unpinned.mjs',
    ], pinned)).toEqual(['platform/wg-edge/unpinned.mjs']);
  });

  it('passes the live tracked repository and stays wired into canonical check', () => {
    const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('TypeScript authored-source boundary OK');

    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(packageJson.scripts['validate:typescript-source-boundary'])
      .toBe('node scripts/validate-typescript-source-boundary.ts');
    expect(acceptanceStages.map(({ script }) => script)).toContain('validate:typescript-source-boundary');
  });
});
