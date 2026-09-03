import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
  requireRegistryResource,
} from './lib/assurance-registry.mjs';

const root = process.cwd();
const errors = [];
const allowedLifecycles = new Set(['Draft', 'Approved', 'Published', 'Superseded', 'Withdrawn']);
const lockedIdentityLifecycles = new Set(['Approved', 'Published', 'Superseded', 'Withdrawn']);
const publicReviewStatus = 'Reviewed';
const requiredBaselineCommit = 'c2359f00fc3bac80bfbc2e82369a86f20e522f74';
const sensitiveKeys = new Set([
  'acceptanceauthority',
  'acceptancerationale',
  'accountmetadata',
  'authorization',
  'authorizationheader',
  'cookie',
  'cookies',
  'credential',
  'credentials',
  'exploitdetail',
  'exploitdetails',
  'infrastructuredetail',
  'infrastructuredetails',
  'password',
  'paymentdata',
  'privatenote',
  'privatenotes',
  'privatetreatment',
  'privatetreatmentdetail',
  'reporteridentity',
  'requestbody',
  'secret',
  'secrets',
  'token',
  'tokens',
  'treatmentactions',
  'triagenote',
  'triagenotes',
  'unreleasedvulnerabilitydetail',
  'unreleasedvulnerabilitydetails',
]);

function readJsonFromDirectory(directory, relative) {
  return JSON.parse(fs.readFileSync(path.join(directory, relative), 'utf8'));
}

function git(args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8' });
}

function gitRefExists(ref) {
  const result = git(['rev-parse', '--verify', ref]);
  return result.status === 0;
}

function createGitReader(ref) {
  return (relative) => {
    const result = git(['show', `${ref}:${relative}`]);
    if (result.status !== 0) {
      throw new Error(`unable to read ${relative} from ${ref}: ${result.stderr.trim() || result.stdout.trim()}`);
    }
    return JSON.parse(result.stdout);
  };
}

function currentReader(relative) {
  return readJsonFromDirectory(root, relative);
}

function determinePreviousRef() {
  if (process.env.ASSURANCE_PREVIOUS_REF) return process.env.ASSURANCE_PREVIOUS_REF;

  const status = git(['status', '--porcelain', '--', 'assurance', 'contracts/assurance', 'scripts']);
  if (status.status === 0 && status.stdout.trim()) return 'HEAD';

  const head = git(['rev-parse', 'HEAD']);
  const originMain = git(['rev-parse', '--verify', 'origin/main']);
  if (head.status === 0 && originMain.status === 0 && head.stdout.trim() !== originMain.stdout.trim()) {
    const base = git(['merge-base', 'HEAD', 'origin/main']);
    if (base.status === 0 && base.stdout.trim()) return base.stdout.trim();
  }

  return gitRefExists('HEAD^1') ? 'HEAD^1' : null;
}

function directoryReaderFromEnv(name) {
  const directory = process.env[name];
  return directory ? (relative) => readJsonFromDirectory(directory, relative) : null;
}

function normalizeKey(key) {
  return String(key).replaceAll('-', '').replaceAll('_', '').toLowerCase();
}

function normalizeHistoricalClaimReference(reference) {
  if (typeof reference !== 'string') return '';
  if (reference.startsWith('ISO27001:')) return reference.replace('ISO27001:', 'ISO27001-');
  if (reference.startsWith('ISO42001:')) return reference.replace('ISO42001:', 'ISO42001-');
  if (reference === 'WCAG22:feedback-support') return 'wcag-2.2';
  return reference;
}

const registry = loadAssuranceRegistry(root);
const registryResources = flattenAssuranceRegistry(registry);
const lifecycleResource = requireRegistryResource(
  registry,
  (resource) => resource.capabilities?.includes('lifecycle'),
  'lifecycle dataset',
);
const lifecyclePath = lifecycleResource.path;
const lifecycleSchemaPath = lifecycleResource.schema;

function collectSnapshot(read, { allowMissing = false } = {}) {
  const records = new Map();
  const documents = new Map();

  function load(relative) {
    if (documents.has(relative)) return documents.get(relative);
    try {
      const document = read(relative);
      documents.set(relative, document);
      return document;
    } catch (error) {
      if (allowMissing) return null;
      throw error;
    }
  }

  function add(id, domain, identity, sourcePath) {
    if (!id || typeof id !== 'string') return;
    if (records.has(id)) {
      errors.push(`lifecycle snapshot contains duplicate public ID ${id}`);
      return;
    }
    records.set(id, { id, domain, identity, sourcePath });
  }

  function primary(kind) {
    return registry.datasets.find((dataset) => dataset.kind === kind && dataset.capabilities?.includes('api-index'));
  }

  const evidenceResource = primary('evidence');
  const evidence = evidenceResource ? load(evidenceResource.path) : null;
  for (const record of evidence?.records ?? []) {
    const locator = record.locator?.repositoryPath ?? record.locator?.route ?? '';
    add(record.id, 'evidence', `evidence|${record.kind ?? ''}|${locator}`, evidenceResource.path);
  }

  const claimsResource = primary('claims');
  const claims = claimsResource ? load(claimsResource.path) : null;
  for (const record of claims?.records ?? []) {
    const references = [
      ...(record.frameworkReferences ?? []),
      ...(record.relationships?.compliance ?? []),
      ...(record.relationships?.frameworks ?? []),
    ]
      .map(normalizeHistoricalClaimReference)
      .filter(Boolean);
    const canonicalReferences = [...new Set(references)].sort().join(',');
    add(record.id, 'claims', `claim|${record.area ?? ''}|${canonicalReferences}`, claimsResource.path);
  }

  const risksResource = primary('risks');
  const risks = risksResource ? load(risksResource.path) : null;
  for (const record of risks?.records ?? []) {
    add(record.id, 'risks', `risk|${record.framework ?? ''}|${record.title ?? ''}`, risksResource.path);
  }

  const incidentsResource = primary('incidents');
  const incidents = incidentsResource ? load(incidentsResource.path) : null;
  for (const record of incidents?.records ?? []) {
    add(record.id, 'incidents', `incident|${record.recordType ?? ''}|${record.detectedAt ?? ''}|${record.title ?? ''}`, incidentsResource.path);
  }

  const exercisesResource = primary('exercises');
  const exercises = exercisesResource ? load(exercisesResource.path) : null;
  for (const record of exercises?.records ?? []) {
    add(record.id, 'exercises', `exercise|${record.recordType ?? ''}|${record.exerciseType ?? ''}|${record.scenario ?? ''}`, exercisesResource.path);
  }

  const advisoriesResource = primary('advisories');
  const advisories = advisoriesResource ? load(advisoriesResource.path) : null;
  for (const record of advisories?.records ?? []) {
    add(record.id, 'advisories', `advisory|${record.recordType ?? ''}|${record.publishedAt ?? ''}`, advisoriesResource.path);
  }

  for (const resource of registryResources.filter((entry) => entry.kind === 'compliance' && entry.capabilities?.includes('records'))) {
    const data = load(resource.path);
    if (!data) continue;
    if (Array.isArray(data.records)) {
      for (const record of data.records) {
        add(record.id, 'compliance', `compliance|${record.framework ?? data.framework?.id ?? ''}|${record.reference ?? ''}`, resource.path);
      }
      continue;
    }
    if (data.clauses && data.annexA) {
      const is27001 = String(data.standard).includes('27001');
      const is42001 = String(data.standard).includes('42001');
      const prefix = is27001 ? 'ISO27001' : is42001 ? 'ISO42001' : null;
      const framework = is27001 ? 'iso-27001' : is42001 ? 'iso-42001' : null;
      if (!prefix || !framework) continue;
      const sections = [data.clauses, ...Object.values(data.annexA ?? {})];
      for (const groups of sections) {
        for (const rows of Object.values(groups ?? {})) {
          for (const record of rows ?? []) {
            const id = `${prefix}-${record.reference}`;
            add(id, 'compliance', `compliance|${framework}|${record.reference}`, resource.path);
          }
        }
      }
      continue;
    }
    for (const record of data.criteria ?? []) {
      const reference = record.reference ?? record.criterionId;
      const id = record.id ?? (record.criterionId ? `WCAG-${record.criterionId}` : null);
      add(id, 'compliance', `compliance|wcag-2.2|${reference ?? ''}`, resource.path);
    }
  }

  return { records, documents };
}

function scanSensitive(relative, value, pointer = '$') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanSensitive(relative, entry, `${pointer}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (sensitiveKeys.has(normalizeKey(key))) {
      errors.push(`${relative}: sensitive public field ${key} is not disclosure-safe (${pointer}.${key})`);
    }
    scanSensitive(relative, child, `${pointer}.${key}`);
  }
}

function validateDisclosureReview(review, label) {
  if (!review || review.status !== publicReviewStatus) {
    errors.push(`${label}: public assurance record requires disclosureReview.status Reviewed`);
    return;
  }
  if (!review.reviewedAt || Number.isNaN(Date.parse(review.reviewedAt))) errors.push(`${label}: disclosure review requires reviewedAt date-time`);
  if (!review.reviewer || String(review.reviewer).trim().length < 3) errors.push(`${label}: disclosure review requires reviewer`);
  if (!review.basis || String(review.basis).trim().length < 10) errors.push(`${label}: disclosure review requires a meaningful basis`);
}

function validateLifecycleEntry(entry, label, retired = false) {
  if (!entry?.id || typeof entry.id !== 'string') errors.push(`${label}: lifecycle entry requires id`);
  if (!allowedLifecycles.has(entry?.lifecycle)) errors.push(`${label}: unsupported lifecycle ${entry?.lifecycle}`);
  validateDisclosureReview(entry?.disclosureReview, label);

  if (retired && !['Superseded', 'Withdrawn'].includes(entry?.lifecycle)) {
    errors.push(`${label}: retired record lifecycle must be Superseded or Withdrawn`);
  }
  if (entry?.lifecycle === 'Superseded') {
    if (!Array.isArray(entry.supersededBy) || entry.supersededBy.length === 0) errors.push(`${label}: Superseded records require supersededBy`);
  } else if (entry?.supersededBy !== undefined) {
    errors.push(`${label}: supersededBy is only valid for Superseded records`);
  }
  if (entry?.lifecycle === 'Withdrawn') {
    if (!entry.withdrawalRationale || String(entry.withdrawalRationale).trim().length < 10) errors.push(`${label}: Withdrawn records require withdrawalRationale`);
    if (entry.supersedes !== undefined) errors.push(`${label}: Withdrawn records cannot supersede another record`);
  } else if (entry?.withdrawalRationale !== undefined) {
    errors.push(`${label}: withdrawalRationale is only valid for Withdrawn records`);
  }

  for (const field of ['supersedes', 'supersededBy']) {
    if (entry?.[field] !== undefined) {
      if (!Array.isArray(entry[field]) || entry[field].some((id) => typeof id !== 'string' || !id)) errors.push(`${label}: ${field} must contain stable record IDs`);
      if (new Set(entry[field]).size !== entry[field].length) errors.push(`${label}: ${field} contains duplicate IDs`);
      if (entry[field].includes(entry.id)) errors.push(`${label}: ${field} cannot reference the same ID`);
    }
  }
}

if (!fs.existsSync(path.join(root, lifecyclePath))) errors.push(`${lifecyclePath}: lifecycle metadata is missing`);
if (!fs.existsSync(path.join(root, lifecycleSchemaPath))) errors.push(`${lifecycleSchemaPath}: lifecycle schema is missing`);

const lifecycle = fs.existsSync(path.join(root, lifecyclePath)) ? currentReader(lifecyclePath) : { records: [], retiredRecords: [] };
if (lifecycle.schemaVersion !== 1) errors.push(`${lifecyclePath}: schemaVersion must be 1`);
if (!/^[0-9a-f]{40}$/.test(lifecycle.baseline?.commit ?? '')) errors.push(`${lifecyclePath}: baseline.commit must be an immutable 40-character commit SHA`);
if (lifecycle.baseline?.commit !== requiredBaselineCommit) errors.push(`${lifecyclePath}: baseline.commit must remain pinned to ${requiredBaselineCommit}`);
if (lifecycle.baseline?.lifecycle !== 'Published') errors.push(`${lifecyclePath}: baseline lifecycle must be Published`);
validateDisclosureReview(lifecycle.baseline?.disclosureReview, `${lifecyclePath}: baseline`);

const recordsMetadata = new Map();
for (const entry of lifecycle.records ?? []) {
  validateLifecycleEntry(entry, `${lifecyclePath}: ${entry?.id ?? 'unknown record'}`);
  if (recordsMetadata.has(entry.id)) errors.push(`${lifecyclePath}: duplicate lifecycle metadata for ${entry.id}`);
  else recordsMetadata.set(entry.id, entry);
}

const retiredMetadata = new Map();
for (const entry of lifecycle.retiredRecords ?? []) {
  validateLifecycleEntry(entry, `${lifecyclePath}: retired ${entry?.id ?? 'unknown record'}`, true);
  if (retiredMetadata.has(entry.id)) errors.push(`${lifecyclePath}: duplicate retired record ${entry.id}`);
  else retiredMetadata.set(entry.id, entry);
  if (recordsMetadata.has(entry.id)) errors.push(`${lifecyclePath}: ${entry.id} cannot be both current lifecycle metadata and retired`);
}

const current = collectSnapshot(currentReader);
for (const [relative, document] of current.documents) scanSensitive(relative, document);

let baseline = null;
const baselineDirectoryReader = directoryReaderFromEnv('ASSURANCE_BASELINE_DIR');
try {
  baseline = collectSnapshot(baselineDirectoryReader ?? createGitReader(lifecycle.baseline?.commit), { allowMissing: true });
} catch (error) {
  errors.push(`${lifecyclePath}: unable to load lifecycle baseline: ${error.message}`);
}

let previous = null;
let previousLifecycle = null;
const previousDirectoryReader = directoryReaderFromEnv('ASSURANCE_PREVIOUS_DIR');
try {
  if (previousDirectoryReader) {
    previous = collectSnapshot(previousDirectoryReader, { allowMissing: true });
    try { previousLifecycle = previousDirectoryReader(lifecyclePath); } catch { previousLifecycle = null; }
  } else {
    const previousRef = determinePreviousRef();
    if (previousRef) {
      const reader = createGitReader(previousRef);
      previous = collectSnapshot(reader, { allowMissing: true });
      try { previousLifecycle = reader(lifecyclePath); } catch { previousLifecycle = null; }
    }
  }
} catch (error) {
  errors.push(`${lifecyclePath}: unable to load previous assurance snapshot: ${error.message}`);
}

const baselineIds = new Set(baseline ? baseline.records.keys() : []);
function effectiveMetadata(id, metadata = recordsMetadata, retired = retiredMetadata, lifecycleData = lifecycle) {
  return metadata.get(id) ?? retired.get(id) ?? (baselineIds.has(id) ? lifecycleData.baseline : null);
}

for (const [id] of current.records) {
  if (retiredMetadata.has(id)) errors.push(`${id}: retired stable ID cannot be reused by a current assurance record`);
  if (!baselineIds.has(id) && !recordsMetadata.has(id)) errors.push(`${id}: new public assurance record requires explicit lifecycle and disclosure-review metadata`);
  const metadata = effectiveMetadata(id);
  if (!metadata) errors.push(`${id}: lifecycle metadata is unresolved`);
  else validateDisclosureReview(metadata.disclosureReview, id);
}

for (const [id] of recordsMetadata) {
  if (!current.records.has(id)) errors.push(`${id}: lifecycle metadata references a missing current record; move the ID to retiredRecords instead of deleting it silently`);
}

function requireRetirementForMissing(snapshot, label) {
  if (!snapshot) return;
  for (const [id] of snapshot.records) {
    if (!current.records.has(id) && !retiredMetadata.has(id)) {
      errors.push(`${id}: silent deletion from ${label} is forbidden; retain a Superseded or Withdrawn tombstone`);
    }
  }
}
requireRetirementForMissing(baseline, 'the published lifecycle baseline');
requireRetirementForMissing(previous, 'the previous assurance snapshot');

function previousMetadataMaps(data) {
  const currentMap = new Map((data?.records ?? []).map((entry) => [entry.id, entry]));
  const retiredMap = new Map((data?.retiredRecords ?? []).map((entry) => [entry.id, entry]));
  return { currentMap, retiredMap };
}

if (previousLifecycle) {
  const previousMaps = previousMetadataMaps(previousLifecycle);
  for (const [id] of previousMaps.currentMap) {
    if (!recordsMetadata.has(id) && !retiredMetadata.has(id)) errors.push(`${id}: lifecycle reservation cannot be deleted from history`);
  }
  for (const [id] of previousMaps.retiredMap) {
    if (!retiredMetadata.has(id)) errors.push(`${id}: retired stable ID reservation cannot be deleted from history`);
  }
}

if (previous) {
  const previousMaps = previousMetadataMaps(previousLifecycle);
  const previousBaselineIds = baselineIds;
  const previousEffective = (id) => previousMaps.currentMap.get(id)
    ?? previousMaps.retiredMap.get(id)
    ?? (previousBaselineIds.has(id) ? lifecycle.baseline : null);

  for (const [id, previousRecord] of previous.records) {
    const currentRecord = current.records.get(id);
    if (!currentRecord) continue;
    const metadata = previousEffective(id);
    if (metadata && lockedIdentityLifecycles.has(metadata.lifecycle) && previousRecord.identity !== currentRecord.identity) {
      errors.push(`${id}: immutable public ID identity changed; supersede with a new ID instead of reusing the existing ID`);
    }
  }
}

function knownId(id) {
  return current.records.has(id) || retiredMetadata.has(id);
}

for (const entry of [...recordsMetadata.values(), ...retiredMetadata.values()]) {
  for (const supersededId of entry.supersedes ?? []) {
    if (!knownId(supersededId)) {
      errors.push(`${entry.id}: supersedes references unknown record ${supersededId}`);
      continue;
    }
    const target = effectiveMetadata(supersededId);
    if (target?.lifecycle !== 'Superseded') errors.push(`${entry.id}: supersedes target ${supersededId} must be Superseded`);
    if (!target?.supersededBy?.includes(entry.id)) errors.push(`${entry.id}: supersedes relationship to ${supersededId} must be reciprocal via supersededBy`);
  }
  for (const replacementId of entry.supersededBy ?? []) {
    if (!knownId(replacementId)) {
      errors.push(`${entry.id}: supersededBy references unknown record ${replacementId}`);
      continue;
    }
    const replacement = effectiveMetadata(replacementId);
    if (!replacement?.supersedes?.includes(entry.id)) errors.push(`${entry.id}: supersededBy relationship to ${replacementId} must be reciprocal via supersedes`);
  }
}

if (errors.length) {
  console.error('Assurance lifecycle validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance lifecycle validation passed: ${current.records.size} current IDs from registry discovery, ${recordsMetadata.size} explicit lifecycle records, ${retiredMetadata.size} retired IDs.`);
