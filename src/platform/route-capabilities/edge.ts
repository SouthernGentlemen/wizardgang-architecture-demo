import edgeDemo from '../../demos/edge';
import { edgeInspectionResponse } from '../../api/runtime';
import {
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
  renderRegisteredDemo,
} from '../route-capability';

const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/router.test.ts'] as const;

export const edgeLaboratoryCapability = definePlatformLaboratoryCapability({
  id: 'platform.edge',
  routes: [
    {
      id: 'platform.edge.page',
      pattern: edgeDemo.route,
      methods: ['GET'],
      kind: 'page',
      handler: (_request, env) => renderRegisteredDemo(env, edgeDemo),
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'allow' },
      documentation: {
        title: edgeDemo.title,
        description: edgeDemo.summary,
        docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'],
      },
      source: {
        module: 'src/platform/route-capabilities/edge.ts',
        exportName: 'edgeLaboratoryCapability',
        tests,
      },
      requestLimits: noRequestBody('The edge inspection page accepts GET without a request body.'),
      storage: NO_STORAGE,
    },
    {
      id: 'platform.edge.inspect',
      pattern: '/__api/edge/inspect',
      methods: ['GET'],
      kind: 'api',
      handler: (request, env) => edgeInspectionResponse(request, env),
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Edge inspection API',
        description: 'Returns the allowlisted Cloudflare request context without client identifiers.',
        docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'],
      },
      source: {
        module: 'src/platform/route-capabilities/edge.ts',
        exportName: 'edgeLaboratoryCapability',
        tests,
      },
      requestLimits: noRequestBody('GET inspects request metadata and does not consume a request body.'),
      storage: NO_STORAGE,
    },
  ],
});
