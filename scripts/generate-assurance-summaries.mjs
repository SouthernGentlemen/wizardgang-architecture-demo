import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
  readJsonFile,
  registryResourceById,
} from './lib/assurance-registry.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
export const GENERATED_BEGIN = '<!-- BEGIN GENERATED ASSURANCE PROJECTION -->';
export const GENERATED_END = '<!-- END GENERATED ASSURANCE PROJECTION -->';

function titleCase(value) {
  return String(value)
    .replaceAll('-', ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderApproval(document, state = {}) {
  const approval = { ...(document.approval ?? {}), ...(state.approval ?? {}) };
  const lines = [];
  if (approval.method) lines.push(`**Approval:** ${approval.method}`);
  if (approval.pullRequest && approval.mergeCommit) {
    lines.push(`**Approval record:** PR #${approval.pullRequest} · merge commit \`${approval.mergeCommit}\``);
  }
  return lines;
}

function renderDocumentMetadata(document, state = {}) {
  const reference = state.id ?? document.id;
  const status = state.status ?? document.status;
  const assessmentDate = state.assessmentDate ?? document.assessmentDate;
  const lines = [`**Reference:** ${reference}`];
  if (document.framework) lines.push(`**Framework:** ${document.framework}`);
  if (document.appliesTo?.length) lines.push(`**Applies to:** ${document.appliesTo.join('; ')}`);
  if (status) lines.push(`**Status:** ${titleCase(status)}`);
  lines.push(`**Owner:** ${document.owner}`);
  if (assessmentDate) lines.push(`**Assessment date:** ${assessmentDate}`);
  if (document.baselineDate) lines.push(`**Baseline date:** ${document.baselineDate}`);
  lines.push(...renderApproval(document, state));
  if (document.review?.dueDate) lines.push(`**Review due:** ${document.review.dueDate}`);
  if (document.review?.cadence) lines.push(`**Review cadence:** ${document.review.cadence}`);
  return lines.join('\n\n');
}

function riskRecords(document, data) {
  const framework = document.recordSelector?.framework;
  return (data.records ?? [])
    .filter((record) => !framework || record.framework === framework)
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function renderRiskProjection(document, data) {
  const records = riskRecords(document, data);
  const rows = records.map((record) => `| ${record.id} | ${record.title} | ${record.inherent.score} ${titleCase(record.inherent.rating)} | ${record.residual.score} ${titleCase(record.residual.rating)} | ${record.treatment.map(titleCase).join(' / ')} | ${titleCase(record.status)} | ${record.reviewDue} |`);
  return `${GENERATED_BEGIN}\n\n${renderDocumentMetadata(document)}\n\n## Current Register\n\n**Records:** ${records.length}\n\n| ID | Risk | Inherent | Residual | Treatment | Status | Review due |\n|---|---|---:|---:|---|---|---|\n${rows.join('\n')}\n\n${GENERATED_END}`;
}

export function renderIncidentProjection(document, incidents, exercises) {
  const incidentRows = [...(incidents.records ?? [])]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((record) => `| ${record.id} | ${record.title} | ${titleCase(record.status)} | ${record.detectedAt ?? '—'} | ${record.finalSeverity ?? record.initialSeverity ?? '—'} |`);
  const exerciseRows = [...(exercises.records ?? [])]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((record) => `| ${record.id} | ${record.exerciseType} | ${record.scenario} | ${record.scope} | ${record.dueDate ?? record.completedAt ?? '—'} | ${record.owner} | ${titleCase(record.status)} | ${(record.relationships?.evidence ?? []).length} |`);
  return `${GENERATED_BEGIN}\n\n${renderDocumentMetadata(document)}\n\n## Current Status\n\n**Actual incident records:** ${incidentRows.length}\n\n${incidents.qualification}\n\n| ID | Title | Status | Detected | Final severity |\n|---|---|---|---|---|\n${incidentRows.join('\n')}\n\n**Exercise records:** ${exerciseRows.length}\n\n${exercises.qualification}\n\n| ID | Type | Scenario | Scope | Due / completed | Owner | Status | Evidence records |\n|---|---|---|---|---|---|---|---:|\n${exerciseRows.join('\n')}\n\n${GENERATED_END}`;
}

function annexCounts(data) {
  const counts = { met: 0, partial: 0, gap: 0, 'not-applicable': 0 };
  for (const record of data.records ?? []) {
    if (record.kind !== 'control') continue;
    counts[record.status] = (counts[record.status] ?? 0) + 1;
  }
  return { ...counts, total: Object.values(counts).reduce((sum, value) => sum + value, 0) };
}

export function renderSoaSummary(document, sourcePath, data) {
  const counts = annexCounts(data);
  const soa = data.sourceSoa;
  return `# ${data.standard} Statement of Applicability\n\n<!-- GENERATED FILE: scripts/generate-assurance-summaries.mjs; DO NOT EDIT. CANONICAL JSON IS THE ONLY ASSURANCE STATE AUTHORITY. -->\n\n${renderDocumentMetadata(document, soa)}\n\n## Authority\n\nThis Markdown file is a deterministic presentation of canonical structured assurance data. Per-control applicability, status, N/A rationale, title, and evidence relationships are maintained only in \`${sourcePath}\`. Document ownership and review cadence are maintained in \`assurance/presentation/documents.json\`.\n\nGenerated Markdown is not an input to runtime, validation, APIs, or dashboards.\n\n## Summary\n\n| Controls | Met | Partial | Gap | N/A |\n|---:|---:|---:|---:|---:|\n| ${counts.total} | ${counts.met} | ${counts.partial} | ${counts.gap} | ${counts['not-applicable']} |\n\n## Interpretation\n\n- Status is evidence posture only and is not a certification score.\n- N/A rationales are required and live only in the canonical structured record for the affected control.\n- Missing implementation remains \`Gap\` or \`Partial\`; it is never converted to N/A merely because evidence is incomplete.\n- This repository remains aligned — uncertified; no status implies certification, control effectiveness, or residual-risk acceptance.\n\n## Regeneration\n\nRun \`npm run generate:assurance-summaries\` after an approved structured assurance change. CI runs the same generator in check mode and rejects stale or independently edited generated presentation.\n`;
}

export function applyGeneratedProjection(current, projection, outputPath) {
  const start = current.indexOf(GENERATED_BEGIN);
  const end = current.indexOf(GENERATED_END);
  if (start < 0 || end < start) throw new Error(`${outputPath}: generated projection markers are missing or invalid`);
  return `${current.slice(0, start)}${projection}${current.slice(end + GENERATED_END.length)}`;
}

function main() {
  const registry = loadAssuranceRegistry(root);
  const governance = readJsonFile(root, 'docs/governance/REFERENCE-REGISTRY.json');
  const governancePaths = new Map(governance.records.map((record) => [record.reference, record.path]));
  const presentationResources = flattenAssuranceRegistry(registry).filter((resource) => resource.kind === 'documents' && resource.capabilities?.includes('summary-source'));
  if (presentationResources.length !== 1) throw new Error(`assurance/registry.json: expected exactly one generated-document metadata resource; found ${presentationResources.length}`);
  const catalog = readJsonFile(root, presentationResources[0].path);
  const failures = [];

  for (const document of [...catalog.documents].sort((left, right) => left.id.localeCompare(right.id))) {
    const outputPath = governancePaths.get(document.governanceDocumentReference);
    if (!outputPath) {
      failures.push(`${document.id}: governanceDocumentReference does not resolve through docs/governance/REFERENCE-REGISTRY.json`);
      continue;
    }
    const sourceResources = document.sourceDatasets.map((id) => registryResourceById(registry, id));
    if (sourceResources.some((resource) => !resource)) {
      failures.push(`${document.id}: one or more sourceDatasets do not resolve through assurance/registry.json`);
      continue;
    }
    const sources = sourceResources.map((resource) => ({ resource, data: readJsonFile(root, resource.path) }));
    const absolute = path.join(root, outputPath);
    const current = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
    let rendered;
    try {
      if (document.type === 'risk-register') {
        rendered = applyGeneratedProjection(current, renderRiskProjection(document, sources[0].data), outputPath);
      } else if (document.type === 'incident-exercise-register') {
        const incidents = sources.find(({ resource }) => resource.kind === 'incidents')?.data;
        const exercises = sources.find(({ resource }) => resource.kind === 'exercises')?.data;
        if (!incidents || !exercises) throw new Error(`${document.id}: incident/exercise projection requires incident and exercise datasets`);
        rendered = applyGeneratedProjection(current, renderIncidentProjection(document, incidents, exercises), outputPath);
      } else if (document.type === 'soa') {
        rendered = renderSoaSummary(document, sources[0].resource.path, sources[0].data);
      } else {
        throw new Error(`${document.id}: unsupported presentation type ${document.type}`);
      }
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
      continue;
    }

    if (checkOnly) {
      if (current !== rendered) failures.push(`${outputPath}: generated assurance presentation is stale or was edited independently`);
    } else {
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, rendered);
      console.log(`Generated assurance presentation ${outputPath}`);
    }
  }

  if (failures.length) {
    console.error('Assurance Markdown presentation validation failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  if (checkOnly) console.log(`Assurance Markdown presentations are current for ${catalog.documents.length} structured document definitions.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
