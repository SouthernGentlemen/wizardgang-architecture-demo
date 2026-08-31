import type { Env } from '../types';
import { getDemoControl } from '../lib/demo-control';
import { recordApplicationLog, recentApplicationLogs } from '../lib/logs';
import { json } from '../lib/http';

type Readiness = 'operational' | 'unavailable' | 'unconfigured';

export interface HealthSnapshot {
  status: 'operational' | 'degraded' | 'offline';
  checkedAt: string;
  demo: { state: 'online' | 'offline'; message: string };
  services: {
    worker: 'operational';
    d1: Readiness;
    r2: Readiness;
    durableObjects: Readiness;
  };
  responseMs: Partial<Record<'d1' | 'r2' | 'durableObjects', number>>;
}

async function timed(check: () => Promise<unknown>): Promise<{ status: 'operational' | 'unavailable'; responseMs: number }> {
  const started = Date.now();
  try {
    await check();
    return { status: 'operational', responseMs: Date.now() - started };
  } catch {
    return { status: 'unavailable', responseMs: Date.now() - started };
  }
}

export async function collectHealth(env: Env, persist = true): Promise<HealthSnapshot> {
  const checkedAt = new Date().toISOString();
  const control = await getDemoControl(env);
  const d1 = await timed(() => env.DEMO_DB.prepare('SELECT 1').all());
  const r2 = env.DEMO_R2
    ? await timed(() => env.DEMO_R2!.get('__wizardgang_health_probe__'))
    : { status: 'unconfigured' as const, responseMs: 0 };
  const durableObjects = env.DEMO_COORDINATOR
    ? await timed(async () => {
      const id = env.DEMO_COORDINATOR!.idFromName('health');
      const response = await env.DEMO_COORDINATOR!.get(id).fetch(new Request('https://durable-object/'));
      if (!response.ok) throw new Error('Durable Object probe failed');
    })
    : { status: 'unconfigured' as const, responseMs: 0 };

  const dependencyFailure = [d1.status, r2.status, durableObjects.status].includes('unavailable');
  const status = control.state === 'offline' ? 'offline' : dependencyFailure ? 'degraded' : 'operational';
  const snapshot: HealthSnapshot = {
    status,
    checkedAt,
    demo: { state: control.state, message: control.publicMessage },
    services: {
      worker: 'operational',
      d1: d1.status,
      r2: r2.status,
      durableObjects: durableObjects.status,
    },
    responseMs: {
      d1: d1.responseMs,
      ...(env.DEMO_R2 ? { r2: r2.responseMs } : {}),
      ...(env.DEMO_COORDINATOR ? { durableObjects: durableObjects.responseMs } : {}),
    },
  };

  if (persist && d1.status === 'operational') {
    try {
      await env.DEMO_DB.prepare(
        `INSERT INTO service_health_checks (service_key, status, response_ms, detail_json, checked_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        'public-demo',
        status === 'offline' ? 'down' : status,
        d1.responseMs,
        JSON.stringify({ intentionalOffline: control.state === 'offline', services: snapshot.services }),
        checkedAt,
      ).run();
      await recordApplicationLog(env, {
        level: status === 'operational' ? 'info' : 'warn',
        source: 'health',
        eventKey: 'health_check',
        message: status === 'offline'
          ? 'Runtime checked; public demo intentionally offline.'
          : status === 'degraded' ? 'Runtime operational; one or more dependencies unavailable.' : 'Runtime dependency checks passed.',
        route: '/health',
        detail: { demoState: control.state, services: snapshot.services, responseMs: snapshot.responseMs },
      });
    } catch {
      // Health reporting should still respond even if history/log persistence is unavailable.
    }
  }

  return snapshot;
}

export async function healthResponse(env: Env): Promise<Response> {
  const snapshot = await collectHealth(env);
  return json(snapshot, { status: snapshot.status === 'operational' ? 200 : 503, headers: { 'cache-control': 'no-store' } });
}

export function versionResponse(env: Env): Response {
  return json({
    service: 'wizardgang-architecture-demo',
    version: env.DEPLOYED_VERSION || 'development',
    commit: env.DEPLOYED_SHA || null,
    branch: env.GITHUB_BRANCH,
    repository: env.GITHUB_REPO_URL,
    environment: env.DEPLOYMENT_ENVIRONMENT || 'local',
  }, { headers: { 'cache-control': 'no-store' } });
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
  return json({ results }, { headers: { 'cache-control': 'no-store' } });
}
