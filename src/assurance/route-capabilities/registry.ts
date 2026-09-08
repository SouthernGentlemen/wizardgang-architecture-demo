import { defineAssuranceRouteCapability } from '../route-capability';

export const assuranceRegistryRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'wizardgang-public-assurance',
  html: {
    handler: async (request, env) => {
      const { renderAssurance } = await import('../../demos/assurance');
      return renderAssurance(request, env);
    },
    source: {
      module: 'src/demos/assurance.ts',
      exportName: 'renderAssurance',
      tests: ['tests/assurance-consolidation.test.ts', 'tests/router.test.ts'],
    },
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Assurance',
      summary: 'One public assurance surface for delivery evidence, governance, compliance, risks, incidents, concerns, and evidence records.',
      order: 3,
      navigation: 'primary',
      architectureMap: true,
    },
  },
});
