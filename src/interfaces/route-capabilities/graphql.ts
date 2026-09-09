import { graphqlResponse } from '../../api/graphql';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

function machineOnlyGraphqlRequest(request: Request): Request {
  if (request.method !== 'GET' || !(request.headers.get('accept') || '').includes('text/html')) return request;
  const headers = new Headers(request.headers);
  headers.set('accept', 'application/graphql-response+json, application/json');
  return new Request(request, { headers });
}

export const graphqlRouteCapability = defineInterfaceIdentityCapability('interfaces.graphql', [

interfaceIdentityRoute({
  id: 'interfaces.graphql.console', pattern: '/interfaces/graphql', methods: ['GET'], kind: 'page',
  handler: async (_request, { env }) => { const [{ graphqlContent }, { renderPage }] = await Promise.all([import('../../demos/graphql-console'), import('../../ui/page')]); return renderPage(env, { ...graphqlContent(env), routeId: 'interfaces.graphql.console' }); },
  title: 'GraphQL console', description: 'Run public GraphQL examples against the shared D1-backed schema and bundled GraphiQL IDE.',
  sourceModule: 'src/demos/graphql-console.ts', sourceExport: 'graphqlContent', tests: ['tests/interface-consolidation.test.ts', 'tests/graphql.test.ts'],
  page: { parent: 'interfaces.index', label: 'GraphQL', summary: 'Working public query examples plus an accessible first-party query runner.', order: 1, navigation: 'secondary', architectureMap: true },
}),
  interfaceIdentityRoute({
    id: 'interfaces.graphql.endpoint',
    pattern: '/graphql',
    methods: ['GET', 'POST'],
    kind: 'protocol',
    handler: (request, { env }) => graphqlResponse(machineOnlyGraphqlRequest(request), env),
    title: 'GraphQL API',
    description: 'Machine-only GraphQL protocol endpoint with bounded execution and the shared application authorization policy.',
    sourceModule: 'src/api/graphql.ts',
    sourceExport: 'graphqlResponse',
    authentication: { mode: 'anonymous' },
    authorization: { mode: 'policy', policy: 'demo:read; mutations require demo:write' },
    sameOrigin: { mode: 'required', methods: ['POST'] },
    browserHtml: 'never',
    indexing: 'deny',
    tests: ['tests/graphql.test.ts', 'tests/interface-consolidation.test.ts', 'tests/canonical-frontend-routes.test.ts'],
  }),
]);
