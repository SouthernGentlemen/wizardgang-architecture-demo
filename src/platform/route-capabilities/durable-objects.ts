import { durableCounterResponse } from '../../api/durable';
import {
  DURABLE_OBJECT_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../route-capability';

const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/runtime.test.ts', 'tests/router.test.ts'] as const;

export const durableObjectsLaboratoryCapability = definePlatformLaboratoryCapability({
  id: 'platform.durable-objects',
  routes: [

{
  id: 'platform.durable-objects',
  pattern: '/platform/durable-objects',
  methods: ['GET'],
  kind: 'page',
  handler: async (_request, env) => {
    const [{ durableObjectsContent }, { renderPage }] = await Promise.all([import('../../demos/durable-objects'), import('../../ui/page')]);
    return renderPage(env, { ...durableObjectsContent(env), routeId: 'platform.durable-objects' });
  },
  authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, visibility: 'public',
  sameOrigin: { mode: 'not-required' }, offline: { mode: 'gated' }, cache: { mode: 'no-store' },
  crawler: { crawling: 'controlled', indexing: 'allow' },
  documentation: { title: 'Durable Objects', description: 'Coordinated stateful compute for cases where independent Worker requests must agree on shared state.', docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'] },
  source: { module: 'src/demos/durable-objects.ts', exportName: 'durableObjectsContent', tests },
  requestLimits: noRequestBody('GET renders the Durable Object laboratory and consumes no request body.'), storage: DURABLE_OBJECT_STORAGE,
  page: { parent: 'platform.index', label: 'Durable Objects', summary: 'Coordinated stateful compute where independent Worker requests must agree on shared state.', order: 2, navigation: 'secondary', architectureMap: true },
},
    {
      id: 'platform.durable-objects.counter',
      labId: 'durable-counter',
      pattern: '/api/labs/durable-counter',
      methods: ['GET', 'POST'],
      requestSchemas: { GET: 'none', POST: 'none' },
      kind: 'api',
      handler: (request, env) => durableCounterResponse(request, env),
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Durable Object counter laboratory API',
        description: 'Reads or increments the public counter coordinated and persisted by a Durable Object.',
        docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'],
      },
      source: {
        module: 'src/platform/route-capabilities/durable-objects.ts',
        exportName: 'durableObjectsLaboratoryCapability',
        tests,
      },
      requestLimits: noRequestBody('GET and POST use the method as the operation and do not consume a request body.'),
      storage: DURABLE_OBJECT_STORAGE,
    },
  ],
});
