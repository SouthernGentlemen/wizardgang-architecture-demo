import { listAssuranceRecords, publicAssuranceRegistry } from '../assurance/service';
import {
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';

export function assuranceAdvisoriesResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const records = listAssuranceRecords('advisories');
  const page = paginateAssuranceRecords(request, context.url, records);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'advisories',
    qualification: publicAssuranceRegistry.advisoryQualification,
    count: records.length,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
