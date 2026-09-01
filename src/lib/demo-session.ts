import type { Env } from '../types';
import { HttpError } from './http';

const COOKIE_NAME = 'wg_demo_session';
const MAX_AGE_SECONDS = 24 * 60 * 60;
const encoder = new TextEncoder();

interface SessionRow {
  id: string;
  expires_at: string;
}

export interface DemoSession {
  id: string;
  setCookie?: string;
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function bytesFromHex(value: string): ArrayBuffer | null {
  if (!/^[0-9a-f]{64}$/.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16)).buffer as ArrayBuffer;
}

async function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(id: string, secret: string): Promise<string> {
  return hex(await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(id)));
}

export async function createSignedDemoSessionValue(id: string, secret: string): Promise<string> {
  return `${id}.${await sign(id, secret)}`;
}

export async function verifySignedDemoSessionValue(value: string, secret: string): Promise<string | null> {
  if (value.length > 160) return null;
  const separator = value.lastIndexOf('.');
  const id = value.slice(0, separator);
  const signature = bytesFromHex(value.slice(separator + 1));
  if (!/^[0-9a-f-]{36}$/.test(id) || !signature) return null;
  const valid = await crypto.subtle.verify('HMAC', await signingKey(secret), signature, encoder.encode(id));
  return valid ? id : null;
}

function cookieValue(request: Request): string | null {
  const header = request.headers.get('cookie') || '';
  for (const item of header.split(';')) {
    const [name, ...parts] = item.trim().split('=');
    if (name === COOKIE_NAME) return parts.join('=');
  }
  return null;
}

function serializedCookie(value: string): string {
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; Secure; HttpOnly; SameSite=Lax`;
}

export async function ensureDemoSession(request: Request, env: Env): Promise<DemoSession> {
  const secret = env.DEMO_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new HttpError(503, 'demo_session_not_configured');
  const now = new Date();
  const candidate = cookieValue(request);
  const verifiedId = candidate ? await verifySignedDemoSessionValue(candidate, secret) : null;

  if (verifiedId) {
    const result = await env.DEMO_DB.prepare(
      'SELECT id, expires_at FROM demo_sessions WHERE id = ? LIMIT 1',
    ).bind(verifiedId).all<SessionRow>();
    const row = result.results[0];
    if (row && Date.parse(row.expires_at) > now.getTime()) {
      await env.DEMO_DB.prepare('UPDATE demo_sessions SET last_seen_at = ? WHERE id = ?')
        .bind(now.toISOString(), verifiedId).run();
      return { id: verifiedId };
    }
  }

  const id = crypto.randomUUID();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + MAX_AGE_SECONDS * 1000).toISOString();
  await env.DEMO_DB.prepare(
    'INSERT INTO demo_sessions (id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?)',
  ).bind(id, createdAt, expiresAt, createdAt).run();
  return { id, setCookie: serializedCookie(await createSignedDemoSessionValue(id, secret)) };
}

export function withDemoSession(response: Response, session: DemoSession): Response {
  if (!session.setCookie) return response;
  const headers = new Headers(response.headers);
  headers.append('set-cookie', session.setCookie);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
