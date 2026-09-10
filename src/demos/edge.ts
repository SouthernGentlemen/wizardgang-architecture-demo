import type { DemoDefinition, Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { demoContent, type PageContent } from '../ui/page';

const demo: DemoDefinition = {
  "id": "edge",
  "title": "Cloudflare Edge",
  "group": "Platform",
  "sourcePath": "src/demos/edge.ts",
  "summary": "Public edge boundary for DNS, TLS, CDN, routing, traffic filtering, rate controls, and security policy.",
  "proves": [
    "Safe Cloudflare request context without client identifiers",
    "Edge-delivered security and no-store response headers",
    "Public-safe operational evidence"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/api/labs/edge", "description": "Inspect allowlisted edge and protocol context." }],
  "supportingSources": [{ "label": "View runtime API", "path": "src/api/runtime.ts" }, { "label": "View Cloudflare route config", "path": "wrangler.jsonc" }],
  "action": { "label": "Inspect this edge request", "method": "GET", "path": "/api/labs/edge" }
};

export function edgeContent(env: Env): PageContent {
  return demoContent(env, { ...demo, route: `${routeUrl('demos.index')}#edge` });
}

export default demo;
