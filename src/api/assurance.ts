import {
  assuranceFilterValues,
  complianceFrameworks,
  complianceQualification,
  deriveComplianceCounts,
  deriveRiskCounts,
  type AssuranceFilterValues,
} from '../assurance/service';
import type {
  ComplianceFramework,
  ComplianceLevel,
  ComplianceStatus,
  RiskFramework,
  RiskRating,
  RiskStatus,
} from '../assurance/model';
import {
  filterPublishedAssuranceRecords,
  findPublishedAssuranceRecord,
  listPublishedAssuranceRecords,
  publishedAssuranceSummary,
} from '../assurance/publication';
import {
  serializeAssuranceV1Compliance,
  serializeAssuranceV1Exercise,
  serializeAssuranceV1Incident,
  serializeAssuranceV1Risk,
} from './assurance-v1';
import {
  assuranceEnumQuery,
  assuranceErrorResponse,
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';

interface RiskRequestFilters {
  canonical: AssuranceFilterValues;
  released: {
    framework?: RiskFramework;
    status?: RiskStatus;
    residualRating?: RiskRating;
  };
}

function riskFilters(request: Request, url: URL): RiskRequestFilters | Response {
  const framework = assuranceEnumQuery(request, url, 'framework', assuranceFilterValues('risks', 'framework'));
  if (framework instanceof Response) return framework;
  const status = assuranceEnumQuery(request, url, 'status', assuranceFilterValues('risks', 'status'));
  if (status instanceof Response) return status;
  const residual = assuranceEnumQuery(request, url, 'residual', assuranceFilterValues('risks', 'residual'));
  if (residual instanceof Response) return residual;
  return {
    canonical: {
      ...(framework ? { framework } : {}),
      ...(status ? { status } : {}),
      ...(residual ? { residual } : {}),
    },
    released: {
      ...(framework ? { framework: framework as RiskFramework } : {}),
      ...(status ? { status: status as RiskStatus } : {}),
      ...(residual ? { residualRating: residual as RiskRating } : {}),
    },
  };
}

function complianceFilters(request: Request, url: URL): AssuranceFilterValues | Response {
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
  const filteredRecords = filterPublishedAssuranceRecords('risks', filters.canonical);
  const page = paginateAssuranceRecords(request, context.url, filteredRecords);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'risks',
    qualification: publishedAssuranceSummary.qualification,
    filters: filters.released,
    counts: deriveRiskCounts(filteredRecords),
    totalAvailable: listPublishedAssuranceRecords('risks').length,
    records: page.records.map(serializeAssuranceV1Risk),
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
      qualification: complianceQualification,
      framework: complianceFrameworks.find((candidate) => candidate.id === record.framework),
      record: serializeAssuranceV1Compliance(record),
    });
  }

  const filters = complianceFilters(request, context.url);
  if (filters instanceof Response) return filters;
  const filteredRecords = filterPublishedAssuranceRecords('compliance', filters);
  const page = paginateAssuranceRecords(request, context.url, filteredRecords);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'compliance',
    qualification: complianceQualification,
    filters,
    counts: deriveComplianceCounts(filteredRecords),
    totalAvailable: listPublishedAssuranceRecords('compliance').length,
    frameworks: complianceFrameworks,
    records: page.records.map(serializeAssuranceV1Compliance),
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
  const incidents = page.records.flatMap((record) =>
    record.recordType === 'incident' ? [serializeAssuranceV1Incident(record)] : [],
  );
  const exercises = page.records.flatMap((record) =>
    record.recordType === 'exercise' ? [serializeAssuranceV1Exercise(record)] : [],
  );

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'incidents',
    qualification: publishedAssuranceSummary.incidentQualifications,
    counts: publishedAssuranceSummary.incidentCounts,
    incidents,
    exercises,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
