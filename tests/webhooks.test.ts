import { describe, expect, it } from 'vitest';
import { githubWebhookResponse, signWebhookForTest, webhookDemoResponse, webhookEventsResponse, webhookResetResponse } from '../src/api/webhooks';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

interface StoredDelivery { provider: string; eventType: string; repository: string; actor: string | null; summary: unknown }

function environment(): Env & { WG_DB: SqliteD1 } {
  return {
    WG_DB: new SqliteD1(),
    WG_SESSION_KEY: 'test-session-secret-that-is-at-least-32-characters',
    DEMO_WEBHOOK_SECRET: 'test-demo-webhook-secret',
    GITHUB_WEBHOOK_SECRET: 'test-github-webhook-secret',
    GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

function deliveries(env: Env & { WG_DB: SqliteD1 }) {
  return [...env.WG_DB.records<StoredDelivery>('webhook-deliveries').values()];
}

function githubRequest(secret: string, payload: string, delivery = 'delivery-github-1', event = 'push'): Promise<Request> {
  return signWebhookForTest(secret, payload).then((signature) => new Request('https://demo.example/webhooks/github', {
    method: 'POST', body: payload, headers: {
      'content-type': 'application/json',
      'x-github-delivery': delivery,
      'x-github-event': event,
      'x-hub-signature-256': `sha256=${signature}`,
    },
  }));
}

describe('GitHub webhook receiver', () => {
  it('verifies signature, event, repository, and replay before storing a safe summary', async () => {
    const env = environment();
    const payload = JSON.stringify({
      ref: 'refs/heads/main', after: 'abc123', repository: { full_name: 'Wizard-Gang/wizardgang-architecture-demo' },
      sender: { login: 'octocat' }, head_commit: { id: 'abc123', message: 'Ship demo', url: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo/commit/abc123' },
      untrusted_private_field: 'must-not-persist',
    });
    expect((await githubWebhookResponse(await githubRequest(env.GITHUB_WEBHOOK_SECRET!, payload), env)).status).toBe(202);
    const stored = deliveries(env);
    expect(stored).toHaveLength(1);
    expect(stored[0].owner).toBe('github');
    expect(stored[0].expiresAt).not.toBeNull();
    expect(stored[0].body).toMatchObject({ provider: 'github', eventType: 'push', repository: 'Wizard-Gang/wizardgang-architecture-demo', actor: 'octocat' });
    expect(JSON.stringify(stored[0].body.summary)).toContain('Ship demo');
    expect(env.WG_DB.dump()).not.toContain('must-not-persist');
    expect((await githubWebhookResponse(await githubRequest(env.GITHUB_WEBHOOK_SECRET!, payload), env)).status).toBe(409);
  });

  it('rejects invalid signatures, unsupported events, and the wrong repository', async () => {
    const env = environment();
    const allowedPayload = JSON.stringify({ repository: { full_name: 'Wizard-Gang/wizardgang-architecture-demo' } });
    const invalid = await githubRequest(env.GITHUB_WEBHOOK_SECRET!, allowedPayload, 'invalid-signature');
    invalid.headers.set('x-hub-signature-256', `sha256=${'0'.repeat(64)}`);
    expect((await githubWebhookResponse(invalid, env)).status).toBe(401);
    expect((await githubWebhookResponse(await githubRequest(env.GITHUB_WEBHOOK_SECRET!, allowedPayload, 'unsupported', 'issues'), env)).status).toBe(400);
    const wrongRepo = JSON.stringify({ repository: { full_name: 'someone/else' } });
    expect((await githubWebhookResponse(await githubRequest(env.GITHUB_WEBHOOK_SECRET!, wrongRepo, 'wrong-repo'), env)).status).toBe(403);
    expect(deliveries(env)).toHaveLength(0);
  });
});

describe('visitor webhook viewer', () => {
  it('generates, lists, and resets only the signed current-session events', async () => {
    const env = environment();
    const generated = await webhookDemoResponse(new Request('https://demo.example/api/labs/webhook-demo', { method: 'POST', headers: { origin: 'https://demo.example' } }), env);
    expect(generated.status).toBe(202);
    const cookie = generated.headers.get('set-cookie')?.split(';')[0];
    expect(cookie).toMatch(/^wg_demo_session=/);
    const listed = await webhookEventsResponse(new Request('https://demo.example/api/labs/webhook-events', { headers: { cookie: cookie! } }), env);
    expect(await listed.json()).toMatchObject({ events: [{ provider: 'demo', eventType: 'release', actor: 'wizardgang-release-bot' }], pollingIntervalMs: 2000 });
    expect((await webhookResetResponse(new Request('https://demo.example/api/labs/webhook-reset', { method: 'POST', headers: { cookie: cookie!, origin: 'https://demo.example' } }), env)).status).toBe(200);
    const afterReset = await webhookEventsResponse(new Request('https://demo.example/api/labs/webhook-events', { headers: { cookie: cookie! } }), env);
    expect(await afterReset.json()).toMatchObject({ events: [] });
  });
});
