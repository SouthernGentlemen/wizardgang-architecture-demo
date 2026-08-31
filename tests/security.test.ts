import { describe, expect, it } from 'vitest';
import { requireAdmin, requireSameOrigin } from '../src/lib/admin-auth';
import { getDemoControl } from '../src/lib/demo-control';
import { json, readJson } from '../src/lib/http';
import type { Env } from '../src/types';

const baseEnv = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_ADMIN_USER: 'operator',
  DEMO_ADMIN_PASSWORD: 'correct horse battery staple',
} as Env;

describe('admin boundary', () => {
  it('requires configured credentials and rejects an incorrect secret', async () => {
    const missing = await requireAdmin(new Request('https://demo.wizardgang.ai/admin'), { ...baseEnv, DEMO_ADMIN_PASSWORD: undefined });
    expect(missing).toBeInstanceOf(Response);
    expect((missing as Response).status).toBe(503);

    const invalid = await requireAdmin(new Request('https://demo.wizardgang.ai/admin', {
      headers: { authorization: `Basic ${btoa('operator:wrong')}` },
    }), baseEnv);
    expect(invalid).toBeInstanceOf(Response);
    expect((invalid as Response).status).toBe(401);
  });

  it('accepts exact credentials without exposing the password', async () => {
    const identity = await requireAdmin(new Request('https://demo.wizardgang.ai/admin', {
      headers: { authorization: `Basic ${btoa('operator:correct horse battery staple')}` },
    }), baseEnv);
    expect(identity).toEqual({ username: 'operator' });
  });

  it('requires an exact same-origin mutation', () => {
    const request = new Request('https://demo.wizardgang.ai/admin', {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
    });
    expect(requireSameOrigin(request)?.status).toBe(403);
    expect(requireSameOrigin(new Request('https://demo.wizardgang.ai/admin', {
      method: 'POST',
      headers: { origin: 'https://demo.wizardgang.ai' },
    }))).toBeNull();
  });
});

describe('safe HTTP and control defaults', () => {
  it('adds baseline security headers to JSON responses', () => {
    const response = json({ ok: true });
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });

  it('enforces JSON content type and bounded bodies', async () => {
    await expect(readJson(new Request('https://demo.wizardgang.ai/api', {
      method: 'POST',
      body: 'plain text',
      headers: { 'content-type': 'text/plain' },
    }))).rejects.toMatchObject({ status: 415 });
  });

  it('fails closed when the D1 control state cannot be read', async () => {
    const control = await getDemoControl({
      ...baseEnv,
      DEMO_DB: {
        prepare() {
          return { bind: () => { throw new Error('unused'); }, run: async () => { throw new Error('unavailable'); }, all: async () => { throw new Error('unavailable'); } };
        },
      },
    });
    expect(control.state).toBe('offline');
    expect(control.publicMessage).toContain('unavailable');
  });
});
