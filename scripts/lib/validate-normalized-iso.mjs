import fs from 'node:fs';
import path from 'node:path';

export function validateNormalizedIso({
  root = process.cwd(),
  dataPath,
  schemaPath,
  standard,
  edition,
  framework,
  idPrefix,
  sourceSoaId,
  expectedClauseRefs,
  expectedAnnexRefs,
  expectedAnnexCounts,
  extraValidate,
}) {
  const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const errors = [];
  const compliance = readJson(dataPath);
  const schema = readJson(schemaPath);
  const evidence = readJson('assurance/evidence/evidence.json');
  const governance = readJson('docs/governance/REFERENCE-REGISTRY.json');
  const evidenceIds = new Set((evidence.records ?? []).map((record) => record.id));
  const governanceIds = new Set((governance.records ?? []).map((record) => record.reference));
  const records = compliance.records ?? [];
  const clauses = records.filter((record) => record.kind === 'clause');
  const controls = records.filter((record) => record.kind === 'control');

  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${schemaPath}: expected JSON Schema draft 2020-12`);
  if (compliance.schemaVersion !== 1) errors.push(`${dataPath}: schemaVersion must be 1`);
  if (compliance.standard !== standard || compliance.edition !== edition) errors.push(`${dataPath}: standard identity must remain ${standard}`);
  if (compliance.framework?.id !== framework || compliance.framework?.label !== standard || compliance.framework?.sourcePath !== dataPath) errors.push(`${dataPath}: framework metadata must be canonical and source-owned`);
  if (compliance.visibility !== 'public') errors.push(`${dataPath}: visibility must be public`);
  if ('counts' in compliance) errors.push(`${dataPath}: counts must be derived, not stored`);
  if ('clauses' in compliance || 'annexA' in compliance) errors.push(`${dataPath}: legacy status buckets are not allowed`);
  if (JSON.stringify(compliance).includes('notApplicable')) errors.push(`${dataPath}: legacy notApplicable spelling is not allowed`);
  if (!String(compliance.qualification ?? '').toLowerCase().includes('not claimed')) errors.push(`${dataPath}: qualification must avoid certification/conformance claims`);
  if (!String(compliance.paraphraseNotice ?? '').toLowerCase().includes('paraphrase')) errors.push(`${dataPath}: paraphrase notice is required`);

  if (compliance.sourceSoa?.id !== sourceSoaId
    || compliance.sourceSoa?.governanceDocumentReference !== sourceSoaId
    || !governanceIds.has(sourceSoaId)
    || compliance.sourceSoa?.status !== 'approved'
    || compliance.sourceSoa?.assessmentDate !== '2026-09-02'
    || compliance.sourceSoa?.approval?.pullRequest !== 56
    || compliance.sourceSoa?.approval?.mergeCommit !== '1ae105da8ab6466e334a2faf4e6c63f5885c91df') {
    errors.push(`${dataPath}: sourceSoa must retain approved ${sourceSoaId} identity and provenance through the governance catalog`);
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
    if (record.framework !== framework || record.frameworkLabel !== standard || record.sourcePath !== dataPath) errors.push(`${record.id}: record framework/source identity must be explicit and canonical`);
    if (!['met', 'partial', 'gap', 'not-applicable'].includes(record.status)) errors.push(`${record.id}: unsupported normalized status ${record.status}`);
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

  const annexCounts = controls.reduce((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
    return counts;
  }, {});
  for (const [status, expected] of Object.entries(expectedAnnexCounts)) {
    if ((annexCounts[status] ?? 0) !== expected) errors.push(`${dataPath}: expected ${expected} ${status} Annex A controls, found ${annexCounts[status] ?? 0}`);
  }

  extraValidate?.({ compliance, records, clauses, controls, errors });
  return { errors, compliance, records, clauses, controls };
}

export function finishIsoValidation(label, result) {
  if (result.errors.length) {
    console.error(`${label} public compliance validation failed:`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`${label} public compliance validation passed from canonical normalized data: ${result.clauses.length} clause references and ${result.controls.length} Annex A controls.`);
}
