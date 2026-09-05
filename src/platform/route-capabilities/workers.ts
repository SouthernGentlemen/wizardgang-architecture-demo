import workersDemo from '../../demos/workers';
import { workerComputeResponse } from '../../api/runtime';
import {
  STATELESS_COMPUTE_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
  renderRegisteredDemo,
} from '../route-capability';

const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/runtime.test.ts', 'tests/router.test.ts'] as const;

export const workersLaboratoryCapability = definePlatformLaboratoryCapability({
  id: 'platform.workers',
  routes: [
    {
      id: 'platform.workers.page',
      pattern: workersDemo.route,
      methods: ['GET'],
      kind: 'page',
      handler: (_request, env) => renderRegisteredDemo(env, workersDemo),
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'allow' },
      documentation: {
        title: workersDemo.title,
        description: workersDemo.summary,
        docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'],
      },
      source: {
        module: 'src/platform/route-capabilities/workers.ts',
        exportName: 'workersLaboratoryCapability',
        tests,
      },
      requestLimits: noRequestBody('The Worker computation page accepts GET without a request body.'),
      storage: STATELESS_COMPUTE_STORAGE,
    },
    {
      id: 'platform.workers.compute',
      pattern: '/__api/workers/compute',
      methods: ['POST'],
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
        title: 'Worker computation API',
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
