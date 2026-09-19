import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('DEMO-319 current-state documentation cleanup acceptance', () => {
  it('runs the repository-wide documentation acceptance validator', () => {
    const output = execFileSync(process.execPath, ['scripts/validate-documentation-cleanup.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(output).toContain('Documentation cleanup validation passed:');
    expect(output).toContain('retired documentation remains absent');
  });

  it('keeps operating history while current documentation stays compact', () => {
    expect(existsSync('docs/history/DEPLOYMENTS.md')).toBe(true);
    expect(existsSync('docs/releases')).toBe(false);
    expect(existsSync('docs/governance/registers')).toBe(false);
    expect(existsSync('docs/governance/soa')).toBe(false);
    expect(existsSync('docs/governance/assessments')).toBe(false);

    const readme = readFileSync('README.md', 'utf8');
    expect(readme).toContain('## Start here');
    expect(readme).toContain('docs/governance/GOVERNANCE.md');
    expect(readme).not.toContain('docs/ROUTES.md');
  });

  it('keeps the validator in the default check path', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts['validate:documentation']).toBe('node scripts/validate-documentation-cleanup.mjs');
    expect(pkg.scripts.check).toContain('npm run validate:documentation');
  });
});
