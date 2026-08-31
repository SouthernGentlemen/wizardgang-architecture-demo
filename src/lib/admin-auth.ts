import type { Env } from '../types';

export interface AdminIdentity { username: string; }

function unauthorized(): Response {
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'www-authenticate': 'Basic realm="WizardGang Demo Admin", charset="UTF-8"',
      'cache-control': 'no-store'
    }
  });
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function equalSecret(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  let mismatch = a.byteLength ^ b.byteLength;
  const length = Math.max(a.byteLength, b.byteLength);
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return mismatch === 0;
}

export async function requireAdmin(request: Request, env: Env): Promise<AdminIdentity | Response> {
  if (!env.DEMO_ADMIN_USER || !env.DEMO_ADMIN_PASSWORD) {
    return new Response('Demo admin is not configured.', { status: 503, headers: { 'cache-control': 'no-store' } });
  }
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Basic ') || header.length > 4096) return unauthorized();
  try {
    const decoded = atob(header.slice(6));
    const split = decoded.indexOf(':');
    const username = decoded.slice(0, split);
    const password = decoded.slice(split + 1);
    if (split < 0) return unauthorized();
    const valid = await equalSecret(`${username}\u0000${password}`, `${env.DEMO_ADMIN_USER}\u0000${env.DEMO_ADMIN_PASSWORD}`);
    if (!valid) return unauthorized();
    return { username };
  } catch {
    return unauthorized();
  }
}

export function requireSameOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  if (!origin || origin !== expected) {
    return new Response('A same-origin form submission is required.', {
      status: 403,
      headers: { 'cache-control': 'no-store' },
    });
  }
  return null;
}
