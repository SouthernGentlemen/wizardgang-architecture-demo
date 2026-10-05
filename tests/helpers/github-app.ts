import { generateKeyPairSync } from 'node:crypto';
import type { Env } from '../../src/types';

export const appInstallationId = '987654';

// A throwaway PKCS#8 key generated per run; wg-edge signs the App JWT with it and appTokenResponse issues the token.
const appPrivateKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

export const githubAppEnv: Pick<Env, 'GITHUB_APP_ID' | 'GITHUB_APP_INSTALLATION_ID' | 'GITHUB_APP_PRIVATE_KEY'> = {
  GITHUB_APP_ID: '123456',
  GITHUB_APP_INSTALLATION_ID: appInstallationId,
  GITHUB_APP_PRIVATE_KEY: appPrivateKey,
};

/** The fixture installation token for one permission set, named after the permissions it holds. */
export function appToken(permissions: Record<string, string>): string {
  return `app-installation-token-${Object.entries(permissions).map(([name, level]) => `${name}-${level}`).join('-')}`;
}

/** The access-token exchange answer for a fetch mock, or null when the request is not that exchange. */
export function appTokenResponse(input: RequestInfo | URL, init?: RequestInit): Response | null {
  const url = new URL(String(input));
  if (url.pathname !== `/app/installations/${appInstallationId}/access_tokens` || init?.method !== 'POST') return null;
  const { permissions } = JSON.parse(String(init.body)) as { permissions: Record<string, string> };
  return new Response(JSON.stringify({
    token: appToken(permissions),
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    permissions: { ...permissions, metadata: 'read' },
  }), { status: 201, headers: { 'content-type': 'application/json' } });
}

/** The permission sets requested from the access-token exchange, in call order. */
export function mintedPermissions(calls: ReadonlyArray<readonly unknown[]>): Array<Record<string, string>> {
  return calls
    .filter(([input, init]) => appTokenResponse(input as RequestInfo, init as RequestInit) !== null)
    .map(([, init]) => (JSON.parse(String((init as RequestInit).body)) as { permissions: Record<string, string> }).permissions);
}
