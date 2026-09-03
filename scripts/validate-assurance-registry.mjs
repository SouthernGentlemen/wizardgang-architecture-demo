import fs from 'node:fs';
import path from 'node:path';
import {
  ASSURANCE_REGISTRY_PATH,
  canonicalAssuranceDatasetPaths,
  discoverCanonicalAssuranceJson,
  flattenAssuranceRegistry,
  isControlledRelativePath,
  loadAssuranceRegistry,
  readJsonFile,
} from './lib/assurance-registry.mjs';
import { formatJsonSchemaErrors, validateJsonSchema } from './lib/json-schema.mjs';
import { renderRuntimeBinding, RUNTIME_BINDING_PATH } from './generate-assurance-runtime-binding.mjs';

const root = process.cwd();
const errors = [];
const registrySchemaPath = 'contracts/assurance/registry.schema.json';

function fail(message) {
  errors.push(message);
}

function exists(relative) {
  return isControlledRelativePath(relative) && fs.existsSync(path.join(root, relative));
}

let registry;
let registrySchema;
try {
  registry = loadAssuranceRegistry(root);
} catch (error) {
  fail(`${ASSURANCE_REGISTRY_PATH}: unable to read registry: ${error instanceof Error ? error.message : String(error)}`);
}
try {
  registrySchema = readJsonFile(root, registrySchemaPath);
} catch (error) {
  fail(`${registrySchemaPath}: unable to read registry schema: ${error instanceof Error ? error.message : String(error)}`);
}

if (registry && registrySchema) {
  try {
    errors.push(...formatJsonSchemaErrors(
      ASSURANCE_REGISTRY_PATH,
      registrySchemaPath,
      validateJsonSchema(registry, registrySchema, { schemaPath: registrySchemaPath }),
    ));
  } catch (error) {
    fail(`${registrySchemaPath}: JSON Schema validation could not run: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (registry) {
  const resources = flattenAssuranceRegistry(registry);
  const identities = new Map();
  const registeredPaths = new Map();

  for (const resource of resources) {
    if (identities.has(resource.id)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate dataset identity ${resource.id}`);
    else identities.set(resource.id, resource.path);

    if (registeredPaths.has(resource.path)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate registered path ${resource.path}`);
    else registeredPaths.set(resource.path, resource.id);

    if (!exists(resource.path)) fail(`${ASSURANCE_REGISTRY_PATH}: registered dataset is missing: ${resource.path}`);
    if (!exists(resource.schema)) fail(`${ASSURANCE_REGISTRY_PATH}: registered schema is missing for ${resource.path}: ${resource.schema}`);
    if (!exists(resource.path) || !exists(resource.schema)) continue;

    let schema;
    let data;
    try {
      schema = readJsonFile(root, resource.schema);
      data = readJsonFile(root, resource.path);
    } catch (error) {
      fail(`${resource.path}: unable to read registered data or schema: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
      fail(`${resource.schema}: expected JSON Schema draft 2020-12`);
      continue;
    }

    try {
      errors.push(...formatJsonSchemaErrors(
        resource.path,
        resource.schema,
        validateJsonSchema(data, schema, { schemaPath: resource.schema }),
      ));
    } catch (error) {
      fail(`${resource.path}: schema validation via ${resource.schema} could not run: ${error instanceof Error ? error.message : String(error)}`);
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
    if (!dataset.capabilities?.includes('api-index')) fail(`${ASSURANCE_REGISTRY_PATH}: primary dataset ${dataset.id} must declare api-index capability`);
  }
  for (const kind of ['evidence', 'claims', 'compliance', 'risks', 'incidents', 'exercises', 'advisories']) {
    if (!primaryKinds.has(kind)) fail(`${ASSURANCE_REGISTRY_PATH}: missing primary dataset family ${kind}`);
  }

  const lifecycle = resources.filter((resource) => resource.capabilities?.includes('lifecycle'));
  if (lifecycle.length !== 1) fail(`${ASSURANCE_REGISTRY_PATH}: expected exactly one lifecycle resource; found ${lifecycle.length}`);
  const monitoring = resources.filter((resource) => resource.capabilities?.includes('monitoring'));
  if (monitoring.length !== 1) fail(`${ASSURANCE_REGISTRY_PATH}: expected exactly one monitoring resource; found ${monitoring.length}`);

  const manifests = resources.filter((resource) => resource.kind === 'compliance' && resource.capabilities?.includes('manifest'));
  if (manifests.length !== 1) {
    fail(`${ASSURANCE_REGISTRY_PATH}: expected exactly one compliance manifest resource; found ${manifests.length}`);
  } else if (exists(manifests[0].path)) {
    const manifest = readJsonFile(root, manifests[0].path);
    const manifestPartitions = (manifest.partitions ?? []).map((partition) => partition.path).sort();
    const registeredPartitions = resources
      .filter((resource) => resource.kind === 'compliance' && resource.role === 'partition')
      .map((resource) => resource.path)
      .sort();
    if (JSON.stringify(manifestPartitions) !== JSON.stringify(registeredPartitions)) {
      fail(`${manifests[0].path}: partition inventory does not agree with ${ASSURANCE_REGISTRY_PATH}`);
    }
  }

  const runtimeIds = resources.filter((resource) => resource.capabilities?.includes('runtime')).map((resource) => resource.id).sort();
  if (new Set(runtimeIds).size !== runtimeIds.length) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate runtime dataset identity`);

  const expectedBinding = renderRuntimeBinding(registry);
  const bindingPath = path.join(root, RUNTIME_BINDING_PATH);
  const currentBinding = fs.existsSync(bindingPath) ? fs.readFileSync(bindingPath, 'utf8') : '';
  if (currentBinding !== expectedBinding) fail(`${RUNTIME_BINDING_PATH}: runtime import binding does not agree with ${ASSURANCE_REGISTRY_PATH}`);
}

if (errors.length) {
  console.error('Assurance registry completeness/schema validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance registry validation passed: ${flattenAssuranceRegistry(registry).length} registered resources, all canonical assurance JSON registered and schema-valid.`);
