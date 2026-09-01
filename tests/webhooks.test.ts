import { describe, expect, it } from 'vitest';
import { githubWebhookResponse, signWebhookForTest, webhookDemoResponse, webhookEventsResponse, webhookResetResponse } from '../src/api/webhooks';
import type { D1PreparedStatement, Env } from '../src/types';

interface StoredEvent {
  id: number;
  session_id: string | null;
  provider: 'demo' | 'github';
  delivery_id: string;
  event_type: string;
  action: string | null;
  repository: string;
  actor: string | null;
  summary_json: string;
  received_at: string;
}

class WebhookStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: WebhookD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.includes('INSERT INTO demo_sessions')) {
      this.db.sessions.set(String(this.values[0]), { expires_at: String(this.values[2]) });
    }
    if (this.sql.includes('INSERT INTO webhook_events')) {
      const deliveryId = String(this.values[2]);
      if (this.db.events.some((event) => event.delivery_id === deliveryId)) throw new Error('UNIQUE constraint failed');
      this.db.events.push({
        id: this.db.nextId++, session_id: this.values[0] ? String(this.values[0]) : null,
        provider: this.values[1] as 'demo' | 'github', delivery_id: deliveryId,
        event_type: String(this.values[3]), action: this.values[4] ? String(this.values[4]) : null,
        repository: String(this.values[5]), actor: this.values[6] ? String(this.values[6]) : null,
        summary_json: String(this.values[7]), received_at: String(this.values[9]),
      });
    }
    if (this.sql.includes('DELETE FROM webhook_events')) {
      const sessionId = String(this.values[0]);
      this.db.events = this.db.events.filter((event) => event.session_id !== sessionId || event.provider !== 'demo');
    }
    return { meta: { last_row_id: this.db.nextId++ } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_sessions')) {
      const id = String(this.values[0]);
      const session = this.db.sessions.get(id);
      return { results: session ? [{ id, expires_at: session.expires_at }] as T[] : [] };
    }
    if (this.sql.includes('FROM webhook_events')) {
      const [sessionId, repository] = this.values.map(String);
      return { results: this.db.events.filter((event) => event.session_id === sessionId || (event.provider === 'github' && event.repository === repository)).sort((left, right) => right.received_at.localeCompare(left.received_at)) as T[] };
    }
    return { results: [] as T[] };
  }
}

class WebhookD1 {
  nextId = 1;
  sessions = new Map<string, { expires_at: string }>();
  events: StoredEvent[] = [];
  prepare(sql: string) { return new WebhookStatement(this, sql); }
}

function environment(): Env & { DEMO_DB: WebhookD1 } {
  return {
    DEMO_DB: new WebhookD1(),
    DEMO_SESSION_SECRET: 'test-session-secret-that-is-at-least-32-characters',
    WEBHOOK_DEMO_SECRET: 'test-demo-webhook-secret',
    GITHUB_WEBHOOK_SECRET: 'test-github-webhook-secret',
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

function githubRequest(secret: string, payload: string, delivery = 'delivery-github-1', event = 'push'): Promise<Request> {
  return signWebhookForTest(secret, payload).then((signature) => new Request('https://demo.example/v1/webhooks/github', {
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
      ref: 'refs/heads/main', after: 'abc123', repository: { full_name: 'SouthernGentlemen/wizardgang-architecture-demo' },
      sender: { login: 'octocat' }, head_commit: { id: 'abc123', message: 'Ship demo', url: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo/commit/abc123' },
      untrusted_private_field: 'must-not-persist',
    });
    expect((await githubWebhookResponse(await githubRequest(env.GITHUB_WEBHOOK_SECRET!, payload), env)).status).toBe(202);
    expect(env.DEMO_DB.events).toHaveLength(1);
    expect(env.DEMO_DB.events[0]).toMatchObject({ provider: 'github', event_type: 'push', repository: 'SouthernGentlemen/wizardgang-architecture-demo', actor: 'octocat' });
    expect(env.DEMO_DB.events[0].summary_json).toContain('Ship demo');
    expect(env.DEMO_DB.events[0].summary_json).not.toContain('must-not-persist');
    expect((await githubWebhookResponse(await githubRequest(env.GITHUB_WEBHOOK_SECRET!, payload), env)).status).toBe(409);
  });

  it('rejects invalid signatures, unsupported events, and the wrong repository', async () => {
    const env = environment();
    const allowedPayload = JSON.stringify({ repository: { full_name: 'SouthernGentlemen/wizardgang-architecture-demo' } });
    const invalid = await githubRequest(env.GITHUB_WEBHOOK_SECRET!, allowedPayload, 'invalid-signature');
    invalid.headers.set('x-hub-signature-256', `sha256=${'0'.repeat(64)}`);
    expect((await githubWebhookResponse(invalid, env)).status).toBe(401);
    expect((await githubWebhookResponse(await githubRequest(env.GITHUB_WEBHOOK_SECRET!, allowedPayload, 'unsupported', 'issues'), env)).status).toBe(400);
    const wrongRepo = JSON.stringify({ repository: { full_name: 'someone/else' } });
    expect((await githubWebhookResponse(await githubRequest(env.GITHUB_WEBHOOK_SECRET!, wrongRepo, 'wrong-repo'), env)).status).toBe(403);
    expect(env.DEMO_DB.events).toHaveLength(0);
  });
});

describe('visitor webhook viewer', () => {
  it('generates, lists, and resets only the signed current-session events', async () => {
    const env = environment();
    const generated = await webhookDemoResponse(new Request('https://demo.example/__api/webhooks/demo', { method: 'POST', headers: { origin: 'https://demo.example' } }), env);
    expect(generated.status).toBe(202);
    const cookie = generated.headers.get('set-cookie')?.split(';')[0];
    expect(cookie).toMatch(/^wg_demo_session=/);
    const listed = await webhookEventsResponse(new Request('https://demo.example/__api/webhooks/events', { headers: { cookie: cookie! } }), env);
    expect(await listed.json()).toMatchObject({ events: [{ provider: 'demo', eventType: 'push', actor: 'demo-visitor' }], pollingIntervalMs: 2000 });
    expect((await webhookResetResponse(new Request('https://demo.example/__api/webhooks/reset', { method: 'POST', headers: { cookie: cookie!, origin: 'https://demo.example' } }), env)).status).toBe(200);
    const afterReset = await webhookEventsResponse(new Request('https://demo.example/__api/webhooks/events', { headers: { cookie: cookie! } }), env);
    expect(await afterReset.json()).toMatchObject({ events: [] });
  });
});
