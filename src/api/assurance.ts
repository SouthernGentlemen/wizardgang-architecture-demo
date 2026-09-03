import {
  complianceFiltersFromUrl,
  deriveComplianceCounts,
  deriveRiskCounts,
  filterPublicCompliance,
  filterPublicRisks,
  findPublicComplianceRecord,
  publicAssuranceRegistry,
  publicComplianceFrameworks,
  publicComplianceQualification,
  publicComplianceRecords,
  riskFiltersFromUrl,
} from '../assurance/registry';
import { json, methodNotAllowed } from '../lib/http';

const assuranceCache = { headers: { 'cache-control': 'public, max-age=300' } };

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
  }, assuranceCache);
}

export function assuranceComplianceResponse(request: Request, recordId?: string): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);

  if (recordId !== undefined) {
    let decodedId: string;
    try {
      decodedId = decodeURIComponent(recordId);
    } catch {
      return json({ error: 'invalid_compliance_record_id' }, { status: 400, ...assuranceCache });
    }
    const record = findPublicComplianceRecord(decodedId);
    if (!record) {
      return json({ error: 'compliance_record_not_found', recordId: decodedId }, { status: 404, ...assuranceCache });
    }
    return json({
      schemaVersion: 1,
      dataset: 'compliance',
      qualification: publicComplianceQualification,
      framework: publicComplianceFrameworks.find((candidate) => candidate.id === record.framework),
      record,
    }, assuranceCache);
  }

  const filters = complianceFiltersFromUrl(new URL(request.url));
  const records = filterPublicCompliance(filters);
  return json({
    schemaVersion: 1,
    dataset: 'compliance',
    qualification: publicComplianceQualification,
    filters,
    counts: deriveComplianceCounts(records),
    totalAvailable: publicComplianceRecords.length,
    frameworks: publicComplianceFrameworks,
    records,
  }, assuranceCache);
}

export function assuranceIncidentsResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return json({
    schemaVersion: publicAssuranceRegistry.schemaVersion,
    dataset: 'incidents',
    qualification: publicAssuranceRegistry.incidentQualifications,
    counts: publicAssuranceRegistry.incidentCounts,
    incidents: publicAssuranceRegistry.incidents,
    exercises: publicAssuranceRegistry.exercises,
  }, assuranceCache);
}
