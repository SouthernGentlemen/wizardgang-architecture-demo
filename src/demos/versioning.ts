import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "versioning",
  "route": "/git/versioning",
  "title": "Git Versioning",
  "group": "Delivery",
  "sourcePath": "src/demos/versioning.ts",
  "summary": "Commit and change categorization aligned to the WG-ARCH-001 traceability model.",
  "proves": [
    "Project-specific DEMO prefix and allowed change categories",
    "Small independently understandable commits",
    "Live history connects changes to source and release evidence"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/version", "description": "Read the commit SHA injected into a deployment." }],
  "supportingSources": [{ "label": "View contribution conventions", "path": "CONTRIBUTING.md" }, { "label": "View architecture versioning standard", "path": "docs/ARCHITECTURE-STANDARD.md" }],
  "repositoryLinks": [{ "label": "Inspect main history", "path": "/commits/main" }],
  "action": { "label": "Inspect deployed version metadata", "method": "GET", "path": "/version" }
};

export default demo;
