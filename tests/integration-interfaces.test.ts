import { describe, expect, it } from 'vitest';
import { graphqlResponse } from '../src/api/graphql';
import { mcpResponse } from '../src/api/mcp';
import { signWebhookForTest, webhookReceiptResponse } from '../src/api/webhooks';
import type { D1PreparedStatement, Env } from '../src/types';

class InterfaceStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: InterfaceD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.includes('INSERT INTO webhook_receipts')) {
      const deliveryId = String(this.values[1]);
      if (this.db.deliveries.has(deliveryId)) throw new Error('UNIQUE');
      this.db.deliveries.add(deliveryId);
    }
    return { meta: { last_row_id: this.db.nextId++ } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_records')) return { results: this.db.records as T[] };
    return { results: [] as T[] };
  }
}

class InterfaceD1 {
  nextId = 1;
  deliveries = new Set<string>();
  records = [{ id: 7, namespace: 'public', record_key: 'architecture', value_json: '{"edge":true}' }];
  prepare(sql: string) { return new InterfaceStatement(this, sql); }
}

function env(): Env {
  return {
    DEMO_DB: new InterfaceD1(),
    WEBHOOK_DEMO_SECRET: 'test-webhook-secret',
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

describe('GraphQL authorization and resolver boundary', () => {
  it('executes the declared read query against D1', async () => {
    const response = await graphqlResponse(new Request('https://demo.example/graphql', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'query { demoRecords(namespace: "public") { id namespace key valueJson } }' }),
    }), env());
    expect(await response.json()).toMatchObject({ data: { demoRecords: [{ id: '7', key: 'architecture' }] } });
  });

  it('rejects mutations absent from the public schema', async () => {
    const response = await graphqlResponse(new Request('https://demo.example/graphql', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: 'mutation { eraseEverything }' }),
    }), env());
    expect(response.status).toBe(400);
  });
});

describe('signed webhook receipt', () => {
  it('verifies HMAC signatures and rejects replayed delivery IDs', async () => {
    const environment = env();
    const payload = JSON.stringify({ type: 'demo.record.changed', data: { key: 'architecture' } });
    const signature = await signWebhookForTest('test-webhook-secret', payload);
    const makeRequest = () => new Request('https://demo.example/v1/webhooks/demo', {
      method: 'POST', body: payload,
      headers: { 'content-type': 'application/json', 'x-demo-delivery-id': 'delivery-1', 'x-demo-signature': signature },
    });
    expect((await webhookReceiptResponse(makeRequest(), environment)).status).toBe(202);
    expect((await webhookReceiptResponse(makeRequest(), environment)).status).toBe(409);
  });

  it('rejects invalid signatures before persistence', async () => {
    const response = await webhookReceiptResponse(new Request('https://demo.example/v1/webhooks/demo', {
      method: 'POST', body: JSON.stringify({ type: 'demo.record.changed' }),
      headers: { 'x-demo-delivery-id': 'delivery-2', 'x-demo-signature': 'wrong' },
    }), env());
    expect(response.status).toBe(401);
  });
});

describe('controlled MCP interface', () => {
  it('discovers and invokes only the declared read tool', async () => {
    const request = (method: string, params?: unknown) => new Request('https://demo.example/mcp', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const listed = await mcpResponse(request('tools/list'), env());
    expect(await listed.json()).toMatchObject({ result: { tools: [{ name: 'list_demo_records' }] } });
    const called = await mcpResponse(request('tools/call', { name: 'list_demo_records', arguments: { namespace: 'public' } }), env());
    expect(await called.json()).toMatchObject({ result: { isError: false } });
  });
});
