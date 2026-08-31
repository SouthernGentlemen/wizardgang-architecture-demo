import type { Env } from '../types';
import { json } from './http';

export type Permission = 'demo:read' | 'demo:write';

export interface Principal {
  subject: string;
  authentication: 'anonymous' | 'bearer';
  permissions: Permission[];
}

async function secretMatches(actual: string, expected: string): Promise<boolean> {
  const encode = (value: string) => new TextEncoder().encode(value);
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encode(actual)),
    crypto.subtle.digest('SHA-256', encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let mismatch = a.byteLength ^ b.byteLength;
  for (let index = 0; index < Math.max(a.byteLength, b.byteLength); index += 1) mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return mismatch === 0;
}

export async function authorize(request: Request, env: Env, permission: Permission): Promise<Principal | Response> {
  if (permission === 'demo:read' && !request.headers.has('authorization')) {
    return { subject: 'public-visitor', authentication: 'anonymous', permissions: ['demo:read'] };
  }

  if (!env.DEMO_API_TOKEN) {
    return json({ error: 'protected_demo_not_configured' }, {
      status: 503,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ') || !(await secretMatches(header.slice(7), env.DEMO_API_TOKEN))) {
    return json({ error: 'authentication_required' }, {
      status: 401,
      headers: { 'www-authenticate': 'Bearer realm="WizardGang architecture demo"', 'cache-control': 'no-store' },
    });
  }

  return {
    subject: 'demo-api-operator',
    authentication: 'bearer',
    permissions: ['demo:read', 'demo:write'],
  };
}
