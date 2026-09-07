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
});
