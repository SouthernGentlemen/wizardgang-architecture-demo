import {
  CLIENT_CAPABILITIES_META_KEY,
  CLIENT_INFO_META_KEY,
  McpServer,
  PROTOCOL_VERSION_META_KEY,
  SUPPORTED_PROTOCOL_VERSIONS,
  createMcpHandler,
  type ServerContext,
} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { Env } from '../types';
import type { Principal } from '../lib/authorization';
import { authorize } from '../lib/authorization';
import { json } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

export const MCP_SERVER_PATH = '/mcp/server';
export const MCP_MODERN_PROTOCOL_VERSION = '2026-07-28';
export const MCP_SUPPORTED_PROTOCOL_VERSIONS = [
  MCP_MODERN_PROTOCOL_VERSION,
  ...SUPPORTED_PROTOCOL_VERSIONS,
];

interface RecordRow {
  id: number;
  namespace: string;
  record_key: string;
  value_json: string;
}

interface ClientEvidence {
  clientName: string;
  clientVersion: string;
  protocolVersion: string;
}

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const PingOutput = z.object({
  ok: z.literal(true),
  server: z.literal('wizardgang-architecture-demo'),
  transport: z.literal('streamable-http'),
  timestamp: z.string(),
});

const DemoRecord = z.object({
  id: z.number().int(),
  namespace: z.string(),
  key: z.string(),
  valueJson: z.string(),
});

const ListDemoRecordsOutput = z.object({ results: z.array(DemoRecord) });

function safeIdentity(value: unknown, fallback: string, max = 80): string {
  if (typeof value !== 'string') return fallback;
  const normalized = value.replace(/[^a-zA-Z0-9._ /()-]/g, '').trim().slice(0, max);
  return normalized || fallback;
}

function knownUserAgent(value: string | null): string {
  if (!value) return 'unknown-mcp-client';
  if (/claude[- /]?code/i.test(value)) return 'claude-code';
  if (/codex/i.test(value)) return 'codex';
  if (/modelcontextprotocol|mcp[- /]?inspector/i.test(value)) return 'mcp-inspector';
  if (/curl/i.test(value)) return 'curl';
  return 'unknown-mcp-client';
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

async function readClientEvidence(request: Request): Promise<ClientEvidence> {
  let body: Record<string, unknown> | undefined;
  if (request.method === 'POST') {
    try {
      body = objectValue(await request.clone().json());
    } catch {
      // The SDK owns malformed JSON reporting; evidence extraction stays best-effort.
    }
  }

  const params = objectValue(body?.params);
  const meta = objectValue(params?._meta);
  const clientInfo = objectValue(meta?.[CLIENT_INFO_META_KEY]) ?? objectValue(params?.clientInfo);
  const headerVersion = request.headers.get('mcp-protocol-version');
  const claimedVersion = meta?.[PROTOCOL_VERSION_META_KEY] ?? params?.protocolVersion;

  return {
    clientName: safeIdentity(clientInfo?.name, knownUserAgent(request.headers.get('user-agent'))),
    clientVersion: safeIdentity(clientInfo?.version, 'unreported', 40),
    protocolVersion: safeIdentity(headerVersion ?? claimedVersion, 'legacy-unreported', 40),
  };
}

function principalAuthMode(principal: Principal): 'public' | 'bearer' {
  return principal.authentication === 'anonymous' ? 'public' : 'bearer';
}

async function recordToolCall(
  env: Env,
  principal: Principal,
  evidence: ClientEvidence,
  ctx: ServerContext,
  tool: string,
  startedAt: number,
  detail: Record<string, unknown> = {},
): Promise<void> {
  await recordApplicationLog(env, {
    source: 'mcp',
    eventKey: 'tool_called',
    message: `MCP tool ${tool} completed successfully.`,
    route: MCP_SERVER_PATH,
    detail: {
      clientName: evidence.clientName,
      clientVersion: evidence.clientVersion,
      protocolVersion: evidence.protocolVersion,
      method: ctx.mcpReq.method,
      tool,
      durationMs: Math.max(0, Date.now() - startedAt),
      result: 'success',
      authMode: principalAuthMode(principal),
      ...detail,
    },
  });
}

function createWizardGangMcpServer(env: Env, principal: Principal, evidence: ClientEvidence): McpServer {
  const server = new McpServer(
    { name: 'wizardgang-architecture-demo', version: '2.0.0' },
    {
      supportedProtocolVersions: MCP_SUPPORTED_PROTOCOL_VERSIONS,
      instructions: 'Use ping to verify connectivity. All exposed tools are public, read-only demonstrations governed by the same application authorization boundary as REST and GraphQL.',
      cacheHints: {
        'server/discover': { ttlMs: 60_000, cacheScope: 'public' },
        'tools/list': { ttlMs: 60_000, cacheScope: 'public' },
      },
    },
  );

  server.registerTool(
    'ping',
    {
      title: 'Ping WizardGang',
      description: 'Verify MCP client connectivity to the WizardGang architecture demo.',
      inputSchema: z.object({}),
      outputSchema: PingOutput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (_args, ctx) => {
      const startedAt = Date.now();
      const output = {
        ok: true as const,
        server: 'wizardgang-architecture-demo' as const,
        transport: 'streamable-http' as const,
        timestamp: new Date().toISOString(),
      };
      await recordToolCall(env, principal, evidence, ctx, 'ping', startedAt);
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  server.registerTool(
    'list_demo_records',
    {
      title: 'List demo records',
      description: 'Read bounded public demonstration records through the shared D1 authorization boundary.',
      inputSchema: z.object({
        namespace: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/).default('public'),
      }),
      outputSchema: ListDemoRecordsOutput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ namespace }, ctx) => {
      const startedAt = Date.now();
      const rows = await env.DEMO_DB.prepare(
        'SELECT id, namespace, record_key, value_json FROM demo_records WHERE namespace = ? ORDER BY record_key LIMIT 100',
      ).bind(namespace).all<RecordRow>();
      const output = {
        results: rows.results.map((row) => ({
          id: row.id,
          namespace: row.namespace,
          key: row.record_key,
          valueJson: row.value_json,
        })),
      };
      await recordToolCall(env, principal, evidence, ctx, 'list_demo_records', startedAt, {
        namespace,
        resultCount: output.results.length,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  return server;
}

function originRejected(request: Request): Response | undefined {
  const origin = request.headers.get('origin');
  if (!origin || origin === new URL(request.url).origin) return undefined;
  return json({ error: 'invalid_origin' }, { status: 403, headers: { 'cache-control': 'no-store' } });
}

export async function mcpResponse(request: Request, env: Env): Promise<Response> {
  const originFailure = originRejected(request);
  if (originFailure) return originFailure;

  const principal = await authorize(request, env, 'demo:read');
  if (principal instanceof Response) return principal;
  const evidence = await readClientEvidence(request);
  const handler = createMcpHandler(
    () => createWizardGangMcpServer(env, principal, evidence),
    { legacy: 'stateless', responseMode: 'auto' },
  );
  return handler.fetch(request);
}

export const mcpMetaKeys = {
  protocolVersion: PROTOCOL_VERSION_META_KEY,
  clientInfo: CLIENT_INFO_META_KEY,
  clientCapabilities: CLIENT_CAPABILITIES_META_KEY,
} as const;
