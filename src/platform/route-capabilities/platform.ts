import {
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../route-capability';

const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/router.test.ts', 'tests/interface.test.ts'] as const;
const docs = ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'] as const;

export const platformPageCapability = definePlatformLaboratoryCapability({
  id: 'platform.surface',
  routes: [
    {
      id: 'platform.page',
      pattern: '/platform',
      methods: ['GET'],
      kind: 'page',
      handler: async (request, env) => {
        const { renderPlatform } = await import('../../demos/platform');
        return renderPlatform(request, env);
      },
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'allow' },
      documentation: {
        title: 'Cloudflare Platform',
        description: 'One server-rendered surface for edge inspection, Worker compute, Durable Objects, D1, and R2 demonstrations.',
        docs,
      },
      source: {
        module: 'src/demos/platform.ts',
        exportName: 'renderPlatform',
        tests,
      },
      requestLimits: noRequestBody('The platform page selects a server-rendered view from the query string and consumes no request body.'),
      storage: NO_STORAGE,
      page: {
        parent: 'interfaces.frontend.index',
        label: 'Platform',
        summary: 'One server-rendered surface for edge inspection, Worker compute, Durable Objects, D1, and R2 demonstrations.',
        order: 1,
        navigation: 'primary',
        architectureMap: true,
      },
    },
  ],
});
