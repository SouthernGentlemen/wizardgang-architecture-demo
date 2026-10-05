import { GitHubAppError, githubAppToken } from '#wg-edge';
import type { GitHubPermissionLevel } from '#wg-edge';
import type { Env } from '../types';

// Every Worker GitHub call acts as wg-github-app (baseline config/secrets.json). GITHUB_APP_ID and
// GITHUB_APP_INSTALLATION_ID are public vars; GITHUB_APP_PRIVATE_KEY is the Worker secret. Each call asks for the
// fewest permissions it needs, and wg-edge reuses one installation token per permission set until it nears expiry.

export type GitHubAppPermissions = Readonly<Record<string, GitHubPermissionLevel>>;

export { GitHubAppError };

const tokens = new Map<string, Promise<{ token: string; expiresAt: number }>>();

/** True when the App ID, installation ID and private key are all present; no value is read. */
export function githubAppConfigured(env: Pick<Env, 'GITHUB_APP_ID' | 'GITHUB_APP_INSTALLATION_ID' | 'GITHUB_APP_PRIVATE_KEY'>): boolean {
  return Boolean(env.GITHUB_APP_ID && env.GITHUB_APP_INSTALLATION_ID && env.GITHUB_APP_PRIVATE_KEY);
}

/** An installation token holding exactly `permissions`, or null when the App is not configured. Throws GitHubAppError. */
export async function githubAppTokenFor(env: Env, permissions: GitHubAppPermissions): Promise<string | null> {
  if (!githubAppConfigured(env)) return null;
  return githubAppToken(env, { installationId: env.GITHUB_APP_INSTALLATION_ID as string, permissions: { ...permissions } }, { cache: tokens });
}

export function clearGitHubAppTokensForTest(): void {
  tokens.clear();
}
