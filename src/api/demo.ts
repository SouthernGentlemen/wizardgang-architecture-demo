import type { Env } from '../types';
import { recordDemoEvent, recentDemoEvents } from '../lib/audit';
import { demosById } from '../demos/registry';
import { recordApplicationLog } from '../lib/logs';

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

export async function runBaselineDemo(request: Request, env: Env): Promise<Response> {
  let body: { demoId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 });
  }

  const demo = body.demoId ? demosById.get(body.demoId) : undefined;
  if (!demo) return json({ error: 'unknown_demo' }, { status: 404 });

  const event = await recordDemoEvent(env, demo.id, 'baseline_run', {
    route: demo.route,
    sourcePath: demo.sourcePath,
  });

  await recordApplicationLog(env, {
    source: demo.id,
    eventKey: 'baseline_run',
    message: `Baseline demo executed for ${demo.route}.`,
    route: demo.route,
    detail: { sourcePath: demo.sourcePath, eventId: event.id }
  });

  return json({
    ok: true,
    demo: demo.id,
    route: demo.route,
    backend: 'Cloudflare Worker -> D1 demo-blob',
    event,
  });
}

export async function listDemoEvents(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? '20');
  return json({ results: await recentDemoEvents(env, Number.isFinite(limit) ? limit : 20) });
}
