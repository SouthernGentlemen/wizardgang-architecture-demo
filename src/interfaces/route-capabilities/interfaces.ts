import interfacesDemo, { renderInterfaces } from '../../demos/interfaces';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const interfacesRouteCapability = defineInterfaceIdentityCapability('interfaces.page', [
  interfaceIdentityRoute({
    id: 'interfaces.page',
    pattern: interfacesDemo.route,
    methods: ['GET'],
    kind: 'page',
    handler: (request, { env }) => renderInterfaces(request, env),
    title: interfacesDemo.title,
    description: interfacesDemo.summary,
    sourceModule: 'src/demos/interfaces.ts',
    sourceExport: 'renderInterfaces',
    tests: ['tests/interface-consolidation.test.ts', 'tests/interface.test.ts'],
  }),
]);
