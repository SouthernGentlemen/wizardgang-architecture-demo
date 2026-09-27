import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
const lines = workflow.split('\n');
function job(name) {
  const start = lines.findIndex((line) => line === `  ${name}:`);
  if (start < 0) return '';
  const end = lines.findIndex((line, index) => index > start && /^  [a-z0-9-]+:$/.test(line));
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
}

describe('DEMO-379 distinct required security and secrets statuses', () => {
  it('runs all four named jobs on pull requests and main', () => {
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('branches: [main]');
    for (const name of ['validate', 'change-id', 'security', 'secrets']) {
      expect(job(name), `${name} job`).not.toBe('');
    }
    expect(workflow).toMatch(/permissions:\n  contents: read/);
  });

  it('pins both new jobs to the exact head and their existing security commands', () => {
    const security = job('security');
    const secrets = job('secrets');
    for (const source of [security, secrets]) {
      expect(source).toContain('ref: ${{ github.event.pull_request.head.sha || github.sha }}');
      expect(source).toContain('node-version-file: .node-version');
      expect(source).toContain('npm install --global npm@12.1.0');
    }
    expect(security).toContain('run: npm ci');
    expect(security).toContain('run: npm run audit:dependencies');
    expect(secrets).toContain('fetch-depth: 0');
    expect(secrets).toContain('run: npm run validate:security');
    expect(secrets).toContain('run: npm run validate:worker-secrets');
  });
});
