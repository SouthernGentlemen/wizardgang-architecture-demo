import {
  assuranceRegistry,
  primaryAssuranceResource,
} from '../assurance/model';
import { resolveAssuranceResourceOwner } from '../assurance/record-discovery.js';
import {
  assuranceFilterNames,
  assuranceFilterPredicate,
  normalizeAssuranceFilters,
  type AssuranceFilterValues,
} from '../assurance/service';
import { assuranceErrorResponse } from './assurance-contract';

export interface FocusedAssuranceSelection<T> {
  filterOwner: string;
  filters: AssuranceFilterValues;
  records: T[];
}

function filterOwnerForDataset(dataset: string): string {
  const resource = primaryAssuranceResource(dataset);
  const owner = resolveAssuranceResourceOwner(assuranceRegistry, resource, 'routeOwner');
  return owner.kind;
}

export function focusedAssuranceFilterOwner(
  datasets: readonly string[],
): string {
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
  datasets: readonly string[],
  records: T[],
): FocusedAssuranceSelection<T> | Response {
  const filterOwner = focusedAssuranceFilterOwner(datasets);
  const allowedParameters = new Set([
    ...assuranceFilterNames(filterOwner),
    'limit',
    'cursor',
  ]);
  let unsupported: string | undefined;
  url.searchParams.forEach((_value, parameter) => {
    if (unsupported === undefined && !allowedParameters.has(parameter)) unsupported = parameter;
  });
  if (unsupported) {
    return assuranceErrorResponse(request, 400, {
      error: 'unsupported_query_parameter',
      parameter: unsupported,
    });
  }

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
    records: records.filter((record) => predicate(record)),
  };
}
