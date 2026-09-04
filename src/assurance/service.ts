import {
  assuranceCanonicalRecordCollections,
  assuranceComplianceFrameworks,
  assuranceQualifications,
  assuranceRegistryResources,
  assuranceRuntimeForwardRelationshipIndex,
  assuranceRuntimeRecordCollections,
  assuranceRuntimeRecordIndex,
  assuranceRuntimeReverseRelationshipIndex,
  primaryAssuranceResource,
  runtimeAssuranceDataset,
  type AssuranceDataset,
  type AssuranceRelationships,
  type AssuranceRegistryFilter,
  type AssuranceRegistryResource,
  type AssuranceRuntimeRecord,
  type AssuranceRuntimeRelationshipReference,
  type CanonicalAssuranceRecordMap,
  type ComplianceCounts,
  type ComplianceFramework,
  type ComplianceLevel,
  type ComplianceStatus,
  type ExerciseRecord,
  type IncidentCounts,
  type IncidentRecord,
  type RiskCounts,
  type RiskFramework,
  type RiskRating,
  type RiskRecord,
  type RiskStatus,
} from './model';
import { assuranceRecordsFromDocument } from './record-discovery.js';
import { assuranceRuntimeFilterVocabularies } from './generated/registry-bindings';
import {
  assuranceAnchor as canonicalAssuranceAnchor,
  assuranceRecordUrls as canonicalAssuranceRecordUrls,
  assuranceRoutesForDataset,
} from './routes';
import {
  createReportingCollection,
  type ReportingCollectionResult,
} from '../reporting/contracts';
import { structuredReportingSource } from '../reporting/registry';

export type AssuranceRecordMap = CanonicalAssuranceRecordMap;
export type AssuranceRecord = CanonicalAssuranceRecordMap[AssuranceDataset];
export type AssuranceFilterValues = Record<string, string>;

function recordsForDataset<K extends AssuranceDataset>(dataset: K): CanonicalAssuranceRecordMap[K][] {
  return assuranceCanonicalRecordCollections[dataset];
}

function reportingResourcesForDataset(dataset: string): AssuranceRegistryResource[] {
  return assuranceRegistryResources.filter((resource) => resource.kind === dataset
    && resource.capabilities.includes('runtime')
    && resource.capabilities.includes('records'));
}

function recordsForReportingResource(dataset: string, resource: AssuranceRegistryResource): AssuranceRuntimeRecord[] {
  const sourceIds = new Set(
    assuranceRecordsFromDocument(resource, runtimeAssuranceDataset(resource))
      .flatMap((record) => {
        if (!record || typeof record !== 'object' || Array.isArray(record)) return [];
        const id = (record as { id?: unknown }).id;
        return typeof id === 'string' && id.length > 0 ? [id] : [];
      }),
  );
  return (assuranceRuntimeRecordCollections[dataset] ?? []).filter((record) => sourceIds.has(record.id));
}

export function assuranceReportingCollections(dataset: string): ReportingCollectionResult<AssuranceRuntimeRecord>[] {
  return reportingResourcesForDataset(dataset).map((resource) => createReportingCollection(
    structuredReportingSource(resource),
    recordsForReportingResource(dataset, resource),
  ));
}

export function listAssuranceRecords<K extends AssuranceDataset>(dataset: K): CanonicalAssuranceRecordMap[K][];
export function listAssuranceRecords(dataset: string): AssuranceRuntimeRecord[];
export function listAssuranceRecords(dataset: string): AssuranceRuntimeRecord[] {
  return assuranceReportingCollections(dataset).flatMap((collection) => collection.records);
}

export function findAssuranceRecord<K extends AssuranceDataset>(dataset: K, recordId: string): CanonicalAssuranceRecordMap[K] | undefined;
export function findAssuranceRecord(dataset: string, recordId: string): AssuranceRuntimeRecord | undefined;
export function findAssuranceRecord(dataset: string, recordId: string): AssuranceRuntimeRecord | undefined {
  const indexed = assuranceRuntimeRecordIndex.get(recordId);
  return indexed?.dataset === dataset ? indexed.record : undefined;
}

export function assuranceDatasetForRecordId(recordId: string): string | undefined {
  return assuranceRuntimeRecordIndex.get(recordId)?.dataset;
}

export function assuranceDatasetCount(dataset: string): number {
  return assuranceReportingCollections(dataset).reduce((total, collection) => total + collection.derived.count, 0);
}

export function assuranceDatasetSource(dataset: AssuranceDataset): string {
  return primaryAssuranceResource(dataset).path;
}

export function assuranceDatasetSchema(dataset: AssuranceDataset): string {
  return primaryAssuranceResource(dataset).schema;
}

export function assuranceFilterDefinitions(dataset: AssuranceDataset): Readonly<Record<string, AssuranceRegistryFilter>> {
  const resource = primaryAssuranceResource(dataset);
  return resource.filters ?? {};
}

export function assuranceFilterNames(dataset: AssuranceDataset): string[] {
  return Object.keys(assuranceFilterDefinitions(dataset));
}

export function assuranceFilterValues(dataset: AssuranceDataset, parameter: string): string[] {
  const definition = assuranceFilterDefinitions(dataset)[parameter];
  if (!definition) return [];
  const values = assuranceRuntimeFilterVocabularies[dataset]?.[parameter];
  if (!values || values.length === 0) {
    throw new Error(`${dataset}.${parameter} does not resolve to an authoritative registered filter vocabulary.`);
  }
  return [...values];
}

function valueAtPath(record: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return (value as Record<string, unknown>)[segment];
  }, record);
}

export interface AssuranceFilterIssue {
  parameter: string;
  value: string | string[];
  allowed: string[];
}

export interface AssuranceFilterNormalization {
  filters: AssuranceFilterValues;
  issues: AssuranceFilterIssue[];
}

export function normalizeAssuranceFilters(dataset: AssuranceDataset, searchParams: URLSearchParams): AssuranceFilterNormalization {
  const filters: AssuranceFilterValues = {};
  const issues: AssuranceFilterIssue[] = [];
  for (const parameter of assuranceFilterNames(dataset)) {
    const values = searchParams.getAll(parameter);
    if (values.length === 0) continue;
    const allowed = assuranceFilterValues(dataset, parameter);
    if (values.length !== 1 || !allowed.includes(values[0])) {
      issues.push({ parameter, value: values.length === 1 ? values[0] : values, allowed });
      continue;
    }
    filters[parameter] = values[0];
  }
  return { filters, issues };
}

export function assuranceFiltersFromUrl(dataset: AssuranceDataset, url: URL): AssuranceFilterValues {
  return normalizeAssuranceFilters(dataset, url.searchParams).filters;
}

export function serializeAssuranceFilters(dataset: AssuranceDataset, filters: AssuranceFilterValues): string {
  const params = new URLSearchParams();
  for (const parameter of assuranceFilterNames(dataset)) {
    const value = filters[parameter];
    if (value !== undefined) params.set(parameter, value);
  }
  return params.toString();
}

export function assuranceFilterPredicate(dataset: AssuranceDataset, filters: AssuranceFilterValues): (record: AssuranceRecord) => boolean {
  const definitions = assuranceFilterDefinitions(dataset);
  return (record) => Object.entries(filters).every(([parameter, expected]) => {
    const definition = definitions[parameter];
    return definition ? valueAtPath(record, definition.path) === expected : true;
  });
}

export function filterAssuranceRecords<K extends AssuranceDataset, T extends CanonicalAssuranceRecordMap[K]>(
  dataset: K,
  filters: AssuranceFilterValues,
  records: T[] = listAssuranceRecords(dataset) as T[],
): T[] {
  const predicate = assuranceFilterPredicate(dataset, filters);
  return records.filter((record) => predicate(record as AssuranceRecord));
}

export interface AssuranceFacetCounts {
  total: number;
  byFilter: Record<string, Record<string, number>>;
}

export function deriveAssuranceCounts<K extends AssuranceDataset>(dataset: K, records: CanonicalAssuranceRecordMap[K][]): AssuranceFacetCounts {
  const byFilter: Record<string, Record<string, number>> = {};
  for (const [parameter, definition] of Object.entries(assuranceFilterDefinitions(dataset))) {
    const counts = Object.fromEntries(assuranceFilterValues(dataset, parameter).map((value) => [value, 0])) as Record<string, number>;
    for (const record of records) {
      const value = valueAtPath(record, definition.path);
      if (typeof value === 'string') counts[value] = (counts[value] ?? 0) + 1;
    }
    byFilter[parameter] = counts;
  }
  return { total: records.length, byFilter };
}

export function labelAssuranceFilterValue(dataset: AssuranceDataset, parameter: string, value: string): string {
  if (dataset === 'compliance' && parameter === 'framework') {
    return assuranceComplianceFrameworks.find((framework) => framework.id === value)?.label ?? value;
  }
  if (value === 'ai') return 'AI';
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

export function deriveRiskCounts(records: RiskRecord[]): RiskCounts {
  const counts = deriveAssuranceCounts('risks', records);
  return {
    total: counts.total,
    byFramework: counts.byFilter.framework as Record<RiskFramework, number>,
    byStatus: counts.byFilter.status as Record<RiskStatus, number>,
    byResidualRating: counts.byFilter.residual as Record<RiskRating, number>,
  };
}

export function deriveComplianceCounts(records: CanonicalAssuranceRecordMap['compliance'][]): ComplianceCounts {
  const counts = deriveAssuranceCounts('compliance', records);
  return {
    total: counts.total,
    byFramework: counts.byFilter.framework as Record<ComplianceFramework, number>,
    byStatus: counts.byFilter.status as Record<ComplianceStatus, number>,
    byLevel: counts.byFilter.level as Record<ComplianceLevel, number>,
  };
}

export function deriveIncidentCounts(actual: IncidentRecord[], simulatedExercises: ExerciseRecord[]): IncidentCounts {
  const completedStatuses = new Set(['completed', 'follow-up-open', 'closed']);
  return {
    actualIncidents: actual.length,
    exercises: simulatedExercises.length,
    plannedExercises: simulatedExercises.filter((record) => record.status === 'planned').length,
    completedExercises: simulatedExercises.filter((record) => completedStatuses.has(record.status)).length,
  };
}

export type AssuranceRelationshipName = keyof AssuranceRelationships;
export type AssuranceRelationshipReference = AssuranceRuntimeRelationshipReference;

export function forwardAssuranceRelationships(recordId: string): AssuranceRelationships | undefined {
  return assuranceRuntimeForwardRelationshipIndex.get(recordId);
}

export function reverseAssuranceRelationships(targetId: string, relation?: AssuranceRelationshipName): AssuranceRelationshipReference[] {
  const references = assuranceRuntimeReverseRelationshipIndex.get(targetId) ?? [];
  return references.filter((reference) => !relation || reference.relation === relation).map((reference) => ({ ...reference }));
}

export function evidenceUsedBy(evidenceId: string): string[] {
  return reverseAssuranceRelationships(evidenceId, 'evidence').map((reference) => reference.sourceId);
}

export const assuranceAnchor = canonicalAssuranceAnchor;

export function assuranceRecordUrls(dataset: AssuranceDataset, recordId?: string): { html?: string; api?: string } {
  return canonicalAssuranceRecordUrls(dataset, recordId);
}

export function assuranceRecordUrlsById(recordId: string): { html?: string; api?: string } {
  const dataset = assuranceDatasetForRecordId(recordId);
  if (!dataset) return {};
  const indexedForHttp = assuranceRegistryResources.some(
    (resource) => resource.kind === dataset && resource.role === 'dataset' && resource.capabilities.includes('api-index'),
  );
  if (!indexedForHttp || !assuranceRoutesForDataset(dataset as AssuranceDataset)) return {};
  return canonicalAssuranceRecordUrls(dataset as AssuranceDataset, recordId);
}

export const complianceFrameworks = assuranceComplianceFrameworks;
export const complianceQualification = assuranceQualifications.compliance;
export const assuranceQualification = assuranceQualifications.registry;
export const incidentQualifications = {
  incidents: assuranceQualifications.incidents,
  exercises: assuranceQualifications.exercises,
};
export const advisoryQualification = assuranceQualifications.advisories;
