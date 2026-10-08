#!/usr/bin/env node
import {
  assuranceRecordEntries,
  loadAssuranceRegistry,
  readJsonFile,
  requireAssuranceCapabilityResource,
} from './lib/assurance-registry.ts';
import {
  deriveRuntimeSourceRevisions,
  verifyLifecycleBaselineMembership,
} from './generate-assurance-runtime-binding.ts';
import {
  assurancePublicationDecision,
  disclosureReviewIsPublishable,
  resolveAssuranceLifecycle,
} from '../src/assurance/publication-policy.ts';

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createAssuranceValidationContext } from './lib/assurance-validation-context.ts';

export function runAssurancePublicationValidation(context = createAssuranceValidationContext()) {
  const root = context.root;
  const errors = [];

  try {
    const registry = context.registry();
    const lifecycleResource = requireAssuranceCapabilityResource(registry, 'lifecycle');
    const lifecycle = readJsonFile(root, lifecycleResource.path);
    const baselineMembership = verifyLifecycleBaselineMembership(registry, root);
    const sourceRevisions = deriveRuntimeSourceRevisions(registry, root);
    const entries = assuranceRecordEntries(registry, (resource) => readJsonFile(root, resource.path));

    for (const { resource, record } of entries) {
      if (!record || typeof record !== 'object' || Array.isArray(record) || typeof record.id !== 'string') continue;
      const resourceRevision = sourceRevisions[resource.id];
      if (!resourceRevision) {
        errors.push(`${record.id}: registered source revision is unresolved for ${resource.id}`);
        continue;
      }
      const decision = assurancePublicationDecision(
        resource,
        lifecycle,
        record.id,
        { baselineMembership, resourceRevision },
      );
      if (!decision.selected) {
        errors.push(`${record.id}: public assurance record is not publishable (${decision.reason})`);
      }
    }

    for (const retired of lifecycle.retiredRecords ?? []) {
      const resolved = resolveAssuranceLifecycle(lifecycle, retired.id, { baselineMembership });
      if (!resolved || resolved.source !== 'retired') {
        errors.push(`${retired.id}: retained lifecycle record could not be resolved`);
        continue;
      }
      if (!disclosureReviewIsPublishable(resolved.disclosureReview)) {
        errors.push(`${retired.id}: retained lifecycle record requires a Reviewed disclosure review reference`);
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  if (errors.length > 0) {
    console.error('Assurance publication policy validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    return false;
  }

  console.log('Assurance publication policy validation passed: public visibility, lifecycle authority, frozen historical membership, and exact source-revision disclosure approvals are consistent.');

  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!runAssurancePublicationValidation()) process.exitCode = 1;
}
