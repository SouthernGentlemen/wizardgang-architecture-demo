import type { Env } from '../types';
import { KINDS, TTL_SECONDS, demoEvents, latestEvents } from './storage';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ApplicationLogInput {
  level?: LogLevel;
  source: string;
  eventKey: string;
  message: string;
  route?: string | null;
  requestId?: string | null;
  detail?: unknown;
}

export interface ApplicationLogRow {
  id: number;
  level: LogLevel;
  source: string;
  event_key: string;
  message: string;
  route: string | null;
  request_id: string | null;
  detail_json: string | null;
  created_at: string;
}

function safeText(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

const SENSITIVE_KEY = /(password|passwd|token|authorization|cookie|secret|api[_-]?key|access[_-]?key|private[_-]?key|payment|card|credential|account[_-]?id|request[_-]?body|raw[_-]?body)/i;
const SENSITIVE_VALUE = /(?:bearer\s+[a-z0-9._~+/-]{8,}|sk-[a-z0-9_-]{8,})/i;

function redactDetail(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redactDetail(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).slice(0, 100).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[redacted]' : redactDetail(item, depth + 1),
      ]),
    );
  }
  if (typeof value === 'string') return SENSITIVE_VALUE.test(value) ? '[redacted]' : safeText(value, 1000);
  return value;
}

export async function recordApplicationLog(env: Env, input: ApplicationLogInput): Promise<void> {
  const createdAt = new Date().toISOString();
  const serializedDetail = input.detail === undefined ? null : JSON.stringify(redactDetail(input.detail));
  const detailJson = serializedDetail && serializedDetail.length > 4000
    ? JSON.stringify({ truncated: true, preview: serializedDetail.slice(0, 3000) })
    : serializedDetail;

  const entry: Omit<ApplicationLogRow, 'id'> = {
    level: input.level ?? 'info',
    source: safeText(input.source, 80),
    event_key: safeText(input.eventKey, 120),
    message: safeText(input.message, 500),
    route: input.route ? safeText(input.route, 200) : null,
    request_id: input.requestId ? safeText(input.requestId, 120) : null,
    detail_json: detailJson,
    created_at: createdAt,
  };
  await demoEvents(env).append(KINDS.log, entry, { ttlSeconds: TTL_SECONDS.log });
}

export async function recentApplicationLogs(
  env: Env,
  options: { limit?: number; level?: string | null; source?: string | null; requestId?: string | null } = {},
): Promise<ApplicationLogRow[]> {
  const limit = Math.max(1, Math.min(Number(options.limit ?? 50) || 50, 200));
  const level = options.level && ['debug', 'info', 'warn', 'error'].includes(options.level)
    ? options.level
    : null;
  const source = options.source?.trim().slice(0, 80) || null;
  const requestId = options.requestId?.trim().slice(0, 120) || null;

  const recent = await latestEvents<Omit<ApplicationLogRow, 'id'>>(env, KINDS.log, limit, TTL_SECONDS.log, (row) =>
    (!level || row.level === level) && (!source || row.source === source) && (!requestId || row.request_id === requestId));
  return recent.map(({ at, body }) => {
    const row: ApplicationLogRow = { id: at, ...body };
    return row.source === 'identity' ? { ...row, detail_json: null } : row;
  });
}
