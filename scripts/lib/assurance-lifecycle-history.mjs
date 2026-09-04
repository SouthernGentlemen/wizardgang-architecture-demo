import {
  assuranceRecordIdentity,
  assuranceRecordResources,
  assuranceRecordsFromDocument,
  flattenAssuranceRegistry,
} from './assurance-registry.mjs';

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
  snapshot.records.set(id, {
    id,
    domain: resource.kind,
    identity,
    sourcePath,
    resourceId: resource.id,
  });
}

function loadDocument(snapshot, read, relative, label, description) {
  if (snapshot.documents.has(relative)) return snapshot.documents.get(relative);
  const document = readRequired(read, relative, label, description);
  snapshot.documents.set(relative, document);
  return document;
}

export function collectRegistryAssuranceSnapshot(registry, read, label = 'assurance snapshot') {
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

export function readSnapshotLifecycle(snapshot, read, label = 'assurance snapshot') {
  const matches = flattenAssuranceRegistry(snapshot.registry)
    .filter((resource) => resource?.capabilities?.includes('lifecycle'));
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error(`${label}: expected at most one registered lifecycle resource; found ${matches.length}`);
  }
  return readRequired(read, matches[0].path, label, 'registered lifecycle resource');
}
