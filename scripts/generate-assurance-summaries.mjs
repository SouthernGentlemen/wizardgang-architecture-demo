import fs from 'node:fs';
import path from 'node:path';
import {
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
  readJsonFile,
} from './lib/assurance-registry.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const registry = loadAssuranceRegistry(root);
const sources = flattenAssuranceRegistry(registry)
  .filter((resource) => resource.capabilities?.includes('summary-source'))
  .sort((left, right) => left.id.localeCompare(right.id));

function titleCase(value) {
  return String(value).slice(0, 1).toUpperCase() + String(value).slice(1);
}

function annexCounts(data) {
  const counts = { met: 0, partial: 0, gap: 0, notApplicable: 0 };
  for (const groups of Object.values(data.annexA ?? {})) {
    for (const key of Object.keys(counts)) counts[key] += groups?.[key]?.length ?? 0;
  }
  return { ...counts, total: Object.values(counts).reduce((sum, value) => sum + value, 0) };
}

function renderSummary(sourcePath, data) {
  const counts = annexCounts(data);
  const soa = data.sourceSoa;
  return `# ${data.standard} Statement of Applicability\n\n<!-- GENERATED FILE: scripts/generate-assurance-summaries.mjs; DO NOT EDIT STATUS, COUNTS, OR RATIONALES HERE. -->\n\n**Reference:** ${soa.id}\n\n**Status:** ${titleCase(soa.status)}\n\n**Owner:** Management-System Owner / Evidence Custodian\n\n**Assessment date:** ${soa.assessmentDate}\n\n**Approval:** Controlled pull request and merge\n\n**Approval record:** PR #${soa.approval.pullRequest} · merge commit \`${soa.approval.mergeCommit}\`\n\n**Review:** At least annually and after material scope, risk, supplier, architecture, data, personnel, or AI-capability change\n\n## Authority\n\nThis Markdown file is a deterministic summary of the structured assurance registry. The canonical per-control applicability, status, N/A rationale, title, and evidence links are maintained only in \`${sourcePath}\`. Do not maintain a second control-state table in Markdown.\n\nThe \`sourceSoa\` metadata retained in the structured dataset preserves this controlled document's identity, assessment date, and approval provenance; it does not make this generated presentation a second source of truth.\n\n## Summary\n\n| Controls | Met | Partial | Gap | N/A |\n|---:|---:|---:|---:|---:|\n| ${counts.total} | ${counts.met} | ${counts.partial} | ${counts.gap} | ${counts.notApplicable} |\n\n## Interpretation\n\n- Status is evidence posture only and is not a certification score.\n- N/A rationales are required and live only in the canonical structured record for the affected control.\n- Missing implementation remains \`Gap\` or \`Partial\`; it is never converted to N/A merely because evidence is incomplete.\n- This repository remains aligned — uncertified; no status implies certification, control effectiveness, or residual-risk acceptance.\n\n## Regeneration\n\nRun \`npm run generate:assurance-summaries\` after an approved structured assurance change. CI runs the same generator in check mode and rejects any independently edited or stale Markdown summary.\n`;
}

const failures = [];
for (const source of sources) {
  const data = readJsonFile(root, source.path);
  const outputPath = data.sourceSoa?.repositoryPath;
  if (!outputPath) {
    failures.push(`${source.path}: sourceSoa.repositoryPath is required`);
    continue;
  }
  const rendered = renderSummary(source.path, data);
  const absolute = path.join(root, outputPath);
  if (checkOnly) {
    const current = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
    if (current !== rendered) failures.push(`${outputPath}: generated summary is stale or was edited independently`);
  } else {
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, rendered);
    console.log(`Generated ${outputPath} from ${source.path}`);
  }
}

if (failures.length) {
  console.error('Assurance Markdown summary validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (checkOnly) console.log(`Assurance Markdown summaries match ${sources.length} registry-discovered canonical structured sources.`);
