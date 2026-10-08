import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  loadAssuranceRegistry,
  primaryRegistryDataset,
  readJsonFile,
} from './lib/assurance-registry.ts';
import {
  recordRelationshipIdentity,
  registeredRelationshipFamily,
  validateRelationshipSet,
} from './lib/assurance-relationships.ts';
import { validateRegisteredAssuranceResource } from './lib/assurance-validation.ts';

function hasAnnotatedReleaseTag(root, release) {
  const result = spawnSync('git', ['cat-file', '-t', `refs/tags/${release}`], {
    cwd: root,
    encoding: 'utf8',
  });
  return result.status === 0 && result.stdout.trim() === 'tag';
}

export function validateAdvisories(root = process.cwd(), context = null) {
  const errors = [];
  let registry;
  let advisoryResource;
  let advisories;

  try {
    registry = context?.registry() ?? loadAssuranceRegistry(root);
    advisoryResource = primaryRegistryDataset(registry, 'advisories');
    advisories = context?.readJson(advisoryResource.path) ?? readJsonFile(root, advisoryResource.path);
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
  if (!context) for (const kind of ['evidence', 'incidents']) {
    try {
      const family = registeredRelationshipFamily(root, registry, kind);
      relationshipFamilies.set(kind, family.identities);
    } catch (error) {
      errors.push(`advisories: unable to discover related ${kind} dataset through assurance/registry.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const advisoryIds = new Set();
  for (const record of advisories.records ?? []) {
    if (advisoryIds.has(record.id)) errors.push(`${record.id}: duplicate published GHSA ID`);
    advisoryIds.add(record.id);

    if (!context) errors.push(...validateRelationshipSet(
      record.relationships,
      relationshipFamilies,
      `${advisoryResource.path}:${record.id}`,
      recordRelationshipIdentity(registry, advisoryResource, record),
    ));

    for (const release of record.fixedReleases ?? []) {
      if (!hasAnnotatedReleaseTag(root, release)) {
        errors.push(`${record.id}: fixed release ${release} is not an annotated release tag`);
      }
    }
  }

  return { errors, count: advisoryIds.size };
}

export function runAdvisoryValidation(root = process.cwd(), context = null) {
  const result = validateAdvisories(root, context);
  if (result.errors.length) {
    console.error('Public advisory validation failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    return 1;
  }
  console.log(`Public advisory validation passed: ${result.count} published advisories with canonical relationships and annotated fixed-release tags.`);
  return 0;
}

const entrypoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === entrypoint) process.exitCode = runAdvisoryValidation();
