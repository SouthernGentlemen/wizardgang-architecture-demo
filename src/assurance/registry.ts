import registryData from '../../assurance/registry.json';
import evidenceData from '../../assurance/evidence/evidence.json';
import claimsData from '../../assurance/claims/claims.json';
import risksData from '../../assurance/risks/risks.json';
import incidentsData from '../../assurance/incidents/incidents.json';
import exercisesData from '../../assurance/incidents/exercises.json';
import advisoriesData from '../../assurance/advisories/advisories.json';
import iso27001Data from '../../assurance/compliance/iso-27001-2022.json';
import iso42001Data from '../../assurance/compliance/iso-42001-2023.json';
import wcagData from '../../assurance/compliance/wcag-2.2.json';
import wcagPerceivableData from '../../assurance/compliance/wcag-2.2/perceivable.json';
import wcagOperableData from '../../assurance/compliance/wcag-2.2/operable.json';
import wcagUnderstandableData from '../../assurance/compliance/wcag-2.2/understandable.json';
import wcagRobustData from '../../assurance/compliance/wcag-2.2/robust.json';

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

type RawIsoRecord = { reference: string; title: string; evidence: string[]; rationale?: string };
type RawIsoGroups = Record<string, RawIsoRecord[]>;
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

const evidence = evidenceData.records as PublicEvidence[];
const claims = claimsData.records as PublicAssuranceClaim[];
const risks = risksData.records as PublicRisk[];
const incidents = incidentsData.records as PublicIncident[];
const exercises = exercisesData.records as PublicExercise[];
const advisories = advisoriesData.records as PublicAdvisory[];
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

const wcagPartitions: Array<{ sourcePath: string; data: RawWcagPartition }> = [
  { sourcePath: 'assurance/compliance/wcag-2.2/perceivable.json', data: wcagPerceivableData as unknown as RawWcagPartition },
  { sourcePath: 'assurance/compliance/wcag-2.2/operable.json', data: wcagOperableData as unknown as RawWcagPartition },
  { sourcePath: 'assurance/compliance/wcag-2.2/understandable.json', data: wcagUnderstandableData as unknown as RawWcagPartition },
  { sourcePath: 'assurance/compliance/wcag-2.2/robust.json', data: wcagRobustData as unknown as RawWcagPartition },
];

const frameworkOrder = new Map<ComplianceFramework, number>([
  ['iso-27001', 0],
  ['iso-42001', 1],
  ['wcag-2.2', 2],
]);

export const publicComplianceRecords: PublicComplianceRecord[] = [
  ...normalizeIsoDataset(
    'iso-27001',
    iso27001Data.standard,
    'ISO27001',
    'assurance/compliance/iso-27001-2022.json',
    iso27001Data.clauses as unknown as RawIsoGroups,
    iso27001Data.annexA as unknown as Record<string, RawIsoGroups>,
  ),
  ...normalizeIsoDataset(
    'iso-42001',
    iso42001Data.standard,
    'ISO42001',
    'assurance/compliance/iso-42001-2023.json',
    iso42001Data.clauses as unknown as RawIsoGroups,
    iso42001Data.annexA as unknown as Record<string, RawIsoGroups>,
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
    label: iso27001Data.standard,
    edition: iso27001Data.edition,
    qualification: iso27001Data.qualification,
    assessmentDate: iso27001Data.sourceSoa.assessmentDate,
    sourcePath: 'assurance/compliance/iso-27001-2022.json',
  },
  {
    id: 'iso-42001',
    label: iso42001Data.standard,
    edition: iso42001Data.edition,
    qualification: iso42001Data.qualification,
    assessmentDate: iso42001Data.sourceSoa.assessmentDate,
    sourcePath: 'assurance/compliance/iso-42001-2023.json',
  },
  {
    id: 'wcag-2.2',
    label: 'WCAG 2.2',
    edition: wcagData.edition,
    qualification: wcagData.qualification,
    assessmentDate: wcagData.assessmentDate,
    sourcePath: 'assurance/compliance/wcag-2.2.json',
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

export const publicAssuranceRegistry = {
  ...registryData,
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
