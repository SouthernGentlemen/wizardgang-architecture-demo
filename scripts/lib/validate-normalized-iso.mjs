import {
  loadAssuranceRecordInventory,
  loadAssuranceRegistry,
  readJsonFile,
  requireRegistryResource,
} from './assurance-registry.mjs';

const ISO_POSTURE_STATUSES = ['met', 'partial', 'gap', 'not-applicable'];

function validApprovalProvenance(approval) {
  return Number.isInteger(approval?.pullRequest)
    && approval.pullRequest > 0
    && /^[0-9a-f]{40}$/.test(approval?.mergeCommit ?? '');
}

function deriveIsoPosture(controls) {
  const counts = Object.fromEntries(ISO_POSTURE_STATUSES.map((status) => [status, 0]));
  for (const record of controls) {
    if (record.status in counts) counts[record.status] += 1;
  }
  return counts;
}

export function validateNormalizedIso({ root = process.cwd(), standard, edition, framework, idPrefix, sourceSoaId, expectedClauseRefs, expectedAnnexRefs, extraValidate }) {
  const errors = [];
  const registry = loadAssuranceRegistry(root);
  const inventory = loadAssuranceRecordInventory(root, registry);
  const resource = requireRegistryResource(
    registry,
    (entry) => entry.kind === 'compliance'
      && entry.capabilities?.includes('records')
      && entry.framework?.id === framework,
    `${framework} compliance record resource`,
  );
  const dataPath = resource.path;
  const schemaPath = resource.schema;
  const compliance = inventory.documentForResource(resource);
  const schema = readJsonFile(root, schemaPath);
  const governance = readJsonFile(root, 'docs/governance/REFERENCE-REGISTRY.json');
  const metadata = resource.framework;
  const evidenceIds = inventory.idsForKind('evidence');
  const governanceIds = new Set((governance.records ?? []).map((record) => record.reference));
  const records = compliance.records ?? [];
  const clauses = records.filter((record) => record.kind === 'clause');
  const controls = records.filter((record) => record.kind === 'control');

  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${schemaPath}: expected JSON Schema draft 2020-12`);
  if (compliance.schemaVersion !== 1) errors.push(`${dataPath}: schemaVersion must be 1`);
  if (!metadata || metadata.id !== framework || metadata.label !== standard || metadata.edition !== edition) errors.push(`${dataPath}: framework identity must be owned by its registered resource`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata?.assessmentDate ?? '')) errors.push(`${dataPath}: registered framework assessmentDate must be an ISO date`);
  if (!String(metadata?.qualification ?? '').toLowerCase().includes('not claimed')) errors.push(`${dataPath}: registered framework qualification must avoid certification/conformance claims`);
  if (compliance.visibility !== 'public') errors.push(`${dataPath}: visibility must be public`);
  for (const duplicate of ['standard', 'edition', 'qualification', 'framework']) if (duplicate in compliance) errors.push(`${dataPath}: ${duplicate} is registry-owned and must not be stored in the dataset`);
  if ('counts' in compliance) errors.push(`${dataPath}: counts must be derived, not stored`);
  if ('clauses' in compliance || 'annexA' in compliance) errors.push(`${dataPath}: legacy status buckets are not allowed`);
  if (JSON.stringify(compliance).includes('notApplicable')) errors.push(`${dataPath}: legacy notApplicable spelling is not allowed`);
  if (!String(compliance.paraphraseNotice ?? '').toLowerCase().includes('paraphrase')) errors.push(`${dataPath}: paraphrase notice is required`);

  const sourceSoa = compliance.sourceSoa ?? {};
  if (sourceSoa.id !== sourceSoaId || sourceSoa.governanceDocumentReference !== sourceSoaId || !governanceIds.has(sourceSoaId) || sourceSoa.status !== 'approved' || 'assessmentDate' in sourceSoa) {
    errors.push(`${dataPath}: sourceSoa must retain approved ${sourceSoaId} document identity without duplicating framework assessment metadata`);
  }
  if (!validApprovalProvenance(sourceSoa.approval)) {
    errors.push(`${dataPath}: approved sourceSoa must retain pull-request and merge-commit provenance`);
  }

  if (clauses.length !== expectedClauseRefs.length) errors.push(`${dataPath}: expected ${expectedClauseRefs.length} clause records, found ${clauses.length}`);
  if (controls.length !== expectedAnnexRefs.length) errors.push(`${dataPath}: expected ${expectedAnnexRefs.length} Annex A records, found ${controls.length}`);
  const seenIds = new Set();
  const seenRefs = new Set();
  for (const record of records) {
    if (record.id !== `${idPrefix}-${record.reference}`) errors.push(`${record.reference}: explicit canonical ID must remain ${idPrefix}-${record.reference}`);
    if (seenIds.has(record.id)) errors.push(`${record.id}: duplicate canonical compliance ID`);
    seenIds.add(record.id);
    if (seenRefs.has(record.reference)) errors.push(`${record.reference}: duplicate ISO reference`);
    seenRefs.add(record.reference);
    for (const duplicate of ['framework', 'frameworkLabel', 'sourcePath']) if (duplicate in record) errors.push(`${record.id}: ${duplicate} is derived from registered framework/resource metadata`);
    if (!ISO_POSTURE_STATUSES.includes(record.status)) errors.push(`${record.id}: unsupported normalized status ${record.status}`);
    const expectedApplicability = record.status === 'not-applicable' ? 'not-applicable' : 'applicable';
    if (record.applicability !== expectedApplicability) errors.push(`${record.id}: applicability must agree with status`);
    if (record.status === 'not-applicable' && (!record.rationale || record.rationale.trim().length < 10)) errors.push(`${record.id}: N/A rationale is required`);
    if (record.status !== 'not-applicable' && record.rationale) errors.push(`${record.id}: rationale is reserved for N/A controls`);
    const refs = record.relationships?.evidence;
    if (!Array.isArray(refs) || refs.length === 0) errors.push(`${record.id}: at least one evidence relationship is required`);
    if (new Set(refs ?? []).size !== (refs ?? []).length) errors.push(`${record.id}: duplicate evidence relationship`);
    for (const evidenceId of refs ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`${record.id}: unresolved evidence ${evidenceId}`);
  }
  for (const ref of [...expectedClauseRefs, ...expectedAnnexRefs]) if (!seenRefs.has(ref)) errors.push(`${ref}: required ISO reference is missing`);
  const postureCounts = deriveIsoPosture(controls);
  extraValidate?.({ compliance, records, clauses, controls, postureCounts, errors, resource, frameworkMetadata: metadata });
  return { errors, compliance, records, clauses, controls, postureCounts, resource };
}

export function finishIsoValidation(label, result) {
  if (result.errors.length) {
    console.error(`${label} public compliance validation failed:`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  const posture = ISO_POSTURE_STATUSES.map((status) => `${result.postureCounts[status]} ${status}`).join(', ');
  console.log(`${label} public compliance validation passed from canonical normalized data: ${result.clauses.length} clause references and ${result.controls.length} Annex A controls (${posture}).`);
}
