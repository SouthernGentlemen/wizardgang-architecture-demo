import type { PublicEvidence, FreshnessPolicy } from './registry';
import { repoUrl } from '../lib/github';
import type { Env } from '../types';

export interface FreshnessSemantics {
  scope: 'deployment' | 'controlled-event' | 'live-observation';
  meaning: string;
}

export const FRESHNESS_SEMANTICS: Record<FreshnessPolicy, FreshnessSemantics> = {
  'release-bound': {
    scope: 'deployment',
    meaning: 'Current for the exact deployed source revision. A later deployment establishes a new release-bound revision.',
  },
  'event-driven': {
    scope: 'controlled-event',
    meaning: 'Current until the governed record or material event requires review or replacement.',
  },
  'observation-bound': {
    scope: 'live-observation',
    meaning: 'The locator must be observed at use time; the registry does not treat an earlier observation as current state.',
  },
};

export interface AssuranceDeploymentContext {
  version: string | null;
  commit: string | null;
  sourceResolution: 'deployed-commit' | 'not-supplied';
}

export type ResolvedEvidenceLocator =
  | {
      kind: 'repository';
      repositoryPath: string;
      revision: string | null;
      url: string | null;
      resolution: 'deployed-commit' | 'not-supplied';
    }
  | {
      kind: 'route';
      route: string;
      url: string;
      resolution: 'live-route';
    };

export interface PresentedPublicEvidence extends PublicEvidence {
  usedBy: string[];
  freshness: FreshnessSemantics & { policy: FreshnessPolicy };
  resolved: ResolvedEvidenceLocator;
}

type EvidenceWithUsedBy = PublicEvidence & { usedBy?: string[] };

export function assuranceDeploymentContext(env: Env): AssuranceDeploymentContext {
  const commit = env.DEPLOYED_SHA?.trim() || null;
  return {
    version: env.DEPLOYED_VERSION?.trim() || null,
    commit,
    sourceResolution: commit ? 'deployed-commit' : 'not-supplied',
  };
}

export function presentPublicEvidence(record: EvidenceWithUsedBy, env: Env, origin: string): PresentedPublicEvidence {
  const freshness = {
    policy: record.freshnessPolicy,
    ...FRESHNESS_SEMANTICS[record.freshnessPolicy],
  };
  const commit = env.DEPLOYED_SHA?.trim() || null;

  if (record.locator.repositoryPath) {
    const repositoryPath = record.locator.repositoryPath;
    return {
      ...record,
      usedBy: [...(record.usedBy ?? [])],
      freshness,
      resolved: {
        kind: 'repository',
        repositoryPath,
        revision: commit,
        url: commit ? `${repoUrl(env)}/blob/${encodeURIComponent(commit)}/${repositoryPath}` : null,
        resolution: commit ? 'deployed-commit' : 'not-supplied',
      },
    };
  }

  const route = record.locator.route as string;
  return {
    ...record,
    usedBy: [...(record.usedBy ?? [])],
    freshness,
    resolved: {
      kind: 'route',
      route,
      url: new URL(route, origin).toString(),
      resolution: 'live-route',
    },
  };
}
