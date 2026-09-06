import graphqlDemo from '../../demos/graphql';
import { graphqlResponse, graphqlSchemaResponse } from '../../api/graphql';
import { renderGraphqlDemo } from '../../demos/graphql-console';
import { graphiqlAssetResponse, localGraphiqlResponse } from '../../ui/graphiql-assets';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

function wantsGraphqlPage(request: Request): boolean {
  if (request.method !== 'GET') return false;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') || accept === '';
}

export const graphqlRouteCapability = defineInterfaceIdentityCapability('interfaces.graphql', [
  interfaceIdentityRoute({
    id: 'interfaces.graphql.endpoint',
    pattern: graphqlDemo.route,
    methods: ['GET', 'POST'],
    kind: 'protocol',
    handler: (request, { env }) => wantsGraphqlPage(request) ? renderGraphqlDemo(env) : graphqlResponse(request, env),
    title: graphqlDemo.title,
    description: 'GraphQL protocol endpoint with HTML content negotiation, bounded execution, and the shared application authorization policy.',
    sourceModule: 'src/api/graphql.ts',
    sourceExport: 'graphqlResponse',
    authentication: { mode: 'anonymous' },
    authorization: { mode: 'policy', policy: 'demo:read; mutations require demo:write' },
    sameOrigin: { mode: 'required', methods: ['POST'] },
    browserHtml: 'graphql',
    indexing: 'allow',
    tests: ['tests/graphql.test.ts', 'tests/integration-interfaces.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.graphql.console',
    pattern: '/graphql/console',
    methods: ['GET'],
    kind: 'page',
    handler: (request) => localGraphiqlResponse(request),
    title: 'GraphiQL console',
    description: 'Locally bundled GraphiQL execution console for the GraphQL endpoint.',
    sourceModule: 'src/ui/graphiql-assets.ts',
    sourceExport: 'localGraphiqlResponse',
    indexing: 'deny',
    browserHtml: 'never',
    tests: ['tests/graphql.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.graphql.schema',
    pattern: '/graphql/schema',
    methods: ['GET'],
    kind: 'protocol',
    handler: (request) => graphqlSchemaResponse(request),
    title: 'GraphQL schema',
    description: 'Executable GraphQL schema contract.',
    sourceModule: 'src/api/graphql.ts',
    sourceExport: 'graphqlSchemaResponse',
    cache: { mode: 'public', maxAgeSeconds: 300 },
    tests: ['tests/graphql.test.ts', 'tests/contracts.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.graphql.asset',
    pattern: '/__assets/graphiql/:asset',
    methods: ['GET'],
    kind: 'asset',
    handler: (request, _context, params) => graphiqlAssetResponse(request, params.asset || ''),
    title: 'GraphiQL local asset',
    description: 'Immutable locally bundled GraphiQL script, stylesheet, or worker asset.',
    sourceModule: 'src/ui/graphiql-assets.ts',
    sourceExport: 'graphiqlAssetResponse',
    cache: { mode: 'public', maxAgeSeconds: 31_536_000, immutable: true },
    browserHtml: 'page',
    tests: ['tests/graphql.test.ts'],
  }),
]);
