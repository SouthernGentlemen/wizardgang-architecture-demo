import type { Env } from '../types';

export function sourceUrl(env: Env, path: string): string {
  const base = env.GITHUB_REPO_URL.replace(/\/$/, '');
  const branch = encodeURIComponent(env.GITHUB_BRANCH || 'main');
  return `${base}/blob/${branch}/${path}`;
}

export function repoUrl(env: Env): string {
  return env.GITHUB_REPO_URL.replace(/\/$/, '');
}
