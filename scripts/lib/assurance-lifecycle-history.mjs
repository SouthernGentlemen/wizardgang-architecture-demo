import path from 'node:path';
import {
  ASSURANCE_REGISTRY_PATH,
  assuranceRecordIdentity,
  assuranceRecordResources,
  assuranceRecordsFromDocument,
  flattenAssuranceRegistry,
} from './assurance-registry.mjs';

const LEGACY_V014_REGISTRY_ID = 'wizardgang-public-assurance';
const LEGACY_V014_DATASETS = new Map([
  ['evidence', 'assurance/evidence/evidence.json'],
  ['claims', 'assurance/claims/claims.json'],
  ['compliance', 'assurance/compliance/iso-27001-2022.json'],
  ['risks', 'assurance/risks/risks.json'],
  ['incidents', 'assurance/incidents/incidents.json'],
  ['exercises', 'assurance/incidents/exercises.json'],
  ['advisories', 'assurance/advisories/advisories.json'],
]);
const LEGACY_V014_RECORD_COLLECTIONS = {
  evidence: { path: 'records', identity: ['kind', 'locator.repositoryPath', 'locator.route'] },
  claims: { path: 'records', identity: ['area', 'title'] },
  risks: { path: 'records', identity: ['framework', 'title'] },
  incidents: { path: 'records', identity: ['recordType', 'detectedAt', 'title'] },
  exercises: { path: 'records', identity: ['recordType', 'exerciseType', 'scenario'] },
  advisories: { path: 'records', identity: ['recordType', 'publishedAt'] },
};

function message(error) {
  return error instanceof Error ? error.message : String(error);
}

function readRequired(read, relative, label, description = 'registered assurance resource') {
  try {
    return read(relative);
  } catch (error) {
    throw new Error(`${label}: unable to read ${description} ${relative}: ${message(error)}`);
  }
}

function createSnapshot(registry) {
  return { registry, records: new Map(), documents: new Map() };
}

function addRecord(snapshot, resource, record, sourcePath, label) {
  const id = record?.id;
  if (!id || typeof id !== 'string') return;
  if (snapshot.records.has(id)) throw new Error(`${label}: duplicate public ID ${id} discovered in ${sourcePath}`);

  let identity;
  try {
    identity = assuranceRecordIdentity(resource, record);
  } catch (error) {
    throw new Error(`${label}: unable to derive identity for ${id} from ${sourcePath}: ${message(error)}`);
  }
  snapshot.records.set(id, { id, domain: resource.kind, identity, sourcePath });
}

function loadDocument(snapshot, read, relative, label, description) {
  if (snapshot.documents.has(relative)) return snapshot.documents.get(relative);
  const document = readRequired(read, relative, label, description);
  snapshot.documents.set(relative, document);
  return document;
}

function collectModernSnapshot(registry, read, label) {
  const snapshot = createSnapshot(registry);
  for (const resource of assuranceRecordResources(registry)) {
    const document = loadDocument(snapshot, read, resource.path, label);
    let records;
    try {
      records = assuranceRecordsFromDocument(resource, document);
    } catch (error) {
      throw new Error(`${label}: unable to decode registered record collection ${resource.path}: ${message(error)}`);
    }
    for (const record of records) addRecord(snapshot, resource, record, resource.path, label);
  }
  return snapshot;
}

function legacyResource(dataset) {
  const collection = LEGACY_V014_RECORD_COLLECTIONS[dataset.kind];
  if (!collection) return null;
  return {
    id: `legacy-v0.14.0.${dataset.kind}`,
    kind: dataset.kind,
    capabilities: ['records'],
    recordCollection: collection,
  };
}

function legacyComplianceResource() {
  return {
    id: 'legacy-v0.14.0.compliance',
    kind: 'compliance',
    capabilities: ['records'],
    recordCollection: { path: 'records', identity: ['framework', 'reference'] },
  };
}

function decodeLegacyIso(document, sourcePath, label) {
  if (!document?.clauses || !document?.annexA) {
    throw new Error(`${label}: ${sourcePath} is not a supported v0.14.0 ISO assurance document`);
  }
  const standard = String(document.standard ?? '');
  const is27001 = standard.includes('27001');
  const is42001 = standard.includes('42001');
  const prefix = is27001 ? 'ISO27001' : is42001 ? 'ISO42001' : null;
  const framework = is27001 ? 'iso-27001' : is42001 ? 'iso-42001' : null;
  if (!prefix || !framework) {
    throw new Error(`${label}: ${sourcePath} has an unsupported v0.14.0 ISO standard ${standard || '<missing>'}`);
  }

  const records = [];
  const sections = [document.clauses, ...Object.values(document.annexA ?? {})];
  for (const groups of sections) {
    for (const rows of Object.values(groups ?? {})) {
      if (!Array.isArray(rows)) throw new Error(`${label}: ${sourcePath} contains an incomplete v0.14.0 ISO record group`);
      for (const record of rows) {
        if (!record?.reference) throw new Error(`${label}: ${sourcePath} contains a v0.14.0 ISO record without reference`);
        records.push({ id: `${prefix}-${record.reference}`, framework, reference: record.reference });
      }
    }
  }
  return records;
}

function isLegacyV014Registry(registry) {
  if (registry?.schemaVersion !== 1 || registry?.id !== LEGACY_V014_REGISTRY_ID) return false;
  if (!Array.isArray(registry.datasets) || registry.datasets.length !== LEGACY_V014_DATASETS.size) return false;
  if (registry.lifecycle || registry.presentations || registry.operations) return false;

  const seen = new Set();
  for (const dataset of registry.datasets) {
    if (dataset?.capabilities !== undefined || dataset?.recordCollection !== undefined || dataset?.resources !== undefined) return false;
    if (LEGACY_V014_DATASETS.get(dataset?.kind) !== dataset?.path || seen.has(dataset.kind)) return false;
    seen.add(dataset.kind);
  }
  return seen.size === LEGACY_V014_DATASETS.size;
}

function collectLegacyV014Snapshot(registry, read, label) {
  const snapshot = createSnapshot(registry);
  const compliance = legacyComplianceResource();

  for (const dataset of registry.datasets) {
    const document = loadDocument(snapshot, read, dataset.path, label);
    if (dataset.kind === 'compliance') {
      for (const record of decodeLegacyIso(document, dataset.path, label)) addRecord(snapshot, compliance, record, dataset.path, label);
      continue;
    }

    const resource = legacyResource(dataset);
    if (!resource) throw new Error(`${label}: unsupported v0.14.0 record dataset kind ${dataset.kind}`);
    let records;
    try {
      records = assuranceRecordsFromDocument(resource, document);
    } catch (error) {
      throw new Error(`${label}: unable to decode v0.14.0 record collection ${dataset.path}: ${message(error)}`);
    }
    for (const record of records) addRecord(snapshot, resource, record, dataset.path, label);
  }

  const complianceDataset = registry.datasets.find((dataset) => dataset.kind === 'compliance');
  const complianceDirectory = path.posix.dirname(complianceDataset.path);
  const iso42001Path = path.posix.join(complianceDirectory, 'iso-42001-2023.json');
  const iso42001 = loadDocument(snapshot, read, iso42001Path, label, 'v0.14.0 published compliance resource');
  for (const record of decodeLegacyIso(iso42001, iso42001Path, label)) addRecord(snapshot, compliance, record, iso42001Path, label);

  const wcagManifestPath = path.posix.join(complianceDirectory, 'wcag-2.2.json');
  const wcagManifest = loadDocument(snapshot, read, wcagManifestPath, label, 'v0.14.0 published compliance manifest');
  if (!Array.isArray(wcagManifest?.partitions)) {
    throw new Error(`${label}: ${wcagManifestPath} is missing the v0.14.0 WCAG partition manifest`);
  }
  for (const partition of wcagManifest.partitions) {
    if (!partition?.path || typeof partition.path !== 'string') {
      throw new Error(`${label}: ${wcagManifestPath} contains a WCAG partition without a path`);
    }
    const document = loadDocument(snapshot, read, partition.path, label, 'v0.14.0 published WCAG partition');
    if (!Array.isArray(document?.criteria)) {
      throw new Error(`${label}: ${partition.path} is missing the v0.14.0 WCAG criteria collection`);
    }
    for (const record of document.criteria) {
      if (!record?.criterionId) throw new Error(`${label}: ${partition.path} contains a v0.14.0 WCAG record without criterionId`);
      addRecord(snapshot, compliance, {
        id: `WCAG-${record.criterionId}`,
        framework: 'wcag-2.2',
        reference: record.criterionId,
      }, partition.path, label);
    }
  }

  return snapshot;
}

function registryUsesModernRecordContract(registry) {
  return flattenAssuranceRegistry(registry).some((resource) =>
    resource?.recordCollection !== undefined
    || (Array.isArray(resource?.capabilities) && resource.capabilities.includes('records')));
}

export function collectRegistryAssuranceSnapshot(registry, read, label = 'assurance snapshot') {
  return collectModernSnapshot(registry, read, label);
}

export function collectHistoricalAssuranceSnapshot(read, label = 'historical assurance snapshot') {
  const registry = readRequired(read, ASSURANCE_REGISTRY_PATH, label, 'assurance registry');
  if (registryUsesModernRecordContract(registry)) return collectModernSnapshot(registry, read, label);
  if (isLegacyV014Registry(registry)) return collectLegacyV014Snapshot(registry, read, label);
  throw new Error(`${label}: unsupported historical assurance registry format; refusing incomplete identity discovery`);
}

export function readSnapshotLifecycle(snapshot, read, label = 'historical assurance snapshot') {
  const matches = flattenAssuranceRegistry(snapshot.registry)
    .filter((resource) => resource?.capabilities?.includes('lifecycle'));
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error(`${label}: expected at most one registered lifecycle resource; found ${matches.length}`);
  }
  return readRequired(read, matches[0].path, label, 'registered lifecycle resource');
}
