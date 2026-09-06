import { assuranceRelationshipIds } from '../assurance/relationship-contract.js';
import type { Env } from '../types';
import { MCP_SERVER_PATH, mcpResponse } from './mcp';
import { recordDemoEvent, recentDemoEvents } from '../lib/audit';
import { repoUrl } from '../lib/github';
import { json, methodNotAllowed } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';
import {
  assuranceDeploymentCommitUrl,
  assuranceDeploymentContext,
  presentEvidence,
} from '../assurance/presentation';
import {
  findPublishedAssuranceRecord,
  listPublishedAssuranceRecords,
} from '../assurance/publication';

const ISO_27001_FRAMEWORK = 'iso-27001';

function iso27001GovernanceClaims() {
  const compliance = listPublishedAssuranceRecords('compliance')
    .filter((record) => record.framework === ISO_27001_FRAMEWORK);
  if (compliance.length === 0) {
    throw new Error('Canonical ISO/IEC 27001 compliance records are unavailable.');
  }
  const complianceIds = new Set(compliance.map((record) => record.id));
  const claims = listPublishedAssuranceRecords('claims')
    .filter((claim) => assuranceRelationshipIds(claim.relationships, 'compliance').some((recordId) => complianceIds.has(recordId)));
  return { compliance, claims };
}

function firstPublishedEvidence(evidenceIds: string[]) {
  for (const evidenceId of evidenceIds) {
    const evidence = findPublishedAssuranceRecord('evidence', evidenceId);
    if (evidence) return evidence;
  }
  return undefined;
}

export async function traceabilityResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const events = await recentDemoEvents(env, 20);
  const deployment = assuranceDeploymentContext(env);
  const deploymentSource = assuranceDeploymentCommitUrl(env, deployment);
  const releaseEvidence = deployment.version && deployment.version !== 'development' && deployment.commit && deploymentSource
    ? { status: 'traceable', version: deployment.version, commit: deployment.commit, source: deploymentSource }
    : { status: 'not-supplied', version: deployment.version || 'development', commit: deployment.commit, explanation: 'Deployment metadata must be injected by the release workflow.' };
  const repository = repoUrl(env);
  return json({
    chain: ['requirement', 'branch/commit', 'pull request/review', 'automated validation', 'tag/release', 'deployment', 'operational observation'],
    releaseEvidence,
    repository,
    workflows: [`${repository}/actions`, `${repository}/releases`],
    recentApplicationAuditEvents: events,
  }, { headers: { 'cache-control': 'no-store' } });
}

export function securityControlsResponse(request: Request, env: Env): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const { compliance, claims } = iso27001GovernanceClaims();
  const origin = new URL(request.url).origin;
  const frameworkLabel = compliance[0].frameworkLabel.replace(/:\d{4}$/, '');
  return json({
    alignment: `${frameworkLabel} aligned — uncertified`,
    controls: claims.map((claim) => {
      const evidence = firstPublishedEvidence(assuranceRelationshipIds(claim.relationships, 'evidence'));
      return {
        area: claim.area.replaceAll('-', ' '),
        implementation: claim.statement,
        evidence: evidence ? presentEvidence(evidence, env, origin).resolved.url : null,
      };
    }),
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
  const evaluationVersion = 'mcp-boundary-v1';
  const outcome = passed ? 'passed' : 'failed';
  const event = await recordDemoEvent(env, 'iso42001', 'ai_boundary_evaluation', {
    evaluationVersion,
    outcome,
    checkCount: results.length,
    passedCount: results.filter((result) => result.passed).length,
  });
  await recordApplicationLog(env, {
    level: passed ? 'info' : 'error',
    source: 'governance-ai',
    eventKey: 'ai_boundary_evaluation',
    message: `AI/MCP boundary evaluation ${outcome}.`,
    route: '/__api/governance/ai-evaluation',
    detail: { auditEventId: event.id },
  });
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
