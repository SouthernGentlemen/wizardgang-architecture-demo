import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "api",
  "title": "REST API",
  "group": "Interfaces",
  "sourcePath": "src/demos/api.ts",
  "summary": "Explore a small anonymous REST API through an OpenAPI 3.0-style contract and live CRUD examples.",
  "proves": [
    "GET, POST, PUT, and DELETE retain distinct REST resource semantics",
    "Every visitor receives an isolated browser session for reads and writes",
    "The focused OpenAPI 3.0-style document shows method, path, body, and response examples",
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
