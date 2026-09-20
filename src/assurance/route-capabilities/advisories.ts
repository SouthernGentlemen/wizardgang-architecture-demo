import { defineAssuranceRouteCapability } from '../route-capability';

export const advisoriesRouteCapability = defineAssuranceRouteCapability({
  routeId: 'security.index',
  pattern: '/security',
  html: {
    handler: async (_request, env) => {
      const { loadSecurityPageData, renderSecurity } = await import('../../ui/security');
      return renderSecurity(env, loadSecurityPageData());
    },
    offline: 'available',
    source: {
      module: 'src/ui/security.tsx',
      exportName: 'renderSecurity',
      tests: ['tests/security.test.ts', 'tests/router.test.ts'],
    },
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Security',
      summary: 'Private vulnerability reporting, coordinated disclosure, and disclosure-safe published security advisory assurance.',
      order: 4,
      navigation: 'none',
      architectureMap: false,
    },
  },
});
