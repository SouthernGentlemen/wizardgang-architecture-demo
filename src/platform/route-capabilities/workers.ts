import { workerComputeResponse } from '../../api/runtime';
import {
  STATELESS_COMPUTE_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../route-capability';

const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/runtime.test.ts', 'tests/router.test.ts'] as const;

export const workersLaboratoryCapability = definePlatformLaboratoryCapability({
  id: 'platform.workers',
  routes: [

{
  id: 'platform.workers',
  pattern: '/platform/workers',
  methods: ['GET'],
  kind: 'page',
  handler: async (_request, env) => {
    const [{ workersContent }, { renderPage }] = await Promise.all([import('../../demos/workers'), import('../../ui/page')]);
    return renderPage(env, { ...workersContent(env), routeId: 'platform.workers' });
  },
  authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, visibility: 'public',
  sameOrigin: { mode: 'not-required' }, offline: { mode: 'gated' }, cache: { mode: 'no-store' },
  crawler: { crawling: 'controlled', indexing: 'allow' },
  documentation: { title: 'Cloudflare Workers', description: 'Stateless TypeScript application compute and the mediation layer between clients, platform state, and integrations.', docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'] },
  source: { module: 'src/demos/workers.ts', exportName: 'workersContent', tests },
  requestLimits: noRequestBody('GET renders the Worker compute laboratory and consumes no request body.'), storage: STATELESS_COMPUTE_STORAGE,
  page: { parent: 'platform.index', label: 'Workers', summary: 'Stateless TypeScript application compute between clients, platform state, and integrations.', order: 1, navigation: 'secondary', architectureMap: true },
},
    {
      id: 'platform.workers.compute',
      labId: 'workers',
      pattern: '/api/labs/workers',
      methods: ['POST'],
      requestSchemas: { POST: 'worker-compute-v1' },
      kind: 'api',
      handler: (request, env) => workerComputeResponse(request, env),
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Worker computation laboratory API',
        description: 'Runs bounded stateless arithmetic in the Worker and records audit evidence separately.',
        docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'],
      },
      source: {
        module: 'src/platform/route-capabilities/workers.ts',
        exportName: 'workersLaboratoryCapability',
        tests,
      },
      requestLimits: {
        maxBodyBytes: 4_096,
        maxItems: 100,
        notes: ['JSON only; values must contain 1-100 finite numbers.'],
      },
      storage: STATELESS_COMPUTE_STORAGE,
    },
  ],
});
