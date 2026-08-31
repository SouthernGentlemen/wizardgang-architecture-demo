import type { Env } from '../types';

export function sourceUrl(env: Env, path: string): string {
  const base = env.GITHUB_REPO_URL.replace(/\/$/, '');
  const revision = encodeURIComponent(env.DEPLOYED_SHA || env.GITHUB_BRANCH || 'main');
  return `${base}/blob/${revision}/${path}`;
}

export function repoUrl(env: Env): string {
  return env.GITHUB_REPO_URL.replace(/\/$/, '');
}
