import type { Env } from '../types';
import { MCP_SERVER_PATH, mcpResponse } from './mcp';
import { recordDemoEvent, recentDemoEvents } from '../lib/audit';
import { json, methodNotAllowed } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

export async function traceabilityResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const events = await recentDemoEvents(env, 20);
  const releaseEvidence = env.DEPLOYED_VERSION && env.DEPLOYED_VERSION !== 'development' && env.DEPLOYED_SHA
    ? { status: 'traceable', version: env.DEPLOYED_VERSION, commit: env.DEPLOYED_SHA, source: `${env.GITHUB_REPO_URL}/commit/${env.DEPLOYED_SHA}` }
    : { status: 'not-supplied', version: env.DEPLOYED_VERSION || 'development', commit: env.DEPLOYED_SHA || null, explanation: 'Deployment metadata must be injected by the release workflow.' };
  return json({
    chain: ['requirement', 'branch/commit', 'pull request/review', 'automated validation', 'tag/release', 'deployment', 'operational observation'],
    releaseEvidence,
    repository: env.GITHUB_REPO_URL,
    workflows: [`${env.GITHUB_REPO_URL}/actions`, `${env.GITHUB_REPO_URL}/releases`],
    recentApplicationAuditEvents: events,
  }, { headers: { 'cache-control': 'no-store' } });
}

export function securityControlsResponse(request: Request, env: Env): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const source = (path: string) => `${env.GITHUB_REPO_URL}/blob/${encodeURIComponent(env.GITHUB_BRANCH || 'main')}/${path}`;
  return json({
    alignment: 'ISO/IEC 27001 aligned — uncertified',
    controls: [
      { area: 'access control', implementation: 'separate authentication and authorization, least-privilege write access', evidence: source('src/lib/authorization.ts') },
      { area: 'secure development', implementation: 'type checking, tests, contract/migration/localization/security validation', evidence: source('.github/workflows/ci.yml') },
      { area: 'change and release management', implementation: 'reviewed main, semantic tags/releases, tag-bound deployment workflow', evidence: source('docs/RELEASE.md') },
      { area: 'logging and investigation', implementation: 'bounded redacted diagnostics separated from audit events', evidence: source('src/lib/logs.ts') },
      { area: 'configuration and secrets', implementation: 'managed secrets; examples contain placeholders only', evidence: source('SECURITY.md') },
      { area: 'availability', implementation: 'health history, intentional offline distinction, graceful synthetic budget degradation', evidence: source('docs/OPERATIONS.md') },
    ],
    limitations: ['This evidence demonstrates engineering alignment only.', 'No certification or complete information-security management system is claimed.'],
  }, { headers: { 'cache-control': 'no-store' } });
}

export async function aiEvaluationResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const invoke = (method: string, params?: unknown) => mcpResponse(new Request(new URL(MCP_SERVER_PATH, request.url), {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
  }), env);
  const valid = await invoke('tools/call', { name: 'list_demo_records', arguments: { namespace: 'public' } });
  const unknownMethod = await invoke('tools/deleteEverything');
  const invalidScope = await invoke('tools/call', { name: 'list_demo_records', arguments: { namespace: '../private' } });
  const readMessage = async (response: Response) => {
    const text = await response.text();
    const payload = response.headers.get('content-type')?.includes('text/event-stream')
      ? [...text.matchAll(/^data:\s*(.+)$/gm)].at(-1)?.[1]
      : text;
    return payload ? JSON.parse(payload) as Record<string, unknown> : {};
  };
  const [validMessage, unknownMessage, invalidMessage] = await Promise.all([
    readMessage(valid), readMessage(unknownMethod), readMessage(invalidScope),
  ]);
  const validResult = validMessage.result as Record<string, unknown> | undefined;
  const unknownError = unknownMessage.error as Record<string, unknown> | undefined;
  const invalidResult = invalidMessage.result as Record<string, unknown> | undefined;
  const results = [
    { case: 'approved read tool', expected: 'tool result', actual: validResult?.structuredContent ? 'tool result' : 'missing result', httpStatus: valid.status, passed: Boolean(validResult?.structuredContent) },
    { case: 'unknown method fallback', expected: 'JSON-RPC -32601', actual: `JSON-RPC ${String(unknownError?.code ?? 'missing')}`, httpStatus: unknownMethod.status, passed: unknownError?.code === -32601 },
    { case: 'invalid namespace validation', expected: 'tool error', actual: invalidResult?.isError === true ? 'tool error' : 'missing error', httpStatus: invalidScope.status, passed: invalidResult?.isError === true },
  ];
  const passed = results.every((result) => result.passed);
  const event = await recordDemoEvent(env, 'iso42001', 'ai_boundary_evaluation', { passed, results });
  await recordApplicationLog(env, { level: passed ? 'info' : 'error', source: 'governance-ai', eventKey: 'ai_boundary_evaluation', message: `AI/MCP boundary evaluation ${passed ? 'passed' : 'failed'}.`, route: '/__api/governance/ai-evaluation', detail: { passed, results, eventId: event.id } });
  return json({
    alignment: 'ISO/IEC 42001 aligned — uncertified',
    systemBoundary: 'Public MCP read tool -> shared authorization -> validation -> D1 records -> bounded result',
    intendedUse: 'Inspect public demo records through a controlled AI application interface.',
    humanOversight: 'Write operations are not exposed as MCP tools; application operators control source, release, and demo state.',
    fallback: 'Unknown methods and invalid scopes fail closed with structured errors.',
    passed,
    results,
    auditEventId: event.id,
  }, { status: passed ? 200 : 500, headers: { 'cache-control': 'no-store' } });
}
