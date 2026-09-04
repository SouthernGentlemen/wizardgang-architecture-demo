import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASSURANCE_REGISTRY_PATH,
  assuranceRecordCollectionPath,
  assuranceValueAtPath,
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
  readJsonFile,
  requireAssuranceCapabilityResource,
  resolveAssuranceResourceOwner,
} from './lib/assurance-registry.mjs';
import { createAssuranceSchemaLoader } from './lib/assurance-validation.mjs';
import {
  collectJsonSchemaDependencies,
  resolveJsonSchemaProperty,
} from './lib/json-schema.mjs';
import { RISK_RATING_VALUES } from '../src/assurance/risk-rating.js';

export const RUNTIME_BINDING_PATH = 'src/assurance/generated/registry-bindings.ts';
export const LIFECYCLE_BASELINE_MEMBERSHIP_PATH = 'src/assurance/generated/lifecycle-baseline-membership.json';
export const LIFECYCLE_BASELINE_MEMBERSHIP_BLOB = 'e2f4aad3146649fdfe2063abc780dc73a99bdd64';
export const LIFECYCLE_HISTORICAL_COMMIT = 'c2359f00fc3bac80bfbc2e82369a86f20e522f74';

function modulePath(fromFile, targetFile) {
  const fromDirectory = path.dirname(fromFile);
  let relative = path.relative(fromDirectory, targetFile).split(path.sep).join('/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

function gitBlobSha(source) {
  const bytes = Buffer.isBuffer(source) ? source : Buffer.from(source);
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex');
}

export function gitBlobShaForFile(root, relative) {
  return gitBlobSha(fs.readFileSync(path.join(root, relative)));
}

function addFilterValue(values, value) {
  const candidate = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && !Array.isArray(value) && typeof value.id === 'string'
      ? value.id
      : undefined;
  if (candidate !== undefined && !values.includes(candidate)) values.push(candidate);
}

function derivedFilterValues(resource, definition) {
  if (resource.kind === 'risks' && definition.path === 'residual.rating') return RISK_RATING_VALUES;
  return [];
}

function schemaFilterValues(root, resource, definition, loadSchema) {
  const collectionPath = assuranceRecordCollectionPath(resource);
  if (!collectionPath) throw new Error(`${resource.id} cannot supply filters without a declared record collection.`);
  const schema = readJsonFile(root, resource.schema);
  const property = resolveJsonSchemaProperty(schema, collectionPath, definition.path, {
    schemaPath: resource.schema,
    loadSchema,
  });
  if (!property) return [];
  if (Array.isArray(property.enum)) return property.enum.filter((value) => typeof value === 'string');
  return typeof property.const === 'string' ? [property.const] : [];
}

function resourceUsesFilterOwner(registry, resource, owner) {
  if (resource.kind === owner.kind) return true;
  if (!resource.routeOwner) return false;
  return resolveAssuranceResourceOwner(registry, resource, 'routeOwner').id === owner.id;
}

export function deriveRuntimeFilterVocabularies(registry, root = process.cwd()) {
  const resources = flattenAssuranceRegistry(registry);
  const runtimeRecordResources = resources.filter(
    (resource) => resource.capabilities?.includes('runtime') && resource.capabilities?.includes('records'),
  );
  const owners = (registry.datasets ?? [])
    .filter((resource) => resource.filters)
    .sort((left, right) => left.id.localeCompare(right.id));
  const loadSchema = createAssuranceSchemaLoader(root);
  const vocabularies = {};

  for (const owner of owners) {
    const filters = {};
    const routeResources = runtimeRecordResources.filter((resource) => resourceUsesFilterOwner(registry, resource, owner));
    const allRouteResources = resources.filter((resource) => resourceUsesFilterOwner(registry, resource, owner));
    for (const [parameter, definition] of Object.entries(owner.filters ?? {})) {
      const values = [];
      for (const resource of routeResources) {
        for (const value of derivedFilterValues(resource, definition)) addFilterValue(values, value);
        for (const value of schemaFilterValues(root, resource, definition, loadSchema)) addFilterValue(values, value);
      }
      if (values.length === 0) {
        for (const resource of allRouteResources) addFilterValue(values, assuranceValueAtPath(resource, definition.path));
      }
      if (values.length === 0) {
        throw new Error(`${owner.id}.${parameter} does not resolve to an authoritative registered filter vocabulary.`);
      }
      filters[parameter] = values;
    }
    vocabularies[owner.kind] = filters;
  }

  return vocabularies;
}

export function deriveRuntimeSchemaDependencyDigests(registry, root = process.cwd()) {
  const runtimeResources = flattenAssuranceRegistry(registry)
    .filter((resource) => resource.capabilities?.includes('runtime'));
  const loadSchema = createAssuranceSchemaLoader(root);
  const dependencies = new Set();
  for (const resource of runtimeResources) {
    const schema = readJsonFile(root, resource.schema);
    for (const dependency of collectJsonSchemaDependencies(schema, {
      schemaPath: resource.schema,
      loadSchema,
    })) {
      if (dependency !== resource.schema) dependencies.add(dependency);
    }
  }
  return Object.fromEntries([...dependencies].sort().map((dependency) => {
    const source = fs.readFileSync(path.join(root, dependency));
    return [dependency, createHash('sha256').update(source).digest('hex')];
  }));
}

export function deriveRuntimeSourceRevisions(registry, root = process.cwd()) {
  const runtimeResources = flattenAssuranceRegistry(registry)
    .filter((resource) => resource.capabilities?.includes('runtime'))
    .sort((left, right) => left.id.localeCompare(right.id));
  return Object.fromEntries(runtimeResources.map((resource) => [
    resource.id,
    gitBlobShaForFile(root, resource.path),
  ]));
}

export function verifyLifecycleBaselineMembership(registry, root = process.cwd()) {
  const lifecycleResource = requireAssuranceCapabilityResource(registry, 'lifecycle');
  const lifecycle = readJsonFile(root, lifecycleResource.path);
  const baseline = lifecycle?.baseline;
  if (baseline?.historicalCommit !== LIFECYCLE_HISTORICAL_COMMIT) {
    throw new Error(`${lifecycleResource.path}: baseline historicalCommit must remain pinned to ${LIFECYCLE_HISTORICAL_COMMIT}.`);
  }
  if (baseline?.membership?.path !== LIFECYCLE_BASELINE_MEMBERSHIP_PATH) {
    throw new Error(`${lifecycleResource.path}: baseline membership path must remain ${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}.`);
  }
  if (baseline?.membership?.blob !== LIFECYCLE_BASELINE_MEMBERSHIP_BLOB) {
    throw new Error(`${lifecycleResource.path}: baseline membership blob must remain ${LIFECYCLE_BASELINE_MEMBERSHIP_BLOB}.`);
  }

  const absolute = path.join(root, LIFECYCLE_BASELINE_MEMBERSHIP_PATH);
  const source = fs.readFileSync(absolute);
  const actualBlob = gitBlobSha(source);
  if (actualBlob !== LIFECYCLE_BASELINE_MEMBERSHIP_BLOB) {
    throw new Error(`${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}: frozen membership artifact changed; expected Git blob ${LIFECYCLE_BASELINE_MEMBERSHIP_BLOB}, found ${actualBlob}.`);
  }

  const membership = JSON.parse(source.toString('utf8'));
  if (membership?.schemaVersion !== 1 || membership?.commit !== LIFECYCLE_HISTORICAL_COMMIT || !Array.isArray(membership?.recordIds)) {
    throw new Error(`${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}: frozen membership artifact is invalid.`);
  }
  if (membership.recordIds.some((id) => typeof id !== 'string' || !id)) {
    throw new Error(`${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}: frozen membership contains an invalid stable ID.`);
  }
  const sorted = [...membership.recordIds].sort();
  if (new Set(sorted).size !== sorted.length || sorted.some((id, index) => id !== membership.recordIds[index])) {
    throw new Error(`${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}: frozen membership IDs must remain unique and sorted.`);
  }
  return membership;
}

export function renderRuntimeBinding(registry, root = process.cwd()) {
  const lifecycleResource = requireAssuranceCapabilityResource(registry, 'lifecycle');
  if (!lifecycleResource.capabilities?.includes('runtime')) {
    throw new Error(`${lifecycleResource.id}: lifecycle capability owner must declare runtime capability for Worker binding.`);
  }
  verifyLifecycleBaselineMembership(registry, root);

  const runtimeResources = flattenAssuranceRegistry(registry)
    .filter((resource) => resource.capabilities?.includes('runtime'))
    .sort((left, right) => left.id.localeCompare(right.id));
  const filterVocabularies = deriveRuntimeFilterVocabularies(registry, root);
  const dependencyDigests = deriveRuntimeSchemaDependencyDigests(registry, root);
  const sourceRevisions = deriveRuntimeSourceRevisions(registry, root);

  const lines = [
    '// GENERATED FILE: scripts/generate-assurance-runtime-binding.mjs; DO NOT EDIT BY HAND.',
    `import registryData from '${modulePath(RUNTIME_BINDING_PATH, ASSURANCE_REGISTRY_PATH)}';`,
    `import lifecycleBaselineMembership from './${path.basename(LIFECYCLE_BASELINE_MEMBERSHIP_PATH)}';`,
  ];

  runtimeResources.forEach((resource, index) => {
    lines.push(`import dataset${index} from '${modulePath(RUNTIME_BINDING_PATH, resource.path)}';`);
    lines.push(`import schema${index} from '${modulePath(RUNTIME_BINDING_PATH, resource.schema)}';`);
  });

  lines.push(
    '',
    'export const assuranceRegistryData = registryData;',
    'export const assuranceLifecycleBaselineMembership = lifecycleBaselineMembership;',
    '',
    'export const assuranceRuntimeDatasets: Record<string, unknown> = {',
  );
  runtimeResources.forEach((resource, index) => {
    lines.push(`  ${JSON.stringify(resource.id)}: dataset${index},`);
  });
  lines.push(
    '};',
    '',
    'export const assuranceRuntimeSourceRevisions: Readonly<Record<string, string>> =',
    `${JSON.stringify(sourceRevisions, null, 2)};`,
    '',
    'export const assuranceRuntimeSchemas: Record<string, unknown> = {',
  );
  runtimeResources.forEach((resource, index) => {
    lines.push(`  ${JSON.stringify(resource.id)}: schema${index},`);
  });
  lines.push(
    '};',
    '',
    'export const assuranceRuntimeFilterVocabularies: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> =',
    `${JSON.stringify(filterVocabularies, null, 2)};`,
    '',
    'export const assuranceRuntimeSchemaDependencyDigests: Readonly<Record<string, string>> =',
    `${JSON.stringify(dependencyDigests, null, 2)};`,
    '',
  );
  return lines.join('\n');
}

function main() {
  const root = process.cwd();
  const checkOnly = process.argv.includes('--check');
  const registry = loadAssuranceRegistry(root);
  const renderedBinding = renderRuntimeBinding(registry, root);
  const bindingAbsolute = path.join(root, RUNTIME_BINDING_PATH);

  if (checkOnly) {
    const currentBinding = fs.existsSync(bindingAbsolute) ? fs.readFileSync(bindingAbsolute, 'utf8') : '';
    if (currentBinding !== renderedBinding) {
      console.error(`${RUNTIME_BINDING_PATH}: generated runtime import binding is stale or does not agree with ${ASSURANCE_REGISTRY_PATH}, source revisions, and schema dependencies`);
      process.exit(1);
    }
    console.log(`Assurance runtime import binding agrees with ${ASSURANCE_REGISTRY_PATH}, source revisions, and schema dependencies.`);
    console.log(`Frozen lifecycle baseline membership remains pinned to Git blob ${LIFECYCLE_BASELINE_MEMBERSHIP_BLOB}.`);
    return;
  }

  fs.mkdirSync(path.dirname(bindingAbsolute), { recursive: true });
  fs.writeFileSync(bindingAbsolute, renderedBinding);
  console.log(`Generated ${RUNTIME_BINDING_PATH} from ${ASSURANCE_REGISTRY_PATH}, source revisions, and schema dependencies.`);
  console.log(`Verified frozen lifecycle baseline membership at Git blob ${LIFECYCLE_BASELINE_MEMBERSHIP_BLOB}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
