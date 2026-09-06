import {
  assuranceRecordResources,
  assuranceRecordsFromDocument,
  flattenAssuranceRegistry,
  primaryRegistryDataset,
  readJsonFile,
} from './assurance-registry.mjs';
import {
  assuranceIdentityKey,
  assuranceRelationshipDefinition,
  assuranceRelationshipNames,
  assuranceRelationshipIds,
  validateAssuranceRelationshipSet,
} from '../../src/assurance/relationship-contract.js';

export { assuranceRelationshipIds };

export function structuredRelationshipSourceId(registry, resource) {
  const declaration = registry?.reporting?.structuredRecords;
  if (!declaration?.id || !resource?.path?.startsWith(declaration.resourceRoot)) {
    throw new Error(`${resource?.id ?? 'unknown assurance resource'} is outside the registered structured relationship source scope`);
  }
  return `${declaration.id}.${resource.id}`;
}

export function recordRelationshipIdentity(registry, resource, record) {
  return {
    source: structuredRelationshipSourceId(registry, resource),
    native: record.id,
  };
}

export function registeredRelationshipFamily(root, registry, kind) {
  const resource = primaryRegistryDataset(registry, kind);
  const records = [];
  const identities = [];
  for (const candidate of assuranceRecordResources(registry).filter((entry) => entry.kind === kind)) {
    const dataset = readJsonFile(root, candidate.path);
    for (const record of assuranceRecordsFromDocument(candidate, dataset)) {
      records.push(record);
      identities.push(assuranceIdentityKey(recordRelationshipIdentity(registry, candidate, record)));
    }
  }
  return {
    resource,
    dataset: { records },
    ids: new Set(records.map((record) => record.id)),
    identities: new Set(identities),
  };
}

export function registeredRelationshipTargets(registry, recordEntries, { frameworkIds = [], governanceDocumentIds = [] } = {}) {
  const knownFrameworkIds = new Set(frameworkIds);
  const resources = flattenAssuranceRegistry(registry);

  return new Map(assuranceRelationshipNames().map((name) => {
    const definition = assuranceRelationshipDefinition(name);
    if (definition?.target === 'records') {
      const identities = recordEntries
        .filter(({ resource, record }) => resource.kind === definition.kind && (!definition.recordKind || record?.kind === definition.recordKind))
        .map(({ resource, record }) => assuranceIdentityKey(recordRelationshipIdentity(registry, resource, record)));
      return [name, new Set(identities)];
    }
    if (definition?.target === 'frameworks') {
      const identities = resources
        .filter((resource) => resource.framework?.id && knownFrameworkIds.has(resource.framework.id))
        .map((resource) => assuranceIdentityKey({
          source: structuredRelationshipSourceId(registry, resource),
          native: resource.framework.id,
        }));
      return [name, new Set(identities)];
    }
    if (definition?.target === 'governance-documents') {
      const resource = resources.find((candidate) => candidate.id === 'presentation.documents');
      const identities = resource
        ? [...governanceDocumentIds].map((native) => assuranceIdentityKey({
          source: structuredRelationshipSourceId(registry, resource),
          native,
        }))
        : [];
      return [name, new Set(identities)];
    }
    throw new Error(`Unsupported assurance relationship target kind ${String(definition?.target)}`);
  }));
}

export function validateRelationshipSet(relationships, families, label = 'relationships', sourceIdentity) {
  return validateAssuranceRelationshipSet(
    relationships,
    { targetIdentitiesByRelationship: families, sourceIdentity },
    label,
  );
}
