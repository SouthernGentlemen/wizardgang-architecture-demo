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

export interface PublicRiskFilters {
  framework?: RiskFramework;
  status?: RiskStatus;
  residualRating?: RiskRating;
}

export interface PublicComplianceFilters {
  framework?: ComplianceFramework;
  status?: ComplianceStatus;
  level?: ComplianceLevel;
}

export interface PublicRiskCounts {
  total: number;
  byFramework: Record<RiskFramework, number>;
  byStatus: Record<RiskStatus, number>;
  byResidualRating: Record<RiskRating, number>;
}

export interface PublicIncidentCounts {
  actualIncidents: number;
  exercises: number;
  plannedExercises: number;
  completedExercises: number;
}

export interface PublicComplianceCounts {
  total: number;
  byFramework: Record<ComplianceFramework, number>;
  byStatus: Record<ComplianceStatus, number>;
  byLevel: Record<ComplianceLevel, number>;
}

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

type RawIsoRecord = { reference: string; title: string; evidence: string[]; rationale?: string };
type RawIsoGroups = Record<string, RawIsoRecord[]>;
type RawIsoDataset = {
  standard: string;
  edition: string;
  qualification: string;
  sourceSoa: { assessmentDate: string };
  clauses: RawIsoGroups;
  annexA: Record<string, RawIsoGroups>;
};
type RawWcagCriterion = {
  criterionId: string;
  name: string;
  level: ComplianceLevel;
  status: 'demonstrated' | 'partial' | 'gap' | 'not-observed';
  implementation: string;
  validation: { automated: 'partial' | 'none'; manual: 'required' };
  evidenceIds: string[];
  gaps: string[];
  owner: string;
  freshnessRules: string[];
};
type RawWcagPartition = {
  principle: { number: string; name: string };
  criteria: RawWcagCriterion[];
};
type RawWcagManifest = {
  edition: string;
  qualification: string;
  assessmentDate: string;
  partitions: Array<{ principle: string; path: string }>;
};

type RecordsDataset<T> = { records: T[]; qualification?: string };

const registryData = assuranceRegistryData as unknown as RawRegistry;
const runtimeData = assuranceRuntimeDatasets as Record<string, unknown>;

function flattenRegistryResources(): RawRegistryResource[] {
  return [
    ...registryData.datasets.flatMap((dataset) => [dataset, ...(dataset.resources ?? [])]),
    registryData.lifecycle,
    ...registryData.operations,
  ];
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
  return requireResource(
    (resource) => resource.kind === kind && resource.capabilities.includes('api-index'),
    `primary ${kind} dataset`,
  );
}

const evidenceResource = primaryDataset('evidence');
const claimsResource = primaryDataset('claims');
const risksResource = primaryDataset('risks');
const incidentsResource = primaryDataset('incidents');
const exercisesResource = primaryDataset('exercises');
const advisoriesResource = primaryDataset('advisories');

const evidenceData = runtimeDataset<RecordsDataset<PublicEvidence>>(evidenceResource);
const claimsData = runtimeDataset<RecordsDataset<PublicAssuranceClaim>>(claimsResource);
const risksData = runtimeDataset<RecordsDataset<PublicRisk>>(risksResource);
const incidentsData = runtimeDataset<RecordsDataset<PublicIncident>>(incidentsResource);
const exercisesData = runtimeDataset<RecordsDataset<PublicExercise>>(exercisesResource);
const advisoriesData = runtimeDataset<RecordsDataset<PublicAdvisory>>(advisoriesResource);

const complianceResources = registryResources.filter((resource) => resource.kind === 'compliance');
const summarySources = complianceResources
  .filter((resource) => resource.capabilities.includes('summary-source'))
  .map((resource) => ({ resource, data: runtimeDataset<RawIsoDataset>(resource) }));
const iso27001Source = summarySources.find(({ data }) => data.standard.includes('27001'));
const iso42001Source = summarySources.find(({ data }) => data.standard.includes('42001'));
if (!iso27001Source || !iso42001Source) throw new Error('Assurance registry must provide both ISO/IEC 27001 and ISO/IEC 42001 runtime datasets.');

const wcagManifestResource = requireResource(
  (resource) => resource.kind === 'compliance' && resource.capabilities.includes('manifest'),
  'WCAG compliance manifest',
);
const wcagData = runtimeDataset<RawWcagManifest>(wcagManifestResource);
const wcagPartitions = wcagData.partitions.map((partition) => {
  const resource = requireResource(
    (candidate) => candidate.kind === 'compliance' && candidate.role === 'partition' && candidate.path === partition.path,
    `registered WCAG partition ${partition.path}`,
  );
  return { sourcePath: resource.path, data: runtimeDataset<RawWcagPartition>(resource) };
});

const evidence = evidenceData.records;
const claims = claimsData.records;
const risks = risksData.records;
const incidents = incidentsData.records;
const exercises = exercisesData.records;
const advisories = advisoriesData.records;
const usedBy = new Map<string, Set<string>>();

function addEvidenceUsage(recordId: string, evidenceIds: string[] = []): void {
  for (const evidenceId of evidenceIds) {
    const references = usedBy.get(evidenceId) ?? new Set<string>();
    references.add(recordId);
    usedBy.set(evidenceId, references);
  }
}

function normalizeComplianceStatus(value: string): ComplianceStatus {
  return value === 'notApplicable' ? 'not-applicable' : value as ComplianceStatus;
}

function normalizeIsoGroups(
  framework: ComplianceFramework,
  frameworkLabel: string,
  idPrefix: string,
  kind: 'clause' | 'control',
  section: string,
  sourcePath: string,
  groups: RawIsoGroups,
): PublicComplianceRecord[] {
  return Object.entries(groups).flatMap(([status, records]) => records.map((record) => {
    const normalizedStatus = normalizeComplianceStatus(status);
    return {
      id: `${idPrefix}-${record.reference}`,
      framework,
      frameworkLabel,
      reference: record.reference,
      title: record.title,
      kind,
      section,
      status: normalizedStatus,
      applicability: normalizedStatus === 'not-applicable' ? 'not-applicable' : 'applicable',
      ...(record.rationale ? { rationale: record.rationale } : {}),
      evidence: [...record.evidence],
      sourcePath,
    };
  }));
}

function normalizeIsoDataset(
  framework: ComplianceFramework,
  frameworkLabel: string,
  idPrefix: string,
  sourcePath: string,
  clauses: RawIsoGroups,
  annexA: Record<string, RawIsoGroups>,
): PublicComplianceRecord[] {
  return [
    ...normalizeIsoGroups(framework, frameworkLabel, idPrefix, 'clause', 'Clauses 4–10', sourcePath, clauses),
    ...Object.entries(annexA).flatMap(([family, groups]) => normalizeIsoGroups(
      framework,
      frameworkLabel,
      idPrefix,
      'control',
      `Annex A · ${family.replace(/([a-z])([A-Z])/g, '$1 $2')}`,
      sourcePath,
      groups,
    )),
  ];
}

const frameworkOrder = new Map<ComplianceFramework, number>([
  ['iso-27001', 0],
  ['iso-42001', 1],
  ['wcag-2.2', 2],
]);

export const publicComplianceRecords: PublicComplianceRecord[] = [
  ...normalizeIsoDataset(
    'iso-27001',
    iso27001Source.data.standard,
    'ISO27001',
    iso27001Source.resource.path,
    iso27001Source.data.clauses,
    iso27001Source.data.annexA,
  ),
  ...normalizeIsoDataset(
    'iso-42001',
    iso42001Source.data.standard,
    'ISO42001',
    iso42001Source.resource.path,
    iso42001Source.data.clauses,
    iso42001Source.data.annexA,
  ),
  ...wcagPartitions.flatMap(({ sourcePath, data }) => data.criteria.map((criterion): PublicComplianceRecord => ({
    id: `WCAG-${criterion.criterionId}`,
    framework: 'wcag-2.2',
    frameworkLabel: 'WCAG 2.2',
    reference: criterion.criterionId,
    title: criterion.name,
    kind: 'criterion',
    section: `${data.principle.number}. ${data.principle.name}`,
    status: criterion.status,
    level: criterion.level,
    implementation: criterion.implementation,
    validation: { ...criterion.validation },
    gaps: [...criterion.gaps],
    owner: criterion.owner,
    freshnessRules: [...criterion.freshnessRules],
    evidence: [...criterion.evidenceIds],
    sourcePath,
  }))),
].sort((left, right) => {
  const frameworkDifference = (frameworkOrder.get(left.framework) ?? 99) - (frameworkOrder.get(right.framework) ?? 99);
  if (frameworkDifference) return frameworkDifference;
  return left.reference.localeCompare(right.reference, undefined, { numeric: true });
});

export const publicComplianceFrameworks: PublicComplianceFramework[] = [
  {
    id: 'iso-27001',
    label: iso27001Source.data.standard,
    edition: iso27001Source.data.edition,
    qualification: iso27001Source.data.qualification,
    assessmentDate: iso27001Source.data.sourceSoa.assessmentDate,
    sourcePath: iso27001Source.resource.path,
  },
  {
    id: 'iso-42001',
    label: iso42001Source.data.standard,
    edition: iso42001Source.data.edition,
    qualification: iso42001Source.data.qualification,
    assessmentDate: iso42001Source.data.sourceSoa.assessmentDate,
    sourcePath: iso42001Source.resource.path,
  },
  {
    id: 'wcag-2.2',
    label: 'WCAG 2.2',
    edition: wcagData.edition,
    qualification: wcagData.qualification,
    assessmentDate: wcagData.assessmentDate,
    sourcePath: wcagManifestResource.path,
  },
];

export const publicComplianceQualification = 'Public engineering-evidence projection only. Framework-specific qualifications remain authoritative; certification and formal conformance are not claimed.';

for (const claim of claims) addEvidenceUsage(claim.id, claim.evidence);
for (const risk of risks) addEvidenceUsage(risk.id, risk.evidence);
for (const incident of incidents) addEvidenceUsage(incident.id, incident.evidence);
for (const exercise of exercises) addEvidenceUsage(exercise.id, exercise.evidence);
for (const advisory of advisories) addEvidenceUsage(advisory.id, advisory.evidence);
for (const compliance of publicComplianceRecords) addEvidenceUsage(compliance.id, compliance.evidence);

export function deriveRiskCounts(records: PublicRisk[]): PublicRiskCounts {
  const counts: PublicRiskCounts = {
    total: records.length,
    byFramework: { security: 0, ai: 0 },
    byStatus: { open: 0, treating: 0 },
    byResidualRating: { low: 0, moderate: 0, high: 0, critical: 0 },
  };
  for (const record of records) {
    counts.byFramework[record.framework] += 1;
    counts.byStatus[record.status] += 1;
    counts.byResidualRating[record.residual.rating] += 1;
  }
  return counts;
}

export function deriveIncidentCounts(actual: PublicIncident[], simulatedExercises: PublicExercise[]): PublicIncidentCounts {
  return {
    actualIncidents: actual.length,
    exercises: simulatedExercises.length,
    plannedExercises: simulatedExercises.filter((record) => record.status === 'planned').length,
    completedExercises: simulatedExercises.filter((record) => ['completed', 'follow-up-open', 'closed'].includes(record.status)).length,
  };
}

export function deriveComplianceCounts(records: PublicComplianceRecord[]): PublicComplianceCounts {
  const counts: PublicComplianceCounts = {
    total: records.length,
    byFramework: { 'iso-27001': 0, 'iso-42001': 0, 'wcag-2.2': 0 },
    byStatus: { met: 0, partial: 0, gap: 0, 'not-applicable': 0, demonstrated: 0, 'not-observed': 0 },
    byLevel: { A: 0, AA: 0, AAA: 0 },
  };
  for (const record of records) {
    counts.byFramework[record.framework] += 1;
    counts.byStatus[record.status] += 1;
    if (record.level) counts.byLevel[record.level] += 1;
  }
  return counts;
}

export function filterPublicRisks(filters: PublicRiskFilters): PublicRisk[] {
  return risks.filter((record) => (
    (!filters.framework || record.framework === filters.framework)
    && (!filters.status || record.status === filters.status)
    && (!filters.residualRating || record.residual.rating === filters.residualRating)
  ));
}

export function filterPublicCompliance(filters: PublicComplianceFilters): PublicComplianceRecord[] {
  return publicComplianceRecords.filter((record) => (
    (!filters.framework || record.framework === filters.framework)
    && (!filters.status || record.status === filters.status)
    && (!filters.level || record.level === filters.level)
  ));
}

export function findPublicComplianceRecord(recordId: string): PublicComplianceRecord | undefined {
  return publicComplianceRecords.find((record) => record.id === recordId);
}

export function riskFiltersFromUrl(url: URL): PublicRiskFilters {
  const framework = url.searchParams.get('framework');
  const status = url.searchParams.get('status');
  const residualRating = url.searchParams.get('residual');
  return {
    ...(framework === 'security' || framework === 'ai' ? { framework } : {}),
    ...(status === 'open' || status === 'treating' ? { status } : {}),
    ...(residualRating === 'low' || residualRating === 'moderate' || residualRating === 'high' || residualRating === 'critical'
      ? { residualRating }
      : {}),
  };
}

export function complianceFiltersFromUrl(url: URL): PublicComplianceFilters {
  const framework = url.searchParams.get('framework');
  const status = url.searchParams.get('status');
  const level = url.searchParams.get('level');
  return {
    ...(framework === 'iso-27001' || framework === 'iso-42001' || framework === 'wcag-2.2' ? { framework } : {}),
    ...(status === 'met' || status === 'partial' || status === 'gap' || status === 'not-applicable' || status === 'demonstrated' || status === 'not-observed' ? { status } : {}),
    ...(level === 'A' || level === 'AA' || level === 'AAA' ? { level } : {}),
  };
}

export const publicComplianceRegistry = {
  schemaVersion: 1,
  dataset: 'compliance',
  qualification: publicComplianceQualification,
  frameworks: publicComplianceFrameworks,
  counts: deriveComplianceCounts(publicComplianceRecords),
  records: publicComplianceRecords,
};

const publicRegistryMetadata = {
  schemaVersion: registryData.schemaVersion,
  id: registryData.id,
  title: registryData.title,
  scope: registryData.scope,
  qualification: registryData.qualification,
  visibility: registryData.visibility,
  lifecycle: {
    path: registryData.lifecycle.path,
    schema: registryData.lifecycle.schema,
  },
  datasets: registryData.datasets.map((dataset) => ({
    kind: dataset.kind,
    path: dataset.path,
    schema: dataset.schema,
  })),
};

export const publicAssuranceRegistry = {
  ...publicRegistryMetadata,
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
  incidentQualifications: {
    incidents: incidentsData.qualification,
    exercises: exercisesData.qualification,
  },
  advisoryQualification: advisoriesData.qualification,
  claims,
  risks,
  incidents,
  exercises,
  advisories,
  evidence: evidence.map((record) => ({ ...record, usedBy: [...(usedBy.get(record.id) ?? [])].sort() })),
};
