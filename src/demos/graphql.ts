import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'graphql',
  route: '/interfaces?view=graphql',
  title: 'GraphQL API',
  group: 'Interfaces',
  sourcePath: 'src/demos/graphql.ts',
  summary: 'Query and mutate the same D1-backed users through a typed GraphQL schema and a locally bundled GraphiQL IDE.',
  proves: [
    'GraphQL Yoga executes the versioned schema against shared D1 services',
    'Queries and mutations cross the same normalized application-principal policy as REST and MCP',
    'Depth, field-count, batching, and request-size controls are enforced before execution',
    'Unexpected execution errors are masked while schema inspection remains available',
  ],
  status: 'working',
  supportingSources: [
    { label: 'View GraphQL implementation', path: 'src/api/graphql.ts' },
    { label: 'View GraphQL schema', path: 'contracts/graphql/schema.graphql' },
    { label: 'View local GraphiQL assets', path: 'src/ui/graphiql-assets.ts' },
  ],
};

export default demo;
