import { assuranceResponse } from '../../api/assurance-registry';
import { renderAssurance } from '../../demos/assurance';
import { defineAssuranceRouteCapability } from '../route-capability';

export const assuranceRegistryRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'wizardgang-public-assurance',
  html: {
    handler: renderAssurance,
    source: {
      module: 'src/demos/assurance.ts',
      exportName: 'renderAssurance',
      tests: ['tests/assurance-consolidation.test.ts', 'tests/router.test.ts'],
    },
  },
  apiCollection: {
    handler: assuranceResponse,
    source: {
      module: 'src/api/assurance-registry.ts',
      exportName: 'assuranceResponse',
      tests: ['tests/assurance-api.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
