import type { DemoDefinition, Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { demoContent, type PageContent } from '../ui/page';

const demo: DemoDefinition = {
  "id": "workers",
  "title": "Cloudflare Workers",
  "group": "Platform",
  "sourcePath": "src/demos/workers.ts",
  "summary": "Apply an edge cache and routing policy before a request reaches origin.",
  "proves": [
    "A Worker inspects request method, path, and credentials at the edge",
    "Cacheability and routing are decided before origin work",
    "The policy decision is stateless and uses no process-memory persistence"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/api/labs/workers", "description": "Apply an edge cache and routing policy to a request." }],
  "supportingSources": [{ "label": "View runtime API", "path": "src/api/runtime.ts" }, { "label": "View Worker entry point", "path": "src/index.ts" }],
  "action": { "label": "Apply edge request policy", "method": "POST", "path": "/api/labs/workers", "body": { "operation": "edge-policy", "request": { "method": "GET", "path": "/assets/architecture-map.svg", "hasCookie": false, "hasAuthorization": false } } }
};

export function workersContent(env: Env): PageContent {
  return demoContent(env, { ...demo, route: routeUrl('platform.workers') });
}

export default demo;
