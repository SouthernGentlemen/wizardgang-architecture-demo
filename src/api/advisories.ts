import { genericAssuranceResponse } from './assurance';

export function assuranceAdvisoriesResponse(request: Request): Promise<Response> {
  return genericAssuranceResponse(request, 'advisories');
}
