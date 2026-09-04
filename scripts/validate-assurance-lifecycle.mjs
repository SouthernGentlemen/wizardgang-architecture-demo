import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ASSURANCE_REGISTRY_PATH,
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
  requireRegistryResource,
} from './lib/assurance-registry.mjs';
import {
  collectRegistryAssuranceSnapshot,
  readSnapshotLifecycle,
} from './lib/assurance-lifecycle-history.mjs';
import {
  gitBlobShaForFile,
  LIFECYCLE_BASELINE_MEMBERSHIP_BLOB,
  LIFECYCLE_BASELINE_MEMBERSHIP_PATH,
  LIFECYCLE_HISTORICAL_COMMIT,
  verifyLifecycleBaselineMembership,
} from './generate-assurance-runtime-binding.mjs';

const root = process.cwd();
const errors = [];
const allowedLifecycles = new Set(['Draft', 'Approved', 'Published', 'Superseded', 'Withdrawn']);
const lockedIdentityLifecycles = new Set(['Approved', 'Published', 'Superseded', 'Withdrawn']);
const publicReviewStatus = 'Reviewed';
const requiredMigrationCommit = '6f8383cd6a318e0fe03506bc96401f5161c6e222';
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
    try {
      return JSON.parse(result.stdout);
    } catch (error) {
      throw new Error(`unable to decode ${relative} from ${ref}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

function currentReader(relative) {
  return readJsonFromDirectory(root, relative);
}

function determinePreviousRef() {
  if (process.env.ASSURANCE_PREVIOUS_REF) return process.env.ASSURANCE_PREVIOUS_REF;

  const status = git(['status', '--porcelain', '--', 'assurance', 'contracts/assurance', 'scripts', 'src/assurance']);
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

function emptySnapshot(registry = null) {
  return { registry, records: new Map(), documents: new Map() };
}

const registry = loadAssuranceRegistry(root);
const resourcesById = new Map(flattenAssuranceRegistry(registry).map((resource) => [resource.id, resource]));
const lifecycleResource = requireRegistryResource(
  registry,
  (resource) => resource.capabilities?.includes('lifecycle'),
  'lifecycle dataset',
);
const lifecyclePath = lifecycleResource.path;
const lifecycleSchemaPath = lifecycleResource.schema;

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

function validateReviewEvent(review, label) {
  if (!review?.id || typeof review.id !== 'string') errors.push(`${label}: review event requires id`);
  if (!['Reviewed', 'Pending'].includes(review?.status)) errors.push(`${label}: review event has unsupported status ${String(review?.status)}`);
  if (!review?.reviewedAt || Number.isNaN(Date.parse(review.reviewedAt))) errors.push(`${label}: review event requires reviewedAt date-time`);
  if (!review?.reviewer || String(review.reviewer).trim().length < 3) errors.push(`${label}: review event requires reviewer`);
  if (!review?.basis || String(review.basis).trim().length < 10) errors.push(`${label}: review event requires a meaningful basis`);
}

const reviewEvents = new Map();
function reviewedEvent(reviewRef, label) {
  const review = reviewEvents.get(reviewRef);
  if (!review) {
    errors.push(`${label}: unknown disclosure review reference ${String(reviewRef)}`);
    return null;
  }
  if (review.status !== publicReviewStatus) {
    errors.push(`${label}: disclosure review ${reviewRef} must be Reviewed before public publication`);
  }
  return review;
}

function validateLifecycleEntry(entry, label, retired = false) {
  if (!entry?.id || typeof entry.id !== 'string') errors.push(`${label}: lifecycle entry requires id`);
  if (!allowedLifecycles.has(entry?.lifecycle)) errors.push(`${label}: unsupported lifecycle ${entry?.lifecycle}`);
  reviewedEvent(entry?.reviewRef, label);

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
if (lifecycle.schemaVersion !== 2) errors.push(`${lifecyclePath}: schemaVersion must be 2`);
if (lifecycle.baseline?.historicalCommit !== LIFECYCLE_HISTORICAL_COMMIT) errors.push(`${lifecyclePath}: baseline historicalCommit must remain pinned to ${LIFECYCLE_HISTORICAL_COMMIT}`);
if (lifecycle.baseline?.migrationCommit !== requiredMigrationCommit) errors.push(`${lifecyclePath}: baseline migrationCommit must remain pinned to ${requiredMigrationCommit}`);
if (lifecycle.baseline?.membership?.path !== LIFECYCLE_BASELINE_MEMBERSHIP_PATH) errors.push(`${lifecyclePath}: baseline membership path must remain ${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}`);
if (lifecycle.baseline?.membership?.blob !== LIFECYCLE_BASELINE_MEMBERSHIP_BLOB) errors.push(`${lifecyclePath}: baseline membership blob must remain ${LIFECYCLE_BASELINE_MEMBERSHIP_BLOB}`);
if (lifecycle.baseline?.lifecycle !== 'Published') errors.push(`${lifecyclePath}: baseline lifecycle must be Published`);

for (const review of lifecycle.reviewEvents ?? []) {
  validateReviewEvent(review, `${lifecyclePath}: review ${review?.id ?? 'unknown'}`);
  if (reviewEvents.has(review?.id)) errors.push(`${lifecyclePath}: duplicate review event ${review?.id}`);
  else if (review?.id) reviewEvents.set(review.id, review);
}
reviewedEvent(lifecycle.baseline?.reviewRef, `${lifecyclePath}: baseline`);

let baselineMembership = { schemaVersion: 1, commit: LIFECYCLE_HISTORICAL_COMMIT, recordIds: [] };
try {
  baselineMembership = verifyLifecycleBaselineMembership(registry, root);
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}
const baselineIds = new Set(baselineMembership.recordIds ?? []);

const sourceApprovals = new Map();
const sourceApprovalKeys = new Map();
for (const approval of lifecycle.sourceApprovals ?? []) {
  const label = `${lifecyclePath}: source approval ${approval?.id ?? 'unknown'}`;
  if (!approval?.id || typeof approval.id !== 'string') errors.push(`${label}: source approval requires id`);
  if (!approval?.resource || typeof approval.resource !== 'string') errors.push(`${label}: source approval requires resource`);
  if (!/^[0-9a-f]{40}$/.test(approval?.revision ?? '')) errors.push(`${label}: source approval revision must be a 40-character Git blob SHA`);
  if (sourceApprovals.has(approval?.id)) errors.push(`${lifecyclePath}: duplicate source approval ${approval?.id}`);
  else if (approval?.id) sourceApprovals.set(approval.id, approval);
  const resource = resourcesById.get(approval?.resource);
  if (!resource || !resource.capabilities?.includes('runtime')) errors.push(`${label}: source approval references non-runtime resource ${String(approval?.resource)}`);
  reviewedEvent(approval?.reviewRef, label);
  const key = `${approval?.resource}\0${approval?.revision}`;
  if (sourceApprovalKeys.has(key)) errors.push(`${label}: duplicate approval for resource revision ${approval?.resource}@${approval?.revision}`);
  else sourceApprovalKeys.set(key, approval);
}

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

let current = emptySnapshot(registry);
try {
  current = collectRegistryAssuranceSnapshot(registry, currentReader, 'current assurance snapshot');
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}
for (const [relative, document] of current.documents) scanSensitive(relative, document);

let migration = null;
try {
  const migrationReader = directoryReaderFromEnv('ASSURANCE_MIGRATION_DIR') ?? createGitReader(lifecycle.baseline?.migrationCommit);
  const migrationRegistry = migrationReader(ASSURANCE_REGISTRY_PATH);
  migration = collectRegistryAssuranceSnapshot(migrationRegistry, migrationReader, 'normalized lifecycle migration bridge');
} catch (error) {
  errors.push(`${lifecyclePath}: unable to load normalized migration bridge: ${error instanceof Error ? error.message : String(error)}`);
}

if (migration) {
  for (const id of baselineIds) {
    if (!migration.records.has(id)) errors.push(`${id}: frozen historical membership is missing from normalized migration bridge ${requiredMigrationCommit}`);
  }
}

let previous = null;
let previousLifecycle = null;
const previousDirectoryReader = directoryReaderFromEnv('ASSURANCE_PREVIOUS_DIR');
try {
  if (previousDirectoryReader) {
    const previousRegistry = previousDirectoryReader(ASSURANCE_REGISTRY_PATH);
    previous = collectRegistryAssuranceSnapshot(previousRegistry, previousDirectoryReader, 'previous assurance snapshot');
    previousLifecycle = readSnapshotLifecycle(previous, previousDirectoryReader, 'previous assurance snapshot');
  } else {
    const previousRef = determinePreviousRef();
    if (previousRef) {
      const reader = createGitReader(previousRef);
      const previousRegistry = reader(ASSURANCE_REGISTRY_PATH);
      previous = collectRegistryAssuranceSnapshot(previousRegistry, reader, `previous assurance snapshot ${previousRef}`);
      previousLifecycle = readSnapshotLifecycle(previous, reader, `previous assurance snapshot ${previousRef}`);
    }
  }
} catch (error) {
  errors.push(`${lifecyclePath}: unable to load previous current-contract snapshot: ${error instanceof Error ? error.message : String(error)}`);
}

function effectiveMetadata(id, metadata = recordsMetadata, retired = retiredMetadata, lifecycleData = lifecycle) {
  if (metadata.has(id)) return metadata.get(id);
  if (retired.has(id)) return retired.get(id);
  if (!baselineIds.has(id)) return null;
  return {
    id,
    lifecycle: lifecycleData?.baseline?.lifecycle ?? 'Published',
    reviewRef: lifecycleData?.baseline?.reviewRef,
  };
}

const sourceRevisionCache = new Map();
function sourceRevision(record) {
  if (!sourceRevisionCache.has(record.sourcePath)) {
    sourceRevisionCache.set(record.sourcePath, gitBlobShaForFile(root, record.sourcePath));
  }
  return sourceRevisionCache.get(record.sourcePath);
}

for (const [id, record] of current.records) {
  if (retiredMetadata.has(id)) errors.push(`${id}: retired stable ID cannot be reused by a current assurance record`);
  if (!baselineIds.has(id) && !recordsMetadata.has(id)) errors.push(`${id}: new public assurance record requires explicit lifecycle and disclosure-review metadata`);
  const metadata = effectiveMetadata(id);
  if (!metadata) errors.push(`${id}: lifecycle metadata is unresolved`);
  else reviewedEvent(metadata.reviewRef, id);

  const revision = sourceRevision(record);
  const approval = sourceApprovalKeys.get(`${record.resourceId}\0${revision}`);
  if (!approval) {
    errors.push(`${id}: current source ${record.resourceId}@${revision} has no disclosure approval for this exact content revision`);
  } else {
    reviewedEvent(approval.reviewRef, `${id}: source approval ${approval.id}`);
  }
}

for (const [id] of recordsMetadata) {
  if (!current.records.has(id)) errors.push(`${id}: lifecycle metadata references a missing current record; move the ID to retiredRecords instead of deleting it silently`);
}

for (const id of baselineIds) {
  if (!current.records.has(id) && !retiredMetadata.has(id)) {
    errors.push(`${id}: silent deletion from the frozen published lifecycle baseline is forbidden; retain a Superseded or Withdrawn tombstone`);
  }
}

if (previous) {
  for (const [id] of previous.records) {
    if (!current.records.has(id) && !retiredMetadata.has(id)) {
      errors.push(`${id}: silent deletion from the previous assurance snapshot is forbidden; retain a Superseded or Withdrawn tombstone`);
    }
  }
}

function lifecycleMetadataMaps(data) {
  return {
    currentMap: new Map((data?.records ?? []).map((entry) => [entry.id, entry])),
    retiredMap: new Map((data?.retiredRecords ?? []).map((entry) => [entry.id, entry])),
  };
}

const previousMaps = lifecycleMetadataMaps(previousLifecycle);
if (previousLifecycle?.schemaVersion === 2) {
  for (const [id] of previousMaps.currentMap) {
    if (!recordsMetadata.has(id) && !retiredMetadata.has(id)) errors.push(`${id}: lifecycle reservation cannot be deleted from history`);
  }
  for (const [id] of previousMaps.retiredMap) {
    if (!retiredMetadata.has(id)) errors.push(`${id}: retired stable ID reservation cannot be deleted from history`);
  }
  for (const review of previousLifecycle.reviewEvents ?? []) {
    if (!reviewEvents.has(review.id)) errors.push(`${review.id}: disclosure review event cannot be deleted from history`);
  }
  for (const approval of previousLifecycle.sourceApprovals ?? []) {
    if (!sourceApprovals.has(approval.id)) errors.push(`${approval.id}: source approval cannot be deleted from history`);
  }
}

function immutableIdentityError(id, label) {
  errors.push(`${id}: immutable public ID identity changed from ${label}; supersede with a new ID instead of reusing the existing ID`);
}

if (migration) {
  for (const id of baselineIds) {
    const migratedRecord = migration.records.get(id);
    const currentRecord = current.records.get(id);
    if (migratedRecord && currentRecord && migratedRecord.identity !== currentRecord.identity) {
      immutableIdentityError(id, 'the verified normalized migration bridge');
    }
  }
}

if (previous) {
  const previousEffective = (id) => {
    if (previousLifecycle?.schemaVersion === 2) {
      return previousMaps.currentMap.get(id)
        ?? previousMaps.retiredMap.get(id)
        ?? (baselineIds.has(id) ? {
          id,
          lifecycle: previousLifecycle?.baseline?.lifecycle ?? 'Published',
          reviewRef: previousLifecycle?.baseline?.reviewRef,
        } : null);
    }
    return effectiveMetadata(id);
  };

  for (const [id, previousRecord] of previous.records) {
    const currentRecord = current.records.get(id);
    if (!currentRecord) continue;
    const metadata = previousEffective(id);
    if (!metadata) {
      errors.push(`${id}: previous assurance snapshot has no lifecycle reservation; historical identity cannot be validated safely`);
      continue;
    }
    if (lockedIdentityLifecycles.has(metadata.lifecycle) && previousRecord.identity !== currentRecord.identity) {
      immutableIdentityError(id, 'the previous assurance snapshot');
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

console.log(`Assurance lifecycle validation passed: ${current.records.size} current IDs, ${baselineIds.size} frozen historical IDs verified through the normalized migration bridge, ${recordsMetadata.size} explicit lifecycle records, ${retiredMetadata.size} retired IDs, and ${sourceApprovals.size} revision-bound source approvals.`);
