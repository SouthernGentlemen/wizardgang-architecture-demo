import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "branching",
  "route": "/git/branching",
  "title": "Branching",
  "group": "Delivery",
  "sourcePath": "src/demos/branching.ts",
  "summary": "Simple branch lifecycle where development returns to main through validated review.",
  "proves": [
    "main is the accepted production baseline",
    "Isolated branch changes return through pull request review",
    "CI is required before semantic tagging and deployment"
  ],
  "status": "working",
  "supportingSources": [{ "label": "View contribution workflow", "path": "CONTRIBUTING.md" }, { "label": "View CI workflow", "path": ".github/workflows/ci.yml" }],
  "repositoryLinks": [{ "label": "Inspect branches", "path": "/branches" }, { "label": "Inspect pull requests", "path": "/pulls" }, { "label": "Inspect branch CI", "path": "/actions" }],
  "action": { "label": "Inspect the running branch", "method": "GET", "path": "/version" }
};

export default demo;
