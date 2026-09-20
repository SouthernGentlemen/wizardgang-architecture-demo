import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const frontendRouteCapability = defineInterfaceIdentityCapability('interfaces.frontend', [
  interfaceIdentityRoute({
    id: 'interfaces.frontend.index',
    pattern: '/',
    methods: ['GET'],
    kind: 'page',
    handler: async (_request, { env }) => {
      const { loadHomePageData, renderHome } = await import('../../ui/home');
      return renderHome(env, await loadHomePageData(env));
    },
    title: 'Architecture demo index',
    description: 'Primary public frontend entry point assembled from registered page metadata.',
    sourceModule: 'src/ui/home.tsx',
    sourceExport: 'renderHome',
    tests: ['tests/router.test.ts', 'tests/interface.test.ts', 'tests/application-route-registry.test.ts', 'tests/canonical-frontend-routes.test.ts'],
    page: {
      label: 'Architecture',
      summary: 'Primary public frontend entry point assembled from registered page metadata.',
      order: 0,
      navigation: 'primary',
      architectureMap: false,
    },
  }),
]);
