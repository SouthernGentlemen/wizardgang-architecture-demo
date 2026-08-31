import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "rest",
  "route": "/api/rest",
  "title": "REST / JSON",
  "group": "Integration",
  "sourcePath": "src/demos/rest.ts",
  "summary": "Conventional RESTful integration using JSON payloads and explicit resource endpoints.",
  "proves": [
    "GET, POST, and DELETE resource semantics",
    "JSON content negotiation and bounded validation",
    "D1-backed data with shared read/write authorization"
  ],
  "status": "working",
  "interfaces": [
    { "method": "GET", "path": "/v1/demo-records", "description": "List records as JSON." },
    { "method": "POST", "path": "/v1/demo-records", "description": "Bearer-protected record upsert." },
    { "method": "DELETE", "path": "/v1/demo-records/{key}", "description": "Bearer-protected record deletion." }
  ],
  "supportingSources": [
    { "label": "View REST implementation", "path": "src/api/records.ts" },
    { "label": "View Swagger 2.x contract", "path": "contracts/openapi/swagger.json" }
  ]
};

export default demo;
