import registryData from '../../assurance/registry.json';
import evidenceData from '../../assurance/evidence/evidence.json';
import claimsData from '../../assurance/claims/claims.json';
import risksData from '../../assurance/risks/risks.json';
import incidentsData from '../../assurance/incidents/incidents.json';
import exercisesData from '../../assurance/incidents/exercises.json';

export type EvidenceKind = 'source' | 'test' | 'workflow' | 'governance-record' | 'release' | 'live-route' | 'observation';
export type FreshnessPolicy = 'release-bound' | 'event-driven' | 'observation-bound';
export type AssurancePosture = 'met' | 'partial' | 'gap' | 'not-applicable';
export type RiskFramework = 'security' | 'ai';
export type RiskRating = 'low' | 'moderate' | 'high' | 'critical';
export type RiskStatus = 'open' | 'treating';
export type RiskTreatment = 'avoid' | 'reduce' | 'share';
export type IncidentStatus = 'investigating' | 'contained' | 'recovering' | 'monitoring' | 'closed' | 'superseded';
export type ExerciseStatus = 'planned' | 'in-progress' | 'completed' | 'follow-up-open' | 'closed' | 'superseded';

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

export interface PublicRiskFilters {
  framework?: RiskFramework;
  status?: RiskStatus;
  residualRating?: RiskRating;
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

const evidence = evidenceData.records as PublicEvidence[];
const claims = claimsData.records as PublicAssuranceClaim[];
const risks = risksData.records as PublicRisk[];
const incidents = incidentsData.records as PublicIncident[];
const exercises = exercisesData.records as PublicExercise[];
const usedBy = new Map<string, string[]>();

for (const claim of claims) {
  for (const evidenceId of claim.evidence) usedBy.set(evidenceId, [...(usedBy.get(evidenceId) ?? []), claim.id]);
}

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

export function filterPublicRisks(filters: PublicRiskFilters): PublicRisk[] {
  return risks.filter((record) => (
    (!filters.framework || record.framework === filters.framework)
    && (!filters.status || record.status === filters.status)
    && (!filters.residualRating || record.residual.rating === filters.residualRating)
  ));
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

export const publicAssuranceRegistry = {
  ...registryData,
  counts: {
    claims: claims.length,
    evidence: evidence.length,
    risks: risks.length,
    incidents: incidents.length,
    exercises: exercises.length,
  },
  riskCounts: deriveRiskCounts(risks),
  incidentCounts: deriveIncidentCounts(incidents, exercises),
  incidentQualifications: {
    incidents: incidentsData.qualification,
    exercises: exercisesData.qualification,
  },
  claims,
  risks,
  incidents,
  exercises,
  evidence: evidence.map((record) => ({ ...record, usedBy: usedBy.get(record.id) ?? [] })),
};
