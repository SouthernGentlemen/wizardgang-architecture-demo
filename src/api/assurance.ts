import {
  complianceFrameworks,
  complianceQualification,
  deriveComplianceCounts,
  deriveRiskCounts,
  normalizeAssuranceFilters,
  type AssuranceFilterValues,
} from '../assurance/service';
import type { AssuranceDataset } from '../assurance/model';
import {
  filterPublishedAssuranceRecords,
  findPublishedAssuranceRecord,
  listPublishedAssuranceRecords,
  publishedAssuranceSummary,
} from '../assurance/publication';
import {
  serializeAssuranceV1Compliance,
  serializeAssuranceV1Exercise,
  serializeAssuranceV1Filters,
  serializeAssuranceV1Incident,
  serializeAssuranceV1Risk,
} from './assurance-v1';
import {
  assuranceErrorResponse,
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';

function assuranceFilters(
  request: Request,
  url: URL,
  dataset: AssuranceDataset,
): AssuranceFilterValues | Response {
  const normalized = normalizeAssuranceFilters(dataset, url.searchParams);
  const issue = normalized.issues[0];
  if (issue) {
    return assuranceErrorResponse(request, 400, {
      error: 'invalid_filter',
      parameter: issue.parameter,
      value: issue.value,
      allowed: issue.allowed,
    });
  }
  return normalized.filters;
}

export function assuranceRisksResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const filters = assuranceFilters(request, context.url, 'risks');
  if (filters instanceof Response) return filters;
  const filteredRecords = filterPublishedAssuranceRecords('risks', filters);
  const page = paginateAssuranceRecords(request, context.url, filteredRecords);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'risks',
    qualification: publishedAssuranceSummary.qualification,
    filters: serializeAssuranceV1Filters('risks', filters),
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

  const filters = assuranceFilters(request, context.url, 'compliance');
  if (filters instanceof Response) return filters;
  const filteredRecords = filterPublishedAssuranceRecords('compliance', filters);
  const page = paginateAssuranceRecords(request, context.url, filteredRecords);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'compliance',
    qualification: complianceQualification,
    filters: serializeAssuranceV1Filters('compliance', filters),
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
