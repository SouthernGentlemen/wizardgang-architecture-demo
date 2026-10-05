import type { Env } from '../types';
import { KINDS, TTL_SECONDS, demoEvents, latestEvents } from './storage';

interface AuditEventBody {
  demoId: string;
  eventType: string;
  payload: unknown;
  createdAt: string;
}

export interface DemoEventRow {
  id: number;
  demo_id: string;
  event_type: string;
  payload_json: string | null;
  created_at: string;
}

/** Appends one audit event. Its id is the event time in milliseconds, which is what events.append returns. */
export async function recordDemoEvent(
  env: Env,
  demoId: string,
  eventType: string,
  payload: unknown = null,
): Promise<{ id: number; createdAt: string }> {
  const createdAt = new Date().toISOString();
  const body: AuditEventBody = { demoId, eventType, payload, createdAt };
  const id = await demoEvents(env).append(KINDS.audit, body, { ttlSeconds: TTL_SECONDS.auditEvent });
  return { id, createdAt };
}

export async function recentDemoEvents(env: Env, limit = 20): Promise<DemoEventRow[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const recent = await latestEvents<AuditEventBody>(env, KINDS.audit, safeLimit, TTL_SECONDS.auditEvent);
  return recent.map(({ at, body }) => ({
    id: at,
    demo_id: body.demoId,
    event_type: body.eventType,
    payload_json: body.demoId === 'identity' ? null : JSON.stringify(body.payload ?? null),
    created_at: body.createdAt,
  }));
}
