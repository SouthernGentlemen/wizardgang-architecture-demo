#!/usr/bin/env node
import {
  assuranceRecordEntries,
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
  readJsonFile,
} from './lib/assurance-registry.mjs';
import {
  assurancePublicationDecision,
  disclosureReviewIsPublishable,
  resolveAssuranceLifecycle,
} from '../src/assurance/publication-policy.js';

const root = process.cwd();
const errors = [];

try {
  const registry = loadAssuranceRegistry(root);
  const resources = flattenAssuranceRegistry(registry);
  const lifecycleResource = resources.find((resource) => resource.capabilities?.includes('lifecycle'));
  if (!lifecycleResource) {
    errors.push('assurance/registry.json: missing lifecycle control-plane resource');
  } else {
    const lifecycle = readJsonFile(root, lifecycleResource.path);
    const entries = assuranceRecordEntries(registry, (resource) => readJsonFile(root, resource.path));

    for (const { resource, record } of entries) {
      if (!record || typeof record !== 'object' || Array.isArray(record) || typeof record.id !== 'string') continue;
      const decision = assurancePublicationDecision(resource, lifecycle, record.id);
      if (!decision.selected) {
        errors.push(`${record.id}: public assurance record is not publishable (${decision.reason})`);
      }
    }

    for (const retired of lifecycle.retiredRecords ?? []) {
      const resolved = resolveAssuranceLifecycle(lifecycle, retired.id, { baselineEligible: false });
      if (!resolved || resolved.source !== 'retired') {
        errors.push(`${retired.id}: retained lifecycle record could not be resolved`);
        continue;
      }
      if (!disclosureReviewIsPublishable(resolved.disclosureReview)) {
        errors.push(`${retired.id}: retained lifecycle record requires Reviewed disclosure metadata`);
      }
    }
  }
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

if (errors.length > 0) {
  console.error('Assurance publication policy validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Assurance publication policy validation passed: public visibility, disclosure review, and lifecycle selection are consistent.');
