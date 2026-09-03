import governanceReferenceData from '../../docs/governance/REFERENCE-REGISTRY.json';
import {
  assuranceRegistryData,
  assuranceRuntimeDatasets,
  assuranceRuntimeSchemas,
} from './generated/registry-bindings';
import {
  assuranceRecordEntries,
  assuranceRecordsForKind,
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

export interface PublicEvidence {
  id: string;
  kind: EvidenceKind;
  title: string;
  description: string;
  locator: { repositoryPath?: string; route?: string };
  freshnessPolicy: FreshnessPolicy;
  visibility: 'public';
}

export interface PublicAssuranceClaim {
  id: string;
  area: string;
  title: string;
  statement: string;
  posture: AssurancePosture;
  frameworkReferences: string[];
  evidence: string[];
}

export interface PublicRisk {
  id: string;
  framework: RiskFramework;
  title: string;
  inherent: { score: number; rating: RiskRating };
  residual: { score: number; rating: RiskRating };
  treatment: RiskTreatment[];
  status: RiskStatus;
  controls: { reference: string; repositoryPath: string }[];
  evidence: string[];
  reviewDue: string;
}

export interface PublicIncident {
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
  riskLinks: string[];
  controlLinks: string[];
  evidence: string[];
  closedAt?: string;
}

export interface PublicExercise {
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
  riskLinks: string[];
  objectiveLinks: string[];
  evidence: string[];
  resultSummary?: string;
  publicNote: string;
}

export interface PublicAdvisory {
  id: string;
  recordType: 'advisory';
  title: string;
  severity: AdvisorySeverity;
  summary: string;
  publishedAt: string;
  updatedAt?: string;
  fixedReleases: string[];
  cveId?: string;
  incidentLinks: string[];
  evidence: string[];
}

export interface PublicComplianceRecord {
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
  evidence: string[];
  sourcePath: string;
}

export interface PublicComplianceFramework {
  id: ComplianceFramework;
  label: string;
  edition: string;
  qualification: string;
  assessmentDate?: string;
  sourcePath: string;
}

export interface PublicRiskFilters { framework?: RiskFramework; status?: RiskStatus; residualRating?: RiskRating }
export interface PublicComplianceFilters { framework?: ComplianceFramework; status?: ComplianceStatus; level?: ComplianceLevel }
export interface PublicRiskCounts {
  total: number;
  byFramework: Record<RiskFramework, number>;
  byStatus: Record<RiskStatus, number>;
  byResidualRating: Record<RiskRating, number>;
}
export interface PublicIncidentCounts { actualIncidents: number; exercises: number; plannedExercises: number; completedExercises: number }
export interface PublicComplianceCounts {
  total: number;
  byFramework: Record<ComplianceFramework, number>;
  byStatus: Record<ComplianceStatus, number>;
  byLevel: Record<ComplianceLevel, number>;
}

type CanonicalClaim = Omit<PublicAssuranceClaim, 'frameworkReferences' | 'evidence'> & { relationships: AssuranceRelationships };
type CanonicalRisk = Omit<PublicRisk, 'controls' | 'evidence'> & { relationships: AssuranceRelationships };
type CanonicalIncident = Omit<PublicIncident, 'riskLinks' | 'controlLinks' | 'evidence'> & { relationships: AssuranceRelationships };
type CanonicalExercise = Omit<PublicExercise, 'riskLinks' | 'objectiveLinks' | 'evidence'> & { relationships: AssuranceRelationships };
type CanonicalAdvisory = Omit<PublicAdvisory, 'incidentLinks' | 'evidence'> & { relationships: AssuranceRelationships };
type CanonicalComplianceRecord = Omit<PublicComplianceRecord, 'evidence'> & { relationships: AssuranceRelationships };
type RecordsDataset<T> = { records: T[]; qualification?: string };
type ComplianceDataset = { qualification?: string; framework: PublicComplianceFramework; records: CanonicalComplianceRecord[] };
type WcagManifest = { qualification?: string; framework: PublicComplianceFramework; partitions: Array<{ principle: string; path: string }> };

export interface AssuranceRegistryFilter {
  path: string;
  label: string;
}

export interface AssuranceRegistryRoutes {
  html?: string;
  api?: string;
  apiRecord?: string;
}

export interface AssuranceRegistryRecordCollection {
  path: string;
  identity: string[];
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

export interface AssuranceCanonicalRelationshipRecord {
  id: string;
  dataset: string;
  relationships: AssuranceRelationships;
}

export const assuranceRegistry = assuranceRegistryData as unknown as AssuranceRegistry;
const runtimeData = assuranceRuntimeDatasets as Record<string, unknown>;
const runtimeSchemas = assuranceRuntimeSchemas as Record<string, unknown>;
const governanceDocuments = new Map(
  governanceReferenceData.records.map((record) => [record.reference, record.path]),
);

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

function canonicalRecordsForKind<T>(kind: string): T[] {
  return assuranceRecordsForKind<T>(runtimeRecordEntries, kind);
}

const complianceResources = assuranceRegistryResources.filter((resource) => resource.kind === 'compliance');
const isoSources = complianceResources
  .filter((resource) => resource.capabilities.includes('summary-source') && resource.capabilities.includes('runtime'))
  .map((resource) => runtimeAssuranceDataset<ComplianceDataset>(resource));
const wcagManifestResource = requireAssuranceResource(
  (resource) => resource.kind === 'compliance' && resource.capabilities.includes('manifest'),
  'WCAG compliance manifest',
);
const wcagData = runtimeAssuranceDataset<WcagManifest>(wcagManifestResource);

export const assuranceModelComplianceFrameworks: PublicComplianceFramework[] = [
  ...isoSources.map((source) => source.framework),
  wcagData.framework,
];
const frameworkOrder = new Map(assuranceModelComplianceFrameworks.map((framework, index) => [framework.id, index]));

const v1BoundaryAdapters: Record<AssuranceDataset, (record: any) => { id: string }> = {
  evidence: (record: PublicEvidence) => ({ ...record }),
  claims: (record: CanonicalClaim) => {
    const { relationships, ...value } = record;
    return {
      ...value,
      frameworkReferences: [...relationships.compliance, ...relationships.frameworks],
      evidence: [...relationships.evidence],
    };
  },
  risks: (record: CanonicalRisk) => {
    const { relationships, ...value } = record;
    return {
      ...value,
      controls: relationships.governanceDocuments.map((reference) => ({
        reference,
        repositoryPath: governanceDocuments.get(reference) ?? '',
      })),
      evidence: [...relationships.evidence],
    };
  },
  incidents: (record: CanonicalIncident) => {
    const { relationships, ...value } = record;
    return {
      ...value,
      riskLinks: [...relationships.risks],
      controlLinks: [...relationships.controls],
      evidence: [...relationships.evidence],
    };
  },
  exercises: (record: CanonicalExercise) => {
    const { relationships, ...value } = record;
    return {
      ...value,
      riskLinks: [...relationships.risks],
      objectiveLinks: [...relationships.objectives],
      evidence: [...relationships.evidence],
    };
  },
  advisories: (record: CanonicalAdvisory) => {
    const { relationships, ...value } = record;
    return {
      ...value,
      incidentLinks: [...relationships.incidents],
      evidence: [...relationships.evidence],
    };
  },
  compliance: (record: CanonicalComplianceRecord) => {
    const { relationships, ...value } = record;
    return { ...value, evidence: [...relationships.evidence] };
  },
};

const indexedKinds = assuranceRegistry.datasets
  .filter((resource) => resource.capabilities.includes('records') && resource.capabilities.includes('api-index'))
  .map((resource) => resource.kind);
const v1Collections: Partial<Record<AssuranceDataset, Array<{ id: string }>>> = {};
for (const kind of indexedKinds) {
  if (!(kind in v1BoundaryAdapters)) {
    throw new Error(`Assurance registry declares unsupported api-index family ${kind}; add an explicit released-boundary adapter before indexing it.`);
  }
  const dataset = kind as AssuranceDataset;
  v1Collections[dataset] = canonicalRecordsForKind<any>(kind).map(v1BoundaryAdapters[dataset]);
}

const complianceCollection = (v1Collections.compliance ?? []) as PublicComplianceRecord[];
complianceCollection.sort((left, right) => {
  const frameworkDifference = (frameworkOrder.get(left.framework) ?? 99) - (frameworkOrder.get(right.framework) ?? 99);
  return frameworkDifference || left.reference.localeCompare(right.reference, undefined, { numeric: true });
});

export const assuranceModelRecordCollections = v1Collections as {
  claims: PublicAssuranceClaim[];
  evidence: PublicEvidence[];
  risks: PublicRisk[];
  incidents: PublicIncident[];
  exercises: PublicExercise[];
  advisories: PublicAdvisory[];
  compliance: PublicComplianceRecord[];
};

export const assuranceModelEvidence = assuranceModelRecordCollections.evidence;
export const assuranceModelClaims = assuranceModelRecordCollections.claims;
export const assuranceModelRisks = assuranceModelRecordCollections.risks;
export const assuranceModelIncidents = assuranceModelRecordCollections.incidents;
export const assuranceModelExercises = assuranceModelRecordCollections.exercises;
export const assuranceModelAdvisories = assuranceModelRecordCollections.advisories;
export const assuranceModelComplianceRecords = assuranceModelRecordCollections.compliance;

export const assuranceCanonicalRelationshipRecords: AssuranceCanonicalRelationshipRecord[] = runtimeRecordEntries.flatMap(({ resource, record }) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return [];
  const candidate = record as { id?: unknown; relationships?: unknown };
  if (typeof candidate.id !== 'string' || !candidate.relationships || typeof candidate.relationships !== 'object') return [];
  return [{ id: candidate.id, dataset: resource.kind, relationships: candidate.relationships as AssuranceRelationships }];
});

function primaryQualification(kind: AssuranceDataset): string | undefined {
  const resource = primaryAssuranceResource(kind);
  return runtimeAssuranceDataset<RecordsDataset<unknown>>(resource).qualification ?? resource.qualification;
}

export const assuranceModelQualifications = {
  registry: assuranceRegistry.qualification,
  compliance: primaryAssuranceResource('compliance').qualification
    ?? 'Public engineering-evidence projection only. Framework-specific qualifications remain authoritative; certification and formal conformance are not claimed.',
  incidents: primaryQualification('incidents'),
  exercises: primaryQualification('exercises'),
  advisories: primaryQualification('advisories'),
};

export const assurancePublicRegistryMetadata = {
  schemaVersion: assuranceRegistry.schemaVersion,
  id: assuranceRegistry.id,
  title: assuranceRegistry.title,
  scope: assuranceRegistry.scope,
  qualification: assuranceRegistry.qualification,
  visibility: assuranceRegistry.visibility,
  lifecycle: { path: assuranceRegistry.lifecycle.path, schema: assuranceRegistry.lifecycle.schema },
  datasets: assuranceRegistry.datasets.map((dataset) => ({ kind: dataset.kind, path: dataset.path, schema: dataset.schema })),
};
