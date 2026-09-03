import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  ASSURANCE_REGISTRY_PATH,
  canonicalAssuranceDatasetPaths,
  loadAssuranceRegistry,
} from './lib/assurance-registry.mjs';

const root = process.cwd();
const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  if (index < 0 || index === args.length - 1) return undefined;
  return args[index + 1];
}

const tag = option('--tag');
const commit = option('--commit');
const generatedAt = option('--generated-at');
const output = option('--output');
const errors = [];

if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) errors.push('--tag must be an exact semantic version tag such as v0.15.0');
if (!commit || !/^[0-9a-f]{40}$/.test(commit)) errors.push('--commit must be the exact 40-character lowercase Git commit SHA');
if (!generatedAt || Number.isNaN(Date.parse(generatedAt))) errors.push('--generated-at must be a valid ISO date-time');

function countComplianceRecords(data) {
  let total = 0;
  const sections = [data.clauses, ...Object.values(data.annexA ?? {})];
  for (const section of sections) {
    if (!section || typeof section !== 'object') continue;
    for (const records of Object.values(section)) {
      if (Array.isArray(records)) total += records.length;
    }
  }
  return total;
}

function countRecords(data) {
  if (Array.isArray(data.records)) return data.records.length;
  if (Array.isArray(data.criteria)) return data.criteria.length;
  if (data.clauses && data.annexA) return countComplianceRecords(data);
  return 0;
}

if (errors.length === 0) {
  const registry = loadAssuranceRegistry(root);
  const files = [ASSURANCE_REGISTRY_PATH, ...canonicalAssuranceDatasetPaths(registry)].sort();
  const digest = crypto.createHash('sha256');
  const byPath = {};
  let total = 0;

  for (const relative of files) {
    const raw = fs.readFileSync(path.join(root, relative));
    digest.update(relative, 'utf8');
    digest.update(Buffer.from([0]));
    digest.update(raw);
    digest.update(Buffer.from([0]));

    const data = JSON.parse(raw.toString('utf8'));
    const count = countRecords(data);
    if (count > 0) {
      byPath[relative] = count;
      total += count;
    }
  }

  const snapshot = {
    schemaVersion: 1,
    registryId: registry.id,
    tag,
    commit,
    generatedAt,
    recordCounts: {
      total,
      byPath,
    },
    contentDigest: {
      algorithm: 'sha256',
      scope: 'Sorted assurance/registry.json plus registry-declared canonical dataset paths; path + NUL + exact file bytes + NUL',
      fileCount: files.length,
      value: digest.digest('hex'),
    },
  };

  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (output) {
    const absoluteOutput = path.resolve(root, output);
    fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
    fs.writeFileSync(absoluteOutput, serialized);
    console.log(`Wrote release-bound assurance snapshot to ${path.relative(root, absoluteOutput)}`);
  } else {
    process.stdout.write(serialized);
  }
}

if (errors.length) {
  console.error('Assurance snapshot generation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
