import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "r2",
  "title": "Cloudflare R2",
  "group": "Platform",
  "sourcePath": "src/demos/r2.ts",
  "summary": "A session-isolated mini file manager backed by real R2 bytes and D1 metadata, with upload, list, preview, download, delete, and reset.",
  "proves": [
    "Uploaded file bytes stored in the DEMO_R2 bucket",
    "Object references and size metadata stored separately in D1",
    "Read/write/delete operations cross the Worker authorization boundary"
  ],
  "status": "working",
  "interfaces": [
    { "method": "GET / POST", "path": "/api/labs/r2-files", "description": "List shared seeds and visitor-owned objects, or upload a visitor-owned object." },
    { "method": "GET / DELETE", "path": "/api/labs/r2-files/{id}", "description": "Stream a visible object or delete an object owned by the current visitor sandbox." },
    { "method": "POST", "path": "/api/labs/r2-reset", "description": "Delete only the objects and metadata owned by the current visitor sandbox." }
  ],
  "supportingSources": [{ "label": "View R2 page implementation", "path": "src/demos/r2-page.ts" }, { "label": "View R2 API implementation", "path": "src/api/r2.ts" }, { "label": "View R2 metadata migration", "path": "migrations/0008_interactive_demo.sql" }]
};

export default demo;
