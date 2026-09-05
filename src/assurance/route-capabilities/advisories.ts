import { assuranceAdvisoriesResponse } from '../../api/advisories';
import { renderSecurity } from '../../demos/security-page';
import { defineAssuranceRouteCapability } from '../route-capability';

export const advisoriesRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'advisories',
  html: {
    handler: (_request, env) => renderSecurity(env),
    offline: 'available',
    source: {
      module: 'src/demos/security-page.ts',
      exportName: 'renderSecurity',
      tests: ['tests/security.test.ts', 'tests/router.test.ts'],
    },
  },
  apiCollection: {
    handler: (request) => assuranceAdvisoriesResponse(request),
    source: {
      module: 'src/api/advisories.ts',
      exportName: 'assuranceAdvisoriesResponse',
      tests: ['tests/assurance-advisories.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
