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
