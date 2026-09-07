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
      id: 'platform.durable-objects.counter',
      pattern: '/__api/durable/counter',
      methods: ['GET', 'POST'],
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
        title: 'Durable Object counter API',
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
