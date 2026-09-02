import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { describe, expect, it } from 'vitest';
import {
  MCP_MODERN_PROTOCOL_VERSION,
  MCP_SUPPORTED_PROTOCOL_VERSIONS,
  mcpMetaKeys,
  mcpResponse,
} from '../src/api/mcp';
import type { D1PreparedStatement, Env } from '../src/types';

class McpStatement implements D1PreparedStatement {
  private values: unknown[] = [];

  constructor(private readonly db: McpD1, private readonly sql: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async run() {
    if (this.sql.includes('INSERT INTO application_logs')) this.db.applicationLogBinds.push(this.values);
    return { meta: { last_row_id: this.db.applicationLogBinds.length } };
  }

  async all<T>() {
    if (this.sql.includes('FROM demo_records')) return { results: this.db.records as T[] };
    return { results: [] as T[] };
  }
}

class McpD1 {
  records = [{ id: 7, namespace: 'public', record_key: 'architecture', value_json: '{"edge":true}' }];
  applicationLogBinds: unknown[][] = [];
  prepare(sql: string) { return new McpStatement(this, sql); }
}

function environment(): Env & { DEMO_DB: McpD1 } {
  return {
    DEMO_DB: new McpD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

function inProcessTransport(env: Env): StreamableHTTPClientTransport {
  const fetchHandler = async (input: RequestInfo | URL, init?: RequestInit) => {
    return mcpResponse(new Request(input, init), env);
  };
  return new StreamableHTTPClientTransport(new URL('https://demo.example/mcp/server'), {
    fetch: fetchHandler as typeof fetch,
  });
}

function modernPingRequest(headerName = 'ping'): Request {
  return new Request('https://demo.example/mcp/server', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': MCP_MODERN_PROTOCOL_VERSION,
      'mcp-method': 'tools/call',
      'mcp-name': headerName,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'ping',
        arguments: {},
        _meta: {
          [mcpMetaKeys.protocolVersion]: MCP_MODERN_PROTOCOL_VERSION,
          [mcpMetaKeys.clientInfo]: { name: 'curl', version: '1.0' },
          [mcpMetaKeys.clientCapabilities]: {},
        },
      },
    }),
  });
}

async function exerciseClient(client: Client, env: Env & { DEMO_DB: McpD1 }) {
  const transport = inProcessTransport(env);
  await client.connect(transport);

  const catalog = await client.listTools();
  expect(catalog.tools.map((tool) => tool.name)).toEqual(['ping', 'list_demo_records']);
  for (const tool of catalog.tools) {
    expect(tool.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(tool.outputSchema).toBeDefined();
  }

  const ping = await client.callTool({ name: 'ping', arguments: {} });
  expect(ping.isError).not.toBe(true);
  expect(ping.structuredContent).toMatchObject({
    ok: true,
    server: 'wizardgang-architecture-demo',
    transport: 'streamable-http',
  });

  const records = await client.callTool({ name: 'list_demo_records', arguments: { namespace: 'public' } });
  expect(records.structuredContent).toEqual({
    results: [{ id: 7, namespace: 'public', key: 'architecture', valueJson: '{"edge":true}' }],
  });

  await client.close();
  return env.DEMO_DB.applicationLogBinds.map((binds) => JSON.parse(String(binds[6])) as Record<string, unknown>);
}

describe('official MCP client interoperability', () => {
  it('connects with MCP 2026-07-28, discovers schemas, and invokes both tools', async () => {
    const env = environment();
    const client = new Client(
      { name: 'integration-modern-client', version: '1.0.0' },
      {
        supportedProtocolVersions: MCP_SUPPORTED_PROTOCOL_VERSIONS,
        versionNegotiation: { mode: { pin: MCP_MODERN_PROTOCOL_VERSION } },
      },
    );

    const logs = await exerciseClient(client, env);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      clientName: 'integration-modern-client',
      clientVersion: '1.0.0',
      protocolVersion: MCP_MODERN_PROTOCOL_VERSION,
      method: 'tools/call',
      tool: 'ping',
      authMode: 'public',
      result: 'success',
    });
  });

  it('also accepts the official client’s legacy 2025 initialization flow', async () => {
    const env = environment();
    const client = new Client({ name: 'integration-legacy-client', version: '1.0.0' });
    const logs = await exerciseClient(client, env);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({ protocolVersion: '2025-11-25', tool: 'ping' });
  });

  it('accepts the documented modern stateless curl request without a handshake', async () => {
    const response = await mcpResponse(modernPingRequest(), environment());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const payload = await response.json() as { result: { structuredContent: unknown } };
    expect(payload.result.structuredContent).toMatchObject({ ok: true, transport: 'streamable-http' });
  });

  it('rejects a modern request when the tool-name header disagrees with the body', async () => {
    const response = await mcpResponse(modernPingRequest('list_demo_records'), environment());
    expect(response.status).toBe(400);
  });

  it('returns 202 with no body for a legacy initialized notification', async () => {
    const response = await mcpResponse(new Request('https://demo.example/mcp/server', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    }), environment());

    expect(response.status).toBe(202);
    expect(await response.text()).toBe('');
  });
});
