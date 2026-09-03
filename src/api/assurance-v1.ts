import { governanceDocumentLinks } from '../assurance/presentation';
import type { AssuranceDataset } from '../assurance/model';
import type { AssuranceFilterValues } from '../assurance/service';
import type {
  PresentedPublishedEvidence,
  PublishedAssuranceRecordMap,
} from '../assurance/publication';

export type AssuranceV1Claim = Omit<PublishedAssuranceRecordMap['claims'], 'relationships'> & {
  frameworkReferences: string[];
  evidence: string[];
};

export type AssuranceV1Risk = Omit<PublishedAssuranceRecordMap['risks'], 'relationships'> & {
  controls: Array<{ reference: string; repositoryPath: string }>;
  evidence: string[];
};

export type AssuranceV1Incident = Omit<PublishedAssuranceRecordMap['incidents'], 'relationships'> & {
  riskLinks: string[];
  controlLinks: string[];
  evidence: string[];
};

export type AssuranceV1Exercise = Omit<PublishedAssuranceRecordMap['exercises'], 'relationships'> & {
  riskLinks: string[];
  objectiveLinks: string[];
  evidence: string[];
};

export type AssuranceV1Advisory = Omit<PublishedAssuranceRecordMap['advisories'], 'relationships'> & {
  incidentLinks: string[];
  evidence: string[];
};

export type AssuranceV1ComplianceRecord = Omit<PublishedAssuranceRecordMap['compliance'], 'relationships'> & {
  evidence: string[];
};

export type AssuranceV1Evidence = PresentedPublishedEvidence;

export function serializeAssuranceV1Filters(
  dataset: AssuranceDataset,
  filters: AssuranceFilterValues,
): Record<string, string> {
  if (dataset !== 'risks' || filters.residual === undefined) return { ...filters };
  const { residual, ...released } = filters;
  return { ...released, residualRating: residual };
}

export function serializeAssuranceV1Claim(record: PublishedAssuranceRecordMap['claims']): AssuranceV1Claim {
  const { relationships, publication, ...value } = record;
  return {
    ...value,
    frameworkReferences: [...relationships.compliance, ...relationships.frameworks],
    evidence: [...relationships.evidence],
    publication,
  };
}

export function serializeAssuranceV1Risk(record: PublishedAssuranceRecordMap['risks']): AssuranceV1Risk {
  const { relationships, publication, ...value } = record;
  return {
    ...value,
    controls: governanceDocumentLinks(relationships.governanceDocuments),
    evidence: [...relationships.evidence],
    publication,
  };
}

export function serializeAssuranceV1Incident(record: PublishedAssuranceRecordMap['incidents']): AssuranceV1Incident {
  const { relationships, publication, ...value } = record;
  return {
    ...value,
    riskLinks: [...relationships.risks],
    controlLinks: [...relationships.controls],
    evidence: [...relationships.evidence],
    publication,
  };
}

export function serializeAssuranceV1Exercise(record: PublishedAssuranceRecordMap['exercises']): AssuranceV1Exercise {
  const { relationships, publication, ...value } = record;
  return {
    ...value,
    riskLinks: [...relationships.risks],
    objectiveLinks: [...relationships.objectives],
    evidence: [...relationships.evidence],
    publication,
  };
}

export function serializeAssuranceV1Advisory(record: PublishedAssuranceRecordMap['advisories']): AssuranceV1Advisory {
  const { relationships, publication, ...value } = record;
  return {
    ...value,
    incidentLinks: [...relationships.incidents],
    evidence: [...relationships.evidence],
    publication,
  };
}

export function serializeAssuranceV1Compliance(record: PublishedAssuranceRecordMap['compliance']): AssuranceV1ComplianceRecord {
  const { relationships, publication, ...value } = record;
  return {
    ...value,
    evidence: [...relationships.evidence],
    publication,
  };
}

export function serializeAssuranceV1Evidence(record: PresentedPublishedEvidence): AssuranceV1Evidence {
  return { ...record };
}
