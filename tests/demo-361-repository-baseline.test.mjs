import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateRepositoryBaseline } from '../scripts/validate-repository-baseline.mjs';

const roots = [];
const capabilityNames = ['typescript', 'react', 'vite', 'vitest', 'browser', 'cloudflareWorker', 'release'];

function write(root, file, content) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function capabilityDeclaration(profile, enabled) {
  return JSON.stringify({
    schemaVersion: 1,
    profile,
    capabilities: Object.fromEntries(capabilityNames.map((name) => [name, enabled])),
  }, null, 2) + '\n';
}

function createUniversalFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-361-baseline-'));
  roots.push(root);
  for (const [file, content] of [
    ['README.md', '# Fixture\n'],
    ['AGENTS.md', '# Agents\n'],
    ['CONTRIBUTING.md', '# Contributing\n'],
    ['SECURITY.md', '# Security\n'],
    ['LICENSE', 'MIT\n'],
    ['.gitignore', 'node_modules/\n'],
    ['.node-version', '26.10.0\n'],
    ['.npmrc', 'engine-strict=true\nstrict-allow-scripts=true\n'],
  ]) write(root, file, content);
  write(root, 'package.json', JSON.stringify({
    name: 'universal-process-fixture',
    version: '1.0.0',
    type: 'module',
    engines: { node: '26.x', npm: '12.x' },
    packageManager: 'npm@12.1.0',
    allowScripts: {},
    scripts: {
      'validate:repository-baseline': 'node scripts/validate-repository-baseline.mjs',
      'validate:history': 'node scripts/validate-history.mjs',
      check: 'npm run validate:repository-baseline && npm run validate:history',
    },
  }, null, 2) + '\n');
  write(root, 'package-lock.json', JSON.stringify({
    name: 'universal-process-fixture',
    version: '1.0.0',
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': {
        name: 'universal-process-fixture',
        version: '1.0.0',
      },
    },
  }, null, 2) + '\n');
  write(root, 'config/repository-capabilities.json', capabilityDeclaration('universal', false));
  write(root, '.github/workflows/ci.yml', `name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
      - run: npm ci
      - run: npm run check
`);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('DEMO-361 repository baseline profiles', () => {
  it('lets a minimal non-Worker/non-React repository satisfy the universal process contract', () => {
    const root = createUniversalFixture();
    for (const file of ['tsconfig.json', 'wrangler.jsonc', 'vite.config.ts', '.github/workflows/release.yml']) {
      expect(fs.existsSync(path.join(root, file))).toBe(false);
    }
    expect(validateRepositoryBaseline(root)).toEqual([]);
  });

  it('keeps the reference-stack profile strict instead of weakening missing capabilities', () => {
    const root = createUniversalFixture();
    write(root, 'config/repository-capabilities.json', capabilityDeclaration('reference-stack', true));
    const failures = validateRepositoryBaseline(root);
    expect(failures).toContain('missing tsconfig.json');
    expect(failures).toContain('missing wrangler.jsonc');
    expect(failures).toContain('missing vite.config.ts');
    expect(failures).toContain('missing .github/workflows/release.yml');
    expect(failures).toContain('pin react major 19');
    expect(failures).toContain('missing npm run test');
  });

  it('keeps this repository on the stronger reference-stack contract', () => {
    const declaration = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config/repository-capabilities.json'), 'utf8'));
    expect(declaration.profile).toBe('reference-stack');
    expect(declaration.capabilities).toEqual(Object.fromEntries(capabilityNames.map((name) => [name, true])));
    expect(validateRepositoryBaseline(process.cwd())).toEqual([]);
  });
});
