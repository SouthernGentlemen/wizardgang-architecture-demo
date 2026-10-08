import fs from 'node:fs';
import path from 'node:path';
import {
  ASSURANCE_REGISTRY_PATH,
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
} from './lib/assurance-registry.ts';

import { pathToFileURL } from 'node:url';
import { createAssuranceValidationContext } from './lib/assurance-validation-context.ts';

export function runAssuranceProjectionValidation(context = createAssuranceValidationContext()) {
  const root = context.root;
  const read = context.readJson;
  const registry = context.registry();
  const errors = [];
  const derivedOnlyKeys = new Set(['counts', 'usedBy', 'url', 'urls', 'href', 'hrefs', 'resolved']);

  function validateCanonical(relative, value, pointer = '$', allowExternalReferences = false) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => validateCanonical(relative, entry, `${pointer}[${index}]`, allowExternalReferences));
      return;
    }
    if (!value || typeof value !== 'object') {
      if (!allowExternalReferences && typeof value === 'string' && /^https?:\/\//i.test(value)) {
        errors.push(`${relative}: canonical assurance data must store stable paths/routes, not absolute URLs (${pointer})`);
      }
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (relative === ASSURANCE_REGISTRY_PATH && derivedOnlyKeys.has(key)) {
        errors.push(`${relative}: ${key} is derived presentation data and must not be stored (${pointer}.${key})`);
      }
      validateCanonical(relative, child, `${pointer}.${key}`, allowExternalReferences);
    }
  }

  validateCanonical(ASSURANCE_REGISTRY_PATH, registry);
  const projectedResources = flattenAssuranceRegistry(registry).filter((resource) => resource.capabilities?.includes('runtime'));
  for (const resource of projectedResources) {
    validateCanonical(resource.path, read(resource.path), '$', resource.capabilities?.includes('manifest'));
  }


  if (errors.length) {
    console.error('Assurance projection validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    return false;
  }

  console.log(`Assurance projection validation passed: ${projectedResources.length} registry-discovered runtime datasets remain free of derived counts, URLs, and reverse links.`);

  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!runAssuranceProjectionValidation()) process.exitCode = 1;
}
