import fs from 'node:fs';
import path from 'node:path';
import {
  assuranceRecordCollectionPath,
  assuranceRecordEntries,
  assuranceRecordIdentity,
  assuranceRecordResources,
  assuranceRecordsForKind,
  assuranceRecordsFromDocument,
  assuranceValueAtPath,
  flattenAssuranceResources,
} from '../../src/assurance/record-discovery.js';

export const ASSURANCE_REGISTRY_PATH = 'assurance/registry.json';

export {
  assuranceRecordCollectionPath,
  assuranceRecordEntries,
  assuranceRecordIdentity,
  assuranceRecordResources,
  assuranceRecordsForKind,
  assuranceRecordsFromDocument,
  assuranceValueAtPath,
};

export function readJsonFile(root, relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

export function loadAssuranceRegistry(root = process.cwd()) {
  return readJsonFile(root, ASSURANCE_REGISTRY_PATH);
}

export function loadAssuranceRecordInventory(root = process.cwd(), registry = loadAssuranceRegistry(root)) {
  const resources = assuranceRecordResources(registry);
  const documentsByResourceId = new Map(resources.map((resource) => [resource.id, readJsonFile(root, resource.path)]));
  const entries = assuranceRecordEntries(registry, (resource) => documentsByResourceId.get(resource.id));

  return {
    resources,
    entries,
    documentsByResourceId,
    entriesForKind(kind) {
      return entries.filter((entry) => entry.resource.kind === kind);
    },
    recordsForKind(kind) {
      return assuranceRecordsForKind(entries, kind);
    },
    idsForKind(kind) {
      return new Set(assuranceRecordsForKind(entries, kind).map((record) => record.id).filter((id) => typeof id === 'string'));
    },
    documentForResource(resourceOrId) {
      const id = typeof resourceOrId === 'string' ? resourceOrId : resourceOrId?.id;
      if (!documentsByResourceId.has(id)) throw new Error(`assurance/registry.json: record resource ${id ?? 'unknown'} is not loaded`);
      return documentsByResourceId.get(id);
    },
  };
}

export function isControlledRelativePath(relative) {
  return typeof relative === 'string'
    && relative.length > 0
    && !path.isAbsolute(relative)
    && !relative.split(/[\\/]/).includes('..');
}

export function flattenAssuranceRegistry(registry) {
  return flattenAssuranceResources(registry);
}

export function registryResourcesByKind(registry, kind) {
  return flattenAssuranceRegistry(registry).filter((resource) => resource.kind === kind);
}

export function registryResourcesWithCapability(registry, capability) {
  return flattenAssuranceRegistry(registry).filter((resource) => resource.capabilities?.includes(capability));
}

export function registryResourceById(registry, id) {
  return flattenAssuranceRegistry(registry).find((resource) => resource.id === id);
}

export function registryResourceByPath(registry, relative) {
  return flattenAssuranceRegistry(registry).find((resource) => resource.path === relative);
}

export function requireRegistryResource(registry, predicate, label) {
  const matches = flattenAssuranceRegistry(registry).filter(predicate);
  if (matches.length !== 1) {
    throw new Error(`assurance/registry.json: expected exactly one ${label}; found ${matches.length}`);
  }
  return matches[0];
}

export function primaryRegistryDataset(registry, kind) {
  const matches = (registry.datasets ?? []).filter((dataset) => dataset.kind === kind && dataset.capabilities?.includes('api-index'));
  if (matches.length !== 1) {
    throw new Error(`assurance/registry.json: expected exactly one indexed ${kind} dataset; found ${matches.length}`);
  }
  return matches[0];
}

export function canonicalAssuranceDatasetPaths(registry) {
  return flattenAssuranceRegistry(registry).map((resource) => resource.path).sort();
}

export function discoverCanonicalAssuranceJson(root = process.cwd()) {
  const assuranceRoot = path.join(root, 'assurance');
  const found = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (path.relative(assuranceRoot, absolute).split(path.sep)[0] === 'snapshots') continue;
        walk(absolute);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const relative = path.relative(root, absolute).split(path.sep).join('/');
        if (relative !== ASSURANCE_REGISTRY_PATH) found.push(relative);
      }
    }
  }

  walk(assuranceRoot);
  return found.sort();
}
