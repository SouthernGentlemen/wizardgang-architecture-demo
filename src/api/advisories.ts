import { publicAssuranceRegistry } from '../assurance/registry';
import {
  assuranceJsonResponse,
  paginateAssuranceRecords,
  prepareAssuranceRequest,
} from './assurance-contract';

export function assuranceAdvisoriesResponse(request: Request): Response {
  const context = prepareAssuranceRequest(request);
  if (context instanceof Response) return context;

  const page = paginateAssuranceRecords(request, context.url, publicAssuranceRegistry.advisories);
  if (page instanceof Response) return page;

  return assuranceJsonResponse(request, {
    schemaVersion: context.schemaVersion,
    dataset: 'advisories',
    qualification: publicAssuranceRegistry.advisoryQualification,
    count: publicAssuranceRegistry.advisories.length,
    records: page.records,
    ...(page.pagination ? { pagination: page.pagination } : {}),
  });
}
