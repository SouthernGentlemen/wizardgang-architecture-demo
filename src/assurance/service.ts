import { repoUrl } from '../lib/github';
import type { Env } from '../types';
import {
  assuranceCanonicalRelationshipRecords,
  assuranceModelComplianceFrameworks,
  assuranceModelQualifications,
  assuranceModelRecordCollections,
  assurancePublicRegistryMetadata,
  assuranceRegistryResources,
  primaryAssuranceResource,
  runtimeAssuranceSchema,
  type AssuranceDataset,
  type AssuranceRelationships,
  type AssuranceRegistryFilter,
  type AssuranceRegistryResource,
  type ComplianceFramework,
  type ComplianceLevel,
  type ComplianceStatus,
  type FreshnessPolicy,
  type PublicAdvisory,
  type PublicAssuranceClaim,
  type PublicComplianceCounts,
  type PublicComplianceFilters,
  type PublicComplianceFramework,
  type PublicComplianceRecord,
  type PublicEvidence,
  type PublicExercise,
  type PublicIncident,
  type PublicIncidentCounts,
  type PublicRisk,
  type PublicRiskCounts,
  type PublicRiskFilters,
  type RiskFramework,
  type RiskRating,
  type RiskStatus,
} from './model';
import { assuranceRecordCollectionPath } from './record-discovery.js';

export type {
  AssuranceDataset,
  AssuranceRelationships,
  AssuranceRegistryFilter,
  ComplianceFramework,
  ComplianceLevel,
  ComplianceStatus,
  FreshnessPolicy,
  PublicAdvisory,
  PublicAssuranceClaim,
  PublicComplianceCounts,
  PublicComplianceFilters,
  PublicComplianceFramework,
  PublicComplianceRecord,
  PublicEvidence,
  PublicExercise,
  PublicIncident,
  PublicIncidentCounts,
  PublicRisk,
  PublicRiskCounts,
  PublicRiskFilters,
  RiskFramework,
  RiskRating,
  RiskStatus,
} from './model';

export interface AssuranceRecordMap {
  claims: PublicAssuranceClaim;
  evidence: PublicEvidence;
  risks: PublicRisk;
  incidents: PublicIncident;
  exercises: PublicExercise;
  advisories: PublicAdvisory;
  compliance: PublicComplianceRecord;
}

export type AssuranceRecord = AssuranceRecordMap[AssuranceDataset];
export type AssuranceFilterValues = Record<string, string>;

function recordsForDataset<K extends AssuranceDataset>(dataset: K): AssuranceRecordMap[K][] {
  return assuranceModelRecordCollections[dataset] as AssuranceRecordMap[K][];
}

export function listAssuranceRecords<K extends AssuranceDataset>(dataset: K): AssuranceRecordMap[K][] {
  return [...recordsForDataset(dataset)];
}

export function findAssuranceRecord<K extends AssuranceDataset>(
  dataset: K,
  recordId: string,
): AssuranceRecordMap[K] | undefined {
  return recordsForDataset(dataset).find((record) => record.id === recordId);
}

export function assuranceDatasetForRecordId(recordId: string): AssuranceDataset | undefined {
  for (const [dataset, records] of Object.entries(assuranceModelRecordCollections)) {
    if (records.some((record) => record.id === recordId)) return dataset as AssuranceDataset;
  }
  return undefined;
}

export function assuranceDatasetCount(dataset: AssuranceDataset): number {
  return recordsForDataset(dataset).length;
}

export function assuranceDatasetSource(dataset: AssuranceDataset): string {
  return primaryAssuranceResource(dataset).path;
}

export function assuranceDatasetSchema(dataset: AssuranceDataset): string {
  return primaryAssuranceResource(dataset).schema;
}

type JsonSchema = Record<string, unknown>;

function resolveLocalSchemaRef(root: JsonSchema, node: unknown): JsonSchema | undefined {
  let current = node;
  const seen = new Set<string>();
  while (current && typeof current === 'object' && !Array.isArray(current)) {
    const object = current as JsonSchema;
    const ref = object.$ref;
    if (typeof ref !== 'string' || !ref.startsWith('#/')) return object;
    if (seen.has(ref)) return undefined;
    seen.add(ref);
    current = ref.slice(2).split('/').reduce<unknown>((value, segment) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
      return (value as JsonSchema)[segment.replaceAll('~1', '/').replaceAll('~0', '~')];
    }, root);
  }
  return undefined;
}

function recordSchema(root: JsonSchema, collectionPath: string): JsonSchema | undefined {
  let node: JsonSchema | undefined = root;
  for (const segment of collectionPath.split('.')) {
    if (!node) return undefined;
    const properties = node.properties;
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return undefined;
    node = resolveLocalSchemaRef(root, (properties as JsonSchema)[segment]);
  }
  return node ? resolveLocalSchemaRef(root, node.items) : undefined;
}

function schemaProperty(root: JsonSchema, collectionPath: string, path: string): JsonSchema | undefined {
  let node = recordSchema(root, collectionPath);
  for (const segment of path.split('.')) {
    if (!node) return undefined;
    const properties = node.properties;
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return undefined;
    node = resolveLocalSchemaRef(root, (properties as JsonSchema)[segment]);
  }
  return node;
}

function schemaValues(root: JsonSchema, collectionPath: string, path: string): string[] {
  const property = schemaProperty(root, collectionPath, path);
  if (!property) return [];
  if (Array.isArray(property.enum)) return property.enum.filter((value): value is string => typeof value === 'string');
  return typeof property.const === 'string' ? [property.const] : [];
}

function datasetResources(dataset: AssuranceDataset): AssuranceRegistryResource[] {
  return assuranceRegistryResources.filter(
    (resource) => resource.kind === dataset && resource.capabilities.includes('records') && resource.capabilities.includes('runtime'),
  );
}

export function assuranceFilterDefinitions(dataset: AssuranceDataset): Readonly<Record<string, AssuranceRegistryFilter>> {
  const resource = primaryAssuranceResource(dataset);
  return resource.filters ?? {};
}

export function assuranceFilterValues(dataset: AssuranceDataset, parameter: string): string[] {
  const definition = assuranceFilterDefinitions(dataset)[parameter];
  if (!definition) return [];
  const values: string[] = [];
  for (const resource of datasetResources(dataset)) {
    const schema = runtimeAssuranceSchema(resource);
    const collectionPath = assuranceRecordCollectionPath(resource);
    if (!collectionPath) throw new Error(`${resource.id} cannot supply filters without a declared record collection.`);
    for (const value of schemaValues(schema, collectionPath, definition.path)) {
      if (!values.includes(value)) values.push(value);
    }
  }
  return values;
}

function valueAtPath(record: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return (value as Record<string, unknown>)[segment];
  }, record);
}

export function assuranceFiltersFromUrl(dataset: AssuranceDataset, url: URL): AssuranceFilterValues {
  const filters: AssuranceFilterValues = {};
  for (const [parameter] of Object.entries(assuranceFilterDefinitions(dataset))) {
    const values = url.searchParams.getAll(parameter);
    if (values.length !== 1) continue;
    if (assuranceFilterValues(dataset, parameter).includes(values[0])) filters[parameter] = values[0];
  }
  return filters;
}

export function filterAssuranceRecords<K extends AssuranceDataset>(
  dataset: K,
  filters: AssuranceFilterValues,
  records: AssuranceRecordMap[K][] = listAssuranceRecords(dataset),
): AssuranceRecordMap[K][] {
  const definitions = assuranceFilterDefinitions(dataset);
  return records.filter((record) => Object.entries(filters).every(([parameter, expected]) => {
    const definition = definitions[parameter];
    return definition ? valueAtPath(record, definition.path) === expected : true;
  }));
}

export interface AssuranceFacetCounts {
  total: number;
  byFilter: Record<string, Record<string, number>>;
}

export function deriveAssuranceCounts<K extends AssuranceDataset>(
  dataset: K,
  records: AssuranceRecordMap[K][],
): AssuranceFacetCounts {
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

export function labelAssuranceFilterValue(
  dataset: AssuranceDataset,
  parameter: string,
  value: string,
): string {
  if (dataset === 'compliance' && parameter === 'framework') {
    return assuranceModelComplianceFrameworks.find((framework) => framework.id === value)?.label ?? value;
  }
  if (value === 'ai') return 'AI';
  return value.split('-').map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

export function deriveRiskCounts(records: PublicRisk[]): PublicRiskCounts {
  const counts = deriveAssuranceCounts('risks', records);
  return {
    total: counts.total,
    byFramework: counts.byFilter.framework as Record<RiskFramework, number>,
    byStatus: counts.byFilter.status as Record<RiskStatus, number>,
    byResidualRating: counts.byFilter.residual as Record<RiskRating, number>,
  };
}

export function deriveComplianceCounts(records: PublicComplianceRecord[]): PublicComplianceCounts {
  const counts = deriveAssuranceCounts('compliance', records);
  return {
    total: counts.total,
    byFramework: counts.byFilter.framework as Record<ComplianceFramework, number>,
    byStatus: counts.byFilter.status as Record<ComplianceStatus, number>,
    byLevel: counts.byFilter.level as Record<ComplianceLevel, number>,
  };
}

export function deriveIncidentCounts(
  actual: PublicIncident[],
  simulatedExercises: PublicExercise[],
): PublicIncidentCounts {
  const completedStatuses = new Set(['completed', 'follow-up-open', 'closed']);
  return {
    actualIncidents: actual.length,
    exercises: simulatedExercises.length,
    plannedExercises: simulatedExercises.filter((record) => record.status === 'planned').length,
    completedExercises: simulatedExercises.filter((record) => completedStatuses.has(record.status)).length,
  };
}

export function filterPublicRisks(filters: PublicRiskFilters): PublicRisk[] {
  return filterAssuranceRecords('risks', {
    ...(filters.framework ? { framework: filters.framework } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.residualRating ? { residual: filters.residualRating } : {}),
  });
}

export function filterPublicCompliance(filters: PublicComplianceFilters): PublicComplianceRecord[] {
  return filterAssuranceRecords('compliance', {
    ...(filters.framework ? { framework: filters.framework } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.level ? { level: filters.level } : {}),
  });
}

export function findPublicComplianceRecord(recordId: string): PublicComplianceRecord | undefined {
  return findAssuranceRecord('compliance', recordId);
}

export function riskFiltersFromUrl(url: URL): PublicRiskFilters {
  const filters = assuranceFiltersFromUrl('risks', url);
  return {
    ...(filters.framework ? { framework: filters.framework as RiskFramework } : {}),
    ...(filters.status ? { status: filters.status as RiskStatus } : {}),
    ...(filters.residual ? { residualRating: filters.residual as RiskRating } : {}),
  };
}

export function complianceFiltersFromUrl(url: URL): PublicComplianceFilters {
  const filters = assuranceFiltersFromUrl('compliance', url);
  return {
    ...(filters.framework ? { framework: filters.framework as ComplianceFramework } : {}),
    ...(filters.status ? { status: filters.status as ComplianceStatus } : {}),
    ...(filters.level ? { level: filters.level as ComplianceLevel } : {}),
  };
}

export interface AssurancePage<T> {
  records: T[];
  pagination?: {
    limit: number;
    returned: number;
    total: number;
    nextCursor: string | null;
  };
}

export function paginateAssuranceRecords<T extends { id: string }>(
  records: T[],
  options?: { limit: number; cursor?: string },
): AssurancePage<T> | undefined {
  if (!options) return { records: [...records] };
  let start = 0;
  if (options.cursor !== undefined) {
    const index = records.findIndex((record) => record.id === options.cursor);
    if (index < 0) return undefined;
    start = index + 1;
  }
  const pageRecords = records.slice(start, start + options.limit);
  const hasMore = start + pageRecords.length < records.length;
  return {
    records: pageRecords,
    pagination: {
      limit: options.limit,
      returned: pageRecords.length,
      total: records.length,
      nextCursor: hasMore && pageRecords.length > 0 ? pageRecords[pageRecords.length - 1].id : null,
    },
  };
}

export type AssuranceRelationshipName = keyof AssuranceRelationships;

export interface AssuranceRelationshipReference {
  sourceId: string;
  dataset: string;
  relation: AssuranceRelationshipName;
}

export function forwardAssuranceRelationships(recordId: string): AssuranceRelationships | undefined {
  return assuranceCanonicalRelationshipRecords.find((record) => record.id === recordId)?.relationships;
}

export function reverseAssuranceRelationships(
  targetId: string,
  relation?: AssuranceRelationshipName,
): AssuranceRelationshipReference[] {
  const references: AssuranceRelationshipReference[] = [];
  for (const source of assuranceCanonicalRelationshipRecords) {
    for (const [name, values] of Object.entries(source.relationships) as Array<[AssuranceRelationshipName, string[]]>) {
      if (relation && name !== relation) continue;
      if (values.includes(targetId)) references.push({ sourceId: source.id, dataset: source.dataset, relation: name });
    }
  }
  return references.sort((left, right) => left.sourceId.localeCompare(right.sourceId) || left.relation.localeCompare(right.relation));
}

export function evidenceUsedBy(evidenceId: string): string[] {
  return reverseAssuranceRelationships(evidenceId, 'evidence').map((reference) => reference.sourceId);
}

export function assuranceAnchor(recordId: string): string {
  return encodeURIComponent(recordId);
}

function routeForDataset(dataset: AssuranceDataset) {
  return primaryAssuranceResource(dataset).routes;
}

export function assuranceRecordUrls(
  dataset: AssuranceDataset,
  recordId?: string,
): { html?: string; api?: string } {
  const routes = routeForDataset(dataset);
  if (!routes) return {};
  const encodedId = recordId ? encodeURIComponent(recordId) : undefined;
  const html = routes.html
    ? recordId ? `${routes.html}#${assuranceAnchor(recordId)}` : routes.html
    : undefined;
  const api = recordId && routes.apiRecord
    ? routes.apiRecord.replace('{id}', encodedId ?? '')
    : routes.api;
  return { html, api };
}

export function assuranceRecordUrlsById(recordId: string): { html?: string; api?: string } {
  const dataset = assuranceDatasetForRecordId(recordId);
  return dataset ? assuranceRecordUrls(dataset, recordId) : {};
}

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

export interface PresentedPublicEvidence extends PublicEvidence {
  usedBy: string[];
  freshness: { policy: FreshnessPolicy; scope: 'deployment' | 'controlled-event' | 'live-observation'; meaning: string };
  resolved: ResolvedEvidenceLocator;
}

export function assuranceDeploymentContext(env: Env): AssuranceDeploymentContext {
  const commit = env.DEPLOYED_SHA?.trim() || null;
  return {
    version: env.DEPLOYED_VERSION?.trim() || null,
    commit,
    sourceResolution: commit ? 'deployed-commit' : 'not-supplied',
  };
}

export function presentPublicEvidence(record: PublicEvidence & { usedBy?: string[] }, env: Env, origin: string): PresentedPublicEvidence {
  const freshness = {
    policy: record.freshnessPolicy,
    ...FRESHNESS_SEMANTICS[record.freshnessPolicy],
  };
  const commit = env.DEPLOYED_SHA?.trim() || null;
  const usedBy = record.usedBy ? [...record.usedBy] : evidenceUsedBy(record.id);

  if (record.locator.repositoryPath) {
    const repositoryPath = record.locator.repositoryPath;
    return {
      ...record,
      usedBy,
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

export function presentedEvidenceRecords(env: Env, origin: string): PresentedPublicEvidence[] {
  return listAssuranceRecords('evidence').map((record) => presentPublicEvidence(record, env, origin));
}

export const publicComplianceRecords = listAssuranceRecords('compliance');
export const publicComplianceFrameworks: PublicComplianceFramework[] = [...assuranceModelComplianceFrameworks];
export const publicComplianceQualification = assuranceModelQualifications.compliance;

export const publicComplianceRegistry = {
  schemaVersion: 1,
  dataset: 'compliance',
  qualification: publicComplianceQualification,
  frameworks: publicComplianceFrameworks,
  counts: deriveComplianceCounts(publicComplianceRecords),
  records: publicComplianceRecords,
};

const incidents = listAssuranceRecords('incidents');
const exercises = listAssuranceRecords('exercises');

// Released v1 envelope: keep this explicit even though record discovery below it is registry-driven.
export const publicAssuranceRegistry = {
  ...assurancePublicRegistryMetadata,
  counts: {
    claims: assuranceDatasetCount('claims'),
    evidence: assuranceDatasetCount('evidence'),
    risks: assuranceDatasetCount('risks'),
    incidents: assuranceDatasetCount('incidents'),
    exercises: assuranceDatasetCount('exercises'),
    advisories: assuranceDatasetCount('advisories'),
  },
  riskCounts: deriveRiskCounts(listAssuranceRecords('risks')),
  incidentCounts: deriveIncidentCounts(incidents, exercises),
  incidentQualifications: {
    incidents: assuranceModelQualifications.incidents,
    exercises: assuranceModelQualifications.exercises,
  },
  advisoryQualification: assuranceModelQualifications.advisories,
  claims: listAssuranceRecords('claims'),
  risks: listAssuranceRecords('risks'),
  incidents,
  exercises,
  advisories: listAssuranceRecords('advisories'),
  evidence: listAssuranceRecords('evidence').map((record) => ({ ...record, usedBy: evidenceUsedBy(record.id) })),
};
