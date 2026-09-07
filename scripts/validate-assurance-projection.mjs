import fs from 'node:fs';
import path from 'node:path';
import {
  ASSURANCE_REGISTRY_PATH,
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
} from './lib/assurance-registry.mjs';

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const registry = loadAssuranceRegistry(root);
const manifest = read('docs/route-manifest.json');
const routes = new Set(manifest.map((entry) => entry.route));
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
    if (derivedOnlyKeys.has(key)) {
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

for (const route of ['/assurance', '/security', '/v1/assurance', '/v1/assurance/evidence', '/v1/assurance/advisories']) {
  if (!routes.has(route)) errors.push(`public assurance route is missing from the route manifest: ${route}`);
}

if (errors.length) {
  console.error('Assurance projection validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance projection validation passed: ${projectedResources.length} registry-discovered runtime datasets remain free of derived counts, URLs, and reverse links.`);
