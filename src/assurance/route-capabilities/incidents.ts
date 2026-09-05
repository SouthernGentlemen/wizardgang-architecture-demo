import { assuranceIncidentsResponse } from '../../api/assurance';
import { renderIncidents } from '../../demos/assurance-pages';
import { defineAssuranceRouteCapability } from '../route-capability';

export const incidentsRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'incidents',
  html: {
    handler: (_request, env) => renderIncidents(env),
    source: {
      module: 'src/demos/assurance-pages.ts',
      exportName: 'renderIncidents',
      tests: ['tests/assurance-incidents.test.ts', 'tests/router.test.ts'],
    },
  },
  apiCollection: {
    handler: (request) => assuranceIncidentsResponse(request),
    source: {
      module: 'src/api/assurance.ts',
      exportName: 'assuranceIncidentsResponse',
      tests: ['tests/assurance-incidents.test.ts', 'tests/assurance-declarative-routing.test.ts'],
    },
  },
});
