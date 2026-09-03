import { deriveComplianceCounts } from './service';
import { listPublishedAssuranceRecords } from './publication';

const complianceRecords = listPublishedAssuranceRecords('compliance');

/**
 * Derived dashboard summary only. Canonical records stay in model/service/publication;
 * released HTTP compatibility belongs in src/api/assurance-v1.ts.
 */
export const publicComplianceRegistry = {
  counts: deriveComplianceCounts(complianceRecords),
};
