#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  flattenAssuranceRegistry,
  loadAssuranceRecordInventory,
  loadAssuranceRegistry,
  readJsonFile,
} from './lib/assurance-registry.mjs';
import {
  createFileSchemaLoader,
  formatJsonSchemaErrors,
  validateJsonSchema,
} from './lib/json-schema.mjs';
import { assuranceRelationshipNames } from '../src/assurance/relationship-contract.js';

const CURRENT_CONTRACT = 'contracts/assurance/reporting.schema.json';
const DERIVED_RECORD_FIELDS = new Set([
  'publication',
  'frameworkReferences',
  'riskLinks',
  'controlLinks',
  'objectiveLinks',
  'incidentLinks',
  'evidence',
  'controls',
  'counts',
  'count',
  'totalAvailable',
  'usedBy',
  'resolved',
  'freshness',
  'observation',
]);
const RELATIONSHIP_NAMES = new Set(assuranceRelationshipNames());

export class ReportingInterchangeError extends Error {
  constructor(code, detail) {
    super(detail ? `${code}: ${detail}` : code);
    this.code = code;
  }
}

function fail(code, detail) {
  throw new ReportingInterchangeError(code, detail);
}

function clone(value) {
  return structuredClone(value);
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function deepMerge(current, incoming) {
  if (
    current === null
    || incoming === null
    || typeof current !== 'object'
    || typeof incoming !== 'object'
    || Array.isArray(current)
    || Array.isArray(incoming)
  ) return clone(incoming);

  const merged = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = key in merged ? deepMerge(merged[key], value) : clone(value);
  }
  return merged;
}

function valueAtPath(value, dottedPath) {
  return dottedPath.split('.').reduce((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    return current[segment];
  }, value);
}

function replaceAtPath(document, dottedPath, value) {
  const segments = dottedPath.split('.');
  const copy = clone(document);
  let cursor = copy;
  for (const segment of segments.slice(0, -1)) {
    if (!cursor[segment] || typeof cursor[segment] !== 'object' || Array.isArray(cursor[segment])) {
      fail('invalid_record_collection_path', dottedPath);
    }
    cursor = cursor[segment];
  }
  cursor[segments.at(-1)] = value;
  return copy;
}

function gitHead(root) {
  try {
    const value = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    if (!/^[0-9a-f]{40}$/.test(value)) fail('invalid_git_revision', value);
    return value;
  } catch (error) {
    if (error instanceof ReportingInterchangeError) throw error;
    fail('git_revision_unavailable', 'Run interchange commands from a full Git checkout.');
  }
}

function gitBlobSha(content) {
  const bytes = Buffer.from(content, 'utf8');
  return crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

function resourceText(root, resource) {
  return fs.readFileSync(path.join(root, resource.path), 'utf8');
}

function effectiveStructuredSource(registry, resource) {
  const declaration = registry.reporting?.structuredRecords;
  if (!declaration) fail('reporting_source_unavailable', 'assurance/registry.json has no structured reporting declaration.');
  if (!resource.path.startsWith(declaration.resourceRoot)) {
    fail('reporting_source_out_of_scope', resource.path);
  }
  const privateResource = resource.visibility === 'private';
  return {
    id: `${declaration.id}.${resource.id}`,
    provider: declaration.provider,
    authority: declaration.authority,
    scope: { repository: declaration.repository, resource: resource.path },
    nativeIdentity: [...declaration.nativeIdentity],
    revisionIdentity: [...declaration.revisionIdentity],
    schema: resource.schema,
    visibility: resource.visibility,
    capabilities: privateResource
      ? declaration.capabilities.filter((capability) => capability !== 'import')
      : [...declaration.capabilities],
    ingestion: privateResource ? registry.reporting.privateIngestion : declaration.ingestion,
  };
}

function recordResources(registry) {
  return flattenAssuranceRegistry(registry)
    .filter((resource) => resource.recordCollection && resource.capabilities?.includes('records'))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function validateAgainstSchema(root, value, schemaPath, definition) {
  const schema = readJsonFile(root, schemaPath);
  const loadSchema = createFileSchemaLoader(root);
  const validationSchema = definition
    ? { $defs: schema.$defs, $ref: `#/$defs/${definition}` }
    : schema;
  const errors = validateJsonSchema(value, validationSchema, { schemaPath, loadSchema });
  if (errors.length > 0) {
    fail('schema_validation_failed', formatJsonSchemaErrors('<interchange>', schemaPath, errors).join('; '));
  }
}

function assertAuthoritativeRecord(record, resourceId) {
  if (!record || typeof record !== 'object' || Array.isArray(record) || typeof record.id !== 'string' || !record.id) {
    fail('invalid_record', `${resourceId} contains a record without a canonical id.`);
  }
  for (const field of DERIVED_RECORD_FIELDS) {
    if (Object.hasOwn(record, field)) {
      fail('derived_field_not_authoritative', `${resourceId}/${record.id}.${field}`);
    }
  }
  for (const score of ['inherent', 'residual']) {
    const value = record[score];
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.hasOwn(value, 'rating')) {
      fail('derived_field_not_authoritative', `${resourceId}/${record.id}.${score}.rating`);
    }
  }
}

function currentInventory(root, registry) {
  const inventory = loadAssuranceRecordInventory(root, registry);
  const recordOwner = new Map();
  for (const entry of inventory.entries) {
    const id = entry.record?.id;
    if (typeof id === 'string' && id) recordOwner.set(id, entry.resource.id);
  }
  return { inventory, recordOwner };
}

function relationshipGraph(collections) {
  const recordLocation = new Map();
  for (const collection of collections) {
    for (const record of collection.records) {
      recordLocation.set(record.id, {
        source: collection.source.id,
        revision: collection.revision.blob,
      });
    }
  }

  for (const collection of collections) {
    const relationships = [];
    for (const record of collection.records) {
      const declared = record.relationships;
      if (!declared || typeof declared !== 'object' || Array.isArray(declared)) continue;
      for (const relation of [...RELATIONSHIP_NAMES].sort()) {
        const targets = declared[relation];
        if (!Array.isArray(targets)) continue;
        for (const targetId of targets) {
          const target = recordLocation.get(targetId);
          if (!target) continue;
          relationships.push({
            relation,
            from: { source: collection.source.id, native: record.id, revision: collection.revision.blob },
            to: { source: target.source, native: targetId, revision: target.revision },
          });
        }
      }
    }
    relationships.sort((left, right) => (
      left.from.source.localeCompare(right.from.source)
      || left.from.native.localeCompare(right.from.native)
      || left.relation.localeCompare(right.relation)
      || left.to.source.localeCompare(right.to.source)
      || left.to.native.localeCompare(right.to.native)
    ));
    collection.relationships = relationships;
  }
}

export function buildInterchangeEnvelope(root = process.cwd()) {
  const registry = loadAssuranceRegistry(root);
  const commit = gitHead(root);
  const resources = recordResources(registry);
  if (resources.length === 0) fail('no_exportable_resources');
  const collections = resources.map((resource) => {
    const source = effectiveStructuredSource(registry, resource);
    if (!source.capabilities.includes('export')) fail('export_not_supported', resource.id);
    const document = readJsonFile(root, resource.path);
    validateAgainstSchema(root, document, resource.schema);
    const records = valueAtPath(document, resource.recordCollection.path);
    if (!Array.isArray(records)) fail('invalid_record_collection_path', `${resource.id}:${resource.recordCollection.path}`);
    const text = resourceText(root, resource);
    return {
      source,
      resource: {
        id: resource.id,
        path: resource.path,
        schema: resource.schema,
        collectionPath: resource.recordCollection.path,
        visibility: resource.visibility,
      },
      revision: { commit, blob: gitBlobSha(text) },
      records: clone(records),
      relationships: [],
    };
  });

  relationshipGraph(collections);
  const envelope = {
    contract: CURRENT_CONTRACT,
    registry: { id: registry.id, schemaVersion: registry.schemaVersion },
    collections,
  };
  validateAgainstSchema(root, envelope, CURRENT_CONTRACT, 'interchangeEnvelope');
  return envelope;
}

function assertCurrentSource(registry, resource, collection) {
  const expected = effectiveStructuredSource(registry, resource);
  if (collection.source.authority !== 'structured-record') {
    fail('unsupported_write_authority', `${collection.source.id}:${collection.source.authority}`);
  }
  if (!deepEqual(collection.source, expected)) {
    fail('source_contract_mismatch', resource.id);
  }
  if (!expected.capabilities.includes('import') || expected.ingestion !== 'enabled') {
    fail('import_not_supported', resource.id);
  }
  if (
    collection.resource.path !== resource.path
    || collection.resource.schema !== resource.schema
    || collection.resource.collectionPath !== resource.recordCollection.path
    || collection.resource.visibility !== resource.visibility
  ) {
    fail('resource_contract_mismatch', resource.id);
  }
}

function validateRelationshipReferences(collections, futureOwner, sourceToResource) {
  for (const collection of collections) {
    const incomingIds = new Set(collection.records.map((record) => record.id));
    for (const relationship of collection.relationships) {
      if (!RELATIONSHIP_NAMES.has(relationship.relation)) {
        fail('invalid_relationship', `Unknown relation ${relationship.relation}.`);
      }
      if (relationship.from.source !== collection.source.id || !incomingIds.has(relationship.from.native)) {
        fail('invalid_relationship', `Unowned source ${relationship.from.source}/${relationship.from.native}.`);
      }
      const targetResource = sourceToResource.get(relationship.to.source);
      if (!targetResource) {
        fail('invalid_relationship', `Unknown target source ${relationship.to.source}.`);
      }
      if (futureOwner.get(relationship.to.native) !== targetResource.id) {
        fail('invalid_relationship', `Unresolved target ${relationship.to.source}/${relationship.to.native}.`);
      }
    }
  }
}

export function planInterchangeImport(root = process.cwd(), envelope) {
  const registry = loadAssuranceRegistry(root);
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope) || envelope.contract !== CURRENT_CONTRACT || !Array.isArray(envelope.collections)) {
    fail('legacy_interchange_contract_rejected');
  }
  validateAgainstSchema(root, envelope, CURRENT_CONTRACT, 'interchangeEnvelope');
  if (envelope.registry.id !== registry.id || envelope.registry.schemaVersion !== registry.schemaVersion) {
    fail('registry_contract_mismatch', `${envelope.registry.id}@${envelope.registry.schemaVersion}`);
  }

  const resources = new Map(recordResources(registry).map((resource) => [resource.id, resource]));
  const { inventory, recordOwner } = currentInventory(root, registry);
  const payloadIds = new Set();
  const sourceToResource = new Map([...resources.values()].map((resource) => [effectiveStructuredSource(registry, resource).id, resource]));
  const importedSources = new Set();
  const planned = [];
  const futureOwner = new Map(recordOwner);

  for (const collection of envelope.collections) {
    const resource = resources.get(collection.resource.id);
    if (!resource) fail('unsupported_write_resource', collection.resource.id);
    assertCurrentSource(registry, resource, collection);
    if (importedSources.has(collection.source.id)) fail('duplicate_source_collection', collection.source.id);
    importedSources.add(collection.source.id);

    const currentDocument = inventory.documentForResource(resource);
    const currentRecords = valueAtPath(currentDocument, resource.recordCollection.path);
    if (!Array.isArray(currentRecords)) fail('invalid_record_collection_path', resource.id);
    const byId = new Map(currentRecords.map((record) => [record.id, record]));

    for (const incoming of collection.records) {
      assertAuthoritativeRecord(incoming, resource.id);
      if (payloadIds.has(incoming.id)) fail('duplicate_import_id', incoming.id);
      payloadIds.add(incoming.id);
      const existingOwner = recordOwner.get(incoming.id);
      if (existingOwner && existingOwner !== resource.id) {
        fail('duplicate_canonical_id', `${incoming.id} is owned by ${existingOwner}.`);
      }
      futureOwner.set(incoming.id, resource.id);
    }

    const mergedRecords = [...currentRecords];
    for (const incoming of collection.records) {
      const current = byId.get(incoming.id);
      if (current) {
        const merged = deepMerge(current, incoming);
        const index = mergedRecords.findIndex((record) => record.id === incoming.id);
        mergedRecords[index] = merged;
      } else {
        mergedRecords.push(clone(incoming));
      }
    }

    const nextDocument = replaceAtPath(currentDocument, resource.recordCollection.path, mergedRecords);
    validateAgainstSchema(root, nextDocument, resource.schema);
    const currentText = resourceText(root, resource);
    const currentBlob = gitBlobSha(currentText);
    const changed = !deepEqual(currentDocument, nextDocument);
    if (changed && collection.revision.blob !== currentBlob) {
      fail('revision_conflict', `${resource.id}: expected ${collection.revision.blob}, current ${currentBlob}.`);
    }

    planned.push({
      resource,
      changed,
      currentBlob,
      nextDocument,
      recordCount: mergedRecords.length,
    });
  }

  validateRelationshipReferences(envelope.collections, futureOwner, sourceToResource);

  return {
    changedResources: planned.filter((entry) => entry.changed).map((entry) => entry.resource.id),
    unchangedResources: planned.filter((entry) => !entry.changed).map((entry) => entry.resource.id),
    resources: planned,
  };
}

function runGenerator(root, script) {
  const result = spawnSync(process.execPath, [script], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) fail('projection_generation_failed', script);
}

export function applyInterchangeImport(root = process.cwd(), envelope, { dryRun = false } = {}) {
  const plan = planInterchangeImport(root, envelope);
  if (!dryRun) {
    for (const entry of plan.resources) {
      if (!entry.changed) continue;
      fs.writeFileSync(
        path.join(root, entry.resource.path),
        `${JSON.stringify(entry.nextDocument, null, 2)}\n`,
        'utf8',
      );
    }
    if (plan.changedResources.length > 0) {
      runGenerator(root, 'scripts/generate-assurance-runtime-binding.mjs');
      runGenerator(root, 'scripts/generate-assurance-summaries.mjs');
    }
  }
  return {
    status: 'valid',
    dryRun,
    changedResources: plan.changedResources,
    unchangedResources: plan.unchangedResources,
  };
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (argument === '--input' || argument === '--output') {
      const value = rest[index + 1];
      if (!value || value.startsWith('--')) fail('invalid_cli_arguments', `${argument} requires a path.`);
      options[argument.slice(2)] = value;
      index += 1;
      continue;
    }
    fail('invalid_cli_arguments', `Unsupported argument ${argument}.`);
  }
  return { command, options };
}

function usage() {
  return [
    'Usage:',
    '  npm run assurance:interchange -- export [--output <file>]',
    '  npm run assurance:interchange -- import --input <file> [--dry-run]',
  ].join('\n');
}

function writeOutput(value, output) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (output) fs.writeFileSync(path.resolve(output), text, 'utf8');
  else process.stdout.write(text);
}

export function main(argv = process.argv.slice(2), root = process.cwd()) {
  const { command, options } = parseArguments(argv);
  if (command === 'export') {
    if (options.input || options.dryRun) fail('invalid_cli_arguments', usage());
    writeOutput(buildInterchangeEnvelope(root), options.output);
    return;
  }
  if (command === 'import') {
    if (!options.input || options.output) fail('invalid_cli_arguments', usage());
    const envelope = JSON.parse(fs.readFileSync(path.resolve(options.input), 'utf8'));
    writeOutput(applyInterchangeImport(root, envelope, { dryRun: Boolean(options.dryRun) }));
    return;
  }
  fail('invalid_cli_arguments', usage());
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  try {
    main();
  } catch (error) {
    const code = error instanceof ReportingInterchangeError ? error.code : 'interchange_failed';
    process.stderr.write(`${JSON.stringify({ error: code, detail: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
