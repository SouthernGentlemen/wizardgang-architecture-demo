import registryData from '../../assurance/registry.json';
import evidenceData from '../../assurance/evidence/evidence.json';
import claimsData from '../../assurance/claims/claims.json';

export type EvidenceKind = 'source' | 'test' | 'workflow' | 'governance-record' | 'release' | 'live-route' | 'observation';
export type FreshnessPolicy = 'release-bound' | 'event-driven' | 'observation-bound';
export type AssurancePosture = 'met' | 'partial' | 'gap' | 'not-applicable';

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

const evidence = evidenceData.records as PublicEvidence[];
const claims = claimsData.records as PublicAssuranceClaim[];
const usedBy = new Map<string, string[]>();

for (const claim of claims) {
  for (const evidenceId of claim.evidence) usedBy.set(evidenceId, [...(usedBy.get(evidenceId) ?? []), claim.id]);
}

export const publicAssuranceRegistry = {
  ...registryData,
  counts: {
    claims: claims.length,
    evidence: evidence.length,
  },
  claims,
  evidence: evidence.map((record) => ({ ...record, usedBy: usedBy.get(record.id) ?? [] })),
};
