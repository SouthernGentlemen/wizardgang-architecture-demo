import {
  assuranceRegistryData,
  assuranceRuntimeDatasets,
  assuranceRuntimeSchemas,
} from './generated/registry-bindings';
import {
  assuranceRecordEntries,
  flattenAssuranceResources as flattenRegistryResources,
} from './record-discovery.js';

export type EvidenceKind = 'source' | 'test' | 'workflow' | 'governance-record' | 'release' | 'live-route' | 'observation';
export type FreshnessPolicy = 'release-bound' | 'event-driven' | 'observation-bound';
export type AssurancePosture = 'met' | 'partial' | 'gap' | 'not-applicable';
export type RiskFramework = 'security' | 'ai';
export type RiskRating = 'low' | 'moderate' | 'high' | 'critical';
export type RiskStatus = 'open' | 'treating';
export type RiskTreatment = 'avoid' | 'reduce' | 'share';
export type IncidentStatus = 'investigating' | 'contained' | 'recovering' | 'monitoring' | 'closed' | 'superseded';
export type ExerciseStatus = 'planned' | 'in-progress' | 'completed' | 'follow-up-open' | 'closed' | 'superseded';
export type AdvisorySeverity = 'low' | 'moderate' | 'high' | 'critical';
export type ComplianceFramework = 'iso-27001' | 'iso-42001' | 'wcag-2.2';
export type ComplianceStatus = AssurancePosture | 'demonstrated' | 'not-observed';
export type ComplianceLevel = 'A' | 'AA' | 'AAA';
export type ComplianceKind = 'clause' | 'control' | 'criterion';

export interface AssuranceRelationships {
  evidence: string[];
  compliance: string[];
  frameworks: string[];
  claims: string[];
  risks: string[];
  controls: string[];
  incidents: string[];
  exercises: string[];
  advisories: string[];
  governanceDocuments: string[];
  objectives: string[];
}

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
type RecordsDataset<T> = { records: T[]; qualification?: string };

export interface AssuranceRegistryFilter {
  path: string;
  label: string;
}

export interface AssuranceRegistryRoutes {
  html?: string;
  api?: string;
  apiRecord?: string;
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
  return requireAssuranceResource(
    (resource) => resource.kind === kind && resource.role === 'dataset' && resource.capabilities.includes('api-index'),
    `indexed ${kind} dataset`,
  );
}

export function runtimeAssuranceDataset<T>(resource: AssuranceRegistryResource): T {
  if (!resource.capabilities.includes('runtime')) throw new Error(`${resource.id} is not declared runtime-capable.`);
  const data = runtimeData[resource.id];
  if (!data) throw new Error(`Runtime assurance binding is missing ${resource.id}.`);
  return data as T;
}

export function runtimeAssuranceSchema(resource: AssuranceRegistryResource): Record<string, unknown> {
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
    .map((entry) => kind === 'compliance'
      ? canonicalComplianceRecord(entry.resource, entry.record as SourceComplianceRecord)
      : entry.record) as T[];
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

export const assuranceCanonicalRecordCollections: { [K in AssuranceDataset]: CanonicalAssuranceRecordMap[K][] } = {
  claims: canonicalRecordsForKind<AssuranceClaimRecord>('claims'),
  evidence: canonicalRecordsForKind<EvidenceRecord>('evidence'),
  risks: canonicalRecordsForKind<RiskRecord>('risks'),
  incidents: canonicalRecordsForKind<IncidentRecord>('incidents'),
  exercises: canonicalRecordsForKind<ExerciseRecord>('exercises'),
  advisories: canonicalRecordsForKind<AdvisoryRecord>('advisories'),
  compliance: complianceRecords,
};

for (const resource of assuranceRegistry.datasets.filter((candidate) => candidate.capabilities.includes('api-index'))) {
  if (!(resource.kind in assuranceCanonicalRecordCollections)) {
    throw new Error(`Assurance registry declares unsupported api-index family ${resource.kind}; add it to the canonical record map before indexing it.`);
  }
}

function primaryQualification(kind: AssuranceDataset): string | undefined {
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
