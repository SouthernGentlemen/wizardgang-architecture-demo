import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "openapi",
  "route": "/api/openapi",
  "title": "OpenAPI / Swagger 2.x",
  "group": "Integration",
  "sourcePath": "src/demos/openapi.ts",
  "summary": "Machine-readable REST contract demonstrating documented endpoints, payloads, responses, and errors.",
  "proves": [
    "A served Swagger 2.0 document",
    "Documented resources, payloads, authorization, and failures",
    "Contract paths validated against the live router in CI"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/v1/openapi.json", "description": "Fetch the live Swagger 2.0 contract." }],
  "supportingSources": [{ "label": "View Swagger 2.x contract", "path": "contracts/openapi/swagger.json" }, { "label": "View contract serving code", "path": "src/api/openapi.ts" }],
  "action": { "label": "Fetch the live API contract", "method": "GET", "path": "/v1/openapi.json" }
};

export default demo;
