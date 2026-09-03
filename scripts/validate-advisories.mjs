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
const evidence = read('assurance/evidence/evidence.json');
const incidents = read('assurance/incidents/incidents.json');
const evidenceIds = new Set((evidence.records ?? []).map((record) => record.id));
const incidentIds = new Set((incidents.records ?? []).map((record) => record.id));
const advisoryIds = new Set();
const ghsaPattern = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;
const cvePattern = /^CVE-[0-9]{4}-[0-9]{4,}$/;
const releasePattern = /^v[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/;
const severities = new Set(['low', 'moderate', 'high', 'critical']);
const allowedKeys = new Set([
  'id',
  'recordType',
  'title',
  'severity',
  'summary',
  'publishedAt',
  'updatedAt',
  'fixedReleases',
  'cveId',
  'incidentLinks',
  'evidence',
]);

if (advisories.schemaVersion !== registry.schemaVersion) errors.push('advisories: schemaVersion must match the registry');
if (!advisories.qualification || typeof advisories.qualification !== 'string') errors.push('advisories: disclosure qualification is required');
if ('counts' in advisories) errors.push('advisories: counts must be derived, not stored');
if (!Array.isArray(advisories.records)) errors.push('advisories: records must be an array');

for (const record of advisories.records ?? []) {
  if (!ghsaPattern.test(record.id ?? '')) errors.push(`advisories: invalid published GHSA ID ${record.id}`);
  if (advisoryIds.has(record.id)) errors.push(`advisories: duplicate GHSA ID ${record.id}`);
  advisoryIds.add(record.id);

  const extraKeys = Object.keys(record).filter((key) => !allowedKeys.has(key));
  if (extraKeys.length) errors.push(`${record.id}: public advisory contains unsupported/private fields: ${extraKeys.join(', ')}`);
  if (record.recordType !== 'advisory') errors.push(`${record.id}: recordType must be advisory`);
  if (!record.title || typeof record.title !== 'string' || record.title.length > 200) errors.push(`${record.id}: invalid public title`);
  if (!record.summary || typeof record.summary !== 'string') errors.push(`${record.id}: disclosure-safe public summary is required`);
  if (!severities.has(record.severity)) errors.push(`${record.id}: unsupported severity ${record.severity}`);
  if (!record.publishedAt || Number.isNaN(Date.parse(record.publishedAt))) errors.push(`${record.id}: publishedAt must be an ISO date-time`);
  if (record.updatedAt && Number.isNaN(Date.parse(record.updatedAt))) errors.push(`${record.id}: updatedAt must be an ISO date-time`);
  if (record.cveId && !cvePattern.test(record.cveId)) errors.push(`${record.id}: invalid assigned CVE identifier ${record.cveId}`);

  if (!Array.isArray(record.fixedReleases) || record.fixedReleases.length === 0) {
    errors.push(`${record.id}: at least one released fix is required before public advisory projection`);
  }
  if (new Set(record.fixedReleases ?? []).size !== record.fixedReleases?.length) errors.push(`${record.id}: duplicate fixed release`);
  for (const release of record.fixedReleases ?? []) {
    if (!releasePattern.test(release)) {
      errors.push(`${record.id}: invalid fixed release tag ${release}`);
      continue;
    }
    if (!fs.existsSync(path.join(root, `docs/releases/${release}.md`))) {
      errors.push(`${record.id}: fixed release ${release} has no controlled release record`);
    }
  }

  if (!Array.isArray(record.incidentLinks)) errors.push(`${record.id}: incidentLinks must be an array`);
  if (new Set(record.incidentLinks ?? []).size !== record.incidentLinks?.length) errors.push(`${record.id}: duplicate incident link`);
  for (const incidentId of record.incidentLinks ?? []) {
    if (!incidentIds.has(incidentId)) errors.push(`${record.id}: incident link ${incidentId} is not an established actual incident record`);
  }

  if (!Array.isArray(record.evidence) || record.evidence.length === 0) errors.push(`${record.id}: public evidence is required`);
  if (new Set(record.evidence ?? []).size !== record.evidence?.length) errors.push(`${record.id}: duplicate evidence link`);
  for (const evidenceId of record.evidence ?? []) {
    if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved public evidence ${evidenceId}`);
  }
}

if (errors.length) {
  console.error('Public advisory validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public advisory validation passed: ${advisoryIds.size} published advisories.`);
