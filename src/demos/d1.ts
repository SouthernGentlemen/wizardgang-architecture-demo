import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "d1",
  "route": "/d1",
  "title": "Cloudflare D1",
  "group": "Runtime",
  "sourcePath": "src/demos/d1.ts",
  "summary": "Relational persistence for structured application records and audit metadata.",
  "proves": [
    "Shared DEMO_DB binding",
    "Versioned CRUD against demo-blob",
    "Relational audit and public-safe operational records"
  ],
  "status": "working",
  "interfaces": [
    { "method": "GET", "path": "/v1/demo-records?namespace=public", "description": "List public records using anonymous demo:read authorization." },
    { "method": "POST", "path": "/v1/demo-records", "description": "Create or update a bounded record using bearer-protected demo:write authorization." },
    { "method": "GET / DELETE", "path": "/v1/demo-records/{key}", "description": "Read publicly or delete with write authorization." }
  ],
  "supportingSources": [
    { "label": "View D1 API implementation", "path": "src/api/records.ts" },
    { "label": "View authorization boundary", "path": "src/lib/authorization.ts" }
  ]
};

export default demo;
