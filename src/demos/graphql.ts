import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "graphql",
  "route": "/api/graphql",
  "title": "GraphQL",
  "group": "Integration",
  "sourcePath": "src/demos/graphql.ts",
  "summary": "Schema-driven application interface using the same security, validation, and persistence boundaries as REST.",
  "proves": [
    "Executable schema-driven D1 query",
    "The same demo:read authorization policy used by REST and MCP",
    "Bounded query shape and public-safe operational logging"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/graphql", "description": "Execute the demoRecords query." }, { "method": "GET", "path": "/graphql/schema", "description": "Read the executable schema." }],
  "supportingSources": [{ "label": "View GraphQL implementation", "path": "src/api/graphql.ts" }, { "label": "View GraphQL schema", "path": "contracts/graphql/schema.graphql" }, { "label": "View shared authorization", "path": "src/lib/authorization.ts" }],
  "action": { "label": "Query demo records with GraphQL", "method": "POST", "path": "/graphql", "body": { "query": "query Records($namespace: String) { demoRecords(namespace: $namespace) { id namespace key valueJson } }", "variables": { "namespace": "public" } } }
};

export default demo;
