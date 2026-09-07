import { assuranceEvidenceResponse } from '../../api/assurance-registry';
import { defineAssuranceRouteCapability } from '../route-capability';

export const evidenceRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'evidence',
  apiCollection: {
    handler: assuranceEvidenceResponse,
    source: {
      module: 'src/api/assurance-registry.ts',
      exportName: 'assuranceEvidenceResponse',
      tests: ['tests/assurance-api.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
