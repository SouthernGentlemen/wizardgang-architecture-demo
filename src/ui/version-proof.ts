import { repoUrl } from '../lib/github';
import type { Env } from '../types';

export function versionProof(env: Env): { label: string; detail: string; href: string } {
  const version = env.DEPLOYED_VERSION || 'development';
  const commit = env.DEPLOYED_SHA?.trim() || '';
  return {
    label: version,
    detail: commit ? `Commit ${commit.slice(0, 7)}` : 'Commit not supplied',
    href: commit ? `${repoUrl(env)}/commit/${encodeURIComponent(commit)}` : repoUrl(env),
  };
}
