import { assuranceRisksResponse } from '../../api/assurance';
import { defineAssuranceRouteCapability } from '../route-capability';

export const risksRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'risks',
  apiCollection: {
    handler: (request, env) => assuranceRisksResponse(request, env),
    source: {
      module: 'src/api/assurance.ts',
      exportName: 'assuranceRisksResponse',
      tests: ['tests/assurance-risks.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
