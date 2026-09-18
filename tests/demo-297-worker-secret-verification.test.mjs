import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const inventory = JSON.parse(fs.readFileSync('config/worker-secrets.json', 'utf8'));
const deploy = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
const provisioner = fs.readFileSync('scripts/provision-worker-secret.mjs', 'utf8');

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
    expect(deploy).toContain('wrangler secret list --json');
    expect(deploy).toContain('validate-worker-secrets.mjs --provisioned');
    expect(deploy).toContain('/auth/session');
    expect(deploy).toContain("baseline.identity === 'ready'");
    expect(deploy).toContain('regressedProviders');
  });

  it('provisions generated values only through wrangler stdin', () => {
    expect(provisioner).toContain("spawn(executable, ['wrangler', 'secret', 'put', name]");
    expect(provisioner).toContain("child.stdin.end(value + '\\n')");
    expect(provisioner).not.toContain('console.log(value)');
    expect(provisioner).not.toContain('process.stdout.write(value)');
  });
});
