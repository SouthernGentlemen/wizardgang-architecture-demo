import { renderInterfaces } from '../../demos/interfaces';
import { frontendSurface } from '../../demos/registry';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

const interfacesSurface = frontendSurface('interfaces.page');

export const interfacesRouteCapability = defineInterfaceIdentityCapability('interfaces.page', [
  interfaceIdentityRoute({
    id: 'interfaces.page',
    pattern: interfacesSurface.route,
    methods: ['GET'],
    kind: 'page',
    handler: (request, { env }) => renderInterfaces(request, env),
    title: interfacesSurface.title,
    description: interfacesSurface.summary,
    sourceModule: 'src/demos/interfaces.ts',
    sourceExport: 'renderInterfaces',
    tests: ['tests/interface-consolidation.test.ts', 'tests/interface.test.ts'],
  }),
]);
