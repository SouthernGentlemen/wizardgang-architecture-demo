import { renderIndex } from '../../ui/page';
import { registeredDemoNavigation } from '../../routing/navigation';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const frontendRouteCapability = defineInterfaceIdentityCapability('interfaces.frontend', [
  interfaceIdentityRoute({
    id: 'interfaces.frontend.index',
    pattern: '/',
    methods: ['GET'],
    kind: 'page',
    handler: (_request, { env }) => renderIndex(env, registeredDemoNavigation()),
    title: 'Architecture demo index',
    description: 'Primary public frontend entry point assembled from registered page metadata.',
    sourceModule: 'src/ui/page.ts',
    sourceExport: 'renderIndex',
    tests: ['tests/router.test.ts', 'tests/interface.test.ts', 'tests/application-route-registry.test.ts'],
  }),
]);