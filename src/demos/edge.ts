import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "edge",
  "route": "/edge",
  "title": "Cloudflare Edge",
  "group": "Runtime",
  "sourcePath": "src/demos/edge.ts",
  "summary": "Public edge boundary for DNS, TLS, CDN, routing, traffic filtering, rate controls, and security policy.",
  "proves": [
    "Stable public routing",
    "Worker request context",
    "Edge-delivered response"
  ],
  "status": "scaffolded"
};

export default demo;
