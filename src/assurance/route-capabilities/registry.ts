import { assuranceResponse } from '../../api/assurance-registry';
import { defineAssuranceRouteCapability } from '../route-capability';

export const assuranceRegistryRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'wizardgang-public-assurance',
  apiCollection: {
    handler: assuranceResponse,
    source: {
      module: 'src/api/assurance-registry.ts',
      exportName: 'assuranceResponse',
      tests: ['tests/assurance-api.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
