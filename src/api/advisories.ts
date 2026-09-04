import {
  listPublishedAssuranceRecords,
  publishedAssuranceSummary,
} from '../assurance/publication';
import { serializeAssuranceV1Advisory } from './assurance-v1';
import {
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';
import { selectFocusedAssuranceRecords } from './assurance-filtering';

export function assuranceAdvisoriesResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const sourceRecords = listPublishedAssuranceRecords('advisories');
  const selection = selectFocusedAssuranceRecords(request, context.url, ['advisories'], sourceRecords);
  if (selection instanceof Response) return selection;
  const page = paginateAssuranceRecords(request, context.url, selection.records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'advisories',
    qualification: publishedAssuranceSummary.advisoryQualification,
    count: selection.records.length,
    records: page.records.map(serializeAssuranceV1Advisory),
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
