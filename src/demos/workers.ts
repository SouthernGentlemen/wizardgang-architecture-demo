import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "workers",
  "route": "/workers",
  "title": "Cloudflare Workers",
  "group": "Platform",
  "sourcePath": "src/demos/workers.ts",
  "summary": "Stateless TypeScript application compute and the mediation layer between clients, platform state, and integrations.",
  "proves": [
    "Bounded TypeScript computation inside a Worker request",
    "No process-memory persistence",
    "D1 is used only for audit evidence, not computation state"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/__api/workers/compute", "description": "Compute a bounded sum, average, minimum, or maximum." }],
  "supportingSources": [{ "label": "View runtime API", "path": "src/api/runtime.ts" }, { "label": "View Worker entry point", "path": "src/index.ts" }],
  "action": { "label": "Run stateless average", "method": "POST", "path": "/__api/workers/compute", "body": { "operation": "average", "values": [8, 13, 21, 34] } }
};

export default demo;
