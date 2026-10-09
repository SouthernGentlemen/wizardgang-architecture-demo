import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseJsonc } from '../platform/conformance/jsonc.mjs';
import { checkWranglerSource } from '../platform/conformance/wrangler.mjs';

const read = (file: string) => fs.readFileSync(file, 'utf8');
const ACCOUNT_ID_VAR = '--var "CLOUDFLARE_ACCOUNT_ID:$CLOUDFLARE_ACCOUNT_ID"';

describe('DEMO-482 Cloudflare usage reporting receives the account ID at deploy time', () => {
  it('deploys through the vendored deploy-worker.yml contract, which passes the account ID var', () => {
    expect(read('platform/deploy/README.md')).toContain(ACCOUNT_ID_VAR);
  });

  it('never commits the account ID, and conformance rejects a committed one', () => {
    const source = read('wrangler.jsonc');
    const config = parseJsonc(source) as { vars: Record<string, string> };
    expect(config.vars).not.toHaveProperty('CLOUDFLARE_ACCOUNT_ID');
    expect(config.vars.CLOUDFLARE_BILLABLE_USAGE).toBe('not-offered');
    expect(checkWranglerSource(source, 'demo')).toEqual([]);
    const committed = source.replace('"vars": {', '"vars": {\n    "CLOUDFLARE_ACCOUNT_ID": "0123456789abcdef0123456789abcdef",');
    expect(checkWranglerSource(committed, 'demo')).toContain('vars.CLOUDFLARE_ACCOUNT_ID is never committed; deploy-worker.yml passes it at deploy time');
  });

  it('keeps the billing token a Worker secret, the other half of the usage configuration', () => {
    expect(read('.dev.vars.example')).toMatch(/^# CLOUDFLARE_BILLING_TOKEN=/m);
    expect(read('src/lib/cloudflare-usage.ts')).toContain('Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_BILLING_TOKEN)');
  });
});
