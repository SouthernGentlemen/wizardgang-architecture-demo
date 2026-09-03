import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const registry = read('assurance/registry.json');
const errors = [];

const dataset = (registry.datasets ?? []).find((entry) => entry.kind === 'advisories');
if (!dataset) errors.push('assurance/registry.json: missing advisories dataset');
if (dataset?.path !== 'assurance/advisories/advisories.json') errors.push('advisories: canonical path must be assurance/advisories/advisories.json');
if (dataset?.schema !== 'contracts/assurance/advisory.schema.json') errors.push('advisories: schema must be contracts/assurance/advisory.schema.json');

const advisories = read(dataset?.path ?? 'assurance/advisories/advisories.json');
if (advisories.schemaVersion !== registry.schemaVersion) errors.push('advisories: schemaVersion must match the registry');

for (const record of advisories.records ?? []) {
  for (const release of record.fixedReleases) {
    if (!fs.existsSync(path.join(root, `docs/releases/${release}.md`))) {
      errors.push(`${record.id}: fixed release ${release} has no controlled release record`);
    }
  }
}

if (errors.length) {
  console.error('Public advisory validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public advisory validation passed: ${(advisories.records ?? []).length} published advisories with controlled fixed-release records.`);
