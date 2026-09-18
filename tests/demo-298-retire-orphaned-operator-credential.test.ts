import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { recordsResponse } from '../src/api/records';
import { createDemoAccessToken, type IdentitySession } from '../src/lib/identity-session';
import type { D1Database, Env } from '../src/types';

function environment(): Env {
  const rows: Array<{ id: number; namespace: string; record_key: string; value_json: string; created_at: string; updated_at: string }> = [];
  let nextId = 1;
  const db: D1Database = {
    prepare(sql: string) {
      let values: unknown[] = [];
      return {
        bind(...bound: unknown[]) { values = bound; return this; },
        async run() {
          if (sql.includes('INSERT INTO demo_records')) {
            const row = { id: nextId++, namespace: String(values[0]), record_key: String(values[1]), value_json: String(values[2]), created_at: String(values[3]), updated_at: String(values[4]) };
            const existing = rows.find((candidate) => candidate.namespace === row.namespace && candidate.record_key === row.record_key);
            if (existing) Object.assign(existing, row, { id: existing.id, created_at: existing.created_at });
            else rows.push(row);
            return { meta: { last_row_id: row.id, changes: 1 } };
          }
          return { meta: { last_row_id: nextId++, changes: 1 } };
        },
        async all<T>() {
          if (sql.includes('FROM demo_records WHERE namespace = ? AND record_key = ?')) return { results: rows.filter((row) => row.namespace === String(values[0]) && row.record_key === String(values[1])) as T[] };
          if (sql.includes('FROM demo_records WHERE namespace = ? ORDER BY')) return { results: rows.filter((row) => row.namespace === String(values[0])) as T[] };
          return { results: [] as T[] };
        },
      };
    },
  };
  return { DEMO_DB: db, GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main', IDENTITY_SESSION_SECRET: 's'.repeat(32), IDENTITY_AUDIT_HMAC_SECRET: 'a'.repeat(32) };
}

function session(): IdentitySession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3_600_000).toISOString();
  return {
    identity: { provider: 'microsoft', protocol: 'oidc', subject: 'demo-298-subject', displayName: 'Demo 298', assurance: 'mfa', role: 'viewer', authenticatedAt: now.toISOString(), expiresAt },
    providerPayloadLabel: 'Validated ID token claims',
    providerPayload: { sub: 'demo-298-subject' },
    validation: [{ key: 'signature', label: 'Signature', status: 'valid', detail: 'Verified.' }],
    protocol: { name: 'OpenID Connect', steps: ['Validated'] },
    issuedAt: now.toISOString(),
    expiresAt,
  };
}

describe('DEMO-298 orphaned operator credential retirement', () => {
  it('removes the unreachable namespace fallback and stale operator bearer policy text', () => {
    const records = fs.readFileSync('src/api/records.ts', 'utf8');
    const identity = fs.readFileSync('src/api/identity.ts', 'utf8');
    const security = fs.readFileSync('SECURITY.md', 'utf8');
    const access = fs.readFileSync('docs/governance/ASSET-ACCESS-ACCEPTABLE-USE.md', 'utf8');
    expect(records).not.toContain("return identifier(requested, 'namespace'");
    expect(identity).not.toContain('managed operator credential');
    expect(security).not.toContain('managed operator bearer credential');
    expect(access).not.toContain('managed operator bearer credentials');
  });

  it('keeps anonymous reads public and visitor bearer writes inside the server-derived sandbox', async () => {
    const env = environment();
    const publicRead = await recordsResponse(new Request('https://demo.example/api/labs/rest-records?namespace=requested-namespace'), env);
    expect(publicRead.status).toBe(200);
    expect(await publicRead.json()).toMatchObject({ authorization: { scope: 'public' } });

    const { token, claims } = await createDemoAccessToken(env, session());
    const write = await recordsResponse(new Request('https://demo.example/api/labs/rest-records', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ namespace: 'requested-namespace', key: 'demo-298', value: { ok: true } }),
    }), env);
    expect(write.status).toBe(201);
    expect(await write.json()).toMatchObject({ namespace: claims.namespace, authorization: { scope: 'visitor-sandbox' } });
    expect(claims.namespace).not.toBe('requested-namespace');
  });
});
