import {
  advisoryQualification,
  assuranceQualification,
  deriveIncidentCounts,
  deriveRiskCounts,
  filterAssuranceRecords,
  incidentQualifications,
  listAssuranceRecords,
  type AssuranceFilterValues,
  type AssuranceRecordMap,
} from './service';
import {
  assuranceRegistry,
  primaryAssuranceResource,
  runtimeAssuranceDataset,
  type AssuranceDataset,
  type AssuranceRegistryResource,
} from './model';
import { requireAssuranceCapabilityResource } from './record-discovery.js';
import { presentEvidence, type PresentedEvidence } from './presentation';
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

const lifecycleResource = requireAssuranceCapabilityResource(
  assuranceRegistry,
  'lifecycle',
) as AssuranceRegistryResource;
const lifecycleRegistry = runtimeAssuranceDataset<AssuranceLifecycleRegistry>(lifecycleResource);

export type PublishedAssuranceRecord<T> = T & {
  publication: AssuranceLifecyclePresentation;
};

export type PublishedAssuranceRecordMap = {
  [K in AssuranceDataset]: PublishedAssuranceRecord<AssuranceRecordMap[K]>;
};

export type PresentedPublishedEvidence = PresentedEvidence<PublishedAssuranceRecordMap['evidence']> & {
  observation?: AssuranceObservedState;
};

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
  const record = listAssuranceRecords(dataset).find((candidate) => candidate.id === recordId);
  return record ? publishRecord(dataset, record) : undefined;
}

export function filterPublishedAssuranceRecords<K extends AssuranceDataset>(
  dataset: K,
  filters: AssuranceFilterValues,
): PublishedAssuranceRecordMap[K][] {
  return filterAssuranceRecords(dataset, filters, listPublishedAssuranceRecords(dataset));
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
    const presented = presentEvidence(record, env, origin);
    const observation = assuranceObservedState(record, now);
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

export const publishedAssuranceSummary = {
  qualification: assuranceQualification,
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
  incidentQualifications,
  advisoryQualification,
  publication: {
    retainedRecords: (lifecycleRegistry.retiredRecords ?? []).map((record) => assuranceLifecyclePresentation({
      ...record,
      source: 'retired',
      retained: true,
    })).filter((record): record is AssuranceLifecyclePresentation => record !== null),
  },
};
