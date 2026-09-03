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

export function assuranceAdvisoriesResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const records = listPublishedAssuranceRecords('advisories');
  const page = paginateAssuranceRecords(request, context.url, records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'advisories',
    qualification: publishedAssuranceSummary.advisoryQualification,
    count: records.length,
    records: page.records.map(serializeAssuranceV1Advisory),
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
