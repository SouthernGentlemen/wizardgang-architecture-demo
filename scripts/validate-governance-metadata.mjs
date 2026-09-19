import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const governanceRoot = path.join(root, 'docs/governance');
const registryPath = path.join(governanceRoot, 'REFERENCE-REGISTRY.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const presentation = JSON.parse(fs.readFileSync(path.join(root, 'assurance/presentation/documents.json'), 'utf8'));
const assuranceRegistry = JSON.parse(fs.readFileSync(path.join(root, 'assurance/registry.json'), 'utf8'));

function flattenResources(resources = []) {
  return resources.flatMap((resource) => [resource, ...flattenResources(resource.resources ?? [])]);
}

const resourcePathById = new Map(flattenResources(assuranceRegistry.datasets ?? []).map((resource) => [resource.id, resource.path]));
const presentationById = new Map((presentation.documents ?? []).map((document) => [document.id, document]));
const errors = [];
const references = new Map();
const referencePattern = /^WG-(?:GOV|POL|REG|OBJ|SOA|AIA|A11Y)-\d{3}$/;

const canonicalManagementDocuments = [
  'docs/governance/GOVERNANCE.md',
  'docs/governance/RISK-MANAGEMENT.md',
  'docs/governance/ASSURANCE-AND-AUDIT.md',
];

const canonicalOperationalDocuments = [
  'docs/governance/SECURITY-GOVERNANCE.md',
  'docs/governance/AI-GOVERNANCE.md',
  'docs/governance/DATA-AND-PRIVACY.md',
  'docs/governance/INCIDENT-AND-CONTINUITY.md',
  'docs/governance/ENGINEERING-CONTROLS.md',
];

const canonicalAssessmentDocuments = [
  'docs/governance/AI-IMPACT-ASSESSMENT.md',
];

const retiredHistoricalAssessmentDocuments = [
  'docs/governance/assessments/ISO-27001-2026-09-17-SELF-ASSESSMENT.md',
  'docs/governance/assessments/ISO-27001-2026-09-18-REPOSITORY-PROTECTION-ADDENDUM.md',
  'docs/governance/assessments/ISO-42001-2026-09-17-SELF-ASSESSMENT.md',
  'docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md',
  'docs/governance/assessments/WCAG-2.2-2026-09-17-EVALUATION.md',
  'docs/governance/assessments/WCAG-2.2-2026-09-18-REASSESSMENT.md',
];

const retiredFragmentedDocuments = [
  'docs/governance/CONTEXT.md',
  'docs/governance/INTERESTED-PARTIES.md',
  'docs/governance/SCOPE.md',
  'docs/governance/MANAGEMENT-SYSTEM.md',
  'docs/governance/LEADERSHIP.md',
  'docs/governance/ROLES-RESPONSIBILITIES.md',
  'docs/governance/MANAGEMENT-SYSTEM-CHANGE-PLANNING.md',
  'docs/governance/MANAGEMENT-SYSTEM-SUPPORT.md',
  'docs/governance/COMPETENCE-AWARENESS-COMMUNICATION.md',
  'docs/governance/OPERATIONAL-PLANNING-CONTROL.md',
  'docs/governance/OPERATIONAL-RISK-AND-AI-REASSESSMENT.md',
  'docs/governance/MONITORING-MEASUREMENT-EVALUATION.md',
  'docs/governance/INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md',
  'docs/governance/MANAGEMENT-REVIEW.md',
  'docs/governance/NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md',
  'docs/governance/CONTROL-AND-DOCUMENT-INDEX.md',
  'docs/governance/AI-POLICY.md',
  'docs/governance/INFORMATION-SECURITY-POLICY.md',
  'docs/governance/ASSET-ACCESS-ACCEPTABLE-USE.md',
  'docs/governance/BACKUP-RECOVERY-RESTORE.md',
  'docs/governance/CONTINUITY-RESILIENCE.md',
  'docs/governance/CONFIGURATION-BASELINE-DRIFT.md',
  'docs/governance/CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md',
  'docs/governance/DATA-GOVERNANCE.md',
  'docs/governance/INCIDENT-MANAGEMENT.md',
  'docs/governance/LEGAL-CONTRACTUAL-IP-PRIVACY.md',
  'docs/governance/SECURE-ENGINEERING-TESTING.md',
  'docs/governance/SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md',
  'docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md',
];

const historicalNarrativePatterns = [
  { label: 'concrete DEMO change ID', pattern: /\bDEMO-\d{3,}\b/g },
  { label: 'historical pull-request number', pattern: /\b(?:PR|pull request)\s*#\d+\b/gi },
  { label: 'full Git SHA', pattern: /\b[0-9a-f]{40}\b/gi },
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

if (registry.authority !== 'reference-identity-only') {
  errors.push('REFERENCE-REGISTRY.json: authority must be reference-identity-only; registration must not become a second state authority');
}

for (const record of registry.records ?? []) {
  if (!referencePattern.test(record.reference)) errors.push(`${record.path}: invalid registered reference ${record.reference}`);
  if (references.has(record.reference)) errors.push(`${record.path}: duplicate registered reference ${record.reference}; also ${references.get(record.reference)}`);
  references.set(record.reference, record.path);

  const absolute = path.join(root, record.path);
  if (!fs.existsSync(absolute)) {
    errors.push(`${record.path}: registered file does not exist`);
    continue;
  }

  if (record.path.endsWith('.md')) {
    const text = fs.readFileSync(absolute, 'utf8');
    const matches = [...text.matchAll(/^\*\*Reference:\*\*\s+([^\s]+)\s*$/gm)];
    if (matches.length !== 1) errors.push(`${record.path}: expected exactly one Reference header, found ${matches.length}`);
    else if (matches[0][1] !== record.reference) errors.push(`${record.path}: header ${matches[0][1]} does not match registry ${record.reference}`);
    continue;
  }

  if (record.path.endsWith('.json') && /^WG-(?:REG|OBJ|SOA)-/.test(record.reference)) {
    const document = presentationById.get(record.reference);
    if (!document) {
      errors.push(`${record.reference}: structured identity is missing from assurance/presentation/documents.json`);
      continue;
    }
    const sourcePaths = new Set((document.sourceDatasets ?? []).map((id) => resourcePathById.get(id)).filter(Boolean));
    if (!sourcePaths.has(record.path)) {
      errors.push(`${record.reference}: registered structured authority ${record.path} is not one of its presentation source datasets`);
    }
    continue;
  }

  errors.push(`${record.path}: registered identity must resolve to governance Markdown or a structured assurance JSON authority`);
}

const registeredPaths = new Set((registry.records ?? []).map((record) => record.path));
const liveReferences = new Map();
for (const absolute of walk(governanceRoot).filter((file) => file.endsWith('.md'))) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  const text = fs.readFileSync(absolute, 'utf8');
  const match = text.match(/^\*\*Reference:\*\*\s+([^\s]+)\s*$/m);
  if (!match) continue;
  if (!registeredPaths.has(relative)) errors.push(`${relative}: has Reference header but is missing from REFERENCE-REGISTRY.json`);
  if (liveReferences.has(match[1])) errors.push(`${relative}: duplicate live Reference ${match[1]}; also ${liveReferences.get(match[1])}`);
  liveReferences.set(match[1], relative);
}

for (const relativePath of [...canonicalManagementDocuments, ...canonicalOperationalDocuments, ...canonicalAssessmentDocuments]) {
  if (!fs.existsSync(path.join(root, relativePath))) errors.push(`${relativePath}: canonical consolidated governance document does not exist`);
}
for (const relativePath of retiredFragmentedDocuments) {
  if (fs.existsSync(path.join(root, relativePath))) errors.push(`${relativePath}: retired fragmented governance document still exists`);
  if (registeredPaths.has(relativePath)) errors.push(`${relativePath}: retired fragmented governance document remains in REFERENCE-REGISTRY.json`);
}
for (const relativePath of retiredHistoricalAssessmentDocuments) {
  if (fs.existsSync(path.join(root, relativePath))) errors.push(`${relativePath}: retired historical assessment Markdown still exists`);
  if (registeredPaths.has(relativePath)) errors.push(`${relativePath}: retired historical assessment remains in REFERENCE-REGISTRY.json`);
}

const topLevelGovernanceMarkdown = fs.readdirSync(governanceRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => `docs/governance/${entry.name}`)
  .sort();

const currentStateAuthorityDocuments = [
  'AGENTS.md',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/ARCHITECTURE-STANDARD.md',
  'docs/CHANGE-MANAGEMENT.md',
  'docs/RELEASE-MANAGEMENT.md',
  ...topLevelGovernanceMarkdown,
];

for (const relativePath of currentStateAuthorityDocuments) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) {
    errors.push(`${relativePath}: current-state authority document does not exist`);
    continue;
  }
  const text = fs.readFileSync(absolute, 'utf8');
  for (const { label, pattern } of historicalNarrativePatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) errors.push(`${relativePath}: permanent current-state documentation contains ${label} "${match[0]}"; keep historical identity in Git/GitHub or dated evidence`);
  }
  for (const retiredPath of [...retiredFragmentedDocuments, ...retiredHistoricalAssessmentDocuments]) {
    const name = retiredPath.split('/').at(-1);
    if (text.includes(retiredPath) || text.includes(name)) {
      errors.push(`${relativePath}: references retired current-state document ${name}`);
    }
  }
}

if (errors.length) {
  console.error('Governance metadata validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Governance metadata validation passed: ${registry.records.length} registered identities; ${liveReferences.size} live Markdown Reference headers; ${topLevelGovernanceMarkdown.length} top-level current-state governance documents; fragmented governance and historical assessment Markdown retired.`);
