import {
  primaryAssuranceResource,
  type AssuranceDataset,
} from '../assurance/model';
import {
  assuranceFilterPredicate,
  normalizeAssuranceFilters,
  type AssuranceFilterValues,
} from '../assurance/service';
import { assuranceErrorResponse } from './assurance-contract';

export interface FocusedAssuranceSelection<T> {
  filterOwner: AssuranceDataset;
  filters: AssuranceFilterValues;
  records: T[];
}

function filterOwnerForDataset(dataset: AssuranceDataset): AssuranceDataset {
  const resource = primaryAssuranceResource(dataset);
  const owner = (resource.routeOwner ?? resource.kind) as AssuranceDataset;
  primaryAssuranceResource(owner);
  return owner;
}

export function focusedAssuranceFilterOwner(
  datasets: readonly AssuranceDataset[],
): AssuranceDataset {
  if (datasets.length === 0) {
    throw new Error('A focused assurance route must declare at least one dataset.');
  }

  const owners = [...new Set(datasets.map(filterOwnerForDataset))];
  if (owners.length !== 1) {
    throw new Error(`Focused assurance route datasets do not share one filter owner: ${datasets.join(', ')}.`);
  }
  return owners[0];
}

export function selectFocusedAssuranceRecords<T>(
  request: Request,
  url: URL,
  datasets: readonly AssuranceDataset[],
  records: T[],
): FocusedAssuranceSelection<T> | Response {
  const filterOwner = focusedAssuranceFilterOwner(datasets);
  const normalized = normalizeAssuranceFilters(filterOwner, url.searchParams);
  const issue = normalized.issues[0];
  if (issue) {
    return assuranceErrorResponse(request, 400, {
      error: 'invalid_filter',
      parameter: issue.parameter,
      value: issue.value,
      allowed: issue.allowed,
    });
  }

  const predicate = assuranceFilterPredicate(filterOwner, normalized.filters);
  return {
    filterOwner,
    filters: normalized.filters,
    records: records.filter((record) => predicate(record as Parameters<typeof predicate>[0])),
  };
}
