import registryData from '../../assurance/registry.json';
import evidenceData from '../../assurance/evidence/evidence.json';
import claimsData from '../../assurance/claims/claims.json';
import risksData from '../../assurance/risks/risks.json';

export type EvidenceKind = 'source' | 'test' | 'workflow' | 'governance-record' | 'release' | 'live-route' | 'observation';
export type FreshnessPolicy = 'release-bound' | 'event-driven' | 'observation-bound';
export type AssurancePosture = 'met' | 'partial' | 'gap' | 'not-applicable';
export type RiskFramework = 'security' | 'ai';
export type RiskRating = 'low' | 'moderate' | 'high' | 'critical';
export type RiskStatus = 'open' | 'treating';
export type RiskTreatment = 'avoid' | 'reduce' | 'share';

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

const evidence = evidenceData.records as PublicEvidence[];
const claims = claimsData.records as PublicAssuranceClaim[];
const risks = risksData.records as PublicRisk[];
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
  },
  riskCounts: deriveRiskCounts(risks),
  claims,
  risks,
  evidence: evidence.map((record) => ({ ...record, usedBy: usedBy.get(record.id) ?? [] })),
};
