import governanceReferenceData from '../../docs/governance/REFERENCE-REGISTRY.json';
import { repoUrl } from '../lib/github';
import type { Env } from '../types';
import { evidenceUsedBy } from './service';
import type { EvidenceRecord, FreshnessPolicy } from './model';

export const FRESHNESS_SEMANTICS: Record<FreshnessPolicy, { scope: 'deployment' | 'controlled-event' | 'live-observation'; meaning: string }> = {
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

export type PresentedEvidence<T extends EvidenceRecord = EvidenceRecord> = T & {
  usedBy: string[];
  freshness: {
    policy: FreshnessPolicy;
    scope: 'deployment' | 'controlled-event' | 'live-observation';
    meaning: string;
  };
  resolved: ResolvedEvidenceLocator;
};

export interface GovernanceDocumentLink {
  reference: string;
  repositoryPath: string;
}

const governanceDocuments = new Map(
  governanceReferenceData.records.map((record) => [record.reference, record.path]),
);

export function governanceDocumentLinks(references: string[]): GovernanceDocumentLink[] {
  return references.map((reference) => ({
    reference,
    repositoryPath: governanceDocuments.get(reference) ?? '',
  }));
}

export function assuranceDeploymentContext(env: Env): AssuranceDeploymentContext {
  const commit = env.DEPLOYED_SHA?.trim() || null;
  return {
    version: env.DEPLOYED_VERSION?.trim() || null,
    commit,
    sourceResolution: commit ? 'deployed-commit' : 'not-supplied',
  };
}

export function assuranceDeploymentCommitUrl(
  env: Env,
  context: AssuranceDeploymentContext = assuranceDeploymentContext(env),
): string | null {
  return context.commit ? `${repoUrl(env)}/commit/${encodeURIComponent(context.commit)}` : null;
}

export function presentEvidence<T extends EvidenceRecord>(record: T, env: Env, origin: string): PresentedEvidence<T> {
  const freshness = {
    policy: record.freshnessPolicy,
    ...FRESHNESS_SEMANTICS[record.freshnessPolicy],
  };
  const deployment = assuranceDeploymentContext(env);
  const usedBy = evidenceUsedBy(record.id);

  if (record.locator.repositoryPath) {
    const repositoryPath = record.locator.repositoryPath;
    return {
      ...record,
      usedBy,
      freshness,
      resolved: {
        kind: 'repository',
        repositoryPath,
        revision: deployment.commit,
        url: deployment.commit ? `${repoUrl(env)}/blob/${encodeURIComponent(deployment.commit)}/${repositoryPath}` : null,
        resolution: deployment.sourceResolution,
      },
    };
  }

  const route = record.locator.route as string;
  return {
    ...record,
    usedBy,
    freshness,
    resolved: {
      kind: 'route',
      route,
      url: new URL(route, origin).toString(),
      resolution: 'live-route',
    },
  };
}
