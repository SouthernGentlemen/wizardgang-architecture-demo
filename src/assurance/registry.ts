import governanceReferenceData from '../../docs/governance/REFERENCE-REGISTRY.json';
import { assuranceRegistryData, assuranceRuntimeDatasets } from './generated/registry-bindings';

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
type ComplianceDataset = { framework: PublicComplianceFramework; records: CanonicalComplianceRecord[] };
type WcagPartition = { criteria: CanonicalComplianceRecord[] };
type WcagManifest = { framework: PublicComplianceFramework; partitions: Array<{ principle: string; path: string }> };

type RawRegistryResource = {
  id: string;
  kind: string;
  role: 'dataset' | 'partition' | 'control-plane' | 'operations';
  path: string;
  schema: string;
  visibility: 'public' | 'private';
  capabilities: string[];
  resources?: RawRegistryResource[];
};
type RawRegistry = {
  schemaVersion: 1;
  id: string;
  title: string;
  scope: string;
  qualification: string;
  visibility: 'public';
  lifecycle: RawRegistryResource;
  datasets: RawRegistryResource[];
  operations: RawRegistryResource[];
};

const registryData = assuranceRegistryData as unknown as RawRegistry;
const runtimeData = assuranceRuntimeDatasets as Record<string, unknown>;
const governanceDocuments = new Map(
  governanceReferenceData.records.map((record) => [record.reference, record.path]),
);

function flattenRegistryResources(): RawRegistryResource[] {
  return [...registryData.datasets.flatMap((dataset) => [dataset, ...(dataset.resources ?? [])]), registryData.lifecycle, ...registryData.operations];
}
const registryResources = flattenRegistryResources();
function requireResource(predicate: (resource: RawRegistryResource) => boolean, label: string): RawRegistryResource {
  const matches = registryResources.filter(predicate);
  if (matches.length !== 1) throw new Error(`Assurance registry binding expected exactly one ${label}; found ${matches.length}.`);
  return matches[0];
}
function runtimeDataset<T>(resource: RawRegistryResource): T {
  if (!resource.capabilities.includes('runtime')) throw new Error(`${resource.id} is not declared runtime-capable.`);
  const data = runtimeData[resource.id];
  if (!data) throw new Error(`Runtime assurance binding is missing ${resource.id}.`);
  return data as T;
}
function primaryDataset(kind: string): RawRegistryResource {
  return requireResource((resource) => resource.kind === kind && resource.capabilities.includes('api-index'), `primary ${kind} dataset`);
}

const evidenceData = runtimeDataset<RecordsDataset<PublicEvidence>>(primaryDataset('evidence'));
const claimsData = runtimeDataset<RecordsDataset<CanonicalClaim>>(primaryDataset('claims'));
const risksData = runtimeDataset<RecordsDataset<CanonicalRisk>>(primaryDataset('risks'));
const incidentsData = runtimeDataset<RecordsDataset<CanonicalIncident>>(primaryDataset('incidents'));
const exercisesData = runtimeDataset<RecordsDataset<CanonicalExercise>>(primaryDataset('exercises'));
const advisoriesData = runtimeDataset<RecordsDataset<CanonicalAdvisory>>(primaryDataset('advisories'));

const complianceResources = registryResources.filter((resource) => resource.kind === 'compliance');
const isoSources = complianceResources
  .filter((resource) => resource.capabilities.includes('summary-source'))
  .map((resource) => runtimeDataset<ComplianceDataset>(resource));
const wcagManifestResource = requireResource((resource) => resource.kind === 'compliance' && resource.capabilities.includes('manifest'), 'WCAG compliance manifest');
const wcagData = runtimeDataset<WcagManifest>(wcagManifestResource);
const wcagPartitions = wcagData.partitions.map((partition) => runtimeDataset<WcagPartition>(requireResource(
  (resource) => resource.kind === 'compliance' && resource.role === 'partition' && resource.path === partition.path,
  `registered WCAG partition ${partition.path}`,
)));

const evidence = evidenceData.records;
const canonicalClaims = claimsData.records;
const canonicalRisks = risksData.records;
const canonicalIncidents = incidentsData.records;
const canonicalExercises = exercisesData.records;
const canonicalAdvisories = advisoriesData.records;

const claims: PublicAssuranceClaim[] = canonicalClaims.map(({ relationships, ...record }) => ({
  ...record,
  frameworkReferences: [...relationships.compliance, ...relationships.frameworks],
  evidence: [...relationships.evidence],
}));
const risks: PublicRisk[] = canonicalRisks.map(({ relationships, ...record }) => ({
  ...record,
  controls: relationships.governanceDocuments.map((reference) => ({
    reference,
    repositoryPath: governanceDocuments.get(reference) ?? '',
  })),
  evidence: [...relationships.evidence],
}));
const incidents: PublicIncident[] = canonicalIncidents.map(({ relationships, ...record }) => ({
  ...record,
  riskLinks: [...relationships.risks],
  controlLinks: [...relationships.controls],
  evidence: [...relationships.evidence],
}));
const exercises: PublicExercise[] = canonicalExercises.map(({ relationships, ...record }) => ({
  ...record,
  riskLinks: [...relationships.risks],
  objectiveLinks: [...relationships.objectives],
  evidence: [...relationships.evidence],
}));
const advisories: PublicAdvisory[] = canonicalAdvisories.map(({ relationships, ...record }) => ({
  ...record,
  incidentLinks: [...relationships.incidents],
  evidence: [...relationships.evidence],
}));

const frameworkOrder = new Map<ComplianceFramework, number>([['iso-27001', 0], ['iso-42001', 1], ['wcag-2.2', 2]]);
export const publicComplianceRecords: PublicComplianceRecord[] = [
  ...isoSources.flatMap((source) => source.records),
  ...wcagPartitions.flatMap((partition) => partition.criteria),
].map(({ relationships, ...record }) => ({ ...record, evidence: [...relationships.evidence] }))
  .sort((left, right) => {
    const frameworkDifference = (frameworkOrder.get(left.framework) ?? 99) - (frameworkOrder.get(right.framework) ?? 99);
    return frameworkDifference || left.reference.localeCompare(right.reference, undefined, { numeric: true });
  });
export const publicComplianceFrameworks: PublicComplianceFramework[] = [...isoSources.map((source) => source.framework), wcagData.framework];
export const publicComplianceQualification = 'Public engineering-evidence projection only. Framework-specific qualifications remain authoritative; certification and formal conformance are not claimed.';

const usedBy = new Map<string, Set<string>>();
function addEvidenceUsage(recordId: string, evidenceIds: string[] = []): void {
  for (const evidenceId of evidenceIds) {
    const references = usedBy.get(evidenceId) ?? new Set<string>();
    references.add(recordId);
    usedBy.set(evidenceId, references);
  }
}
for (const claim of canonicalClaims) addEvidenceUsage(claim.id, claim.relationships.evidence);
for (const risk of canonicalRisks) addEvidenceUsage(risk.id, risk.relationships.evidence);
for (const incident of canonicalIncidents) addEvidenceUsage(incident.id, incident.relationships.evidence);
for (const exercise of canonicalExercises) addEvidenceUsage(exercise.id, exercise.relationships.evidence);
for (const advisory of canonicalAdvisories) addEvidenceUsage(advisory.id, advisory.relationships.evidence);
for (const compliance of [...isoSources.flatMap((source) => source.records), ...wcagPartitions.flatMap((partition) => partition.criteria)]) addEvidenceUsage(compliance.id, compliance.relationships.evidence);

export function deriveRiskCounts(records: PublicRisk[]): PublicRiskCounts {
  const counts: PublicRiskCounts = { total: records.length, byFramework: { security: 0, ai: 0 }, byStatus: { open: 0, treating: 0 }, byResidualRating: { low: 0, moderate: 0, high: 0, critical: 0 } };
  for (const record of records) {
    counts.byFramework[record.framework] += 1;
    counts.byStatus[record.status] += 1;
    counts.byResidualRating[record.residual.rating] += 1;
  }
  return counts;
}
export function deriveIncidentCounts(actual: PublicIncident[], simulatedExercises: PublicExercise[]): PublicIncidentCounts {
  return { actualIncidents: actual.length, exercises: simulatedExercises.length, plannedExercises: simulatedExercises.filter((record) => record.status === 'planned').length, completedExercises: simulatedExercises.filter((record) => ['completed', 'follow-up-open', 'closed'].includes(record.status)).length };
}
export function deriveComplianceCounts(records: PublicComplianceRecord[]): PublicComplianceCounts {
  const counts: PublicComplianceCounts = { total: records.length, byFramework: { 'iso-27001': 0, 'iso-42001': 0, 'wcag-2.2': 0 }, byStatus: { met: 0, partial: 0, gap: 0, 'not-applicable': 0, demonstrated: 0, 'not-observed': 0 }, byLevel: { A: 0, AA: 0, AAA: 0 } };
  for (const record of records) {
    counts.byFramework[record.framework] += 1;
    counts.byStatus[record.status] += 1;
    if (record.level) counts.byLevel[record.level] += 1;
  }
  return counts;
}
export function filterPublicRisks(filters: PublicRiskFilters): PublicRisk[] {
  return risks.filter((record) => (!filters.framework || record.framework === filters.framework) && (!filters.status || record.status === filters.status) && (!filters.residualRating || record.residual.rating === filters.residualRating));
}
export function filterPublicCompliance(filters: PublicComplianceFilters): PublicComplianceRecord[] {
  return publicComplianceRecords.filter((record) => (!filters.framework || record.framework === filters.framework) && (!filters.status || record.status === filters.status) && (!filters.level || record.level === filters.level));
}
export function findPublicComplianceRecord(recordId: string): PublicComplianceRecord | undefined { return publicComplianceRecords.find((record) => record.id === recordId); }
export function riskFiltersFromUrl(url: URL): PublicRiskFilters {
  const framework = url.searchParams.get('framework'); const status = url.searchParams.get('status'); const residualRating = url.searchParams.get('residual');
  return { ...(framework === 'security' || framework === 'ai' ? { framework } : {}), ...(status === 'open' || status === 'treating' ? { status } : {}), ...(residualRating === 'low' || residualRating === 'moderate' || residualRating === 'high' || residualRating === 'critical' ? { residualRating } : {}) };
}
export function complianceFiltersFromUrl(url: URL): PublicComplianceFilters {
  const framework = url.searchParams.get('framework'); const status = url.searchParams.get('status'); const level = url.searchParams.get('level');
  return { ...(framework === 'iso-27001' || framework === 'iso-42001' || framework === 'wcag-2.2' ? { framework } : {}), ...(status === 'met' || status === 'partial' || status === 'gap' || status === 'not-applicable' || status === 'demonstrated' || status === 'not-observed' ? { status } : {}), ...(level === 'A' || level === 'AA' || level === 'AAA' ? { level } : {}) };
}

export const publicComplianceRegistry = { schemaVersion: 1, dataset: 'compliance', qualification: publicComplianceQualification, frameworks: publicComplianceFrameworks, counts: deriveComplianceCounts(publicComplianceRecords), records: publicComplianceRecords };
const publicRegistryMetadata = {
  schemaVersion: registryData.schemaVersion, id: registryData.id, title: registryData.title, scope: registryData.scope, qualification: registryData.qualification, visibility: registryData.visibility,
  lifecycle: { path: registryData.lifecycle.path, schema: registryData.lifecycle.schema },
  datasets: registryData.datasets.map((dataset) => ({ kind: dataset.kind, path: dataset.path, schema: dataset.schema })),
};
export const publicAssuranceRegistry = {
  ...publicRegistryMetadata,
  counts: { claims: claims.length, evidence: evidence.length, risks: risks.length, incidents: incidents.length, exercises: exercises.length, advisories: advisories.length },
  riskCounts: deriveRiskCounts(risks),
  incidentCounts: deriveIncidentCounts(incidents, exercises),
  incidentQualifications: { incidents: incidentsData.qualification, exercises: exercisesData.qualification },
  advisoryQualification: advisoriesData.qualification,
  claims, risks, incidents, exercises, advisories,
  evidence: evidence.map((record) => ({ ...record, usedBy: [...(usedBy.get(record.id) ?? [])].sort() })),
};
