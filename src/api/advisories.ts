import {
  listPublishedAssuranceRecords,
  publicPublishedAssuranceRegistry,
} from '../assurance/publication';
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
    qualification: publicPublishedAssuranceRegistry.advisoryQualification,
    count: records.length,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
