import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  loadAssuranceRegistry,
  primaryRegistryDataset,
  readJsonFile,
} from './lib/assurance-registry.mjs';
import {
  registeredRelationshipFamily,
  validateRelationshipSet,
} from './lib/assurance-relationships.mjs';
import { validateRegisteredAssuranceResource } from './lib/assurance-validation.mjs';

export function validateAdvisories(root = process.cwd()) {
  const errors = [];
  let registry;
  let advisoryResource;
  let advisories;

  try {
    registry = loadAssuranceRegistry(root);
    advisoryResource = primaryRegistryDataset(registry, 'advisories');
    advisories = readJsonFile(root, advisoryResource.path);
  } catch (error) {
    return {
      errors: [`advisories: unable to discover canonical dataset through assurance/registry.json: ${error instanceof Error ? error.message : String(error)}`],
      count: 0,
    };
  }

  errors.push(...validateRegisteredAssuranceResource(root, advisoryResource, advisories));
  if (advisories.schemaVersion !== registry.schemaVersion) {
    errors.push(`${advisoryResource.path}: schemaVersion must match assurance/registry.json`);
  }

  const relationshipFamilies = new Map();
  for (const kind of ['evidence', 'incidents']) {
    try {
      const family = registeredRelationshipFamily(root, registry, kind);
      relationshipFamilies.set(kind, family.ids);
    } catch (error) {
      errors.push(`advisories: unable to discover related ${kind} dataset through assurance/registry.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const advisoryIds = new Set();
  for (const record of advisories.records ?? []) {
    if (advisoryIds.has(record.id)) errors.push(`${record.id}: duplicate published GHSA ID`);
    advisoryIds.add(record.id);

    errors.push(...validateRelationshipSet(
      record.relationships,
      relationshipFamilies,
      `${advisoryResource.path}:${record.id}`,
    ));

    for (const release of record.fixedReleases ?? []) {
      if (!fs.existsSync(path.join(root, `docs/releases/${release}.md`))) {
        errors.push(`${record.id}: fixed release ${release} has no controlled release record`);
      }
    }
  }

  return { errors, count: advisoryIds.size };
}

export function runAdvisoryValidation(root = process.cwd()) {
  const result = validateAdvisories(root);
  if (result.errors.length) {
    console.error('Public advisory validation failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    return 1;
  }
  console.log(`Public advisory validation passed: ${result.count} published advisories with canonical relationships and controlled fixed-release records.`);
  return 0;
}

const entrypoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === entrypoint) process.exitCode = runAdvisoryValidation();
