import {
  deriveComplianceCounts,
  deriveRiskCounts,
  filterPublicCompliance,
  filterPublicRisks,
  findPublicComplianceRecord,
  publicAssuranceRegistry,
  publicComplianceFrameworks,
  publicComplianceQualification,
  publicComplianceRecords,
  type PublicComplianceFilters,
  type PublicExercise,
  type PublicIncident,
  type PublicRiskFilters,
} from '../assurance/registry';
import {
  assuranceEnumQuery,
  assuranceErrorResponse,
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';

const RISK_FRAMEWORKS = ['security', 'ai'] as const;
const RISK_STATUSES = ['open', 'treating'] as const;
const RISK_RATINGS = ['low', 'moderate', 'high', 'critical'] as const;
const COMPLIANCE_FRAMEWORKS = ['iso-27001', 'iso-42001', 'wcag-2.2'] as const;
const COMPLIANCE_STATUSES = ['met', 'partial', 'gap', 'not-applicable', 'demonstrated', 'not-observed'] as const;
const COMPLIANCE_LEVELS = ['A', 'AA', 'AAA'] as const;

function riskFilters(request: Request, url: URL): PublicRiskFilters | Response {
  const framework = assuranceEnumQuery(request, url, 'framework', RISK_FRAMEWORKS);
  if (framework instanceof Response) return framework;
  const status = assuranceEnumQuery(request, url, 'status', RISK_STATUSES);
  if (status instanceof Response) return status;
  const residualRating = assuranceEnumQuery(request, url, 'residual', RISK_RATINGS);
  if (residualRating instanceof Response) return residualRating;
  return {
    ...(framework ? { framework } : {}),
    ...(status ? { status } : {}),
    ...(residualRating ? { residualRating } : {}),
  };
}

function complianceFilters(request: Request, url: URL): PublicComplianceFilters | Response {
  const framework = assuranceEnumQuery(request, url, 'framework', COMPLIANCE_FRAMEWORKS);
  if (framework instanceof Response) return framework;
  const status = assuranceEnumQuery(request, url, 'status', COMPLIANCE_STATUSES);
  if (status instanceof Response) return status;
  const level = assuranceEnumQuery(request, url, 'level', COMPLIANCE_LEVELS);
  if (level instanceof Response) return level;
  return {
    ...(framework ? { framework } : {}),
    ...(status ? { status } : {}),
    ...(level ? { level } : {}),
  };
}

export function assuranceRisksResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const filters = riskFilters(request, context.url);
  if (filters instanceof Response) return filters;
  const filteredRecords = filterPublicRisks(filters);
  const page = paginateAssuranceRecords(request, context.url, filteredRecords);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'risks',
    qualification: publicAssuranceRegistry.qualification,
    filters,
    counts: deriveRiskCounts(filteredRecords),
    totalAvailable: publicAssuranceRegistry.counts.risks,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}

export function assuranceComplianceResponse(request: Request, recordId?: string): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  if (recordId !== undefined) {
    let decodedId: string;
    try {
      decodedId = decodeURIComponent(recordId);
    } catch {
      return assuranceErrorResponse(request, 400, { error: 'invalid_compliance_record_id' });
    }
    const record = findPublicComplianceRecord(decodedId);
    if (!record) {
      return assuranceErrorResponse(request, 404, { error: 'compliance_record_not_found', recordId: decodedId });
    }
    return assuranceJsonResponse(request, {
      schemaVersion: context.schemaVersion,
      dataset: 'compliance',
      qualification: publicComplianceQualification,
      framework: publicComplianceFrameworks.find((candidate) => candidate.id === record.framework),
      record,
    });
  }

  const filters = complianceFilters(request, context.url);
  if (filters instanceof Response) return filters;
  const filteredRecords = filterPublicCompliance(filters);
  const page = paginateAssuranceRecords(request, context.url, filteredRecords);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'compliance',
    qualification: publicComplianceQualification,
    filters,
    counts: deriveComplianceCounts(filteredRecords),
    totalAvailable: publicComplianceRecords.length,
    frameworks: publicComplianceFrameworks,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}

export function assuranceIncidentsResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const combined = [
    ...publicAssuranceRegistry.incidents,
    ...publicAssuranceRegistry.exercises,
  ] as Array<PublicIncident | PublicExercise>;
  const page = paginateAssuranceRecords(request, context.url, combined);
  if (page instanceof Response) return page;
  const incidents = page.records.filter((record): record is PublicIncident => record.recordType === 'incident');
  const exercises = page.records.filter((record): record is PublicExercise => record.recordType === 'exercise');

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'incidents',
    qualification: publicAssuranceRegistry.incidentQualifications,
    counts: publicAssuranceRegistry.incidentCounts,
    incidents,
    exercises,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
