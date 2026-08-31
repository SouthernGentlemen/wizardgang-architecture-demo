import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "r2",
  "route": "/r2",
  "title": "Cloudflare R2",
  "group": "Runtime",
  "sourcePath": "src/demos/r2.ts",
  "summary": "Object storage for files, artifacts, reports, evidence, exports, and other large objects.",
  "proves": [
    "Text content stored in the DEMO_R2 bucket",
    "Object references and size metadata stored separately in D1",
    "Read/write/delete operations cross the Worker authorization boundary"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/__api/r2/demo", "description": "Write a bounded visitor demonstration object to R2." }, { "method": "GET / PUT / DELETE", "path": "/__api/r2/object?key=public/{name}", "description": "Read publicly; write and delete with bearer authorization." }],
  "supportingSources": [{ "label": "View R2 API implementation", "path": "src/api/r2.ts" }, { "label": "View R2 storage boundary", "path": "src/storage/r2.ts" }, { "label": "View R2 metadata migration", "path": "migrations/0005_capability_records.sql" }],
  "actions": [
    { "title": "Visitor-safe object write", "description": "Write a bounded demonstration object to R2 and record its non-secret metadata in D1.", "label": "Store a real R2 demo object", "method": "POST", "path": "/__api/r2/demo" },
    { "title": "Object boundary", "description": "Read the public visitor object. PUT and DELETE on this interface remain bearer protected.", "label": "Read the public R2 demo object", "method": "GET", "path": "/__api/r2/object?key=public/visitor-demo.txt" }
  ]
};

export default demo;
