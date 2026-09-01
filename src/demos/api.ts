import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "api",
  "route": "/api",
  "title": "Application Interfaces",
  "group": "Interfaces",
  "sourcePath": "src/demos/api.ts",
  "summary": "One D1-backed resource exposed through REST, a served OpenAPI contract, GraphQL, and a signed webhook workflow under shared application policy boundaries.",
  "proves": [
    "GET, POST, and DELETE REST semantics over the D1-backed record resource",
    "REST and GraphQL reads share the same demo:read authorization policy",
    "The served Swagger 2.0 contract and live router stay synchronized",
    "GitHub-compatible webhook delivery verifies HMAC integrity, repository scope, event type, and replay protection"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View REST implementation", "path": "src/api/records.ts" },
    { "label": "View shared authorization", "path": "src/lib/authorization.ts" },
    { "label": "View Swagger contract", "path": "contracts/openapi/swagger.json" },
    { "label": "View GraphQL implementation", "path": "src/api/graphql.ts" },
    { "label": "View embedded GraphiQL", "path": "src/demos/graphql-console.ts" },
    { "label": "View webhook implementation", "path": "src/api/webhooks.ts" }
  ]
};

export default demo;
