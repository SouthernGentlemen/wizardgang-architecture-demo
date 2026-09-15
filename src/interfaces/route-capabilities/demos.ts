import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const demosRouteCapability = defineInterfaceIdentityCapability('demos.surface', [
  interfaceIdentityRoute({
    id: 'demos.index',
    pattern: '/demos',
    methods: ['GET'],
    kind: 'page',
    handler: async (request, { env }) => {
      const [{ demosContent }, { renderNotFound, renderPage }] = await Promise.all([
        import('../../demos/demos-page'),
        import('../../ui/page'),
      ]);
      if (new URL(request.url).searchParams.has('view')) return renderNotFound(env);
      return renderPage(env, await demosContent(request, env));
    },
    title: 'Architecture Demos',
    description: 'One task-oriented destination for the interactive architecture demonstrations.',
    sourceModule: 'src/demos/demos-page.ts',
    sourceExport: 'demosContent',
    docs: ['docs/FRONTEND-ROUTES.md', 'docs/ROUTES.md'],
    tests: ['tests/demos-consolidation.test.ts', 'tests/router.test.ts', 'tests/interface.test.ts'],
    page: {
      parent: 'interfaces.frontend.index',
      label: 'Demos',
      summary: 'Execute and inspect the architecture demonstrations from one stable destination.',
      order: 1,
      navigation: 'primary',
      architectureMap: true,
    },
  }),
  interfaceIdentityRoute({
    id: 'demos.presentation',
    pattern: '/api/demos/:demo',
    methods: ['GET'],
    kind: 'api',
    handler: async (request, { env }, params) => {
      const { demoPresentationResponse } = await import('../../demos/demos-page');
      return demoPresentationResponse(request, env, params.demo ?? '');
    },
    title: 'Lazy demo presentation fragment',
    description: 'Returns one scoped demonstration presentation for activation inside the consolidated demos page.',
    sourceModule: 'src/demos/demos-page.ts',
    sourceExport: 'demoPresentationResponse',
    tests: ['tests/demos-consolidation.test.ts', 'tests/router.test.ts'],
  }),
]);
