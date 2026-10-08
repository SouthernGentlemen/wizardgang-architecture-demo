import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  loadAssuranceRecordInventory,
  loadAssuranceRegistry,
} from './lib/assurance-registry.ts';
import {
  ASSURANCE_DOCUMENTATION_SOURCE,
  assuranceRelationshipsForRelation,
  parseAssuranceDocumentationReference,
} from '../src/assurance/relationship-contract.ts';

import { pathToFileURL } from 'node:url';
import { createAssuranceValidationContext } from './lib/assurance-validation-context.ts';
import { headingAnchors } from './lib/markdown-headings.ts';

export function runAssuranceDocumentationValidation(context = createAssuranceValidationContext()) {
  const root = context.root;
  const errors = [];
  const registry = context.registry();
  const inventory = loadAssuranceRecordInventory(root, registry);
  const complianceEntries = inventory.entries.filter((entry) => entry.resource.kind === 'compliance');
  const complianceById = new Map(
    complianceEntries
      .filter((entry) => entry.record && typeof entry.record.id === 'string')
      .map((entry) => [entry.record.id, entry]),
  );

  function trackedMarkdownFiles() {
    const result = spawnSync('git', ['ls-files', '--', '*.md'], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`unable to list tracked Markdown: ${result.stderr.trim() || result.stdout.trim()}`);
    return result.stdout.split('\n').map((value) => value.trim()).filter(Boolean);
  }

  const markdownFiles = trackedMarkdownFiles();
  const markdownSet = new Set(markdownFiles);
  const markdownCache = new Map();
  const anchorsCache = new Map();

  function markdown(relativePath) {
    if (!markdownCache.has(relativePath)) markdownCache.set(relativePath, context.readText(relativePath));
    return markdownCache.get(relativePath);
  }

  function anchors(relativePath) {
    if (!anchorsCache.has(relativePath)) anchorsCache.set(relativePath, headingAnchors(markdown(relativePath)));
    return anchorsCache.get(relativePath);
  }

  const currentAiAssessmentPrefix = 'docs/governance/AI-IMPACT-ASSESSMENT.md#';
  const currentWcagBoundary = 'docs/ACCESSIBILITY.md#current-wcag-22-assurance-boundary';
  let documentationReferences = 0;
  let aiAssessmentReferences = 0;
  for (const entry of complianceEntries) {
    const record = entry.record;
    if (!record || typeof record.id !== 'string') continue;
    const edges = assuranceRelationshipsForRelation(record.relationships, 'documentation');
    if (record.id.startsWith('ISO42001-') && edges.some((edge) => String(edge?.to?.native ?? '').startsWith(currentAiAssessmentPrefix))) {
      aiAssessmentReferences += 1;
    }
    if (record.id.startsWith('WCAG-') && !edges.some((edge) => edge?.to?.native === currentWcagBoundary)) {
      errors.push(`${record.id}: WCAG documentation relationship must retain the current accessibility assurance boundary`);
    }
    for (const edge of edges) {
      documentationReferences += 1;
      if (edge?.to?.source !== ASSURANCE_DOCUMENTATION_SOURCE) {
        errors.push(`${record.id}: documentation source must be ${ASSURANCE_DOCUMENTATION_SOURCE}`);
        continue;
      }
      const parsed = parseAssuranceDocumentationReference(edge?.to?.native);
      if (!parsed) {
        errors.push(`${record.id}: invalid documentation reference ${String(edge?.to?.native)}`);
        continue;
      }
      if (parsed.repositoryPath.startsWith('docs/governance/registers/') || parsed.repositoryPath.startsWith('docs/governance/soa/')) {
        errors.push(`${record.id}: documentation relationship targets retired register/SoA Markdown: ${parsed.repositoryPath}`);
        continue;
      }
      if (parsed.repositoryPath.startsWith('docs/governance/assessments/')) {
        errors.push(`${record.id}: documentation relationship targets retired historical assessment Markdown: ${parsed.repositoryPath}`);
        continue;
      }
      if (!markdownSet.has(parsed.repositoryPath)) {
        errors.push(`${record.id}: documentation file is not a tracked Markdown file: ${parsed.repositoryPath}`);
        continue;
      }
      if (!anchors(parsed.repositoryPath).has(parsed.anchor)) {
        errors.push(`${record.id}: documentation anchor #${parsed.anchor} does not match a heading in ${parsed.repositoryPath}`);
      }
    }
  }

  if (aiAssessmentReferences === 0) {
    errors.push('ISO 42001 documentation relationships must retain the current AI impact assessment authority');
  }

  if (errors.length > 0) {
    console.error('Assurance documentation reference validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    return false;
  }

  console.log(`Assurance documentation reference validation passed for ${complianceById.size} compliance records and ${documentationReferences} documentation references.`);
  console.log('Validation follows structured compliance relationships to tracked Markdown headings; Markdown does not maintain a duplicate clause/control map or assurance status.');

  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!runAssuranceDocumentationValidation()) process.exitCode = 1;
}
