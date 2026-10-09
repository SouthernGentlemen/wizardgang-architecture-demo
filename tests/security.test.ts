import { describe, expect, it } from 'vitest';
import { requireAdmin, requireSameOrigin } from '../src/lib/admin-auth';
import { getDemoControl } from '../src/lib/demo-control';
import { getCrawlerControl } from '../src/lib/crawler-control';
import { json, readJson } from '../src/lib/http';
import type { Env } from '../src/types';
import { createDemoWorker } from '../src/index';

const baseEnv = {
  GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('admin boundary', () => {
  it('requires the shared shell credential and rejects an incorrect secret', async () => {
    const worker = createDemoWorker({ version: '0.31.0', commit: 'a'.repeat(40) });
    const missing = await worker.fetch(new Request('https://demo.wizardgang.ai/admin'), { ...baseEnv, WG_APP: 'demo' } as never, {} as never);
    expect(missing).toBeInstanceOf(Response);
    expect((missing as Response).status).toBe(503);

    const invalid = await worker.fetch(new Request('https://demo.wizardgang.ai/admin', {
      headers: { authorization: `Basic ${btoa('ops:wrong')}` },
    }), { ...baseEnv, WG_APP: 'demo', WG_OPS_TOKEN: 'correct horse battery staple' } as never, {} as never);
    expect(invalid).toBeInstanceOf(Response);
    expect((invalid as Response).status).toBe(401);
  });

  it('accepts only an authenticated shell decision without reading a password', () => {
    expect(requireAdmin(true)).toEqual({ username: 'ops' });
    expect((requireAdmin(false) as Response).status).toBe(401);
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
    const unavailableEnv = {
      ...baseEnv,
      WG_DB: {
        prepare() {
          return { bind: () => { throw new Error('unused'); }, run: async () => { throw new Error('unavailable'); }, all: async () => { throw new Error('unavailable'); } };
        },
      },
    };
    const control = await getDemoControl(unavailableEnv);
    expect(control.state).toBe('offline');
    expect(control.publicMessage).toContain('unavailable');
    expect((await getCrawlerControl(unavailableEnv)).state).toBe('disabled');
  });
});
