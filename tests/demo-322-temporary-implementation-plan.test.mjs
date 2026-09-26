import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const validator = resolve('scripts/validate-documentation-cleanup.mjs');
const plannedChange = ['DEMO', '999'].join('-');
const fixtures = [];

function fixture(markdown) {
  const root = mkdtempSync(join(tmpdir(), 'demo-322-'));
  fixtures.push(root);
  const files = {
    'package.json': JSON.stringify({ scripts: { check: 'npm run validate:documentation' } }),
    [['docs', 'governance', 'REFERENCE-REGISTRY.json'].join('/')]: JSON.stringify({ records: [] }),
    [['docs', 'route-manifest.json'].join('/')]: '[]\n',
    [['docs', 'history', 'DEPLOYMENTS.md'].join('/')]: `# Deployments\n\nRecorded by ${plannedChange}.\n`,
    'README.md': '# Fixture\n',
    ...markdown,
  };
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['add', '--all'], { cwd: root });
  return root;
}

function validate(root) {
  return spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8' });
}

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('DEMO-322 temporary implementation plan', () => {
  it('lets the root implementation plan name the change IDs it reserves', () => {
    const result = validate(fixture({ 'implementation_plan.md': `# Plan\n\n### ${plannedChange} — DOCS — Reserve a change\n` }));
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Documentation cleanup validation passed:');
  });

  it('keeps change IDs out of every other current-state Markdown file', () => {
    const nestedPlan = ['docs', 'implementation_plan.md'].join('/');
    const policy = ['docs', 'POLICY.md'].join('/');
    for (const path of [nestedPlan, policy, 'AGENTS.md']) {
      const result = validate(fixture({ [path]: `# Current state\n\nChanged by ${plannedChange}.\n` }));
      expect(result.status, path).toBe(1);
      expect(result.stderr, path).toContain(`${path}: current-state Markdown contains concrete change narration ${plannedChange}`);
    }
  });
});
