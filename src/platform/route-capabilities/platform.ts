import {
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../route-capability';

const tests = [
  'tests/platform-laboratory-routing.test.ts',
  'tests/router.test.ts',
  'tests/interface.test.ts',
  'tests/application-route-registry.test.ts',
] as const;

export const platformPageCapability = definePlatformLaboratoryCapability({
  id: 'platform.surface',
  routes: [
    {
      id: 'platform.index',
      pattern: '/platform',
      methods: ['GET'],
      kind: 'page',
      handler: async (request, env) => {
        const [{ platformContent }, { renderNotFound, renderPage }] = await Promise.all([
          import('../../demos/platform'),
          import('../../ui/page'),
        ]);
        if (new URL(request.url).searchParams.has('view')) return renderNotFound(env);
        return renderPage(env, platformContent(env));
      },
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'allow' },
      documentation: {
        title: 'Platform demonstrations',
        description: 'Index of canonical Cloudflare platform demonstration routes.',
        docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'],
      },
      source: {
        module: 'src/demos/platform.ts',
        exportName: 'platformContent',
        tests,
      },
      requestLimits: noRequestBody('GET renders registered platform child routes and consumes no request body.'),
      storage: NO_STORAGE,
      page: {
        parent: 'interfaces.frontend.index',
        label: 'Platform',
        summary: 'Cloudflare edge, compute, coordination, relational, and object-storage demonstrations.',
        order: 1,
        navigation: 'primary',
        architectureMap: true,
      },
    },
  ],
});
