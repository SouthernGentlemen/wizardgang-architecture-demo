import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const interfacesRouteCapability = defineInterfaceIdentityCapability('interfaces.surface', [
  interfaceIdentityRoute({
    id: 'interfaces.index',
    pattern: '/interfaces',
    methods: ['GET'],
    kind: 'page',
    handler: async (request, { env }) => {
      const [{ interfacesContent }, { renderNotFound, renderPage }] = await Promise.all([
        import('../../demos/interfaces'),
        import('../../ui/page'),
      ]);
      if (new URL(request.url).searchParams.has('view')) return renderNotFound(env);
      return renderPage(env, interfacesContent(env));
    },
    title: 'Application interfaces',
    description: 'Index of canonical application interface demonstration routes.',
    sourceModule: 'src/demos/interfaces.ts',
    sourceExport: 'interfacesContent',
    tests: ['tests/interface-consolidation.test.ts', 'tests/router.test.ts', 'tests/interface.test.ts', 'tests/application-route-registry.test.ts'],
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Interfaces',
      summary: 'REST, GraphQL, webhooks, identity, MCP, internationalization, and accessibility surfaces.',
      order: 2,
      navigation: 'primary',
      architectureMap: true,
    },
  }),
]);
