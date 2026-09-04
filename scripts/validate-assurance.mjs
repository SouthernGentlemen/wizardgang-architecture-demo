import fs from 'node:fs';
import path from 'node:path';
import { loadAssuranceRegistry, primaryRegistryDataset } from './lib/assurance-registry.mjs';

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const registry = loadAssuranceRegistry(root);
const errors = [];

const evidencePath = primaryRegistryDataset(registry, 'evidence').path;
const risksPath = primaryRegistryDataset(registry, 'risks').path;
const evidence = read(evidencePath);
const risks = read(risksPath);

for (const record of evidence.records ?? []) {
  if (record.locator?.repositoryPath && !fs.existsSync(path.join(root, record.locator.repositoryPath))) {
    errors.push(`${record.id}: repository path does not exist: ${record.locator.repositoryPath}`);
  }
}

const governance = read('docs/governance/REFERENCE-REGISTRY.json');
const governancePaths = new Map((governance.records ?? []).map((record) => [record.reference, record.path]));
const sourceRegisters = new Map();
for (const source of risks.sourceRegisters ?? []) {
  const repositoryPath = governancePaths.get(source.governanceDocumentReference);
  if (sourceRegisters.has(source.id)) errors.push(`risks: duplicate source register ${source.id}`);
  sourceRegisters.set(source.id, repositoryPath);
  if (!repositoryPath || !fs.existsSync(path.join(root, repositoryPath))) {
    errors.push(`risks: governance presentation register does not resolve: ${source.governanceDocumentReference}`);
  }
}
if (sourceRegisters.get('WG-REG-001') !== 'docs/governance/registers/SECURITY-RISK-REGISTER.md') {
  errors.push('risks: WG-REG-001 presentation register is missing');
}
if (sourceRegisters.get('WG-REG-002') !== 'docs/governance/registers/AI-RISK-REGISTER.md') {
  errors.push('risks: WG-REG-002 presentation register is missing');
}

for (const record of risks.records ?? []) {
  if (record.framework === 'security' && !record.id.startsWith('SEC-RISK-')) {
    errors.push(`${record.id}: framework must match SEC-RISK prefix`);
  }
  if (record.framework === 'ai' && !record.id.startsWith('AI-RISK-')) {
    errors.push(`${record.id}: framework must match AI-RISK prefix`);
  }
}

if (errors.length) {
  console.error('Public assurance semantic validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Public assurance semantic validation passed: ${evidence.records.length} evidence locators and ${risks.records.length} risk records agree with controlled repository/governance state.`);
