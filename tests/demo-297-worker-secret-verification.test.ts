import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { forbiddenWorkerSecretVars, missingRequiredProvisionedWorkerSecrets, undeclaredProvisionedWorkerSecrets, workerSecretNameDifferences } from '../scripts/lib/worker-secret-inventory.ts';

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
    expect(release).toContain('uses: Wizard-Gang/baseline/.github/workflows/deploy-worker.yml@5e3847c8cf0072fa9698aa8e5e141f96e00d73bb');
    expect(release).toContain('worker: demo');
    expect(release).toContain('secrets: inherit');
    expect(fs.existsSync('.github/workflows/deploy.yml')).toBe(false);
  });

  it('rejects missing or undeclared Worker secret names in focused inventory fixtures', () => {
    const declared = ['DEMO_WEBHOOK_SECRET', 'GITHUB_WEBHOOK_SECRET'];
    expect(workerSecretNameDifferences(['DEMO_WEBHOOK_SECRET'], declared)).toEqual({
      missing: ['GITHUB_WEBHOOK_SECRET'],
      extra: [],
    });
    expect(workerSecretNameDifferences([...declared, 'EXTRA_SECRET'], declared)).toEqual({
      missing: [],
      extra: ['EXTRA_SECRET'],
    });
    expect(workerSecretNameDifferences([...declared].reverse(), declared)).toEqual({ missing: [], extra: [] });
  });

  it('rejects committed secrets in Worker vars across the inventory, registry and Secrets Store', () => {
    expect(forbiddenWorkerSecretVars(
      ['PUBLIC_CLIENT_ID', 'DEMO_WEBHOOK_SECRET', 'REGISTRY_ONLY', 'WG_OPS_TOKEN'],
      ['DEMO_WEBHOOK_SECRET'],
      ['REGISTRY_ONLY'],
      ['WG_OPS_TOKEN'],
    )).toEqual(['DEMO_WEBHOOK_SECRET', 'REGISTRY_ONLY', 'WG_OPS_TOKEN']);
    expect(forbiddenWorkerSecretVars(['PUBLIC_CLIENT_ID'], ['DEMO_WEBHOOK_SECRET'], [], ['WG_OPS_TOKEN'])).toEqual([]);
  });

  it('rejects missing required provisioned names while preserving optional and undeclared reporting', () => {
    const declared = ['REQUIRED_A', 'REQUIRED_B', 'OPTIONAL'];
    const required = ['REQUIRED_A', 'REQUIRED_B'];
    expect(missingRequiredProvisionedWorkerSecrets(['REQUIRED_A'], required)).toEqual(['REQUIRED_B']);
    expect(missingRequiredProvisionedWorkerSecrets(required, required)).toEqual([]);
    expect(undeclaredProvisionedWorkerSecrets(['REQUIRED_A', 'EXTRA'], declared)).toEqual(['EXTRA']);
    expect(undeclaredProvisionedWorkerSecrets(required, declared)).toEqual([]);
  });
});
