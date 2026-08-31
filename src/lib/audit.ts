import type { Env } from '../types';

export async function recordDemoEvent(
  env: Env,
  demoId: string,
  eventType: string,
  payload: unknown = null,
): Promise<{ id: number; createdAt: string }> {
  const createdAt = new Date().toISOString();
  const result = await env.DEMO_DB.prepare(
    `INSERT INTO demo_events (demo_id, event_type, payload_json, created_at)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(demoId, eventType, JSON.stringify(payload), createdAt)
    .run();

  return {
    id: Number(result.meta.last_row_id ?? 0),
    createdAt,
  };
}

export async function recentDemoEvents(env: Env, limit = 20) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const result = await env.DEMO_DB.prepare(
    `SELECT id, demo_id, event_type, payload_json, created_at
     FROM demo_events
     ORDER BY id DESC
     LIMIT ?`,
  )
    .bind(safeLimit)
    .all();

  return result.results;
}
