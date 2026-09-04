import type { Env } from '../types';
import { json } from './http';
import { readDemoAccessToken, readIdentitySession, sha256, type IdentitySession } from './identity-session';

export type Permission = 'demo:read' | 'demo:write' | 'reporting:private' | 'reporting:write';

export interface Principal {
  subject: string;
  authentication: 'anonymous' | 'bearer' | 'oidc' | 'oauth2' | 'saml2';
  provider?: 'operator' | 'microsoft' | 'google' | 'github';
  permissions: Permission[];
  namespace?: string;
  expiresAt?: string;
}

interface AuthorizationOptions {
  allowIdentitySession?: boolean;
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

export async function principalFromIdentitySession(session: IdentitySession): Promise<Principal> {
  const subject = `${session.identity.provider}:${session.identity.subject}`;
  const permissions: Permission[] = ['demo:read', 'demo:write'];
  if (session.identity.role === 'operator') permissions.push('reporting:private', 'reporting:write');
  return {
    subject,
    authentication: session.identity.protocol,
    provider: session.identity.provider,
    permissions,
    namespace: `sandbox-${(await sha256(subject)).slice(0, 24)}`,
    expiresAt: session.expiresAt,
  };
}

function rejected(): Response {
  return json({ error: 'authentication_required' }, {
    status: 401,
    headers: { 'www-authenticate': 'Bearer realm="WizardGang architecture demo"', 'cache-control': 'no-store' },
  });
}

function denied(): Response {
  return json({ error: 'permission_denied' }, { status: 403, headers: { 'cache-control': 'no-store' } });
}

export async function authorize(request: Request, env: Env, permission: Permission, options: AuthorizationOptions = {}): Promise<Principal | Response> {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    const visitor = await readDemoAccessToken(env, token);
    if (visitor) {
      if (!visitor.permissions.some((candidate) => candidate === permission)) return denied();
      return visitor;
    }
    if (env.DEMO_API_TOKEN && await secretMatches(token, env.DEMO_API_TOKEN)) {
      const operator: Principal = {
        subject: 'demo-api-operator',
        authentication: 'bearer',
        provider: 'operator',
        permissions: ['demo:read', 'demo:write'],
      };
      if (!operator.permissions.includes(permission)) return denied();
      return operator;
    }
    return rejected();
  }

  if (options.allowIdentitySession) {
    const session = await readIdentitySession(request, env);
    if (session) {
      const principal = await principalFromIdentitySession(session);
      if (principal.permissions.includes(permission)) return principal;
      return denied();
    }
  }

  if (permission === 'demo:read') {
    return { subject: 'public-visitor', authentication: 'anonymous', permissions: ['demo:read'] };
  }

  return rejected();
}
