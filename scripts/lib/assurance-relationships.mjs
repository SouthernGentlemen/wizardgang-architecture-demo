import {
  assuranceRecordResources,
  assuranceRecordsFromDocument,
  primaryRegistryDataset,
  readJsonFile,
} from './assurance-registry.mjs';

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

export function validateRelationshipSet(relationships, families, label = 'relationships') {
  const errors = [];
  for (const [family, targets] of families) {
    const values = Array.isArray(relationships?.[family]) ? relationships[family] : [];
    for (const id of values) {
      if (!targets.has(id)) errors.push(`${label}.${family}: unresolved ${family} relationship ${id}`);
    }
  }
  return errors;
}
