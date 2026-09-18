import { describe, expect, it } from 'vitest';
import { authorizationDecisionResponse, demoAccessTokenResponse, identitySessionResponse } from '../src/api/identity';
import { logsResponse } from '../src/api/operations';
import { recentDemoEvents } from '../src/lib/audit';
import {
  createIdentitySession,
  identitySandboxNamespace,
  identitySubjectAuditId,
  sha256,
  type IdentitySession,
} from '../src/lib/identity-session';
import type { ApplicationLogRow } from '../src/lib/logs';
import type { D1Database, Env } from '../src/types';

interface EventRow {
  id: number;
  demo_id: string;
  event_type: string;
  payload_json: string | null;
  created_at: string;
}

function captureDb() {
  let nextId = 1;
  const sessions = new Map<string, { payload: string; expiresAt: string; revokedAt: string | null }>();
  const events: EventRow[] = [];
  const logs: ApplicationLogRow[] = [];

  const db: D1Database = {
    prepare(sql: string) {
      let values: unknown[] = [];
      return {
        bind(...bound: unknown[]) { values = bound; return this; },
        async run() {
          const id = nextId++;
          if (sql.includes('INSERT INTO identity_sessions')) {
            sessions.set(String(values[0]), { payload: String(values[1]), expiresAt: String(values[3]), revokedAt: null });
          } else if (sql.includes('UPDATE identity_sessions')) {
            const row = sessions.get(String(values[1]));
            if (row) row.revokedAt = String(values[0]);
          } else if (sql.includes('INSERT INTO demo_events')) {
            events.unshift({
              id,
              demo_id: String(values[0]),
              event_type: String(values[1]),
              payload_json: values[2] === null ? null : String(values[2]),
              created_at: String(values[3]),
            });
          } else if (sql.includes('INSERT INTO application_logs')) {
            logs.unshift({
              id,
              level: values[0] as ApplicationLogRow['level'],
              source: String(values[1]),
              event_key: String(values[2]),
              message: String(values[3]),
              route: values[4] === null ? null : String(values[4]),
              request_id: values[5] === null ? null : String(values[5]),
              detail_json: values[6] === null ? null : String(values[6]),
              created_at: String(values[7]),
            });
          }
          return { meta: { last_row_id: id, changes: 1 } };
        },
        async all<T>() {
          if (sql.includes('FROM identity_sessions')) {
            const row = sessions.get(String(values[0]));
            const result = row && !row.revokedAt && row.expiresAt > String(values[1])
              ? [{ payload_ciphertext: row.payload, expires_at: row.expiresAt }]
              : [];
            return { results: result as T[] };
          }
          if (sql.includes('FROM application_logs')) return { results: logs as T[] };
          if (sql.includes('FROM demo_events')) return { results: events as T[] };
          return { results: [] as T[] };
        },
      };
    },
  };

  return { db, events, logs };
}

function environment(db: D1Database, auditSecret = 'identity-audit-test-secret-that-is-at-least-thirty-two-characters'): Env {
  return {
    DEMO_DB: db,
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    IDENTITY_SESSION_SECRET: 'identity-session-test-secret-that-is-at-least-thirty-two-characters',
    IDENTITY_AUDIT_HMAC_SECRET: auditSecret,
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
      email: 'ada@example.test',
      emailVerified: true,
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

describe('DEMO-291 identity audit value hardening', () => {
  it('stores a keyed audit identifier and withholds identity detail from public projections', async () => {
    const capture = captureDb();
    const env = environment(capture.db);
    const cookie = (await createIdentitySession(env, session())).split(';')[0];

    const response = await authorizationDecisionResponse(new Request('https://demo.example/auth/authorize', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: 'https://demo.example' },
      body: JSON.stringify({ requestedAction: 'demo:write' }),
    }), env);
    expect(response.status).toBe(200);

    const auditId = await identitySubjectAuditId(env, 'microsoft', 'stable-subject');
    const legacyDigest = await sha256('microsoft:stable-subject');
    const event = capture.events.find((row) => row.event_type === 'identity.authorization_allowed');
    expect(event).toBeTruthy();
    const payload = JSON.parse(String(event?.payload_json)) as Record<string, unknown>;
    expect(payload.subjectAuditId).toBe(auditId);
    expect(payload.subjectAuditId).not.toBe(legacyDigest);
    expect(JSON.stringify(payload)).not.toContain('stable-subject');
    expect(payload).not.toHaveProperty('subjectSha256');

    const storedLog = capture.logs.find((row) => row.event_key === 'identity.authorization_allowed');
    expect(storedLog).toBeTruthy();
    expect(String(storedLog?.detail_json)).not.toContain(auditId);
    expect(String(storedLog?.detail_json)).not.toContain('stable-subject');
    expect(String(storedLog?.detail_json)).not.toContain('subjectSha256');

    const publicLogs = await logsResponse(new Request('https://demo.example/api/operations/logs?source=identity'), env);
    const publicLogBody = await publicLogs.json() as { results: ApplicationLogRow[] };
    expect(publicLogBody.results).not.toHaveLength(0);
    expect(publicLogBody.results.every((row) => row.detail_json === null)).toBe(true);
    expect(JSON.stringify(publicLogBody)).not.toContain(auditId);
    expect(JSON.stringify(publicLogBody)).not.toContain('stable-subject');

    const publicEvents = await recentDemoEvents(env, 20) as Array<Record<string, unknown>>;
    const identityEvents = publicEvents.filter((row) => row.demo_id === 'identity');
    expect(identityEvents).not.toHaveLength(0);
    expect(identityEvents.every((row) => row.payload_json === null)).toBe(true);
    expect(JSON.stringify(identityEvents)).not.toContain(auditId);
  });

  it('derives visitor sandboxes from the keyed namespace purpose and stores no derived value in application logs', async () => {
    const capture = captureDb();
    const env = environment(capture.db);
    const currentSession = session();
    const cookie = (await createIdentitySession(env, currentSession)).split(';')[0];

    const response = await demoAccessTokenResponse(new Request('https://demo.example/auth/token', {
      method: 'POST',
      headers: { cookie, origin: 'https://demo.example' },
    }), env);
    expect(response.status).toBe(200);
    const body = await response.json() as { namespace: string };
    const expected = await identitySandboxNamespace(env, 'microsoft', 'stable-subject');
    const legacy = `sandbox-${(await sha256('microsoft:stable-subject')).slice(0, 24)}`;
    expect(body.namespace).toBe(expected);
    expect(body.namespace).not.toBe(legacy);

    const otherEnv = environment(capture.db, 'a-different-identity-audit-secret-at-least-thirty-two-characters');
    expect(await identitySandboxNamespace(otherEnv, 'microsoft', 'stable-subject')).not.toBe(body.namespace);

    const tokenEvent = capture.events.find((row) => row.event_type === 'identity.demo_access_token_issued');
    const tokenPayload = JSON.parse(String(tokenEvent?.payload_json)) as Record<string, unknown>;
    expect(tokenPayload.namespace).toBe(body.namespace);
    expect(tokenPayload.subjectAuditId).toBe(await identitySubjectAuditId(env, 'microsoft', 'stable-subject'));

    const tokenLog = capture.logs.find((row) => row.event_key === 'identity.demo_access_token_issued');
    expect(String(tokenLog?.detail_json)).not.toContain(body.namespace);
    expect(String(tokenLog?.detail_json)).not.toContain(String(tokenPayload.subjectAuditId));
  });

  it('keeps existing encrypted identity sessions valid when the audit secret changes', async () => {
    const capture = captureDb();
    const original = environment(capture.db, 'original-identity-audit-secret-at-least-thirty-two-characters');
    const cookie = (await createIdentitySession(original, session())).split(';')[0];
    const rotated = environment(capture.db, 'replacement-identity-audit-secret-at-least-thirty-two-chars');

    const response = await identitySessionResponse(new Request('https://demo.example/auth/session', {
      headers: { cookie },
    }), rotated);
    expect(await response.json()).toMatchObject({
      authenticated: true,
      session: { identity: { provider: 'microsoft', subject: 'stable-subject' } },
    });
  });
});
