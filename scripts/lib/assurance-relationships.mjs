import {
  assuranceRecordResources,
  assuranceRecordsFromDocument,
  primaryRegistryDataset,
  readJsonFile,
} from './assurance-registry.mjs';
import {
  assuranceRelationshipNames,
  assuranceRelationshipTargetIds,
  validateAssuranceRelationshipSet,
} from '../../src/assurance/relationship-contract.js';

export function registeredRelationshipFamily(root, registry, kind) {
  const resource = primaryRegistryDataset(registry, kind);
  const records = [];
  for (const candidate of assuranceRecordResources(registry).filter((entry) => entry.kind === kind)) {
    const dataset = readJsonFile(root, candidate.path);
    records.push(...assuranceRecordsFromDocument(candidate, dataset));
  }
  return {
    resource,
    dataset: { records },
    ids: new Set(records.map((record) => record.id)),
  };
}

export function registeredRelationshipTargets(recordEntries, { frameworkIds = [], governanceDocumentIds = [] } = {}) {
  const recordsByKind = new Map();
  for (const { resource, record } of recordEntries) {
    const records = recordsByKind.get(resource.kind) ?? [];
    records.push(record);
    recordsByKind.set(resource.kind, records);
  }
  const context = { recordsByKind, frameworkIds, governanceDocumentIds };
  return new Map(assuranceRelationshipNames().map((name) => [name, assuranceRelationshipTargetIds(name, context)]));
}

export function validateRelationshipSet(relationships, families, label = 'relationships') {
  return validateAssuranceRelationshipSet(
    relationships,
    { targetIdsByRelationship: families },
    label,
  );
}
