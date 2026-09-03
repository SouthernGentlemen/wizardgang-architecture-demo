import {
  assuranceCanonicalRecordCollections,
  assuranceComplianceFrameworks,
  assuranceQualifications,
  assuranceRegistryResources,
  primaryAssuranceResource,
  runtimeAssuranceSchema,
  type AssuranceDataset,
  type AssuranceRelationships,
  type AssuranceRegistryFilter,
  type AssuranceRegistryResource,
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
import { assuranceRecordCollectionPath } from './record-discovery.js';

export type AssuranceRecordMap = CanonicalAssuranceRecordMap;
export type AssuranceRecord = CanonicalAssuranceRecordMap[AssuranceDataset];
export type AssuranceFilterValues = Record<string, string>;

function recordsForDataset<K extends AssuranceDataset>(dataset: K): CanonicalAssuranceRecordMap[K][] {
  return assuranceCanonicalRecordCollections[dataset];
}

export function listAssuranceRecords<K extends AssuranceDataset>(dataset: K): CanonicalAssuranceRecordMap[K][] {
  return [...recordsForDataset(dataset)];
}

export function findAssuranceRecord<K extends AssuranceDataset>(
  dataset: K,
  recordId: string,
): CanonicalAssuranceRecordMap[K] | undefined {
  return recordsForDataset(dataset).find((record) => record.id === recordId);
}

export function assuranceDatasetForRecordId(recordId: string): AssuranceDataset | undefined {
  for (const [dataset, records] of Object.entries(assuranceCanonicalRecordCollections)) {
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
  if (values.length === 0) {
    for (const record of recordsForDataset(dataset)) {
      const value = valueAtPath(record, definition.path);
      if (typeof value === 'string' && !values.includes(value)) values.push(value);
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

export function filterAssuranceRecords<
  K extends AssuranceDataset,
  T extends CanonicalAssuranceRecordMap[K],
>(
  dataset: K,
  filters: AssuranceFilterValues,
  records: T[] = listAssuranceRecords(dataset) as T[],
): T[] {
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
  records: CanonicalAssuranceRecordMap[K][],
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

export function deriveIncidentCounts(
  actual: IncidentRecord[],
  simulatedExercises: ExerciseRecord[],
): IncidentCounts {
  const completedStatuses = new Set(['completed', 'follow-up-open', 'closed']);
  return {
    actualIncidents: actual.length,
    exercises: simulatedExercises.length,
    plannedExercises: simulatedExercises.filter((record) => record.status === 'planned').length,
    completedExercises: simulatedExercises.filter((record) => completedStatuses.has(record.status)).length,
  };
}

export type AssuranceRelationshipName = keyof AssuranceRelationships;

export interface AssuranceRelationshipReference {
  sourceId: string;
  dataset: string;
  relation: AssuranceRelationshipName;
}

function recordRelationships(record: AssuranceRecord): AssuranceRelationships | undefined {
  return 'relationships' in record ? record.relationships : undefined;
}

export function forwardAssuranceRelationships(recordId: string): AssuranceRelationships | undefined {
  const dataset = assuranceDatasetForRecordId(recordId);
  if (!dataset) return undefined;
  const record = findAssuranceRecord(dataset, recordId) as AssuranceRecord | undefined;
  return record ? recordRelationships(record) : undefined;
}

export function reverseAssuranceRelationships(
  targetId: string,
  relation?: AssuranceRelationshipName,
): AssuranceRelationshipReference[] {
  const references: AssuranceRelationshipReference[] = [];
  for (const [dataset, records] of Object.entries(assuranceCanonicalRecordCollections)) {
    for (const source of records as AssuranceRecord[]) {
      const relationships = recordRelationships(source);
      if (!relationships) continue;
      for (const [name, values] of Object.entries(relationships) as Array<[AssuranceRelationshipName, string[]]>) {
        if (relation && name !== relation) continue;
        if (values.includes(targetId)) references.push({ sourceId: source.id, dataset, relation: name });
      }
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

export const complianceFrameworks = assuranceComplianceFrameworks;
export const complianceQualification = assuranceQualifications.compliance;
export const assuranceQualification = assuranceQualifications.registry;
export const incidentQualifications = {
  incidents: assuranceQualifications.incidents,
  exercises: assuranceQualifications.exercises,
};
export const advisoryQualification = assuranceQualifications.advisories;
