import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const inventory = JSON.parse(fs.readFileSync('config/worker-secrets.json', 'utf8'));
const deploy = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
const provisioner = fs.readFileSync('scripts/provision-worker-secret.mjs', 'utf8');
const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const wrangler = path.resolve('node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');

describe('DEMO-297 Worker secret verification', () => {
  it('keeps a value-free, unique inventory with the identity minimums required', () => {
    const names = inventory.secrets.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
    for (const entry of inventory.secrets) {
      expect(entry).not.toHaveProperty('value');
      expect(entry).not.toHaveProperty('secret');
      expect(entry.minimumLength).toBeGreaterThan(0);
      expect(typeof entry.owner).toBe('string');
      expect(typeof entry.capability).toBe('string');
    }
    for (const name of ['IDENTITY_SESSION_SECRET', 'IDENTITY_AUDIT_HMAC_SECRET']) {
      const entry = inventory.secrets.find((candidate) => candidate.name === name);
      expect(entry).toMatchObject({ required: true, minimumLength: 32 });
    }
  });

  it('runs name preflight before migrations and preserves pre/post identity continuity', () => {
    const preflight = deploy.indexOf('name: Verify production Worker secret names');
    const baseline = deploy.indexOf('name: Capture pre-deployment identity baseline');
    const migrations = deploy.indexOf('name: Apply production D1 migrations');
    const workerDeploy = deploy.indexOf('name: Deploy tagged Worker source');
    const verify = deploy.indexOf('name: Verify public version, health, and identity continuity');

    expect(preflight).toBeGreaterThan(-1);
    expect(baseline).toBeGreaterThan(preflight);
    expect(migrations).toBeGreaterThan(baseline);
    expect(workerDeploy).toBeGreaterThan(migrations);
    expect(verify).toBeGreaterThan(workerDeploy);
    expect(deploy).toContain('wrangler secret list --format json');
    expect(deploy).toContain('validate-worker-secrets.mjs --provisioned');
    expect(deploy).toContain('/auth/session');
    expect(deploy).toContain("baseline.identity === 'ready'");
    expect(deploy).toContain('regressedProviders');
  });

  it('executes the inventory parity validator across Env, local examples, and SECURITY.md', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-worker-secrets.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Worker secret names across inventory, Env, .dev.vars.example, and SECURITY.md');
  });

  it('uses the machine-readable flag supported by the locked Wrangler secret-list command', () => {
    expect(packageLock.packages['node_modules/wrangler']?.version).toBe('4.130.0');
    const help = spawnSync(wrangler, ['secret', 'list', '--help'], {
      encoding: 'utf8',
      env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
    });
    const output = `${help.stdout}\n${help.stderr}`;
    expect(help.status, output).toBe(0);
    expect(output).toMatch(/--format\b/);
    expect(output).not.toMatch(/--json\b/);

    const command = deploy.match(/npx wrangler secret list[^\n]*/)?.[0] ?? '';
    expect(command).toContain('--format json');
    expect(command).not.toMatch(/--json\b/);
  });

  it('provisions generated values only through wrangler stdin', () => {
    expect(provisioner).toContain("spawn(executable, ['wrangler', 'secret', 'put', name]");
    expect(provisioner).toContain("child.stdin.end(value + '\\n')");
    expect(provisioner).not.toContain('console.log(value)');
    expect(provisioner).not.toContain('process.stdout.write(value)');
  });
});
