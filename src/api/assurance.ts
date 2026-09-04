import {
  assuranceCollectionState,
  assuranceDatasetForRecordId,
  assuranceDatasetQualification,
  assuranceReportingCollections,
  deriveAssuranceCounts,
} from '../assurance/service';
import {
  assuranceRegistryResources,
  type AssuranceRuntimeRecord,
} from '../assurance/model';
import {
  findPublishedAssuranceRecord,
  listPublishedAssuranceRecords,
  type PublishedAssuranceRuntimeRecord,
} from '../assurance/publication';
import { reportingContractPath } from '../reporting/registry';
import {
  assuranceErrorResponse,
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';
import { selectFocusedAssuranceRecords } from './assurance-filtering';

function routeDatasets(owner: string): string[] {
  const datasets = new Set<string>();
  for (const resource of assuranceRegistryResources) {
    if (!resource.capabilities.includes('runtime') || !resource.capabilities.includes('records')) continue;
    if (resource.kind === owner || resource.routeOwner === owner) datasets.add(resource.kind);
  }
  return [...datasets];
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

function currentSources(datasets: readonly string[]) {
  const sources = new Map<string, ReturnType<typeof assuranceReportingCollections>[number]['source']>();
  for (const dataset of datasets) {
    for (const collection of assuranceReportingCollections(dataset)) {
      sources.set(collection.source.id, collection.source);
    }
  }
  return [...sources.values()];
}

function currentQualifications(datasets: readonly string[]): Record<string, string | null> {
  return Object.fromEntries(datasets.map((dataset) => [dataset, assuranceDatasetQualification(dataset) ?? null]));
}

function currentAvailability(datasets: readonly string[]): Record<string, string> {
  return Object.fromEntries(datasets.map((dataset) => [dataset, assuranceCollectionState(dataset).status]));
}

function publishedRecords(datasets: readonly string[]): PublishedAssuranceRuntimeRecord[] {
  return datasets.flatMap((dataset) => listPublishedAssuranceRecords(dataset));
}

function commonMetadata(owner: string, datasets: readonly string[]) {
  return {
    contract: reportingContractPath,
    dataset: owner,
    datasets: [...datasets],
    availability: currentAvailability(datasets),
    sources: currentSources(datasets),
    qualifications: currentQualifications(datasets),
  };
}

export function genericAssuranceResponse(request: Request, dataset: string, recordId?: string): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;
  const unavailable = unavailableCollectionResponse(request, dataset);
  if (unavailable) return unavailable;

  const datasets = routeDatasets(dataset);
  if (datasets.length === 0) {
    return assuranceErrorResponse(request, 409, {
      error: 'assurance_dataset_unsupported',
      dataset,
      availability: 'unsupported',
    });
  }
  for (const current of datasets) {
    const currentUnavailable = unavailableCollectionResponse(request, current);
    if (currentUnavailable) return currentUnavailable;
  }

  const sourceRecords = publishedRecords(datasets);
  const metadata = commonMetadata(dataset, datasets);

  if (recordId !== undefined) {
    let unsupportedDetailParameter: string | undefined;
    context.url.searchParams.forEach((_value, parameter) => {
      if (unsupportedDetailParameter === undefined) unsupportedDetailParameter = parameter;
    });
    if (unsupportedDetailParameter) {
      return assuranceErrorResponse(request, 400, {
        error: 'unsupported_query_parameter',
        parameter: unsupportedDetailParameter,
      });
    }
    let decodedId: string;
    try {
      decodedId = decodeURIComponent(recordId);
    } catch {
      return assuranceErrorResponse(request, 400, { error: 'invalid_assurance_record_id', dataset });
    }
    const recordDataset = assuranceDatasetForRecordId(decodedId);
    const record = recordDataset && datasets.includes(recordDataset)
      ? findPublishedAssuranceRecord(recordDataset, decodedId)
      : undefined;
    if (!record) {
      return assuranceErrorResponse(request, 404, { error: 'assurance_record_not_found', dataset, recordId: decodedId });
    }
    return assuranceJsonResponse(request, {
      schemaVersion: context.schemaVersion,
      ...metadata,
      query: { filters: {} },
      records: [record],
      derived: {
        count: 1,
        totalAvailable: sourceRecords.length,
        facets: deriveAssuranceCounts(dataset, [record as AssuranceRuntimeRecord]).byFilter,
      },
    });
  }

  const selection = selectFocusedAssuranceRecords(request, context.url, datasets, sourceRecords);
  if (selection instanceof Response) return selection;
  const page = paginateAssuranceRecords(request, context.url, selection.records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    ...metadata,
    query: {
      filters: selection.filters,
      ...(page.pagination ? { pagination: page.pagination } : {}),
    },
    records: page.records,
    derived: {
      count: selection.records.length,
      totalAvailable: sourceRecords.length,
      facets: deriveAssuranceCounts(selection.filterOwner, selection.records).byFilter,
    },
  });
}

export function assuranceRisksResponse(request: Request): Response {
  return genericAssuranceResponse(request, 'risks');
}

export function assuranceComplianceResponse(request: Request, recordId?: string): Response {
  return genericAssuranceResponse(request, 'compliance', recordId);
}

export function assuranceIncidentsResponse(request: Request): Response {
  return genericAssuranceResponse(request, 'incidents');
}
