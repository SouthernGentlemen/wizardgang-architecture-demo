import fs from 'node:fs';
import path from 'node:path';
import {
  ASSURANCE_REGISTRY_PATH,
  assuranceRecordResources,
  assuranceRecordsFromDocument,
  canonicalAssuranceDatasetPaths,
  discoverCanonicalAssuranceJson,
  flattenAssuranceRegistry,
  isControlledRelativePath,
  loadAssuranceRegistry,
  readJsonFile,
} from './lib/assurance-registry.mjs';
import {
  validateAssuranceSchemaValue,
  validateRegisteredAssuranceResource,
} from './lib/assurance-validation.mjs';
import { validateAssuranceRouteContract } from '../src/assurance/route-contract.js';
import { renderRuntimeBinding, RUNTIME_BINDING_PATH } from './generate-assurance-runtime-binding.mjs';

const root = process.cwd();
const errors = [];
const registrySchemaPath = 'contracts/assurance/registry.schema.json';
const releasedV1Kinds = new Set(['evidence', 'claims', 'compliance', 'risks', 'incidents', 'exercises', 'advisories']);

function fail(message) {
  errors.push(message);
}

function exists(relative) {
  return isControlledRelativePath(relative) && fs.existsSync(path.join(root, relative));
}

let registry;
try {
  registry = loadAssuranceRegistry(root);
} catch (error) {
  fail(`${ASSURANCE_REGISTRY_PATH}: unable to read registry: ${error instanceof Error ? error.message : String(error)}`);
}

if (registry) {
  errors.push(...validateAssuranceSchemaValue(root, ASSURANCE_REGISTRY_PATH, registrySchemaPath, registry));
  for (const error of validateAssuranceRouteContract(registry)) fail(`${ASSURANCE_REGISTRY_PATH}: ${error}`);

  const resources = flattenAssuranceRegistry(registry);
  const identities = new Map();
  const registeredPaths = new Map();

  for (const resource of resources) {
    if (identities.has(resource.id)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate dataset identity ${resource.id}`);
    else identities.set(resource.id, resource.path);

    if (registeredPaths.has(resource.path)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate registered path ${resource.path}`);
    else registeredPaths.set(resource.path, resource.id);

    const hasRecords = resource.capabilities?.includes('records');
    const hasRuntime = resource.capabilities?.includes('runtime');
    if (hasRecords && !hasRuntime) fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} records capability requires runtime capability for shared Worker/Node record discovery`);
    if (hasRecords && !resource.recordCollection) fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} records capability requires recordCollection metadata`);
    if (!hasRecords && resource.recordCollection) fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} declares recordCollection without records capability`);
    if (resource.capabilities?.includes('api-index') && !releasedV1Kinds.has(resource.kind)) {
      fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} declares unsupported api-index capability for unreleased family ${resource.kind}`);
    }

    if (!exists(resource.path)) fail(`${ASSURANCE_REGISTRY_PATH}: registered dataset is missing: ${resource.path}`);
    if (!exists(resource.schema)) fail(`${ASSURANCE_REGISTRY_PATH}: registered schema is missing for ${resource.path}: ${resource.schema}`);
    if (!exists(resource.path) || !exists(resource.schema)) continue;

    let data;
    try {
      data = readJsonFile(root, resource.path);
    } catch (error) {
      fail(`${resource.path}: unable to read registered data: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    errors.push(...validateRegisteredAssuranceResource(root, resource, data));
    if (hasRecords) {
      try {
        assuranceRecordsFromDocument(resource, data);
      } catch (error) {
        fail(`${resource.path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  const canonicalFiles = discoverCanonicalAssuranceJson(root);
  const registeredFiles = canonicalAssuranceDatasetPaths(registry);
  const canonicalSet = new Set(canonicalFiles);
  const registeredSet = new Set(registeredFiles);
  for (const relative of canonicalFiles) {
    if (!registeredSet.has(relative)) fail(`${ASSURANCE_REGISTRY_PATH}: unregistered canonical assurance file ${relative}`);
  }
  for (const relative of registeredFiles) {
    if (!canonicalSet.has(relative)) fail(`${ASSURANCE_REGISTRY_PATH}: registered canonical assurance file is missing ${relative}`);
  }

  const primaryKinds = new Map();
  for (const dataset of registry.datasets ?? []) {
    if (primaryKinds.has(dataset.kind)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate primary dataset family ${dataset.kind}`);
    else primaryKinds.set(dataset.kind, dataset.id);
    if (releasedV1Kinds.has(dataset.kind) && !dataset.capabilities?.includes('api-index')) {
      fail(`${ASSURANCE_REGISTRY_PATH}: released v1 primary dataset ${dataset.id} must declare api-index capability`);
    }
  }
  for (const kind of releasedV1Kinds) {
    if (!primaryKinds.has(kind)) fail(`${ASSURANCE_REGISTRY_PATH}: missing released v1 primary dataset family ${kind}`);
  }

  const lifecycle = resources.filter((resource) => resource.capabilities?.includes('lifecycle'));
  if (lifecycle.length !== 1) fail(`${ASSURANCE_REGISTRY_PATH}: expected exactly one lifecycle resource; found ${lifecycle.length}`);
  const monitoring = resources.filter((resource) => resource.capabilities?.includes('monitoring'));
  if (monitoring.length !== 1) fail(`${ASSURANCE_REGISTRY_PATH}: expected exactly one monitoring resource; found ${monitoring.length}`);

  const manifests = resources.filter((resource) => resource.kind === 'compliance' && resource.capabilities?.includes('manifest'));
  if (manifests.length !== 1) {
    fail(`${ASSURANCE_REGISTRY_PATH}: expected exactly one compliance manifest resource; found ${manifests.length}`);
  } else {
    const manifestResource = manifests[0];
    const ownedPartitions = (manifestResource.resources ?? [])
      .filter((resource) => resource.kind === 'compliance' && resource.role === 'partition');
    const registeredPartitions = resources
      .filter((resource) => resource.kind === 'compliance' && resource.role === 'partition');
    if (ownedPartitions.length !== registeredPartitions.length
      || !registeredPartitions.every((resource) => ownedPartitions.some((owned) => owned.id === resource.id && owned.path === resource.path))) {
      fail(`${ASSURANCE_REGISTRY_PATH}: WCAG partition membership must be owned by the compliance manifest resource hierarchy`);
    }
  }

  const runtimeIds = resources.filter((resource) => resource.capabilities?.includes('runtime')).map((resource) => resource.id).sort();
  if (new Set(runtimeIds).size !== runtimeIds.length) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate runtime dataset identity`);

  for (const resource of assuranceRecordResources(registry)) {
    if (!resource.capabilities?.includes('runtime')) continue;
    if (!resource.recordCollection?.identity?.length) fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} recordCollection.identity must declare immutable identity fields`);
  }

  if (errors.length === 0) {
    try {
      const expectedBinding = renderRuntimeBinding(registry);
      const bindingPath = path.join(root, RUNTIME_BINDING_PATH);
      const currentBinding = fs.existsSync(bindingPath) ? fs.readFileSync(bindingPath, 'utf8') : '';
      if (currentBinding !== expectedBinding) fail(`${RUNTIME_BINDING_PATH}: runtime import binding does not agree with ${ASSURANCE_REGISTRY_PATH}`);
    } catch (error) {
      fail(`${RUNTIME_BINDING_PATH}: unable to derive runtime binding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (errors.length) {
  console.error('Assurance registry completeness/schema validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance registry validation passed: ${flattenAssuranceRegistry(registry).length} registered resources, all canonical assurance JSON registered and schema-valid.`);
