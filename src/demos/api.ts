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
    "Signed webhook delivery verifies HMAC integrity and rejects replay"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View REST implementation", "path": "src/api/records.ts" },
    { "label": "View shared authorization", "path": "src/lib/authorization.ts" },
    { "label": "View Swagger contract", "path": "contracts/openapi/swagger.json" },
    { "label": "View GraphQL implementation", "path": "src/api/graphql.ts" },
    { "label": "View webhook implementation", "path": "src/api/webhooks.ts" }
  ],
  "actions": [
    {
      "id": "openapi",
      "title": "OpenAPI / Swagger 2.x",
      "description": "Fetch the machine-readable contract that documents the REST resource, payloads, authorization, responses, and failures.",
      "label": "Fetch the live API contract",
      "method": "GET",
      "path": "/v1/openapi.json"
    },
    {
      "id": "graphql",
      "title": "GraphQL",
      "description": "Query the same D1 records through the same demo:read policy used by REST and MCP.",
      "label": "Query demo records with GraphQL",
      "method": "POST",
      "path": "/graphql",
      "body": { "query": "query Records($namespace: String) { demoRecords(namespace: $namespace) { id namespace key valueJson } }", "variables": { "namespace": "public" } }
    },
    {
      "id": "webhooks",
      "title": "Webhooks",
      "description": "Generate and verify a visitor-safe signed delivery while keeping the signing secret out of the browser and stored evidence.",
      "label": "Send a signed demo webhook",
      "method": "POST",
      "path": "/__api/webhooks/demo"
    }
  ]
};

export default demo;
