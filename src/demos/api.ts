import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "api",
  "route": "/api",
  "title": "REST API",
  "group": "Interfaces",
  "sourcePath": "src/demos/api.ts",
  "summary": "Explore a versioned D1-backed REST API, execute live requests, and inspect the OpenAPI 3.1 contract behind it.",
  "proves": [
    "GET, POST, PUT, and DELETE retain distinct REST resource semantics",
    "Public reads and identity-derived sandbox writes cross one normalized application-principal boundary",
    "The served OpenAPI 3.1 contract generates the live endpoint navigator and code examples",
    "Every request carries a request ID into the public-safe operational log"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View REST implementation", "path": "src/api/records.ts" },
    { "label": "View shared authorization", "path": "src/lib/authorization.ts" },
    { "label": "View OpenAPI contract", "path": "contracts/openapi/openapi.json" },
    { "label": "View explorer implementation", "path": "src/demos/openapi-console.ts" }
  ]
};

export default demo;
