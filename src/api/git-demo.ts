import type { Env } from '../types';
import { recordDemoEvent } from '../lib/audit';
import { requireAdmin, requireSameOrigin } from '../lib/admin-auth';
import { collectGitDemoStatus, dispatchGitDemo, gitDemoPreflight, type VersionBump } from '../lib/git-demo';
import { json, methodNotAllowed } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

const MAX_BODY_BYTES = 2_048;
const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function jsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > MAX_BODY_BYTES) return null;
  try {
    const text = await request.text();
    if (!text || new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return null;
    const value = JSON.parse(text) as unknown;
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function dispatchFailure(result: { status?: number; error?: string }): Response {
  const status = result.status === 503 ? 503 : 502;
  return json({ error: status === 503 ? 'git_demo_not_configured' : 'github_dispatch_failed', detail: result.error ?? 'GitHub dispatch failed.' }, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

async function recordDispatchAudit(env: Env, input: {
  eventKey: string;
  message: string;
  requestId: string;
  detail: Record<string, unknown>;
}): Promise<boolean> {
  const results = await Promise.allSettled([
    recordDemoEvent(env, 'git', input.eventKey, input.detail),
    recordApplicationLog(env, {
      source: 'git',
      eventKey: input.eventKey,
      message: input.message,
      route: '/__api/git/demo',
      requestId: input.requestId,
      detail: input.detail,
    }),
  ]);
  return results.every((result) => result.status === 'fulfilled');
}

export async function gitDemoStatusResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const requestId = new URL(request.url).searchParams.get('request_id');
  if (requestId && !REQUEST_ID_PATTERN.test(requestId)) {
    return json({ error: 'invalid_request_id' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }
  try {
    return json(await collectGitDemoStatus(env, requestId), {
      headers: { 'cache-control': 'no-store' },
    });
  } catch {
    return json({ error: 'git_demo_status_unavailable', detail: 'Live GitHub lifecycle evidence is unavailable.' }, {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '5' },
    });
  }
}

export async function gitDemoStartResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const originFailure = requireSameOrigin(request);
  if (originFailure) return originFailure;
  const identity = await requireAdmin(request, env);
  if (identity instanceof Response) return identity;
  const body = await jsonBody(request);
  const bump = body?.bump;
  if (bump !== 'patch' && bump !== 'minor' && bump !== 'major') {
    return json({ error: 'invalid_version_bump', detail: 'bump must be patch, minor, or major.' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }
  if (!env.GITHUB_DEMO_TOKEN) return dispatchFailure({ status: 503, error: 'Git demo dispatch is not configured.' });

  let preflight: Awaited<ReturnType<typeof gitDemoPreflight>>;
  try {
    preflight = await gitDemoPreflight(env, bump as VersionBump);
  } catch {
    return json({ error: 'github_preflight_unavailable', detail: 'The active pull-request and version checks could not be completed.' }, {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '5' },
    });
  }
  if (preflight.active) {
    return json({
      error: 'git_demo_already_active',
      detail: `Live release demonstration already active: PR #${preflight.active.number}`,
      requestId: preflight.active.requestId,
      pullRequest: { number: preflight.active.number, title: preflight.active.title, url: preflight.active.url },
    }, { status: 409, headers: { 'cache-control': 'no-store' } });
  }

  const requestId = crypto.randomUUID();
  const dispatched = await dispatchGitDemo(env, { operation: 'start', bump: bump as VersionBump, requestId });
  if (!dispatched.ok) return dispatchFailure(dispatched);
  const auditRecorded = await recordDispatchAudit(env, {
    eventKey: 'live_demo_requested',
    message: `Authenticated operator requested a live ${bump} release demonstration.`,
    requestId,
    detail: { operation: 'start', bump, currentVersion: preflight.currentVersion, targetVersion: preflight.targetVersion, authorizedRole: 'demo-admin' },
  });
  return json({
    accepted: true,
    requestId,
    bump,
    currentVersion: preflight.currentVersion,
    targetVersion: preflight.targetVersion,
    statusUrl: `/__api/git/demo?request_id=${encodeURIComponent(requestId)}`,
    auditRecorded,
  }, { status: 202, headers: { 'cache-control': 'no-store' } });
}

export async function gitDemoReleaseResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const originFailure = requireSameOrigin(request);
  if (originFailure) return originFailure;
  const identity = await requireAdmin(request, env);
  if (identity instanceof Response) return identity;
  const body = await jsonBody(request);
  const pullRequest = body?.pullRequest;
  const requestId = body?.requestId;
  if (!Number.isSafeInteger(pullRequest) || Number(pullRequest) < 1 || typeof requestId !== 'string' || !REQUEST_ID_PATTERN.test(requestId)) {
    return json({ error: 'invalid_release_request', detail: 'A valid demo pull request and request ID are required.' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }
  if (!env.GITHUB_DEMO_TOKEN) return dispatchFailure({ status: 503, error: 'Git demo dispatch is not configured.' });

  let status: Awaited<ReturnType<typeof collectGitDemoStatus>>;
  try {
    status = await collectGitDemoStatus(env, requestId, true);
  } catch {
    return json({ error: 'github_preflight_unavailable', detail: 'The pull-request and CI checks could not be completed.' }, {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '5' },
    });
  }
  if (!status.pullRequest || status.pullRequest.number !== pullRequest || status.pullRequest.state !== 'open') {
    return json({ error: 'git_demo_pull_request_mismatch', detail: 'Only the active live-demo pull request can be released.' }, { status: 409, headers: { 'cache-control': 'no-store' } });
  }
  if (status.controller.release && status.controller.release.status !== 'completed') {
    return json({ error: 'git_demo_release_active', detail: 'Merge and release is already running.' }, { status: 409, headers: { 'cache-control': 'no-store' } });
  }
  if (!status.releaseReady) {
    return json({ error: 'git_demo_ci_not_ready', detail: 'The real pull-request CI run must complete successfully before release.' }, { status: 409, headers: { 'cache-control': 'no-store' } });
  }

  const dispatched = await dispatchGitDemo(env, { operation: 'release', pullRequest: Number(pullRequest), requestId: requestId.toLowerCase() });
  if (!dispatched.ok) return dispatchFailure(dispatched);
  const auditRecorded = await recordDispatchAudit(env, {
    eventKey: 'live_demo_release_requested',
    message: `Authenticated operator requested merge and release for live demo PR #${pullRequest}.`,
    requestId,
    detail: { operation: 'release', pullRequest, targetVersion: status.targetVersion, authorizedRole: 'demo-admin' },
  });
  return json({ accepted: true, requestId, pullRequest, targetVersion: status.targetVersion, auditRecorded }, {
    status: 202,
    headers: { 'cache-control': 'no-store' },
  });
}
