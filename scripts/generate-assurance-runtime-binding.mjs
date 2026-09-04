import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
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
} from './lib/assurance-registry.mjs';
import { collectHistoricalAssuranceSnapshot } from './lib/assurance-lifecycle-history.mjs';
import { createAssuranceSchemaLoader } from './lib/assurance-validation.mjs';
import {
  collectJsonSchemaDependencies,
  resolveJsonSchemaProperty,
} from './lib/json-schema.mjs';
import { RISK_RATING_VALUES } from '../src/assurance/risk-rating.js';

export const RUNTIME_BINDING_PATH = 'src/assurance/generated/registry-bindings.ts';
export const LIFECYCLE_BASELINE_MEMBERSHIP_PATH = 'src/assurance/generated/lifecycle-baseline-membership.json';

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
        for (const value of derivedFilterValues(resource, definition)) addFilterValue(values, value);
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

function historicalDirectoryReader(directory) {
  return (relative) => readJsonFile(directory, relative);
}

function historicalGitReader(root, ref) {
  if (!fs.existsSync(path.join(root, '.git'))) return null;

  const probe = spawnSync('git', ['cat-file', '-e', `${ref}^{commit}`], { cwd: root, encoding: 'utf8' });
  if (probe.status !== 0) {
    throw new Error(
      `unable to verify lifecycle baseline ${ref} from repository history: ${probe.stderr.trim() || probe.stdout.trim() || 'git cat-file failed'}`,
    );
  }

  return (relative) => {
    const result = spawnSync('git', ['show', `${ref}:${relative}`], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(`unable to read ${relative} from lifecycle baseline ${ref}: ${result.stderr.trim() || result.stdout.trim()}`);
    }
    try {
      return JSON.parse(result.stdout);
    } catch (error) {
      throw new Error(`unable to decode ${relative} from lifecycle baseline ${ref}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

function normalizedGeneratedMembership(value, expectedCommit) {
  if (value?.schemaVersion !== 1 || value?.commit !== expectedCommit || !Array.isArray(value?.recordIds)) return null;
  if (value.recordIds.some((id) => typeof id !== 'string' || !id)) return null;
  const sorted = [...value.recordIds].sort();
  if (new Set(sorted).size !== sorted.length) return null;
  if (sorted.some((id, index) => id !== value.recordIds[index])) return null;
  return { schemaVersion: 1, commit: expectedCommit, recordIds: sorted };
}

export function deriveLifecycleBaselineMembership(registry, root = process.cwd()) {
  const lifecycleResource = requireAssuranceCapabilityResource(registry, 'lifecycle');
  const lifecycle = readJsonFile(root, lifecycleResource.path);
  const commit = lifecycle?.baseline?.commit;
  if (!/^[0-9a-f]{40}$/.test(commit ?? '')) {
    throw new Error(`${lifecycleResource.path}: baseline.commit must be an immutable 40-character Git commit SHA.`);
  }

  const baselineDirectory = process.env.ASSURANCE_BASELINE_DIR;
  const readHistorical = baselineDirectory
    ? historicalDirectoryReader(baselineDirectory)
    : historicalGitReader(root, commit);

  if (readHistorical) {
    const snapshot = collectHistoricalAssuranceSnapshot(
      readHistorical,
      `generated lifecycle baseline ${commit}`,
    );
    return {
      schemaVersion: 1,
      commit,
      recordIds: [...snapshot.records.keys()].sort(),
    };
  }

  // Fixture copies intentionally omit .git. Reuse only a previously generated,
  // commit-matched artifact there; repository/CI generation always verifies the
  // artifact against the immutable Git baseline above.
  const generatedPath = path.join(root, LIFECYCLE_BASELINE_MEMBERSHIP_PATH);
  if (fs.existsSync(generatedPath)) {
    const generated = normalizedGeneratedMembership(readJsonFile(root, LIFECYCLE_BASELINE_MEMBERSHIP_PATH), commit);
    if (generated) return generated;
  }

  throw new Error(
    `${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}: unable to derive baseline membership for ${commit}; Git history or ASSURANCE_BASELINE_DIR is required when no verified generated artifact exists.`,
  );
}

export function renderRuntimeBinding(registry, root = process.cwd()) {
  const lifecycleResource = requireAssuranceCapabilityResource(registry, 'lifecycle');
  if (!lifecycleResource.capabilities?.includes('runtime')) {
    throw new Error(`${lifecycleResource.id}: lifecycle capability owner must declare runtime capability for Worker binding.`);
  }

  const runtimeResources = flattenAssuranceRegistry(registry)
    .filter((resource) => resource.capabilities?.includes('runtime'))
    .sort((left, right) => left.id.localeCompare(right.id));
  const filterVocabularies = deriveRuntimeFilterVocabularies(registry, root);
  const dependencyDigests = deriveRuntimeSchemaDependencyDigests(registry, root);

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
  const renderedBinding = renderRuntimeBinding(registry, root);
  const renderedMembership = `${JSON.stringify(deriveLifecycleBaselineMembership(registry, root), null, 2)}\n`;
  const bindingAbsolute = path.join(root, RUNTIME_BINDING_PATH);
  const membershipAbsolute = path.join(root, LIFECYCLE_BASELINE_MEMBERSHIP_PATH);

  if (checkOnly) {
    const currentBinding = fs.existsSync(bindingAbsolute) ? fs.readFileSync(bindingAbsolute, 'utf8') : '';
    if (currentBinding !== renderedBinding) {
      console.error(`${RUNTIME_BINDING_PATH}: generated runtime import binding is stale or does not agree with ${ASSURANCE_REGISTRY_PATH} and its schema dependencies`);
      process.exit(1);
    }
    const currentMembership = fs.existsSync(membershipAbsolute) ? fs.readFileSync(membershipAbsolute, 'utf8') : '';
    if (currentMembership !== renderedMembership) {
      console.error(`${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}: generated lifecycle baseline membership is stale or does not agree with the immutable lifecycle baseline`);
      process.exit(1);
    }
    console.log(`Assurance runtime import binding agrees with ${ASSURANCE_REGISTRY_PATH} and its schema dependencies.`);
    console.log(`Lifecycle baseline membership agrees with the immutable baseline referenced by the registry-owned lifecycle resource.`);
    return;
  }

  fs.mkdirSync(path.dirname(bindingAbsolute), { recursive: true });
  fs.writeFileSync(bindingAbsolute, renderedBinding);
  fs.writeFileSync(membershipAbsolute, renderedMembership);
  console.log(`Generated ${RUNTIME_BINDING_PATH} from ${ASSURANCE_REGISTRY_PATH} and its schema dependencies.`);
  console.log(`Generated ${LIFECYCLE_BASELINE_MEMBERSHIP_PATH} from the immutable lifecycle baseline.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
