import {
  assuranceCollectionState,
  assuranceDatasetQualification,
  assuranceDatasetSchema,
  assuranceDatasetSource,
  complianceFrameworks,
  complianceQualification,
  deriveAssuranceCounts,
  deriveComplianceCounts,
  deriveIncidentCounts,
  deriveRiskCounts,
} from '../assurance/service';
import {
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
import { selectFocusedAssuranceRecords } from './assurance-filtering';

export function assuranceRisksResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const sourceRecords = listPublishedAssuranceRecords('risks');
  const selection = selectFocusedAssuranceRecords(request, context.url, ['risks'], sourceRecords);
  if (selection instanceof Response) return selection;
  const page = paginateAssuranceRecords(request, context.url, selection.records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'risks',
    qualification: publishedAssuranceSummary.qualification,
    filters: serializeAssuranceV1Filters('risks', selection.filters),
    counts: deriveRiskCounts(selection.records),
    totalAvailable: sourceRecords.length,
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

  const sourceRecords = listPublishedAssuranceRecords('compliance');
  const selection = selectFocusedAssuranceRecords(request, context.url, ['compliance'], sourceRecords);
  if (selection instanceof Response) return selection;
  const page = paginateAssuranceRecords(request, context.url, selection.records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'compliance',
    qualification: complianceQualification,
    filters: serializeAssuranceV1Filters('compliance', selection.filters),
    counts: deriveComplianceCounts(selection.records),
    totalAvailable: sourceRecords.length,
    frameworks: complianceFrameworks,
    records: page.records.map(serializeAssuranceV1Compliance),
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}

export function assuranceIncidentsResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const sourceIncidents = listPublishedAssuranceRecords('incidents');
  const sourceExercises = listPublishedAssuranceRecords('exercises');
  const combined = [...sourceIncidents, ...sourceExercises];
  const selection = selectFocusedAssuranceRecords(
    request,
    context.url,
    ['incidents', 'exercises'],
    combined,
  );
  if (selection instanceof Response) return selection;

  const filteredIncidents = selection.records.filter(
    (record): record is (typeof sourceIncidents)[number] => record.recordType === 'incident',
  );
  const filteredExercises = selection.records.filter(
    (record): record is (typeof sourceExercises)[number] => record.recordType === 'exercise',
  );
  const page = paginateAssuranceRecords(request, context.url, selection.records);
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
    counts: deriveIncidentCounts(filteredIncidents, filteredExercises),
    incidents,
    exercises,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}

function unavailableCollectionResponse(request: Request, dataset: string): Response | undefined {
  const state = assuranceCollectionState(dataset);
  if (state.status === 'unknown') {
    return assuranceErrorResponse(request, 404, { error: 'assurance_dataset_not_found', dataset, availability: state.status });
  }
  if (state.status === 'unsupported') {
    return assuranceErrorResponse(request, 409, { error: 'assurance_dataset_unsupported', dataset, availability: state.status });
  }
  if (state.status === 'unavailable') {
    return assuranceErrorResponse(request, 503, { error: 'assurance_dataset_unavailable', dataset, availability: state.status });
  }
  return undefined;
}

export function genericAssuranceResponse(request: Request, dataset: string, recordId?: string): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;
  const unavailable = unavailableCollectionResponse(request, dataset);
  if (unavailable) return unavailable;
  const state = assuranceCollectionState(dataset);

  if (recordId !== undefined) {
    let decodedId: string;
    try {
      decodedId = decodeURIComponent(recordId);
    } catch {
      return assuranceErrorResponse(request, 400, { error: 'invalid_assurance_record_id', dataset });
    }
    const record = findPublishedAssuranceRecord(dataset, decodedId);
    if (!record) {
      return assuranceErrorResponse(request, 404, { error: 'assurance_record_not_found', dataset, recordId: decodedId });
    }
    return assuranceJsonResponse(request, {
      schemaVersion: context.schemaVersion,
      dataset,
      availability: state.status,
      qualification: assuranceDatasetQualification(dataset),
      source: { path: assuranceDatasetSource(dataset), schema: assuranceDatasetSchema(dataset) },
      record,
    });
  }

  const sourceRecords = listPublishedAssuranceRecords(dataset);
  const selection = selectFocusedAssuranceRecords(request, context.url, [dataset], sourceRecords);
  if (selection instanceof Response) return selection;
  const page = paginateAssuranceRecords(request, context.url, selection.records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset,
    availability: state.status,
    qualification: assuranceDatasetQualification(dataset),
    source: { path: assuranceDatasetSource(dataset), schema: assuranceDatasetSchema(dataset) },
    filters: selection.filters,
    counts: deriveAssuranceCounts(selection.filterOwner, selection.records),
    totalAvailable: sourceRecords.length,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
