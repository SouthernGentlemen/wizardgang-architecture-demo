import { edgeInspectionResponse } from '../../api/runtime';
import {
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../route-capability';

const tests = ['tests/platform-laboratory-routing.test.ts', 'tests/router.test.ts'] as const;

export const edgeLaboratoryCapability = definePlatformLaboratoryCapability({
  id: 'platform.edge',
  routes: [

{
  id: 'platform.edge',
  pattern: '/platform/edge',
  methods: ['GET'],
  kind: 'page',
  handler: async (_request, env) => {
    const [{ edgeContent }, { renderPage }] = await Promise.all([import('../../demos/edge'), import('../../ui/page')]);
    return renderPage(env, { ...edgeContent(env), routeId: 'platform.edge' });
  },
  authentication: { mode: 'anonymous' }, authorization: { mode: 'none' }, visibility: 'public',
  sameOrigin: { mode: 'not-required' }, offline: { mode: 'gated' }, cache: { mode: 'no-store' },
  crawler: { crawling: 'controlled', indexing: 'allow' },
  documentation: { title: 'Cloudflare Edge', description: 'Public edge boundary for DNS, TLS, CDN, routing, traffic filtering, rate controls, and security policy.', docs: ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'] },
  source: { module: 'src/demos/edge.ts', exportName: 'edgeContent', tests },
  requestLimits: noRequestBody('GET renders the edge laboratory and consumes no request body.'), storage: NO_STORAGE,
  page: { parent: 'platform.index', label: 'Edge', summary: 'Public edge boundary for DNS, TLS, CDN, routing, traffic filtering, rate controls, and security policy.', order: 0, navigation: 'secondary', architectureMap: true },
},
    {
      id: 'platform.edge.inspect',
      labId: 'edge',
      pattern: '/api/labs/edge',
      methods: ['GET'],
      requestSchemas: { GET: 'none' },
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
        title: 'Edge inspection laboratory API',
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
