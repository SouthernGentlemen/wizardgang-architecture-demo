import { primaryRegistryDataset, readJsonFile } from './assurance-registry.mjs';

export function registeredRelationshipFamily(root, registry, kind) {
  const resource = primaryRegistryDataset(registry, kind);
  const dataset = readJsonFile(root, resource.path);
  return {
    resource,
    dataset,
    ids: new Set((dataset.records ?? []).map((record) => record.id)),
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
