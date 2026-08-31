import type { Env } from '../types';
import { authorize } from '../lib/authorization';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

interface McpRequest { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown }
interface RecordRow { id: number; namespace: string; record_key: string; value_json: string }

const TOOL = {
  name: 'list_demo_records',
  description: 'List authorized public demo records from D1.',
  inputSchema: { type: 'object', properties: { namespace: { type: 'string', pattern: '^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$' } }, additionalProperties: false },
};

export async function mcpResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  try {
    const principal = await authorize(request, env, 'demo:read');
    if (principal instanceof Response) return principal;
    const body = await readJson<McpRequest>(request);
    if (body.jsonrpc !== '2.0' || typeof body.method !== 'string') throw new HttpError(400, 'invalid_json_rpc_request');
    const result = body.method === 'initialize'
      ? { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'wizardgang-architecture-demo', version: '1.0.0' } }
      : body.method === 'tools/list'
        ? { tools: [TOOL] }
        : body.method === 'tools/call'
          ? await callTool(body.params, env, principal.subject)
          : null;
    if (!result) return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: 'Method not found' } }, { status: 404 });
    return json({ jsonrpc: '2.0', id: body.id ?? null, result }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

async function callTool(params: unknown, env: Env, subject: string) {
  const value = params && typeof params === 'object' ? params as Record<string, unknown> : {};
  if (value.name !== TOOL.name) throw new HttpError(404, 'unknown_tool');
  const args = value.arguments && typeof value.arguments === 'object' ? value.arguments as Record<string, unknown> : {};
  const namespace = typeof args.namespace === 'string' ? args.namespace : 'public';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(namespace)) throw new HttpError(400, 'invalid_namespace');
  const rows = await env.DEMO_DB.prepare('SELECT id, namespace, record_key, value_json FROM demo_records WHERE namespace = ? ORDER BY record_key LIMIT 100').bind(namespace).all<RecordRow>();
  await recordApplicationLog(env, { source: 'mcp', eventKey: 'tool_called', message: `MCP tool ${TOOL.name} returned ${rows.results.length} record(s).`, route: '/mcp', detail: { tool: TOOL.name, namespace, resultCount: rows.results.length, subject } });
  return { content: [{ type: 'text', text: JSON.stringify(rows.results.map((row) => ({ id: row.id, namespace: row.namespace, key: row.record_key, valueJson: row.value_json }))) }], structuredContent: { results: rows.results }, isError: false };
}
