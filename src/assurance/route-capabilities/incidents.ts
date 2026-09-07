import { assuranceIncidentsResponse } from '../../api/assurance';
import { defineAssuranceRouteCapability } from '../route-capability';

export const incidentsRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'incidents',
  apiCollection: {
    handler: (request, env) => assuranceIncidentsResponse(request, env),
    source: {
      module: 'src/api/assurance.ts',
      exportName: 'assuranceIncidentsResponse',
      tests: ['tests/assurance-incidents.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
