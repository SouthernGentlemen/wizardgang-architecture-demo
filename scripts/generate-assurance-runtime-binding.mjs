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
} from './lib/assurance-registry.mjs';
import { createAssuranceSchemaLoader } from './lib/assurance-validation.mjs';
import {
  collectJsonSchemaDependencies,
  resolveJsonSchemaProperty,
} from './lib/json-schema.mjs';

export const RUNTIME_BINDING_PATH = 'src/assurance/generated/registry-bindings.ts';

function modulePath(fromFile, targetFile) {
  const fromDirectory = path.dirname(fromFile);
  let relative = path.relative(fromDirectory, targetFile).split(path.sep).join('/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

function addFilterValue(values, value) {
  const candidate = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && !Array.isArray(value) && typeof value.id === 'string'
      ? value.id
      : undefined;
  if (candidate !== undefined && !values.includes(candidate)) values.push(candidate);
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

export function deriveRuntimeFilterVocabularies(registry, root = process.cwd()) {
  const resources = flattenAssuranceRegistry(registry);
  const runtimeRecordResources = resources.filter(
    (resource) => resource.capabilities?.includes('runtime') && resource.capabilities?.includes('records'),
  );
  const owners = resources
    .filter((resource) => resource.capabilities?.includes('api-index') && resource.filters)
    .sort((left, right) => left.id.localeCompare(right.id));
  const loadSchema = createAssuranceSchemaLoader(root);
  const vocabularies = {};

  for (const owner of owners) {
    const filters = {};
    const kindResources = runtimeRecordResources.filter((resource) => resource.kind === owner.kind);
    const allKindResources = resources.filter((resource) => resource.kind === owner.kind);
    for (const [parameter, definition] of Object.entries(owner.filters ?? {})) {
      const values = [];
      for (const resource of kindResources) {
        for (const value of schemaFilterValues(root, resource, definition, loadSchema)) addFilterValue(values, value);
      }
      if (values.length === 0) {
        for (const resource of allKindResources) addFilterValue(values, assuranceValueAtPath(resource, definition.path));
      }
      if (values.length === 0) {
        throw new Error(`${owner.kind}.${parameter} does not resolve to an authoritative registered filter vocabulary.`);
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

export function renderRuntimeBinding(registry, root = process.cwd()) {
  const runtimeResources = flattenAssuranceRegistry(registry)
    .filter((resource) => resource.capabilities?.includes('runtime'))
    .sort((left, right) => left.id.localeCompare(right.id));
  const filterVocabularies = deriveRuntimeFilterVocabularies(registry, root);
  const dependencyDigests = deriveRuntimeSchemaDependencyDigests(registry, root);

  const lines = [
    '// GENERATED FILE: scripts/generate-assurance-runtime-binding.mjs; DO NOT EDIT BY HAND.',
    `import registryData from '${modulePath(RUNTIME_BINDING_PATH, ASSURANCE_REGISTRY_PATH)}';`,
  ];

  runtimeResources.forEach((resource, index) => {
    lines.push(`import dataset${index} from '${modulePath(RUNTIME_BINDING_PATH, resource.path)}';`);
    lines.push(`import schema${index} from '${modulePath(RUNTIME_BINDING_PATH, resource.schema)}';`);
  });

  lines.push(
    '',
    'export const assuranceRegistryData = registryData;',
    '',
    'export const assuranceRuntimeDatasets: Record<string, unknown> = {',
  );
  runtimeResources.forEach((resource, index) => {
    lines.push(`  ${JSON.stringify(resource.id)}: dataset${index},`);
  });
  lines.push('};', '', 'export const assuranceRuntimeSchemas: Record<string, unknown> = {');
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
  const rendered = renderRuntimeBinding(registry, root);
  const absolute = path.join(root, RUNTIME_BINDING_PATH);

  if (checkOnly) {
    const current = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
    if (current !== rendered) {
      console.error(`${RUNTIME_BINDING_PATH}: generated runtime import binding is stale or does not agree with ${ASSURANCE_REGISTRY_PATH} and its schema dependencies`);
      process.exit(1);
    }
    console.log(`Assurance runtime import binding agrees with ${ASSURANCE_REGISTRY_PATH} and its schema dependencies.`);
    return;
  }

  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, rendered);
  console.log(`Generated ${RUNTIME_BINDING_PATH} from ${ASSURANCE_REGISTRY_PATH} and its schema dependencies.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
