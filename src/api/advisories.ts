import { genericAssuranceResponse } from './assurance';

export function assuranceAdvisoriesResponse(request: Request): Response {
  return genericAssuranceResponse(request, 'advisories');
}
