import lifecycleData from '../../assurance/lifecycle/records.json';
import {
  deriveIncidentCounts,
  deriveRiskCounts,
  filterPublicCompliance,
  filterPublicRisks,
  listAssuranceRecords,
  presentPublicEvidence,
  publicAssuranceRegistry,
  type AssuranceDataset,
  type AssuranceRecordMap,
  type PresentedPublicEvidence,
  type PublicComplianceFilters,
  type PublicRiskFilters,
} from './service';
import { primaryAssuranceResource } from './model';
import {
  assuranceObservedState,
  assurancePublicationDecision,
  resolveAssuranceLifecycle,
  assuranceLifecyclePresentation,
  type AssuranceLifecyclePresentation,
  type AssuranceLifecycleRegistry,
  type AssuranceObservedState,
} from './publication-policy.js';
import type { Env } from '../types';

const lifecycleRegistry = lifecycleData as unknown as AssuranceLifecycleRegistry;

export type PublishedAssuranceRecord<T> = T & {
  publication: AssuranceLifecyclePresentation;
};

export type PublishedAssuranceRecordMap = {
  [K in AssuranceDataset]: PublishedAssuranceRecord<AssuranceRecordMap[K]>;
};

export interface PresentedPublishedEvidence extends PresentedPublicEvidence {
  publication: AssuranceLifecyclePresentation;
  observation?: AssuranceObservedState;
}

function publishRecord<K extends AssuranceDataset>(
  dataset: K,
  record: AssuranceRecordMap[K],
): PublishedAssuranceRecordMap[K] | undefined {
  const decision = assurancePublicationDecision(
    primaryAssuranceResource(dataset),
    lifecycleRegistry,
    record.id,
  );
  if (!decision.selected || !decision.presentation) return undefined;
  return { ...record, publication: decision.presentation } as PublishedAssuranceRecordMap[K];
}

function publishRecords<K extends AssuranceDataset>(
  dataset: K,
  records: AssuranceRecordMap[K][],
): PublishedAssuranceRecordMap[K][] {
  return records.flatMap((record) => {
    const published = publishRecord(dataset, record);
    return published ? [published] : [];
  });
}

export function listPublishedAssuranceRecords<K extends AssuranceDataset>(
  dataset: K,
): PublishedAssuranceRecordMap[K][] {
  return publishRecords(dataset, listAssuranceRecords(dataset));
}

export function findPublishedAssuranceRecord<K extends AssuranceDataset>(
  dataset: K,
  recordId: string,
): PublishedAssuranceRecordMap[K] | undefined {
  return listPublishedAssuranceRecords(dataset).find((record) => record.id === recordId);
}

export function filterPublishedRisks(
  filters: PublicRiskFilters,
): PublishedAssuranceRecordMap['risks'][] {
  return publishRecords('risks', filterPublicRisks(filters));
}

export function filterPublishedCompliance(
  filters: PublicComplianceFilters,
): PublishedAssuranceRecordMap['compliance'][] {
  return publishRecords('compliance', filterPublicCompliance(filters));
}

export function assurancePublicationForRecord(
  dataset: AssuranceDataset,
  recordId: string,
): AssuranceLifecyclePresentation | null {
  return assuranceLifecyclePresentation(resolveAssuranceLifecycle(lifecycleRegistry, recordId));
}

export function presentedPublishedEvidenceRecords(
  env: Env,
  origin: string,
  now: Date = new Date(),
): PresentedPublishedEvidence[] {
  return listPublishedAssuranceRecords('evidence').map((record) => {
    const presented = presentPublicEvidence(record, env, origin) as PresentedPublishedEvidence;
    const observation = assuranceObservedState(
      record as typeof record & { observedAt?: string; validUntil?: string },
      now,
    );
    return {
      ...presented,
      publication: record.publication,
      ...(observation ? { observation } : {}),
    };
  });
}

const claims = listPublishedAssuranceRecords('claims');
const evidence = listPublishedAssuranceRecords('evidence');
const risks = listPublishedAssuranceRecords('risks');
const incidents = listPublishedAssuranceRecords('incidents');
const exercises = listPublishedAssuranceRecords('exercises');
const advisories = listPublishedAssuranceRecords('advisories');

export const publicPublishedAssuranceRegistry = {
  ...publicAssuranceRegistry,
  counts: {
    claims: claims.length,
    evidence: evidence.length,
    risks: risks.length,
    incidents: incidents.length,
    exercises: exercises.length,
    advisories: advisories.length,
  },
  riskCounts: deriveRiskCounts(risks),
  incidentCounts: deriveIncidentCounts(incidents, exercises),
  claims,
  risks,
  incidents,
  exercises,
  advisories,
  evidence: evidence.map((record) => ({
    ...record,
    usedBy: publicAssuranceRegistry.evidence.find((candidate) => candidate.id === record.id)?.usedBy ?? [],
  })),
  publication: {
    retainedRecords: (lifecycleRegistry.retiredRecords ?? []).map((record) => assuranceLifecyclePresentation({
      ...record,
      source: 'retired',
      retained: true,
    })).filter((record): record is AssuranceLifecyclePresentation => record !== null),
  },
};
