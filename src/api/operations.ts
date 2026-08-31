import type { Env } from '../types';
import { getDemoControl } from '../lib/demo-control';
import { recordApplicationLog, recentApplicationLogs } from '../lib/logs';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export async function healthResponse(env: Env): Promise<Response> {
  const checkedAt = new Date().toISOString();
  const control = await getDemoControl(env);
  try {
    const started = Date.now();
    await env.DEMO_DB.prepare('SELECT 1').all();
    const responseMs = Date.now() - started;
    const overall = control.state === 'offline' ? 'offline' : 'operational';

    try {
      await env.DEMO_DB.prepare(
        `INSERT INTO service_health_checks (service_key, status, response_ms, detail_json, checked_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind('d1', 'operational', responseMs, JSON.stringify({ demoState: control.state }), checkedAt).run();
      await recordApplicationLog(env, {
        level: control.state === 'offline' ? 'warn' : 'info',
        source: 'health',
        eventKey: 'health_check',
        message: control.state === 'offline' ? 'Runtime healthy; public demo intentionally offline.' : 'Runtime and D1 health check passed.',
        route: '/health',
        detail: { demoState: control.state, d1ResponseMs: responseMs }
      });
    } catch {
      // Health reporting should still respond even if history/log persistence is unavailable.
    }

    return json({
      status: overall,
      checkedAt,
      demo: { state: control.state, message: control.publicMessage },
      services: { worker: 'operational', d1: 'operational' },
      responseMs: { d1: responseMs }
    }, control.state === 'offline' ? 503 : 200);
  } catch {
    return json({
      status: 'degraded',
      checkedAt,
      demo: { state: control.state },
      services: { worker: 'operational', d1: 'unavailable' }
    }, 503);
  }
}

export function versionResponse(env: Env): Response {
  return json({
    service: 'wizardgang-architecture-demo',
    version: env.DEPLOYED_VERSION || 'development',
    commit: env.DEPLOYED_SHA || null,
    branch: env.GITHUB_BRANCH,
    repository: env.GITHUB_REPO_URL
  });
}


export async function logsResponse(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const level = url.searchParams.get('level');
  const source = url.searchParams.get('source');
  const results = await recentApplicationLogs(env, {
    limit: Number.isFinite(limit) ? limit : 50,
    level,
    source
  });
  return json({ results });
}
