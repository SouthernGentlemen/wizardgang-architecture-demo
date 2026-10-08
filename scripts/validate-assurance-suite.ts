import { createAssuranceValidationContext, withAssuranceValidationContext } from './lib/assurance-validation-context.ts';
import { runAssuranceRegistryValidation } from './validate-assurance-registry.ts';
import { runAssuranceRecordValidation } from './validate-assurance.ts';
import { runAdvisoryValidation } from './validate-advisories.ts';
import { runAssuranceProjectionValidation } from './validate-assurance-projection.ts';
import { runAssuranceDocumentationValidation } from './validate-assurance-documentation.ts';
import { runIso27001Validation } from './validate-iso27001-compliance.ts';
import { runIso42001Validation } from './validate-iso42001-compliance.ts';
import { runWcagValidation } from './validate-wcag-compliance.ts';
import { runAssurancePublicationValidation } from './validate-assurance-publication.ts';
import { runAssuranceLifecycleValidation } from './validate-assurance-lifecycle.ts';
import { runAssuranceIntegrityValidation } from './validate-assurance-integrity.ts';
import { runAssuranceOperationsValidation } from './validate-assurance-operations.ts';

// Each owner is invoked exactly once in a single Node process. Standalone CLI
// entrypoints use the same predicates for negative-case fixture coverage.
const context = createAssuranceValidationContext();
const validators = [
  ['registry/schema', runAssuranceRegistryValidation],
  ['records/risks', runAssuranceRecordValidation],
  ['advisories', (ctx) => runAdvisoryValidation(ctx.root, ctx) === 0],
  ['projection/absolute URLs', runAssuranceProjectionValidation],
  ['documentation/anchors', runAssuranceDocumentationValidation],
  ['ISO/IEC 27001', runIso27001Validation],
  ['ISO/IEC 42001', runIso42001Validation],
  ['WCAG 2.2', runWcagValidation],
  ['publication', runAssurancePublicationValidation],
  ['lifecycle/history', runAssuranceLifecycleValidation],
  ['integrity/relationships/freshness', runAssuranceIntegrityValidation],
  ['security disclosure/operations', runAssuranceOperationsValidation],
];

await withAssuranceValidationContext(context, async () => {
  let failures = 0;
  for (const [label, validate] of validators) {
    try {
      if ((await validate(context)) !== true) failures += 1;
    } catch (error) {
      failures += 1;
      console.error(`Assurance ${label} validation could not complete: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log(`Assurance execution: one shared context, ${validators.length} domain owners, ${failures} failures.`);
  if (failures) process.exitCode = 1;
});
