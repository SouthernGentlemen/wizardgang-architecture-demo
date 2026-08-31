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

export function requireAdmin(request: Request, env: Env): AdminIdentity | Response {
  if (!env.DEMO_ADMIN_USER || !env.DEMO_ADMIN_PASSWORD) {
    return new Response('Demo admin is not configured.', { status: 503, headers: { 'cache-control': 'no-store' } });
  }
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return unauthorized();
  try {
    const decoded = atob(header.slice(6));
    const split = decoded.indexOf(':');
    const username = decoded.slice(0, split);
    const password = decoded.slice(split + 1);
    if (split < 0 || username !== env.DEMO_ADMIN_USER || password !== env.DEMO_ADMIN_PASSWORD) return unauthorized();
    return { username };
  } catch {
    return unauthorized();
  }
}
