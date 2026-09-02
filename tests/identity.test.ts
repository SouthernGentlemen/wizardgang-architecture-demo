import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authorizationDecisionResponse, demoAccessTokenResponse, identityProviderConfiguration, identitySessionResponse, oauthPkceResponse, providerCallbackResponse, providerStartResponse, samlMetadataResponse, ssoBoundaryResponse } from '../src/api/identity';
import { createIdentitySession, writeFlowCookie, type IdentitySession } from '../src/lib/identity-session';
import type { D1Database, Env } from '../src/types';

function memoryDb(): D1Database {
  let nextId = 1;
  const sessions = new Map<string, { payload: string; expiresAt: string; revokedAt: string | null }>();
  return {
    prepare(sql: string) {
      let values: unknown[] = [];
      return {
        bind(...bound: unknown[]) { values = bound; return this; },
        async run() {
          if (sql.includes('INSERT INTO identity_sessions')) sessions.set(String(values[0]), { payload: String(values[1]), expiresAt: String(values[3]), revokedAt: null });
          if (sql.includes('UPDATE identity_sessions')) {
            const row = sessions.get(String(values[1]));
            if (row) row.revokedAt = String(values[0]);
          }
          return { meta: { last_row_id: nextId++, changes: 1 } };
        },
        async all<T>() {
          if (sql.includes('FROM identity_sessions')) {
            const row = sessions.get(String(values[0]));
            const results = row && !row.revokedAt && row.expiresAt > String(values[1]) ? [{ payload_ciphertext: row.payload, expires_at: row.expiresAt }] : [];
            return { results: results as T[] };
          }
          return { results: [] as T[] };
        },
      };
    },
  };
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    DEMO_DB: memoryDb(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    ...overrides,
  };
}

function authenticatedSession(): IdentitySession {
  const now = new Date();
  return {
    identity: {
      provider: 'microsoft', protocol: 'oidc', subject: 'stable-subject', email: 'ada@example.test', emailVerified: true,
      displayName: 'Ada Lovelace', assurance: 'mfa', role: 'operator', authenticatedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 3_600_000).toISOString(),
    },
    providerPayloadLabel: 'Validated ID token claims',
    providerPayload: { iss: 'https://login.microsoftonline.com/tenant/v2.0', sub: 'stable-subject' },
    validation: [{ key: 'signature', label: 'Signature', status: 'valid', detail: 'Verified.' }],
    protocol: { name: 'OpenID Connect', steps: ['Validated'] },
    issuedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 3_600_000).toISOString(),
  };
}

describe('identity protocol boundaries', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps PKCE verifier, state, and nonce material out of the browser response', async () => {
    const response = await oauthPkceResponse(new Request('https://demo.example/__api/identity/oauth-pkce', { method: 'POST' }), env());
    const body = await response.json() as Record<string, unknown>;
    expect(body).toMatchObject({ pkce: 'S256', secretsExposed: false });
    expect(body.verifier).toBe('retained in an encrypted HttpOnly flow cookie');
    expect(JSON.stringify(body)).not.toMatch(/[A-Za-z0-9_-]{43,}/);
  });

  it('requires a real application session before evaluating authorization', async () => {
    const response = await authorizationDecisionResponse(new Request('https://demo.example/__api/identity/authorize', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requestedAction: 'demo:read' }),
    }), env());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'authentication_required' });
  });

  it('evaluates the normalized session role and assurance without accepting a caller-supplied identity', async () => {
    const environment = env({ IDENTITY_SESSION_SECRET: 'a-test-secret-that-is-at-least-thirty-two-characters' });
    const setCookie = await createIdentitySession(environment, authenticatedSession());
    const cookie = setCookie.split(';')[0];
    const decide = (action: string) => authorizationDecisionResponse(new Request('https://demo.example/__api/identity/authorize', {
      method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: 'https://demo.example' }, body: JSON.stringify({ authentication: { role: 'viewer' }, requestedAction: action }),
    }), environment);
    const write = await decide('demo:write');
    expect(write.status).toBe(200);
    expect(await write.json()).toMatchObject({ authorization: { decision: 'allow' }, identity: { role: 'operator', assurance: 'mfa' } });
    const session = await identitySessionResponse(new Request('https://demo.example/identity/session', { headers: { cookie } }), environment);
    expect(await session.json()).toMatchObject({ authenticated: true, session: { identity: { subject: 'stable-subject' } } });
  });

  it('issues a ten-minute token with a server-derived visitor sandbox', async () => {
    const environment = env({ IDENTITY_SESSION_SECRET: 'a-test-secret-that-is-at-least-thirty-two-characters' });
    const cookie = (await createIdentitySession(environment, authenticatedSession())).split(';')[0];
    const response = await demoAccessTokenResponse(new Request('https://demo.example/__api/identity/token', {
      method: 'POST', headers: { cookie, origin: 'https://demo.example' },
    }), environment);
    expect(response.status).toBe(200);
    const body = await response.json() as { accessToken: string; namespace: string; permissions: string[]; expiresAt: string };
    expect(body.accessToken).toMatch(/^v1\./);
    expect(body.namespace).toMatch(/^sandbox-[0-9a-f]{24}$/);
    expect(body.permissions).toEqual(['demo:read', 'demo:write']);
    expect(Date.parse(body.expiresAt) - Date.now()).toBeLessThanOrEqual(10 * 60_000);
  });

  it('requires the application origin for authenticated authorization requests', async () => {
    const environment = env({ IDENTITY_SESSION_SECRET: 'a-test-secret-that-is-at-least-thirty-two-characters' });
    const cookie = (await createIdentitySession(environment, authenticatedSession())).split(';')[0];
    const request = (origin?: string) => authorizationDecisionResponse(new Request('https://demo.example/__api/identity/authorize', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, ...(origin ? { origin } : {}) },
      body: JSON.stringify({ requestedAction: 'demo:read' }),
    }), environment);
    expect((await request()).status).toBe(403);
    expect((await request('https://attacker.example')).status).toBe(403);
  });

  it('fails closed on a tampered application-session cookie', async () => {
    const environment = env({ IDENTITY_SESSION_SECRET: 'a-test-secret-that-is-at-least-thirty-two-characters' });
    const setCookie = await createIdentitySession(environment, authenticatedSession());
    const cookie = `${setCookie.split(';')[0]}tampered`;
    const response = await identitySessionResponse(new Request('https://demo.example/identity/session', { headers: { cookie } }), environment);
    expect(await response.json()).toMatchObject({ authenticated: false });
  });

  it('reports provider configuration without exposing configured values', () => {
    const configuration = identityProviderConfiguration(env({
      IDENTITY_SESSION_SECRET: 'a-test-secret-that-is-at-least-thirty-two-characters',
      MICROSOFT_CLIENT_ID: 'client-id', MICROSOFT_CLIENT_SECRET: 'client-secret', MICROSOFT_TENANT_ID: 'tenant-id',
    }));
    expect(configuration.microsoft.configured).toBe(true);
    expect(configuration.saml.configured).toBe(false);
    expect(JSON.stringify(configuration)).not.toContain('client-secret');
  });

  it('redirects an unconfigured provider start back to the identity console', async () => {
    const response = await providerStartResponse(new Request('https://demo.example/identity/google'), env(), 'google');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://demo.example/identity?error=provider_unconfigured&provider=google');
  });

  it('validates a Google ID token against discovery and JWKS before creating the application session', async () => {
    const environment = env({
      IDENTITY_SESSION_SECRET: 'a-test-secret-that-is-at-least-thirty-two-characters',
      GOOGLE_CLIENT_ID: 'google-client-id', GOOGLE_CLIENT_SECRET: 'google-client-secret',
    });
    const flow = { provider: 'google' as const, state: 'browser-state', nonce: 'oidc-nonce', verifier: 'pkce-verifier', startedAt: Date.now() };
    const flowCookie = (await writeFlowCookie(environment, flow)).split(';')[0];
    const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
    const publicJwk = await exportJWK(publicKey);
    const now = Math.floor(Date.now() / 1000);
    const idToken = await new SignJWT({ nonce: flow.nonce, email: 'ada@gmail.com', email_verified: true, name: 'Ada Lovelace' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer('https://accounts.google.com')
      .setAudience('google-client-id')
      .setSubject('google-stable-subject')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.endsWith('/.well-known/openid-configuration')) return new Response(JSON.stringify({ issuer: 'https://accounts.google.com', authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth', token_endpoint: 'https://oauth2.googleapis.com/token', jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs' }));
      if (url === 'https://oauth2.googleapis.com/token') return new Response(JSON.stringify({ id_token: idToken, access_token: 'provider-access-token' }));
      if (url === 'https://www.googleapis.com/oauth2/v3/certs') return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: 'test-key', alg: 'RS256', use: 'sig' }] }), { headers: { 'content-type': 'application/json' } });
      return new Response(null, { status: 404 });
    }));
    const callback = await providerCallbackResponse(new Request('https://demo.example/identity/google/callback?state=browser-state&code=one-time-code', { headers: { cookie: flowCookie } }), environment, 'google');
    expect(callback.status).toBe(303);
    expect(callback.headers.get('location')).toBe('https://demo.example/identity?authenticated=google');
    const sessionCookie = callback.headers.get('set-cookie')?.match(/__Host-wg_identity=([^;,]+)/)?.[1];
    expect(sessionCookie).toBeTruthy();
    const sessionResponse = await identitySessionResponse(new Request('https://demo.example/identity/session', { headers: { cookie: `__Host-wg_identity=${sessionCookie}` } }), environment);
    const body = await sessionResponse.json() as Record<string, unknown>;
    expect(body).toMatchObject({ authenticated: true, session: { identity: { provider: 'google', subject: 'google-stable-subject', emailVerified: true }, providerPayload: { sub: 'google-stable-subject' } } });
    expect(JSON.stringify(body)).not.toContain('provider-access-token');
    expect(JSON.stringify(body)).not.toContain(idToken);
  });

  it('uses the immutable GitHub numeric ID and discards the OAuth access credential', async () => {
    const environment = env({
      IDENTITY_SESSION_SECRET: 'a-test-secret-that-is-at-least-thirty-two-characters',
      GITHUB_CLIENT_ID: 'github-client-id', GITHUB_CLIENT_SECRET: 'github-client-secret',
    });
    const flow = { provider: 'github' as const, state: 'github-state', verifier: 'github-pkce-verifier', startedAt: Date.now() };
    const flowCookie = (await writeFlowCookie(environment, flow)).split(';')[0];
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url === 'https://github.com/login/oauth/access_token') return new Response(JSON.stringify({ access_token: 'github-provider-access-token', token_type: 'bearer' }));
      if (url === 'https://api.github.com/user') return new Response(JSON.stringify({ id: 12345678, login: 'ada-dev', name: 'Ada Lovelace', email: null, avatar_url: 'https://avatars.githubusercontent.com/u/12345678', type: 'User' }));
      if (url === 'https://api.github.com/user/emails') return new Response(JSON.stringify([{ email: 'ada@example.test', primary: true, verified: true }]));
      return new Response(null, { status: 404 });
    }));
    const callback = await providerCallbackResponse(new Request('https://demo.example/identity/github/callback?state=github-state&code=one-time-code', { headers: { cookie: flowCookie } }), environment, 'github');
    expect(callback.headers.get('location')).toBe('https://demo.example/identity?authenticated=github');
    const sessionCookie = callback.headers.get('set-cookie')?.match(/__Host-wg_identity=([^;,]+)/)?.[1];
    const response = await identitySessionResponse(new Request('https://demo.example/identity/session', { headers: { cookie: `__Host-wg_identity=${sessionCookie}` } }), environment);
    const body = await response.json() as Record<string, unknown>;
    expect(body).toMatchObject({ authenticated: true, session: { identity: { subject: 'github:12345678', email: 'ada@example.test', emailVerified: true, role: 'viewer' }, providerPayloadLabel: 'GitHub API identity' } });
    expect(JSON.stringify(body)).not.toContain('github-provider-access-token');
  });

  it('serves origin-specific Entra SAML metadata and an explicit trust boundary', async () => {
    const metadata = samlMetadataResponse(new Request('https://demo.example/identity/saml/metadata'));
    const xml = await metadata.text();
    expect(metadata.headers.get('content-type')).toContain('samlmetadata+xml');
    expect(xml).toContain('https://demo.example/identity/saml/acs');
    expect(xml).toContain('WantAssertionsSigned="true"');
    expect(await (await ssoBoundaryResponse(new Request('https://demo.example/__api/identity/sso'), env())).json()).toMatchObject({ authentication: { provider: 'Microsoft Entra ID' } });
  });
});
