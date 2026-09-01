import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "d1",
  "route": "/d1",
  "title": "Cloudflare D1",
  "group": "Platform",
  "sourcePath": "src/demos/d1.ts",
  "summary": "Isolated Users and Tasks CRUD with live parameterized SQL, timing, row counts, shared GraphQL data, and resettable D1 state.",
  "proves": [
    "Shared DEMO_DB binding",
    "Session-scoped Users and Tasks CRUD against demo-blob",
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
    { "label": "View visitor sandbox", "path": "src/lib/demo-session.ts" },
    { "label": "View interactive schema", "path": "migrations/0008_interactive_demo.sql" }
  ]
};

export default demo;
