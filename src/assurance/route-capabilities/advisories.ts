import { defineAssuranceRouteCapability } from '../route-capability';

export const advisoriesRouteCapability = defineAssuranceRouteCapability({
  routeId: 'security.index',
  pattern: '/security',
  html: {
    handler: async (_request, env) => {
      const [{ securityContent }, { renderPage }] = await Promise.all([
        import('../../demos/security-page'),
        import('../../ui/page'),
      ]);
      return renderPage(env, { ...securityContent(env), routeId: 'security.index' });
    },
    offline: 'available',
    source: {
      module: 'src/demos/security-page.ts',
      exportName: 'securityContent',
      tests: ['tests/security.test.ts', 'tests/router.test.ts'],
    },
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Security',
      summary: 'Private vulnerability reporting, coordinated disclosure, and disclosure-safe published security advisory assurance.',
      order: 4,
      navigation: 'primary',
      architectureMap: true,
    },
  },
});
