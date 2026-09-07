import { assuranceRisksResponse } from '../../api/assurance';
import { renderRisks } from '../../demos/assurance-pages';
import { defineAssuranceRouteCapability } from '../route-capability';

export const risksRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'risks',
  html: {
    handler: renderRisks,
    source: {
      module: 'src/demos/assurance-pages.ts',
      exportName: 'renderRisks',
      tests: ['tests/assurance-risks.test.ts', 'tests/router.test.ts'],
    },
  },
  apiCollection: {
    handler: (request, env) => assuranceRisksResponse(request, env),
    source: {
      module: 'src/api/assurance.ts',
      exportName: 'assuranceRisksResponse',
      tests: ['tests/assurance-risks.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
