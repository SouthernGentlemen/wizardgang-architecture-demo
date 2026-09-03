import governanceReferenceData from '../../docs/governance/REFERENCE-REGISTRY.json';
import {
  assuranceRegistryData,
  assuranceRuntimeDatasets,
  assuranceRuntimeSchemas,
} from './generated/registry-bindings';

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
type WcagPartition = { criteria: CanonicalComplianceRecord[] };
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

export interface AssuranceRegistryResource {
  id: string;
  kind: string;
  role: 'dataset' | 'partition' | 'control-plane' | 'operations' | 'presentation';
  path: string;
  schema: string;
  visibility: 'public' | 'private';
  capabilities: string[];
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
  dataset: Exclude<AssuranceDataset, 'evidence'>;
  relationships: AssuranceRelationships;
}

export const assuranceRegistry = assuranceRegistryData as unknown as AssuranceRegistry;
const runtimeData = assuranceRuntimeDatasets as Record<string, unknown>;
const runtimeSchemas = assuranceRuntimeSchemas as Record<string, unknown>;
const governanceDocuments = new Map(
  governanceReferenceData.records.map((record) => [record.reference, record.path]),
);

export function flattenAssuranceResources(): AssuranceRegistryResource[] {
  return [
    ...assuranceRegistry.datasets.flatMap((dataset) => [dataset, ...(dataset.resources ?? [])]),
    assuranceRegistry.lifecycle,
    ...(assuranceRegistry.presentations ?? []),
    ...assuranceRegistry.operations,
  ];
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
    (resource) => resource.kind === kind && resource.capabilities.includes('api-index'),
    `primary ${kind} dataset`,
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

const evidenceData = runtimeAssuranceDataset<RecordsDataset<PublicEvidence>>(primaryAssuranceResource('evidence'));
const claimsData = runtimeAssuranceDataset<RecordsDataset<CanonicalClaim>>(primaryAssuranceResource('claims'));
const risksData = runtimeAssuranceDataset<RecordsDataset<CanonicalRisk>>(primaryAssuranceResource('risks'));
const incidentsData = runtimeAssuranceDataset<RecordsDataset<CanonicalIncident>>(primaryAssuranceResource('incidents'));
const exercisesData = runtimeAssuranceDataset<RecordsDataset<CanonicalExercise>>(primaryAssuranceResource('exercises'));
const advisoriesData = runtimeAssuranceDataset<RecordsDataset<CanonicalAdvisory>>(primaryAssuranceResource('advisories'));

const complianceResources = assuranceRegistryResources.filter((resource) => resource.kind === 'compliance');
const isoSources = complianceResources
  .filter((resource) => resource.capabilities.includes('summary-source'))
  .map((resource) => runtimeAssuranceDataset<ComplianceDataset>(resource));
const wcagManifestResource = requireAssuranceResource(
  (resource) => resource.kind === 'compliance' && resource.capabilities.includes('manifest'),
  'WCAG compliance manifest',
);
const wcagData = runtimeAssuranceDataset<WcagManifest>(wcagManifestResource);
const wcagPartitions = wcagData.partitions.map((partition) => runtimeAssuranceDataset<WcagPartition>(requireAssuranceResource(
  (resource) => resource.kind === 'compliance' && resource.role === 'partition' && resource.path === partition.path,
  `registered WCAG partition ${partition.path}`,
)));

const canonicalClaims = claimsData.records;
const canonicalRisks = risksData.records;
const canonicalIncidents = incidentsData.records;
const canonicalExercises = exercisesData.records;
const canonicalAdvisories = advisoriesData.records;
const canonicalCompliance = [
  ...isoSources.flatMap((source) => source.records),
  ...wcagPartitions.flatMap((partition) => partition.criteria),
];

export const assuranceModelEvidence = evidenceData.records;
export const assuranceModelClaims: PublicAssuranceClaim[] = canonicalClaims.map(({ relationships, ...record }) => ({
  ...record,
  frameworkReferences: [...relationships.compliance, ...relationships.frameworks],
  evidence: [...relationships.evidence],
}));
export const assuranceModelRisks: PublicRisk[] = canonicalRisks.map(({ relationships, ...record }) => ({
  ...record,
  controls: relationships.governanceDocuments.map((reference) => ({
    reference,
    repositoryPath: governanceDocuments.get(reference) ?? '',
  })),
  evidence: [...relationships.evidence],
}));
export const assuranceModelIncidents: PublicIncident[] = canonicalIncidents.map(({ relationships, ...record }) => ({
  ...record,
  riskLinks: [...relationships.risks],
  controlLinks: [...relationships.controls],
  evidence: [...relationships.evidence],
}));
export const assuranceModelExercises: PublicExercise[] = canonicalExercises.map(({ relationships, ...record }) => ({
  ...record,
  riskLinks: [...relationships.risks],
  objectiveLinks: [...relationships.objectives],
  evidence: [...relationships.evidence],
}));
export const assuranceModelAdvisories: PublicAdvisory[] = canonicalAdvisories.map(({ relationships, ...record }) => ({
  ...record,
  incidentLinks: [...relationships.incidents],
  evidence: [...relationships.evidence],
}));

export const assuranceModelComplianceFrameworks: PublicComplianceFramework[] = [
  ...isoSources.map((source) => source.framework),
  wcagData.framework,
];
const frameworkOrder = new Map(assuranceModelComplianceFrameworks.map((framework, index) => [framework.id, index]));
export const assuranceModelComplianceRecords: PublicComplianceRecord[] = canonicalCompliance
  .map(({ relationships, ...record }) => ({ ...record, evidence: [...relationships.evidence] }))
  .sort((left, right) => {
    const frameworkDifference = (frameworkOrder.get(left.framework) ?? 99) - (frameworkOrder.get(right.framework) ?? 99);
    return frameworkDifference || left.reference.localeCompare(right.reference, undefined, { numeric: true });
  });

export const assuranceCanonicalRelationshipRecords: AssuranceCanonicalRelationshipRecord[] = [
  ...canonicalClaims.map((record) => ({ id: record.id, dataset: 'claims' as const, relationships: record.relationships })),
  ...canonicalRisks.map((record) => ({ id: record.id, dataset: 'risks' as const, relationships: record.relationships })),
  ...canonicalIncidents.map((record) => ({ id: record.id, dataset: 'incidents' as const, relationships: record.relationships })),
  ...canonicalExercises.map((record) => ({ id: record.id, dataset: 'exercises' as const, relationships: record.relationships })),
  ...canonicalAdvisories.map((record) => ({ id: record.id, dataset: 'advisories' as const, relationships: record.relationships })),
  ...canonicalCompliance.map((record) => ({ id: record.id, dataset: 'compliance' as const, relationships: record.relationships })),
];

export const assuranceModelQualifications = {
  registry: assuranceRegistry.qualification,
  compliance: primaryAssuranceResource('compliance').qualification
    ?? 'Public engineering-evidence projection only. Framework-specific qualifications remain authoritative; certification and formal conformance are not claimed.',
  incidents: incidentsData.qualification,
  exercises: exercisesData.qualification,
  advisories: advisoriesData.qualification,
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
