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
  type AssuranceRuntimeRecord,
} from './model';
import { assuranceLifecycleBaselineMembership } from './generated/registry-bindings';
import { requireAssuranceCapabilityResource } from './record-discovery.js';
import { presentEvidence, type PresentedEvidence } from './presentation';
import {
  assuranceObservedState,
  assurancePublicationDecision,
  resolveAssuranceLifecycle,
  assuranceLifecyclePresentation,
  type AssuranceLifecyclePresentation,
  type AssuranceLifecycleRecord,
  type AssuranceLifecycleRegistry,
  type AssuranceObservedState,
} from './publication-policy.js';
import type { Env } from '../types';

const lifecycleResource = requireAssuranceCapabilityResource(
  assuranceRegistry,
  'lifecycle',
) as AssuranceRegistryResource;
const lifecycleRegistry = runtimeAssuranceDataset<AssuranceLifecycleRegistry>(lifecycleResource);
const lifecycleResolutionOptions = { baselineMembership: assuranceLifecycleBaselineMembership };

export type PublishedAssuranceRecord<T> = T & {
  publication: AssuranceLifecyclePresentation;
};

export type PublishedAssuranceRecordMap = {
  [K in AssuranceDataset]: PublishedAssuranceRecord<AssuranceRecordMap[K]>;
};

export type PublishedAssuranceRuntimeRecord = PublishedAssuranceRecord<AssuranceRuntimeRecord>;

export type PresentedPublishedEvidence = PresentedEvidence<PublishedAssuranceRecordMap['evidence']> & {
  observation?: AssuranceObservedState;
};

function publishRuntimeRecord(
  dataset: string,
  record: AssuranceRuntimeRecord,
): PublishedAssuranceRuntimeRecord | undefined {
  const decision = assurancePublicationDecision(
    primaryAssuranceResource(dataset),
    lifecycleRegistry,
    record.id,
    lifecycleResolutionOptions,
  );
  if (!decision.selected || !decision.presentation) return undefined;
  return { ...record, publication: decision.presentation };
}

export function listPublishedAssuranceRecords<K extends AssuranceDataset>(
  dataset: K,
): PublishedAssuranceRecordMap[K][];
export function listPublishedAssuranceRecords(dataset: string): PublishedAssuranceRuntimeRecord[];
export function listPublishedAssuranceRecords(dataset: string): PublishedAssuranceRuntimeRecord[] {
  return listAssuranceRecords(dataset).flatMap((record) => {
    const published = publishRuntimeRecord(dataset, record);
    return published ? [published] : [];
  });
}

export function findPublishedAssuranceRecord<K extends AssuranceDataset>(
  dataset: K,
  recordId: string,
): PublishedAssuranceRecordMap[K] | undefined;
export function findPublishedAssuranceRecord(dataset: string, recordId: string): PublishedAssuranceRuntimeRecord | undefined;
export function findPublishedAssuranceRecord(dataset: string, recordId: string): PublishedAssuranceRuntimeRecord | undefined {
  const record = listAssuranceRecords(dataset).find((candidate) => candidate.id === recordId);
  return record ? publishRuntimeRecord(dataset, record) : undefined;
}

export function filterPublishedAssuranceRecords<K extends AssuranceDataset>(
  dataset: K,
  filters: AssuranceFilterValues,
): PublishedAssuranceRecordMap[K][];
export function filterPublishedAssuranceRecords(
  dataset: string,
  filters: AssuranceFilterValues,
): PublishedAssuranceRuntimeRecord[];
export function filterPublishedAssuranceRecords(
  dataset: string,
  filters: AssuranceFilterValues,
): PublishedAssuranceRuntimeRecord[] {
  return filterAssuranceRecords(dataset, filters, listPublishedAssuranceRecords(dataset));
}

export function assurancePublicationForRecord(
  dataset: string,
  recordId: string,
): AssuranceLifecyclePresentation | null {
  primaryAssuranceResource(dataset);
  return assuranceLifecyclePresentation(resolveAssuranceLifecycle(
    lifecycleRegistry,
    recordId,
    lifecycleResolutionOptions,
  ));
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

function retainedLifecyclePresentation(record: AssuranceLifecycleRecord): AssuranceLifecyclePresentation {
  const presentation = assuranceLifecyclePresentation({
    ...record,
    source: 'retired',
    retained: true,
  });
  if (!presentation?.id) {
    throw new Error(`Retained assurance record ${record.id} lost its stable identity during publication.`);
  }
  return presentation;
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
    retainedRecords: (lifecycleRegistry.retiredRecords ?? []).map(retainedLifecyclePresentation),
  },
};
