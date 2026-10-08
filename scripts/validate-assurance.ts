import fs from 'node:fs';
import path from 'node:path';
import {
  loadAssuranceRecordInventory,
  loadAssuranceRegistry,
  primaryRegistryDataset,
  readJsonFile,
} from './lib/assurance-registry.ts';
import { deriveRiskRecord } from '../src/assurance/risk-rating.ts';

import { pathToFileURL } from 'node:url';
import { createAssuranceValidationContext } from './lib/assurance-validation-context.ts';

export function runAssuranceRecordValidation(context = createAssuranceValidationContext()) {
  const root = context.root;
  const registry = context.registry();
  const inventory = loadAssuranceRecordInventory(root, registry);
  const errors = [];

  const evidenceEntries = inventory.entriesForKind('evidence');
  for (const { resource, record } of evidenceEntries) {
    const repositoryPath = record.locator?.repositoryPath;
    if (repositoryPath && !fs.existsSync(path.join(root, repositoryPath))) {
      errors.push(`${record.id}: repository path does not exist: ${repositoryPath} (${resource.path})`);
    }
  }

  const governance = readJsonFile(root, 'docs/governance/REFERENCE-REGISTRY.json');
  const governancePaths = new Map((governance.records ?? []).map((record) => [record.reference, record.path]));
  const primaryRisks = primaryRegistryDataset(registry, 'risks');
  for (const resource of inventory.resources.filter((entry) => entry.kind === 'risks')) {
    const risks = inventory.documentForResource(resource);
    const sourceRegisters = new Map();
    for (const source of risks.sourceRegisters ?? []) {
      const repositoryPath = governancePaths.get(source.governanceDocumentReference);
      if (sourceRegisters.has(source.id)) errors.push(`${resource.path}: duplicate source register ${source.id}`);
      sourceRegisters.set(source.id, source.governanceDocumentReference);
      if (!repositoryPath || !fs.existsSync(path.join(root, repositoryPath))) {
        errors.push(`${resource.path}: governance presentation register does not resolve: ${source.governanceDocumentReference}`);
      }
    }
    if (resource.id === primaryRisks.id) {
      if (sourceRegisters.get('WG-REG-001') !== 'WG-REG-001') {
        errors.push('risks: WG-REG-001 presentation register identity is missing');
      }
      if (sourceRegisters.get('WG-REG-002') !== 'WG-REG-002') {
        errors.push('risks: WG-REG-002 presentation register identity is missing');
      }
    }
  }

  const riskEntries = inventory.entriesForKind('risks');
  for (const { resource, record } of riskEntries) {
    if (record.framework === 'security' && !record.id.startsWith('SEC-RISK-')) {
      errors.push(`${record.id}: framework must match SEC-RISK prefix (${resource.path})`);
    }
    if (record.framework === 'ai' && !record.id.startsWith('AI-RISK-')) {
      errors.push(`${record.id}: framework must match AI-RISK prefix (${resource.path})`);
    }
    try {
      deriveRiskRecord(record);
    } catch (error) {
      errors.push(`${record.id ?? resource.id}: risk score cannot derive a canonical rating: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length) {
    console.error('Assurance validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    return false;
  }
  console.log(`Assurance validation passed for ${evidenceEntries.length} evidence locators and ${riskEntries.length} risk records across all registered partitions.`);

  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!runAssuranceRecordValidation()) process.exitCode = 1;
}
