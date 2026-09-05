import { assuranceEvidenceResponse } from '../../api/assurance-registry';
import { renderEvidenceDemo } from '../../demos/evidence-page';
import { defineAssuranceRouteCapability } from '../route-capability';

export const evidenceRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'evidence',
  html: {
    handler: renderEvidenceDemo,
    source: {
      module: 'src/demos/evidence-page.ts',
      exportName: 'renderEvidenceDemo',
      tests: ['tests/assurance-route-contract.test.ts', 'tests/router.test.ts'],
    },
  },
  apiCollection: {
    handler: assuranceEvidenceResponse,
    source: {
      module: 'src/api/assurance-registry.ts',
      exportName: 'assuranceEvidenceResponse',
      tests: ['tests/assurance-api.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
