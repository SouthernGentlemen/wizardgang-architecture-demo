import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "environments",
  "route": "/environments",
  "title": "Environment Separation",
  "group": "Delivery",
  "sourcePath": "src/demos/environments.ts",
  "summary": "Local, development, preview, and production separation with environment-specific bindings and secrets.",
  "proves": [
    "Config boundary route",
    "Managed secret principle",
    "Deployment environment scaffold"
  ],
  "status": "scaffolded"
};

export default demo;
