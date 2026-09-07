import type { Env } from '../types';
import { json } from './http';
import { readDemoAccessToken, readIdentitySession, sha256, type IdentitySession } from './identity-session';

export type Permission = 'demo:read' | 'demo:write' | 'reporting:private' | 'reporting:write';

export interface Principal {
  subject: string;
  authentication: 'anonymous' | 'bearer' | 'oidc' | 'oauth2' | 'saml2';
  provider?: 'operator' | 'microsoft' | 'google' | 'github';
  role?: 'viewer' | 'operator';
  permissions: Permission[];
  namespace?: string;
  expiresAt?: string;
}

interface AuthorizationOptions {
  allowIdentitySession?: boolean;
}

export async function principalFromIdentitySession(session: IdentitySession): Promise<Principal> {
  const subject = `${session.identity.provider}:${session.identity.subject}`;
  const permissions: Permission[] = ['demo:read', 'demo:write'];
  if (session.identity.role === 'operator') permissions.push('reporting:private', 'reporting:write');
  return {
    subject,
    authentication: session.identity.protocol,
    provider: session.identity.provider,
    role: session.identity.role,
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
    return { subject: 'public-visitor', authentication: 'anonymous', role: 'viewer', permissions: ['demo:read'] };
  }

  return rejected();
}
