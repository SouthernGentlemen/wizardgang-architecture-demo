#!/usr/bin/env node
import {
  assuranceRecordEntries,
  loadAssuranceRegistry,
  readJsonFile,
  requireAssuranceCapabilityResource,
} from './lib/assurance-registry.mjs';
import {
  deriveLifecycleBaselineMembership,
  LIFECYCLE_BASELINE_MEMBERSHIP_PATH,
} from './generate-assurance-runtime-binding.mjs';
import {
  assurancePublicationDecision,
  disclosureReviewIsPublishable,
  resolveAssuranceLifecycle,
} from '../src/assurance/publication-policy.js';

const root = process.cwd();
const errors = [];

try {
  const registry = loadAssuranceRegistry(root);
  const lifecycleResource = requireAssuranceCapabilityResource(registry, 'lifecycle');
  const lifecycle = readJsonFile(root, lifecycleResource.path);
  const generatedMembership = readJsonFile(root, LIFECYCLE_BASELINE_MEMBERSHIP_PATH);
  const baselineMembership = deriveLifecycleBaselineMembership(registry, root);
  const lifecycleResolutionOptions = { baselineMembership };
  const entries = assuranceRecordEntries(registry, (resource) => readJsonFile(root, resource.path));

  if (JSON.stringify(generatedMembership) !== JSON.stringify(baselineMembership)) {
    errors.push(`${LIFECYCLE_BASELINE_MEMBERSHIP_PATH}: generated baseline membership does not match the immutable lifecycle baseline`);
  }

  for (const { resource, record } of entries) {
    if (!record || typeof record !== 'object' || Array.isArray(record) || typeof record.id !== 'string') continue;
    const decision = assurancePublicationDecision(
      resource,
      lifecycle,
      record.id,
      lifecycleResolutionOptions,
    );
    if (!decision.selected) {
      errors.push(`${record.id}: public assurance record is not publishable (${decision.reason})`);
    }
  }

  for (const retired of lifecycle.retiredRecords ?? []) {
    const resolved = resolveAssuranceLifecycle(lifecycle, retired.id, lifecycleResolutionOptions);
    if (!resolved || resolved.source !== 'retired') {
      errors.push(`${retired.id}: retained lifecycle record could not be resolved`);
      continue;
    }
    if (!disclosureReviewIsPublishable(resolved.disclosureReview)) {
      errors.push(`${retired.id}: retained lifecycle record requires Reviewed disclosure metadata`);
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

console.log('Assurance publication policy validation passed: public visibility, disclosure review, and verified lifecycle baseline membership are consistent.');
