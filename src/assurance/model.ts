import {
  assuranceRegistryData,
  assuranceRuntimeDatasets,
  assuranceRuntimeSchemas,
} from './generated/registry-bindings';
import {
  assuranceRecordEntries,
  flattenAssuranceResources as flattenRegistryResources,
  primaryAssuranceDatasetResource,
} from './record-discovery.js';
import {
  assuranceIdentityKey,
  assuranceRelationshipDefinition,
  validateAssuranceRelationshipSet,
} from './relationship-contract.js';
import { structuredReportingSource } from '../reporting/registry';
import { deriveRiskRecord } from './risk-rating.js';
import type { RiskRating as DerivedRiskRating } from './risk-rating.js';

export type EvidenceKind = 'source' | 'test' | 'workflow' | 'governance-record' | 'release' | 'live-route' | 'observation';
export type FreshnessPolicy = 'release-bound' | 'event-driven' | 'observation-bound';
export type AssurancePosture = 'met' | 'partial' | 'gap' | 'not-applicable';
export type RiskFramework = 'security' | 'ai';
export type RiskRating = DerivedRiskRating;
export type RiskStatus = 'open' | 'treating';
export type RiskTreatment = 'avoid' | 'reduce' | 'share';
export type IncidentStatus = 'investigating' | 'contained' | 'recovering' | 'monitoring' | 'closed' | 'superseded';
export type ExerciseStatus = 'planned' | 'in-progress' | 'completed' | 'follow-up-open' | 'closed' | 'superseded';
export type AdvisorySeverity = 'low' | 'moderate' | 'high' | 'critical';
export type ComplianceFramework = 'iso-27001' | 'iso-42001' | 'wcag-2.2';
export type ComplianceStatus = AssurancePosture | 'demonstrated' | 'not-observed';
export type ComplianceLevel = 'A' | 'AA' | 'AAA';
export type ComplianceKind = 'clause' | 'control' | 'criterion';

export type AssuranceRelationshipName =
  | 'evidence'
  | 'compliance'
  | 'frameworks'
  | 'claims'
  | 'risks'
  | 'controls'
  | 'incidents'
  | 'exercises'
  | 'advisories'
  | 'governanceDocuments'
  | 'objectives';

export interface AssuranceReportingIdentity {
  source: string;
  native: string;
}

export interface AssuranceRelationship {
  relation: AssuranceRelationshipName;
  from: AssuranceReportingIdentity;
  to: AssuranceReportingIdentity;
}

export type AssuranceRelationships = AssuranceRelationship[];

export interface EvidenceRecord {
  id: string;
  kind: EvidenceKind;
  title: string;
  description: string;
  locator: { repositoryPath?: string; route?: string };
  freshnessPolicy: FreshnessPolicy;
  visibility: 'public';
  observedAt?: string;
  validUntil?: string;
  relationships: AssuranceRelationships;
}

export interface AssuranceClaimRecord {
  id: string;
  area: string;
  title: string;
  statement: string;
  posture: AssurancePosture;
  relationships: AssuranceRelationships;
}

export interface RiskRecord {
  id: string;
  framework: RiskFramework;
  title: string;
  inherent: { score: number; rating: RiskRating };
  residual: { score: number; rating: RiskRating };
  treatment: RiskTreatment[];
  status: RiskStatus;
  reviewDue: string;
  relationships: AssuranceRelationships;
}

export interface IncidentRecord {
  id: string;
  recordType: 'incident';
  simulated: false;
  title: string;
  status: IncidentStatus;
  detectedAt?: string;
  initialSeverity?: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';
  finalSeverity?: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';
  categories: string[];
  summary: string;
  closedAt?: string;
  relationships: AssuranceRelationships;
}

export interface ExerciseRecord {
  id: string;
  recordType: 'exercise';
  simulated: true;
  exerciseType: string;
  scenario: string;
  scope: string;
  owner: string;
  status: ExerciseStatus;
  dueDate?: string;
  completedAt?: string;
  resultSummary?: string;
  publicNote: string;
  relationships: AssuranceRelationships;
}

export interface AdvisoryRecord {
  id: string;
  recordType: 'advisory';
  title: string;
  severity: AdvisorySeverity;
  summary: string;
  publishedAt: string;
  updatedAt?: string;
  fixedReleases: string[];
  cveId?: string;
  relationships: AssuranceRelationships;
}

export interface ComplianceRecord {
  id: string;
  framework: ComplianceFramework;
  frameworkLabel: string;
  reference: string;
  title: string;
  kind: ComplianceKind;
  section: string;
  status: ComplianceStatus;
  level?: ComplianceLevel;
  applicability?: 'applicable' | 'not-applicable';
  rationale?: string;
  implementation?: string;
  validation?: { automated: 'partial' | 'none'; manual: 'required' };
  gaps?: string[];
  owner?: string;
  freshnessRules?: string[];
  sourcePath: string;
  relationships: AssuranceRelationships;
}

export interface ComplianceFrameworkMetadata {
  id: ComplianceFramework;
  label: string;
  edition: string;
  qualification: string;
  assessmentDate?: string;
}

export interface ComplianceFrameworkPresentation extends ComplianceFrameworkMetadata {
  sourcePath: string;
}

export interface RiskCounts {
  total: number;
  byFramework: Record<RiskFramework, number>;
  byStatus: Record<RiskStatus, number>;
  byResidualRating: Record<RiskRating, number>;
}

export interface IncidentCounts {
  actualIncidents: number;
  exercises: number;
  plannedExercises: number;
  completedExercises: number;
}

export interface ComplianceCounts {
  total: number;
  byFramework: Record<ComplianceFramework, number>;
  byStatus: Record<ComplianceStatus, number>;
  byLevel: Record<ComplianceLevel, number>;
}

type SourceComplianceRecord = Omit<ComplianceRecord, 'framework' | 'frameworkLabel' | 'sourcePath' | 'section'> & {
  section?: string;
};
type SourceRiskRecord = Omit<RiskRecord, 'inherent' | 'residual'> & {
  inherent: { score: number };
  residual: { score: number };
};
type RecordsDataset<T> = { records: T[]; qualification?: string };

export interface AssuranceRegistryFilter {
  path: string;
  label: string;
}

export interface AssuranceRegistryRouteAlias {
  path: string;
  fragment?: string;
}

export interface AssuranceRegistryRoutes {
  html?: string;
  api?: string;
  apiRecord?: string;
  aliases?: AssuranceRegistryRouteAlias[];
}

export interface AssuranceRegistryIdentityComponent {
  source: 'record' | 'resource';
  path: string;
}

export interface AssuranceRegistryRecordCollection {
  path: string;
  identity: Array<string | AssuranceRegistryIdentityComponent>;
}

export interface AssuranceRegistryResource {
  id: string;
  kind: string;
  role: 'dataset' | 'partition' | 'control-plane' | 'operations' | 'presentation';
  path: string;
  schema: string;
  visibility: 'public' | 'private';
  capabilities: string[];
  recordCollection?: AssuranceRegistryRecordCollection;
  framework?: ComplianceFrameworkMetadata;
  partition?: { number: string; label: string };
  qualification?: string;
  routes?: AssuranceRegistryRoutes;
  routeOwner?: string;
  filters?: Record<string, AssuranceRegistryFilter>;
  resources?: AssuranceRegistryResource[];
}

export interface AssuranceRegistry {
  schemaVersion: 1;
  id: string;
  title: string;
  scope: string;
  qualification: string;
  visibility: 'public';
  routes: AssuranceRegistryRoutes;
  lifecycle: AssuranceRegistryResource;
  datasets: AssuranceRegistryResource[];
  presentations: AssuranceRegistryResource[];
  operations: AssuranceRegistryResource[];
}

export type AssuranceDataset = 'claims' | 'evidence' | 'risks' | 'incidents' | 'exercises' | 'advisories' | 'compliance';

export interface CanonicalAssuranceRecordMap {
  claims: AssuranceClaimRecord;
  evidence: EvidenceRecord;
  risks: RiskRecord;
  incidents: IncidentRecord;
  exercises: ExerciseRecord;
  advisories: AdvisoryRecord;
  compliance: ComplianceRecord;
}

export interface AssuranceRuntimeRecord {
  id: string;
  relationships?: AssuranceRelationships;
}

export interface AssuranceRuntimeRecordReference {
  dataset: string;
  record: AssuranceRuntimeRecord;
}

export interface AssuranceRuntimeRelationshipReference {
  sourceId: string;
  dataset: string;
  relation: AssuranceRelationshipName;
}

export const assuranceRegistry = assuranceRegistryData as unknown as AssuranceRegistry;
const runtimeData = assuranceRuntimeDatasets as Record<string, unknown>;
const runtimeSchemas = assuranceRuntimeSchemas as Record<string, unknown>;

export function flattenAssuranceResources(): AssuranceRegistryResource[] {
  return flattenRegistryResources(assuranceRegistry) as AssuranceRegistryResource[];
}

export const assuranceRegistryResources = flattenAssuranceResources();

export function requireAssuranceResource(
  predicate: (resource: AssuranceRegistryResource) => boolean,
  label: string,
): AssuranceRegistryResource {
  const matches = assuranceRegistryResources.filter(predicate);
  if (matches.length !== 1) {
    throw new Error(`Assurance registry binding expected exactly one ${label}; found ${matches.length}.`);
  }
  return matches[0];
}

export function primaryAssuranceResource(kind: string): AssuranceRegistryResource {
  return primaryAssuranceDatasetResource(assuranceRegistry, kind) as AssuranceRegistryResource;
}

export function runtimeAssuranceDataset<T>(resource: AssuranceRegistryResource): T {
  if (!resource.capabilities.includes('runtime')) throw new Error(`${resource.id} is not declared runtime-capable.`);
  const data = runtimeData[resource.id];
  if (!data) throw new Error(`Runtime assurance binding is missing ${resource.id}.`);
  return data as T;
}

export function runtimeAssuranceSchema(resource: AssuranceRegistryResource): Record<string, unknown> {
  if (!resource.capabilities.includes('runtime')) throw new Error(`${resource.id} is not declared runtime-capable.`);
  const schema = runtimeSchemas[resource.id];
  if (!schema) throw new Error(`Runtime assurance schema binding is missing ${resource.id}.`);
  return schema as Record<string, unknown>;
}

const runtimeRecordEntries = assuranceRecordEntries(
  assuranceRegistry,
  (resource) => runtimeAssuranceDataset(resource as AssuranceRegistryResource),
  { runtimeOnly: true },
) as Array<{ resource: AssuranceRegistryResource; record: unknown }>;

function canonicalComplianceRecord(resource: AssuranceRegistryResource, record: SourceComplianceRecord): ComplianceRecord {
  const framework = resource.framework;
  if (!framework) throw new Error(`${resource.id} compliance resource is missing canonical framework metadata.`);
  const section = record.section ?? (resource.partition ? `${resource.partition.number}. ${resource.partition.label}` : undefined);
  if (!section) throw new Error(`${resource.id} compliance record ${record.id} has no canonical section metadata.`);
  return {
    ...record,
    framework: framework.id,
    frameworkLabel: framework.label,
    section,
    sourcePath: resource.path,
  };
}

function canonicalRecordsForKind<T>(kind: string): T[] {
  return runtimeRecordEntries
    .filter((entry) => entry.resource.kind === kind)
    .map((entry) => {
      if (kind === 'compliance') return canonicalComplianceRecord(entry.resource, entry.record as SourceComplianceRecord);
      if (kind === 'risks') return deriveRiskRecord(entry.record as SourceRiskRecord);
      return entry.record;
    }) as T[];
}

const complianceResources = assuranceRegistryResources.filter((resource) => resource.kind === 'compliance');
const frameworkResources = complianceResources.filter((resource) => resource.framework
  && (resource.capabilities.includes('summary-source') || resource.capabilities.includes('manifest')));

export const assuranceComplianceFrameworks: ComplianceFrameworkPresentation[] = frameworkResources.map((resource) => ({
  ...resource.framework!,
  sourcePath: resource.path,
}));
const frameworkOrder = new Map(assuranceComplianceFrameworks.map((framework, index) => [framework.id, index]));

const complianceRecords = canonicalRecordsForKind<ComplianceRecord>('compliance');
complianceRecords.sort((left, right) => {
  const frameworkDifference = (frameworkOrder.get(left.framework) ?? 99) - (frameworkOrder.get(right.framework) ?? 99);
  return frameworkDifference || left.reference.localeCompare(right.reference, undefined, { numeric: true });
});

const runtimeRecordKinds = [...new Set(assuranceRegistryResources
  .filter((resource) => resource.capabilities.includes('runtime') && resource.capabilities.includes('records'))
  .map((resource) => resource.kind))];
const runtimeRecordCollections = Object.fromEntries(runtimeRecordKinds.map((kind) => [
  kind,
  kind === 'compliance'
    ? complianceRecords as AssuranceRuntimeRecord[]
    : canonicalRecordsForKind<AssuranceRuntimeRecord>(kind),
])) as Record<string, AssuranceRuntimeRecord[]>;

export const assuranceRuntimeRecordCollections: Readonly<Record<string, AssuranceRuntimeRecord[]>> = runtimeRecordCollections;
export const assuranceRuntimeRecordCounts: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(runtimeRecordCollections).map(([kind, records]) => [kind, records.length]),
);

const runtimeRecordIndex = new Map<string, AssuranceRuntimeRecordReference>();
const runtimeRecordResourceIndex = new Map<string, AssuranceRegistryResource>();
const runtimeIdentityIndex = new Map<string, { dataset: string; record: AssuranceRuntimeRecord; resource: AssuranceRegistryResource }>();
const forwardRelationshipIndex = new Map<string, AssuranceRelationships>();
const reverseRelationshipIndex = new Map<string, AssuranceRuntimeRelationshipReference[]>();
const resourceByReportingSource = new Map(assuranceRegistryResources.map((resource) => [structuredReportingSource(resource).id, resource]));

for (const entry of runtimeRecordEntries) {
  const record = entry.record as { id?: unknown };
  if (typeof record?.id !== 'string' || record.id.length === 0) continue;
  runtimeRecordResourceIndex.set(record.id, entry.resource);
}

for (const [dataset, records] of Object.entries(runtimeRecordCollections)) {
  for (const record of records) {
    if (!record || typeof record.id !== 'string' || record.id.length === 0) {
      throw new Error(`Assurance runtime dataset ${dataset} contains a record without a canonical string id.`);
    }
    if (runtimeRecordIndex.has(record.id)) {
      throw new Error(`Assurance runtime record index contains duplicate canonical ID ${record.id}.`);
    }
    const resource = runtimeRecordResourceIndex.get(record.id);
    if (!resource) throw new Error(`Assurance runtime record ${record.id} has no registry resource identity.`);
    const reportingIdentity = { source: structuredReportingSource(resource).id, native: record.id };
    const identityKey = assuranceIdentityKey(reportingIdentity);
    if (runtimeIdentityIndex.has(identityKey)) throw new Error(`Duplicate assurance reporting identity ${reportingIdentity.source}:${record.id}.`);
    runtimeRecordIndex.set(record.id, { dataset, record });
    runtimeIdentityIndex.set(identityKey, { dataset, record, resource });
  }
}

for (const [dataset, records] of Object.entries(runtimeRecordCollections)) {
  for (const record of records) {
    const resource = runtimeRecordResourceIndex.get(record.id)!;
    const sourceIdentity = { source: structuredReportingSource(resource).id, native: record.id };
    const relationships = record.relationships ?? [];
    const relationshipErrors = validateAssuranceRelationshipSet(relationships, { sourceIdentity }, `${resource.path}:${record.id}`);
    if (relationshipErrors.length > 0) throw new Error(relationshipErrors.join('; '));
    forwardRelationshipIndex.set(record.id, relationships);
    for (const relationship of relationships) {
      const definition = assuranceRelationshipDefinition(relationship.relation);
      if (!definition) throw new Error(`Assurance runtime record ${record.id} declares invalid relation ${relationship.relation}.`);
      const targetResource = resourceByReportingSource.get(relationship.to.source);
      if (!targetResource) {
        throw new Error(`Assurance runtime record ${record.id} has dangling ${relationship.relation} target source ${relationship.to.source}.`);
      }
      if (resource.visibility === 'public' && targetResource.visibility === 'private') {
        throw new Error(`Assurance runtime record ${record.id} leaks public ${relationship.relation} relationship to private source ${relationship.to.source}.`);
      }
      if (definition.target === 'records') {
        const target = runtimeIdentityIndex.get(assuranceIdentityKey(relationship.to));
        if (!target || target.dataset !== definition.kind || (definition.recordKind && (target.record as { kind?: unknown }).kind !== definition.recordKind)) {
          throw new Error(`Assurance runtime record ${record.id} has dangling ${relationship.relation} identity ${relationship.to.source}:${relationship.to.native}.`);
        }
      } else if (definition.target === 'frameworks') {
        if (targetResource.framework?.id !== relationship.to.native) {
          throw new Error(`Assurance runtime record ${record.id} has dangling framework identity ${relationship.to.source}:${relationship.to.native}.`);
        }
      } else if (definition.target === 'governance-documents' && targetResource.id !== 'presentation.documents') {
        throw new Error(`Assurance runtime record ${record.id} has invalid governance document source ${relationship.to.source}.`);
      }
      const references = reverseRelationshipIndex.get(relationship.to.native) ?? [];
      references.push({ sourceId: record.id, dataset, relation: relationship.relation });
      reverseRelationshipIndex.set(relationship.to.native, references);
    }
  }
}

for (const references of reverseRelationshipIndex.values()) {
  references.sort((left, right) => left.sourceId.localeCompare(right.sourceId) || left.relation.localeCompare(right.relation));
}

export const assuranceRuntimeRecordIndex: ReadonlyMap<string, AssuranceRuntimeRecordReference> = runtimeRecordIndex;
export const assuranceRuntimeForwardRelationshipIndex: ReadonlyMap<string, AssuranceRelationships> = forwardRelationshipIndex;
export const assuranceRuntimeReverseRelationshipIndex: ReadonlyMap<string, readonly AssuranceRuntimeRelationshipReference[]> = reverseRelationshipIndex;

export const assuranceCanonicalRecordCollections = assuranceRuntimeRecordCollections as unknown as {
  [K in AssuranceDataset]: CanonicalAssuranceRecordMap[K][];
};

function primaryQualification(kind: string): string | undefined {
  const resource = primaryAssuranceResource(kind);
  return runtimeAssuranceDataset<RecordsDataset<unknown>>(resource).qualification ?? resource.qualification;
}

export const assuranceQualifications = {
  registry: assuranceRegistry.qualification,
  compliance: primaryAssuranceResource('compliance').qualification
    ?? 'Public engineering-evidence projection only. Framework-specific qualifications remain authoritative; certification and formal conformance are not claimed.',
  incidents: primaryQualification('incidents'),
  exercises: primaryQualification('exercises'),
  advisories: primaryQualification('advisories'),
};

export const assuranceRegistryMetadata = {
  schemaVersion: assuranceRegistry.schemaVersion,
  id: assuranceRegistry.id,
  title: assuranceRegistry.title,
  scope: assuranceRegistry.scope,
  qualification: assuranceRegistry.qualification,
  visibility: assuranceRegistry.visibility,
  lifecycle: { path: assuranceRegistry.lifecycle.path, schema: assuranceRegistry.lifecycle.schema },
  datasets: assuranceRegistry.datasets.map((dataset) => ({ kind: dataset.kind, path: dataset.path, schema: dataset.schema })),
};
