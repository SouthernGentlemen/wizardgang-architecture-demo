import { deriveRiskCounts, filterPublicRisks, publicAssuranceRegistry, riskFiltersFromUrl } from '../assurance/registry';
import { json, methodNotAllowed } from '../lib/http';

export function assuranceRisksResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const filters = riskFiltersFromUrl(new URL(request.url));
  const records = filterPublicRisks(filters);
  return json({
    schemaVersion: publicAssuranceRegistry.schemaVersion,
    dataset: 'risks',
    qualification: publicAssuranceRegistry.qualification,
    filters,
    counts: deriveRiskCounts(records),
    totalAvailable: publicAssuranceRegistry.counts.risks,
    records,
  }, {
    headers: { 'cache-control': 'public, max-age=300' },
  });
}
