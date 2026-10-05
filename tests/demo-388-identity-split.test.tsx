import { Window } from 'happy-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount as mountIdentity } from '../src/browser/identity';
import { demonstrations } from '../src/demos/demos-page';
import { identitySection, type IdentityDemo } from '../src/demos/identity-presentation';
import { routeRequest } from '../src/router';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

const env = {
  WG_DB: new SqliteD1(),
  GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

afterEach(() => vi.unstubAllGlobals());

describe('DEMO-388 focused Identity demos', () => {
  it('keeps three server-rendered presentations and the released category fragment', async () => {
    expect(demonstrations.filter((demo) => demo.category === 'Identity').map((demo) => demo.id)).toEqual(['oauth', 'sso', 'saml']);
    for (const locale of ['en', 'ar']) {
      for (const [id, actions] of [
        ['oauth', ['github']], ['sso', ['microsoft', 'google']], ['saml', ['saml']],
      ] as const) {
        const response = await routeRequest(new Request(`https://demo.wizardgang.ai/demos?${locale === 'ar' ? 'lang=ar&' : ''}demo=${id}#${id}`, { headers: { accept: 'text/html' } }), env);
        const html = await response.text();
        const window = new Window();
        try {
          window.document.documentElement.innerHTML = html;
          const document = window.document;
          const root = document.querySelector<HTMLElement>('[data-demo-panel] [data-demo-section]');
          expect(response.status, html.slice(0, 400)).toBe(200);
          expect(root, html.slice(0, 700)).not.toBeNull();
          expect(root?.dataset.demoSection).toBe(id);
          expect(document.querySelectorAll('[data-demo-selector-category="Identity"] a')).toHaveLength(3);
          expect(document.querySelector(`[data-demo-selector-category="Identity"] [aria-current="location"]`)?.getAttribute('href')).toContain(`demo=${id}#${id}`);
          expect([...root!.querySelectorAll<HTMLElement>('[data-provider-action]')].map((node) => node.dataset.providerAction)).toEqual(actions);
          expect(root?.querySelector('[data-identity-reset]')).not.toBeNull();
          expect(root?.querySelector('[data-provider-payload]')).not.toBeNull();
          expect(root?.querySelector('[data-authorize="demo:read"]')).not.toBeNull();
          expect(root?.querySelector('[data-authorize="demo:write"]')).not.toBeNull();
          expect(document.documentElement.dir).toBe(locale === 'ar' ? 'rtl' : 'ltr');
        } finally {
          await window.happyDOM.close();
        }
      }
      const response = await routeRequest(new Request(`https://demo.wizardgang.ai/demos${locale === 'ar' ? '?lang=ar' : ''}`, { headers: { accept: 'text/html' } }), env);
      const html = await response.text();
      expect(html).toContain(`id="identity" href="?${locale === 'ar' ? 'lang=ar&amp;' : ''}demo=oauth#identity"`);
      const legacy = await routeRequest(new Request(`https://demo.wizardgang.ai/demos?${locale === 'ar' ? 'lang=ar&' : ''}demo=identity#identity`, { headers: { accept: 'text/html' } }), env);
      expect(await legacy.text()).toContain('data-demo-section="oauth"');
    }
  });

  it('shows SAML configuration and metadata without a disabled sign-in dead end', () => {
    const unconfigured = identitySection(env, {}, 'saml').body;
    expect(unconfigured).toContain('An Entra enterprise application and signing certificate must be configured');
    expect(unconfigured).toContain('Not configured in this environment');
    expect(unconfigured).toContain('href="/auth/saml/metadata"');
    expect(unconfigured).toContain('data-provider-action="saml" hidden=""');
    const ready = identitySection({ ...env,
      WG_SESSION_KEY: 's'.repeat(32),
      MICROSOFT_TENANT_ID: 'tenant', SAML_IDP_CERT: 'certificate',
    }, {}, 'saml').body;
    expect(ready).toContain('data-provider-action="saml" href="/auth/saml"');
    expect(ready).not.toContain('data-provider-action="saml" hidden=""');
  });

  it.each([
    ['oauth', 'github'], ['sso', 'google'], ['saml', 'saml'],
  ] as const)('shows only the matching %s session, evaluates authorization, and resets it', async (demo, provider) => {
    const window = new Window({ url: `https://demo.wizardgang.ai/demos?demo=${demo}&authenticated=${provider}#${demo}` });
    window.document.body.innerHTML = identitySection(env, {}, demo as IdentityDemo).body;
    const root = window.document.querySelector<HTMLElement>('[data-demo-section]')!;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input) === '/auth/session') return new Response(JSON.stringify({ authenticated: true,
        providers: { [provider]: { configured: true } },
        session: {
          identity: { provider, protocol: demo, subject: 'visitor', displayName: 'Visitor', assurance: 'provider-authenticated', role: 'viewer' },
          providerPayloadLabel: 'Validated claims', providerPayload: { sub: 'visitor' },
          validation: [{ status: 'valid', label: 'Signature', detail: 'Verified' }],
          protocol: { name: demo, steps: ['Validated'] },
        },
      }));
      if (String(input) === '/auth/authorize') return new Response(JSON.stringify({ authorization: { decision: 'allow', policy: 'Visitor policy' } }));
      if (String(input) === '/auth/logout' && init?.method === 'POST') return new Response(JSON.stringify({ authenticated: false }));
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal('window', window);
    vi.stubGlobal('document', window.document);
    vi.stubGlobal('fetch', fetchMock);
    try {
      await mountIdentity(root);
      expect(root.querySelector<HTMLElement>('[data-identity-result]')?.hidden).toBe(false);
      expect(root.querySelector('[data-provider-payload]')?.textContent).toContain('visitor');
      root.querySelector<HTMLButtonElement>('[data-authorize="demo:read"]')?.click();
      await vi.waitFor(() => expect(root.querySelector('strong[data-decision]')?.textContent).toBe('ALLOW'));
      root.querySelector<HTMLButtonElement>('[data-identity-reset]')?.click();
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>('[data-identity-result]')?.hidden).toBe(true));
      expect(fetchMock).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }));
    } finally {
      await window.happyDOM.close();
    }
  });
});
