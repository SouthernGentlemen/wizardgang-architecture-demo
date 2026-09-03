import {
  assuranceFilterValues,
  deriveComplianceCounts,
  deriveRiskCounts,
  publicComplianceFrameworks,
  publicComplianceQualification,
  type ComplianceFramework,
  type ComplianceLevel,
  type ComplianceStatus,
  type PublicComplianceFilters,
  type PublicRiskFilters,
  type RiskFramework,
  type RiskRating,
  type RiskStatus,
} from '../assurance/service';
import {
  filterPublishedCompliance,
  filterPublishedRisks,
  findPublishedAssuranceRecord,
  listPublishedAssuranceRecords,
  publicPublishedAssuranceRegistry,
} from '../assurance/publication';
import {
  assuranceEnumQuery,
  assuranceErrorResponse,
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';

function riskFilters(request: Request, url: URL): PublicRiskFilters | Response {
  const framework = assuranceEnumQuery(request, url, 'framework', assuranceFilterValues('risks', 'framework'));
  if (framework instanceof Response) return framework;
  const status = assuranceEnumQuery(request, url, 'status', assuranceFilterValues('risks', 'status'));
  if (status instanceof Response) return status;
  const residualRating = assuranceEnumQuery(request, url, 'residual', assuranceFilterValues('risks', 'residual'));
  if (residualRating instanceof Response) return residualRating;
  return {
    ...(framework ? { framework: framework as RiskFramework } : {}),
    ...(status ? { status: status as RiskStatus } : {}),
    ...(residualRating ? { residualRating: residualRating as RiskRating } : {}),
  };
}

function complianceFilters(request: Request, url: URL): PublicComplianceFilters | Response {
  const framework = assuranceEnumQuery(request, url, 'framework', assuranceFilterValues('compliance', 'framework'));
  if (framework instanceof Response) return framework;
  const status = assuranceEnumQuery(request, url, 'status', assuranceFilterValues('compliance', 'status'));
  if (status instanceof Response) return status;
  const level = assuranceEnumQuery(request, url, 'level', assuranceFilterValues('compliance', 'level'));
  if (level instanceof Response) return level;
  return {
    ...(framework ? { framework: framework as ComplianceFramework } : {}),
    ...(status ? { status: status as ComplianceStatus } : {}),
    ...(level ? { level: level as ComplianceLevel } : {}),
  };
}

export function assuranceRisksResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const filters = riskFilters(request, context.url);
  if (filters instanceof Response) return filters;
  const filteredRecords = filterPublishedRisks(filters);
  const page = paginateAssuranceRecords(request, context.url, filteredRecords);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'risks',
    qualification: publicPublishedAssuranceRegistry.qualification,
    filters,
    counts: deriveRiskCounts(filteredRecords),
    totalAvailable: listPublishedAssuranceRecords('risks').length,
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
    const record = findPublishedAssuranceRecord('compliance', decodedId);
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
  const filteredRecords = filterPublishedCompliance(filters);
  const page = paginateAssuranceRecords(request, context.url, filteredRecords);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'compliance',
    qualification: publicComplianceQualification,
    filters,
    counts: deriveComplianceCounts(filteredRecords),
    totalAvailable: listPublishedAssuranceRecords('compliance').length,
    frameworks: publicComplianceFrameworks,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}

export function assuranceIncidentsResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const combined = [
    ...listPublishedAssuranceRecords('incidents'),
    ...listPublishedAssuranceRecords('exercises'),
  ];
  const page = paginateAssuranceRecords(request, context.url, combined);
  if (page instanceof Response) return page;
  const incidents = page.records.filter((record) => record.recordType === 'incident');
  const exercises = page.records.filter((record) => record.recordType === 'exercise');

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'incidents',
    qualification: publicPublishedAssuranceRegistry.incidentQualifications,
    counts: publicPublishedAssuranceRegistry.incidentCounts,
    incidents,
    exercises,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
