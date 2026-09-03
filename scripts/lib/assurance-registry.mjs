import fs from 'node:fs';
import path from 'node:path';

export const ASSURANCE_REGISTRY_PATH = 'assurance/registry.json';

export function readJsonFile(root, relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

export function loadAssuranceRegistry(root = process.cwd()) {
  return readJsonFile(root, ASSURANCE_REGISTRY_PATH);
}

export function isControlledRelativePath(relative) {
  return typeof relative === 'string'
    && relative.length > 0
    && !path.isAbsolute(relative)
    && !relative.split(/[\\/]/).includes('..');
}

export function flattenAssuranceRegistry(registry) {
  const resources = [];
  for (const dataset of registry.datasets ?? []) {
    resources.push(dataset);
    for (const resource of dataset.resources ?? []) resources.push(resource);
  }
  if (registry.lifecycle) resources.push(registry.lifecycle);
  for (const resource of registry.operations ?? []) resources.push(resource);
  return resources;
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
  const matches = (registry.datasets ?? []).filter((dataset) => dataset.kind === kind);
  if (matches.length !== 1) {
    throw new Error(`assurance/registry.json: expected exactly one primary ${kind} dataset; found ${matches.length}`);
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
