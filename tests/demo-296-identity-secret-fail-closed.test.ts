import { describe, expect, it } from 'vitest';
import { healthResponse } from '../src/api/operations';
import { createIdentitySession, type IdentitySession } from '../src/lib/identity-session';
import { identityRouteCapability } from '../src/interfaces/route-capabilities/identity';
import { routeRequest } from '../src/router';
import type { D1Database, Env } from '../src/types';

function captureDb() {
  const sessions = new Map<string, { payload: string; expiresAt: string; revokedAt: string | null }>();
  const state = { revokedSessions: 0, identityAuditWrites: 0, nextId: 1 };

  const db: D1Database = {
    prepare(sql: string) {
      let values: unknown[] = [];
      return {
        bind(...bound: unknown[]) { values = bound; return this; },
        async run() {
          if (sql.includes('INSERT INTO identity_sessions')) {
            sessions.set(String(values[0]), { payload: String(values[1]), expiresAt: String(values[3]), revokedAt: null });
          } else if (sql.includes('UPDATE identity_sessions')) {
            const row = sessions.get(String(values[1]));
            if (row && !row.revokedAt) {
              row.revokedAt = String(values[0]);
              state.revokedSessions += 1;
            }
          } else if (sql.includes('INSERT INTO demo_events') || sql.includes('INSERT INTO application_logs')) {
            state.identityAuditWrites += 1;
          }
          return { meta: { last_row_id: state.nextId++, changes: 1 } };
        },
        async all<T>() {
          if (sql.includes('FROM demo_control')) {
            return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-17T00:00:00.000Z', updated_by: 'test' }] as T[] };
          }
          if (sql.includes('FROM crawler_control')) {
            return { results: [{ state: 'enabled', updated_at: '2026-09-17T00:00:00.000Z', updated_by: 'test' }] as T[] };
          }
          if (sql.trim() === 'SELECT 1') return { results: [{ 1: 1 }] as T[] };
          if (sql.includes('FROM identity_sessions')) {
            const row = sessions.get(String(values[0]));
            const results = row && !row.revokedAt && row.expiresAt > String(values[1])
              ? [{ payload_ciphertext: row.payload, expires_at: row.expiresAt }]
              : [];
            return { results: results as T[] };
          }
          return { results: [] as T[] };
        },
      };
    },
  };

  return { db, state };
}

function environment(db: D1Database, overrides: Partial<Env> = {}): Env {
  return {
    DEMO_DB: db,
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    IDENTITY_SESSION_SECRET: 's'.repeat(32),
    IDENTITY_AUDIT_HMAC_SECRET: 'a'.repeat(32),
    ...overrides,
  };
}

function session(): IdentitySession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3_600_000).toISOString();
  return {
    identity: {
      provider: 'microsoft',
      protocol: 'oidc',
      subject: 'stable-subject',
      displayName: 'Ada Lovelace',
      assurance: 'mfa',
      role: 'operator',
      authenticatedAt: now.toISOString(),
      expiresAt,
    },
    providerPayloadLabel: 'Validated ID token claims',
    providerPayload: { sub: 'stable-subject' },
    validation: [{ key: 'signature', label: 'Signature', status: 'valid', detail: 'Verified.' }],
    protocol: { name: 'OpenID Connect', steps: ['Validated'] },
    issuedAt: now.toISOString(),
    expiresAt,
  };
}

const secretFailures: Array<{ label: string; overrides: Partial<Env> }> = [
  { label: 'session secret missing', overrides: { IDENTITY_SESSION_SECRET: undefined } },
  { label: 'session secret too short', overrides: { IDENTITY_SESSION_SECRET: 's'.repeat(31) } },
  { label: 'audit secret missing', overrides: { IDENTITY_AUDIT_HMAC_SECRET: undefined } },
  { label: 'audit secret too short', overrides: { IDENTITY_AUDIT_HMAC_SECRET: 'a'.repeat(31) } },
];

function endpointRequest(pattern: string, method: string): Request {
  const headers = new Headers({ accept: 'application/json' });
  if (method !== 'GET') headers.set('origin', 'https://demo.example');
  return new Request('https://demo.example' + pattern, { method, headers });
}

describe('DEMO-296 identity secret fail-closed behavior', () => {
  for (const scenario of secretFailures) {
    it('returns a controlled 503 from every identity endpoint when the ' + scenario.label, async () => {
      const capture = captureDb();
      const env = environment(capture.db, scenario.overrides);

      for (const route of identityRouteCapability.routes) {
        const method = route.methods[0];
        const response = await routeRequest(endpointRequest(route.pattern, method), env);
        expect(response.status, route.id).toBe(503);
        expect(response.headers.get('content-type'), route.id).toContain('application/json');
        expect(response.headers.get('cache-control'), route.id).toBe('no-store');
        expect(await response.json(), route.id).toEqual({ error: 'identity_not_configured' });

        if (route.id === 'interfaces.identity.logout') {
          expect(response.headers.get('set-cookie'), route.id).toContain('Max-Age=0');
        }
      }
    });
  }

  it('preserves configured SAML metadata public caching through the response-owned route policy', async () => {
    const capture = captureDb();
    const response = await routeRequest(
      new Request('https://demo.example/auth/saml/metadata', { headers: { accept: 'application/samlmetadata+xml' } }),
      environment(capture.db),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('samlmetadata+xml');
    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it('keeps configured session and logout responses no-store under response-owned cache policy', async () => {
    const capture = captureDb();
    const env = environment(capture.db);

    const sessionResponse = await routeRequest(
      new Request('https://demo.example/auth/session', { headers: { accept: 'application/json' } }),
      env,
    );
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.headers.get('cache-control')).toBe('no-store');

    const logoutResponse = await routeRequest(new Request('https://demo.example/auth/logout', {
      method: 'POST',
      headers: { origin: 'https://demo.example', accept: 'application/json' },
    }), env);
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers.get('cache-control')).toBe('no-store');
    expect(logoutResponse.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  for (const auditSecret of [undefined, 'a'.repeat(31)]) {
    it('revokes and clears sign-out when the audit prerequisite is unavailable', async () => {
      const capture = captureDb();
      const env = environment(capture.db, { IDENTITY_AUDIT_HMAC_SECRET: auditSecret });
      const cookie = (await createIdentitySession(env, session())).split(';')[0];
      const response = await routeRequest(new Request('https://demo.example/auth/logout', {
        method: 'POST',
        headers: { origin: 'https://demo.example', cookie, accept: 'application/json' },
      }), env);

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: 'identity_not_configured' });
      expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
      expect(capture.state.revokedSessions).toBe(1);
      expect(capture.state.identityAuditWrites).toBe(0);
    });
  }

  it('reports public-safe identity readiness without changing health status semantics', async () => {
    const readyCapture = captureDb();
    const ready = await healthResponse(environment(readyCapture.db));
    expect(ready.status).toBe(200);
    expect(await ready.json()).toMatchObject({ status: 'operational', identity: 'ready' });

    for (const scenario of secretFailures) {
      const capture = captureDb();
      const response = await healthResponse(environment(capture.db, scenario.overrides));
      expect(response.status, scenario.label).toBe(200);
      const body = await response.json() as Record<string, unknown>;
      expect(body, scenario.label).toMatchObject({ status: 'operational', identity: 'not-configured' });
      expect(JSON.stringify(body).toLowerCase(), scenario.label).not.toContain('secret');
    }
  });
});
