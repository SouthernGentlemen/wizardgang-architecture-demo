import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const interfacesRouteCapability = defineInterfaceIdentityCapability('interfaces.page', [
  interfaceIdentityRoute({
    id: 'interfaces.page',
    pattern: '/interfaces',
    methods: ['GET'],
    kind: 'page',
    handler: async (request, { env }) => {
      const { renderInterfaces } = await import('../../demos/interfaces');
      return renderInterfaces(request, env);
    },
    title: 'Interfaces',
    description: 'One server-rendered surface for REST, GraphQL, webhooks, identity, MCP, internationalization, and accessibility.',
    sourceModule: 'src/demos/interfaces.ts',
    sourceExport: 'renderInterfaces',
    tests: ['tests/interface-consolidation.test.ts', 'tests/interface.test.ts'],
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Interfaces',
      summary: 'One server-rendered surface for REST, GraphQL, webhooks, identity, MCP, internationalization, and accessibility.',
      order: 2,
      navigation: 'primary',
      architectureMap: true,
    },
  }),
]);
