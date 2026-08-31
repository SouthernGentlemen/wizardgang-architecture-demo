import { describe, expect, it } from 'vitest';
import { authorizationDecisionResponse, oauthPkceResponse, samlMetadataResponse, ssoBoundaryResponse } from '../src/api/identity';
import type { Env } from '../src/types';

function env(): Env {
  let nextId = 1;
  return {
    DEMO_DB: { prepare: () => ({ bind() { return this; }, async run() { return { meta: { last_row_id: nextId++ } }; }, async all<T>() { return { results: [] as T[] }; } }) },
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

describe('identity protocol boundaries', () => {
  it('generates fresh OAuth PKCE S256 material and state', async () => {
    const first = await oauthPkceResponse(new Request('https://demo.example/__api/identity/oauth-pkce', { method: 'POST' }), env());
    const second = await oauthPkceResponse(new Request('https://demo.example/__api/identity/oauth-pkce', { method: 'POST' }), env());
    const a = await first.json() as { verifier: string; challenge: string; state: string; challengeMethod: string };
    const b = await second.json() as typeof a;
    expect(a.challengeMethod).toBe('S256');
    expect(a.verifier).not.toBe(a.challenge);
    expect(a.state).not.toBe(b.state);
    expect(a.verifier).not.toBe(b.verifier);
  });

  it('evaluates authorization independently from the supplied authentication context', async () => {
    const decide = (role: string, assurance: string) => authorizationDecisionResponse(new Request('https://demo.example/__api/identity/authorize', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ authentication: { subject: 'ada@example.test', role, assurance }, requestedAction: 'demo:write' }),
    }), env());
    const allowed = await decide('operator', 'mfa');
    const denied = await decide('operator', 'single-factor');
    expect(allowed.status).toBe(200);
    expect(denied.status).toBe(403);
    expect(await denied.json()).toMatchObject({ authorization: { decision: 'deny' } });
  });

  it('serves provider-neutral SAML metadata and reports SSO as unconfigured', async () => {
    const metadata = samlMetadataResponse(new Request('https://demo.example/identity/saml/metadata'));
    expect(metadata.headers.get('content-type')).toContain('samlmetadata+xml');
    expect(await metadata.text()).toContain('AssertionConsumerService');
    expect(await (await ssoBoundaryResponse(new Request('https://demo.example/__api/identity/sso'))).json()).toMatchObject({ configured: false });
  });
});
