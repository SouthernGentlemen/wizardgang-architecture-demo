import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const writeJson = (relative, value) => fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);

const registry = readJson('assurance/registry.json');
const governance = readJson('docs/governance/REFERENCE-REGISTRY.json');
const governanceByPath = new Map(governance.records.map((record) => [record.path, record.reference]));
const governanceById = new Map(governance.records.map((record) => [record.reference, record.path]));

function flattenResources(resources) {
  return resources.flatMap((resource) => [resource, ...flattenResources(resource.resources ?? [])]);
}

const registryResources = [
  ...flattenResources(registry.datasets ?? []),
  registry.lifecycle,
  ...(registry.operations ?? []),
].filter(Boolean);
const resourceByPath = new Map(registryResources.map((resource) => [resource.path, resource]));

function evidenceRelationships(values = []) {
  return values.map((value) => typeof value === 'string' ? { type: 'evidence', id: value } : value);
}

function governanceRelationshipFromPath(repositoryPath, label) {
  const id = governanceByPath.get(repositoryPath);
  if (!id) throw new Error(`No governance reference resolves ${repositoryPath}`);
  return { type: 'governance-document', id, ...(label ? { label } : {}) };
}

function normalizeIso(relative, frameworkId, prefix, order) {
  const data = readJson(relative);
  if (Array.isArray(data.records) && data.framework?.id === frameworkId) return;

  const sourceSoa = data.sourceSoa;
  const records = [];
  const appendGroups = (groups, kind, section) => {
    for (const [rawStatus, entries] of Object.entries(groups ?? {})) {
      const status = rawStatus === 'notApplicable' ? 'not-applicable' : rawStatus;
      for (const entry of entries ?? []) {
        records.push({
          id: `${prefix}-${entry.reference}`,
          framework: frameworkId,
          reference: entry.reference,
          title: entry.title,
          kind,
          section,
          status,
          applicability: status === 'not-applicable' ? 'not-applicable' : 'applicable',
          ...(entry.rationale ? { rationale: entry.rationale } : {}),
          evidence: evidenceRelationships(entry.evidence),
        });
      }
    }
  };

  appendGroups(data.clauses, 'clause', 'Clauses 4–10');
  for (const [family, groups] of Object.entries(data.annexA ?? {})) {
    appendGroups(groups, 'control', `Annex A · ${family.replace(/([a-z])([A-Z])/g, '$1 $2')}`);
  }

  data.framework = {
    id: frameworkId,
    label: data.standard,
    edition: data.edition,
    qualification: data.qualification,
    assessmentDate: sourceSoa.assessmentDate,
    order,
  };
  data.sourceSoa = {
    type: 'governance-document',
    id: sourceSoa.id,
    status: sourceSoa.status,
    assessmentDate: sourceSoa.assessmentDate,
    approval: sourceSoa.approval,
  };
  data.records = records;
  delete data.standard;
  delete data.edition;
  delete data.qualification;
  delete data.clauses;
  delete data.annexA;
  writeJson(relative, data);
}

normalizeIso('assurance/compliance/iso-27001-2022.json', 'iso-27001', 'ISO27001', 0);
normalizeIso('assurance/compliance/iso-42001-2023.json', 'iso-42001', 'ISO42001', 1);

{
  const relative = 'assurance/compliance/wcag-2.2.json';
  const data = readJson(relative);
  if (!data.framework?.id) {
    data.framework = {
      id: 'wcag-2.2',
      label: 'WCAG 2.2',
      edition: data.edition,
      qualification: data.qualification,
      assessmentDate: data.assessmentDate,
      order: 2,
    };
    data.registryEvidence = evidenceRelationships(data.registryEvidenceIds);
    data.partitions = (data.partitions ?? []).map((partition) => {
      const resource = resourceByPath.get(partition.path);
      if (!resource) throw new Error(`WCAG manifest partition is not registered: ${partition.path}`);
      return { principle: partition.principle, resourceId: resource.id };
    });
    delete data.standard;
    delete data.edition;
    delete data.assessmentDate;
    delete data.qualification;
    delete data.registryEvidenceIds;
    writeJson(relative, data);
  }
}

for (const resource of registryResources.filter((entry) => entry.kind === 'compliance' && entry.role === 'partition')) {
  const data = readJson(resource.path);
  if (Array.isArray(data.records)) continue;
  const principle = data.principle;
  data.framework = 'wcag-2.2';
  data.records = (data.criteria ?? []).map((entry) => ({
    id: `WCAG-${entry.criterionId}`,
    framework: 'wcag-2.2',
    reference: entry.criterionId,
    title: entry.name,
    kind: 'criterion',
    section: `${principle.number}. ${principle.name}`,
    level: entry.level,
    status: entry.status,
    implementation: entry.implementation,
    validation: entry.validation,
    evidence: evidenceRelationships(entry.evidenceIds),
    gaps: entry.gaps,
    owner: entry.owner,
    freshnessRules: entry.freshnessRules,
  }));
  delete data.criteria;
  writeJson(resource.path, data);
}

function complianceOrFrameworkRelationship(value) {
  if (typeof value !== 'string') return value;
  const iso = /^(ISO27001|ISO42001):(.+)$/.exec(value);
  if (iso) return { type: 'compliance', id: `${iso[1]}-${iso[2]}`, reference: value };
  if (value.startsWith('WCAG22:')) return { type: 'framework-reference', framework: 'wcag-2.2', reference: value };
  throw new Error(`Unmodeled framework relationship ${value}`);
}

{
  const relative = 'assurance/claims/claims.json';
  const data = readJson(relative);
  for (const record of data.records ?? []) {
    record.frameworkReferences = (record.frameworkReferences ?? []).map(complianceOrFrameworkRelationship);
    record.evidence = evidenceRelationships(record.evidence);
  }
  writeJson(relative, data);
}

{
  const relative = 'assurance/risks/risks.json';
  const data = readJson(relative);
  data.sourceRegisters = (data.sourceRegisters ?? []).map((entry) => {
    if (typeof entry !== 'object' || entry === null) return entry;
    if (entry.type) return entry;
    const expectedPath = governanceById.get(entry.id);
    if (!expectedPath || expectedPath !== entry.repositoryPath) throw new Error(`Risk source register ${entry.id} does not match governance catalog`);
    return { type: 'governance-document', id: entry.id };
  });
  for (const record of data.records ?? []) {
    record.controls = (record.controls ?? []).map((control) => control?.type
      ? control
      : governanceRelationshipFromPath(control.repositoryPath, control.reference));
    record.evidence = evidenceRelationships(record.evidence);
  }
  writeJson(relative, data);
}

function normalizeSourceRegister(data) {
  if (typeof data.sourceRegister === 'string') data.sourceRegister = governanceRelationshipFromPath(data.sourceRegister);
}
function riskRelationships(values = []) {
  return values.map((value) => typeof value === 'string' ? { type: 'risk', id: value } : value);
}
function incidentRelationships(values = []) {
  return values.map((value) => typeof value === 'string' ? { type: 'incident', id: value } : value);
}
function controlRelationships(values = []) {
  return values.map((value) => {
    if (typeof value !== 'string') return value;
    if (/^(ISO27001|ISO42001)-A\./.test(value)) return { type: 'control', id: value, reference: value };
    if (value.startsWith('WG-')) return { type: 'governance-document', id: value };
    throw new Error(`Unmodeled control relationship ${value}`);
  });
}

{
  const relative = 'assurance/incidents/incidents.json';
  const data = readJson(relative);
  normalizeSourceRegister(data);
  for (const record of data.records ?? []) {
    record.riskLinks = riskRelationships(record.riskLinks);
    record.controlLinks = controlRelationships(record.controlLinks);
    record.evidence = evidenceRelationships(record.evidence);
  }
  writeJson(relative, data);
}

{
  const relative = 'assurance/incidents/exercises.json';
  const data = readJson(relative);
  normalizeSourceRegister(data);
  for (const record of data.records ?? []) {
    record.riskLinks = riskRelationships(record.riskLinks);
    record.objectiveLinks = (record.objectiveLinks ?? []).map((value) => typeof value === 'string'
      ? { type: 'objective', id: value, documentId: 'WG-OBJ-001' }
      : value);
    record.evidence = evidenceRelationships(record.evidence);
  }
  writeJson(relative, data);
}

{
  const relative = 'assurance/advisories/advisories.json';
  const data = readJson(relative);
  for (const record of data.records ?? []) {
    record.incidentLinks = incidentRelationships(record.incidentLinks);
    record.evidence = evidenceRelationships(record.evidence);
  }
  writeJson(relative, data);
}

console.log('DEMO-127 canonical assurance data migration completed.');
