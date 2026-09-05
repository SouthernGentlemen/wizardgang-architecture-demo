import { demos } from '../../demos/registry';
import { renderIndex } from '../../ui/page';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const frontendRouteCapability = defineInterfaceIdentityCapability('interfaces.frontend', [
  interfaceIdentityRoute({
    id: 'interfaces.frontend.index',
    pattern: '/',
    methods: ['GET'],
    kind: 'page',
    handler: (_request, { env }) => renderIndex(env, demos),
    title: 'Architecture demo index',
    description: 'Primary public frontend entry point assembled from the demo registry.',
    sourceModule: 'src/ui/page.ts',
    sourceExport: 'renderIndex',
    tests: ['tests/router.test.ts', 'tests/interface.test.ts'],
  }),
]);
