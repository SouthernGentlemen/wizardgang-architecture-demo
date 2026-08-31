import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "environments",
  "route": "/environments",
  "title": "Environment Separation",
  "group": "Delivery",
  "sourcePath": "src/demos/environments.ts",
  "summary": "Local, development, preview, and production separation with environment-specific bindings and secrets.",
  "proves": [
    "Local, preview, and production bindings are explicit",
    "Secrets remain in local ignored or managed secret stores",
    "Runtime exposes only public environment and release metadata"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/version", "description": "Inspect public environment and deployment metadata without private account data." }],
  "supportingSources": [{ "label": "View Cloudflare bindings", "path": "wrangler.jsonc" }, { "label": "View secret guidance", "path": "SECURITY.md" }, { "label": "View local placeholders", "path": ".dev.vars.example" }],
  "action": { "label": "Inspect the public environment boundary", "method": "GET", "path": "/version" }
};

export default demo;
