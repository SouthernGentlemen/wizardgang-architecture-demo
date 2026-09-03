import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const registry = read('assurance/registry.json');
const manifest = read('docs/route-manifest.json');
const routes = new Set(manifest.map((entry) => entry.route));
const errors = [];
const derivedOnlyKeys = new Set(['counts', 'usedBy', 'url', 'urls', 'href', 'hrefs', 'resolved']);

function validateCanonical(relative, value, pointer = '$') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateCanonical(relative, entry, `${pointer}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      errors.push(`${relative}: canonical assurance data must store stable paths/routes, not absolute URLs (${pointer})`);
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (derivedOnlyKeys.has(key)) {
      errors.push(`${relative}: ${key} is derived presentation data and must not be stored (${pointer}.${key})`);
    }
    validateCanonical(relative, child, `${pointer}.${key}`);
  }
}

validateCanonical('assurance/registry.json', registry);
for (const dataset of registry.datasets ?? []) {
  if (dataset.path) validateCanonical(dataset.path, read(dataset.path));
}

for (const route of ['/evidence', '/v1/assurance', '/v1/assurance/evidence', '/v1/assurance/advisories']) {
  if (!routes.has(route)) errors.push(`public assurance route is missing from the route manifest: ${route}`);
}

if (errors.length) {
  console.error('Assurance projection validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance projection validation passed: ${registry.datasets?.length ?? 0} canonical datasets remain free of derived counts, URLs, and reverse links.`);
