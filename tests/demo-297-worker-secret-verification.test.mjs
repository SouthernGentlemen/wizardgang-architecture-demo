import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const inventory = JSON.parse(fs.readFileSync('config/worker-secrets.json', 'utf8'));
const release = fs.readFileSync('.github/workflows/release.yml', 'utf8');
const wrangler = fs.readFileSync('wrangler.jsonc', 'utf8');

describe('DEMO-297 Worker secret verification', () => {
  it('keeps a value-free inventory aligned to the seven baseline demo Worker secrets', () => {
    const names = inventory.secrets.map((entry) => entry.name).sort();
    expect(names).toEqual([
      'CLOUDFLARE_BILLING_TOKEN',
      'DEMO_WEBHOOK_SECRET',
      'GITHUB_APP_PRIVATE_KEY',
      'GITHUB_OAUTH_CLIENT_SECRET',
      'GITHUB_WEBHOOK_SECRET',
      'GOOGLE_OAUTH_CLIENT_SECRET',
      'MICROSOFT_OAUTH_CLIENT_SECRET',
    ]);
    for (const entry of inventory.secrets) {
      expect(entry).not.toHaveProperty('value');
      expect(entry).not.toHaveProperty('secret');
      expect(entry.minimumLength).toBeGreaterThan(0);
      expect(typeof entry.owner).toBe('string');
      expect(typeof entry.capability).toBe('string');
    }
    for (const retired of ['DEMO_ADMIN_USER', 'DEMO_ADMIN_PASSWORD', 'WG_SESSION_KEY', 'WG_OPS_TOKEN']) {
      expect(names).not.toContain(retired);
    }
  });

  it('uses the shared Secrets Store bindings and the pinned baseline deployment path', () => {
    expect(wrangler).toContain('"binding": "WG_OPS_TOKEN"');
    expect(wrangler).toContain('"binding": "WG_SESSION_KEY"');
    expect(release).toContain('uses: Wizard-Gang/baseline/.github/workflows/deploy-worker.yml@67b4b86847e0d635a3f6fe4c21618a25d5bc71a0');
    expect(release).toContain('worker: demo');
    expect(release).toContain('secrets: inherit');
    expect(fs.existsSync('.github/workflows/deploy.yml')).toBe(false);
  });

  it('executes the inventory parity validator across Env, local examples, SECURITY.md and the vendored registry', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-worker-secrets.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Worker secret names across inventory, Env, .dev.vars.example, and SECURITY.md');
  });
});
