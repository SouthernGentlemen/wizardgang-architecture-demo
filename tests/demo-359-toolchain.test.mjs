import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateToolchainContract } from '../scripts/validate-toolchain.mjs';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const nodeVersion = read('.node-version').trim();
const npmVersion = packageJson.packageManager.replace(/^npm@/, '');

describe('DEMO-359 shared toolchain contract', () => {
  it('keeps exact authorities aligned with the supported engine policy and lock metadata', () => {
    expect(nodeVersion).toBe('26.9.0');
    expect(packageJson.packageManager).toBe('npm@11.19.1');
    expect(packageJson.engines).toEqual({ node: '26.x', npm: '11.x' });
    expect(packageLock.packages?.['']?.engines).toEqual(packageJson.engines);
    expect(read('.npmrc').split(/\r?\n/)).toContain('engine-strict=true');
  });

  it('rejects exact Node or npm drift even inside the supported major line', () => {
    expect(validateToolchainContract({
      packageJson,
      pinnedNodeVersion: nodeVersion,
      actualNodeVersion: '26.9.0',
      actualNpmVersion: '11.19.1',
    }).failures).toEqual([]);

    expect(validateToolchainContract({
      packageJson,
      pinnedNodeVersion: nodeVersion,
      actualNodeVersion: '26.8.0',
      actualNpmVersion: '11.19.0',
    }).failures).toEqual([
      'Node 26.8.0; expected 26.9.0',
      'npm 11.19.0; expected 11.19.1',
    ]);
  });

  it('keeps CI, release, and deployment on repository-owned toolchain authority', () => {
    const ci = read('.github/workflows/ci.yml');
    const release = read('.github/workflows/release.yml');
    const deploy = read('.github/workflows/deploy.yml');

    for (const workflow of [ci, release, deploy]) {
      expect(workflow).toContain('node-version-file: .node-version');
      expect(workflow).not.toMatch(/\bnode-version:\s*\d/);
    }

    expect(ci).toContain('npm run validate:ci');
    for (const workflow of [release, deploy]) {
      const verifyIndex = workflow.indexOf('node scripts/validate-toolchain.mjs');
      const installIndex = workflow.indexOf('run: npm ci');
      expect(verifyIndex).toBeGreaterThan(-1);
      expect(installIndex).toBeGreaterThan(verifyIndex);
    }
  });
});
