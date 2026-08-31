import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "versioning",
  "route": "/git/versioning",
  "title": "Git Versioning",
  "group": "Delivery",
  "sourcePath": "src/demos/versioning.ts",
  "summary": "Commit and change categorization aligned to the WG-ARCH-001 traceability model.",
  "proves": [
    "Project-specific DEMO prefix",
    "Small reviewable change model",
    "Public Git history target"
  ],
  "status": "scaffolded"
};

export default demo;
