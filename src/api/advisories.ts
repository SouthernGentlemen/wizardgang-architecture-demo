import { publicAssuranceRegistry } from '../assurance/registry';
import { json, methodNotAllowed } from '../lib/http';

export function assuranceAdvisoriesResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return json({
    schemaVersion: publicAssuranceRegistry.schemaVersion,
    dataset: 'advisories',
    qualification: publicAssuranceRegistry.advisoryQualification,
    count: publicAssuranceRegistry.advisories.length,
    records: publicAssuranceRegistry.advisories,
  }, {
    headers: { 'cache-control': 'public, max-age=300' },
  });
}
