import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "workers",
  "route": "/workers",
  "title": "Cloudflare Workers",
  "group": "Runtime",
  "sourcePath": "src/demos/workers.ts",
  "summary": "Stateless TypeScript application compute and the mediation layer between clients, platform state, and integrations.",
  "proves": [
    "TypeScript Worker execution",
    "Stateless request handling",
    "Controlled access to shared demo state"
  ],
  "status": "scaffolded"
};

export default demo;
