import { defineAssuranceRouteCapability } from '../route-capability';

export const advisoriesRouteCapability = defineAssuranceRouteCapability({
  ownerId: 'advisories',
  html: {
    handler: async (_request, env) => {
      const { renderSecurity } = await import('../../demos/security-page');
      return renderSecurity(env);
    },
    offline: 'available',
    source: {
      module: 'src/demos/security-page.ts',
      exportName: 'renderSecurity',
      tests: ['tests/security.test.ts', 'tests/router.test.ts'],
    },
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Security',
      summary: 'Private vulnerability reporting, coordinated disclosure, and disclosure-safe published security advisory assurance.',
      order: 5,
      navigation: 'primary',
      architectureMap: true,
    },
  },
});
