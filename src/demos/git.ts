import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "git",
  "route": "/git",
  "title": "Git / GitHub",
  "group": "Delivery",
  "sourcePath": "src/demos/git.ts",
  "summary": "Public source-of-truth demonstration for code, documentation, history, and engineering context.",
  "proves": [
    "Public repository linkage",
    "Route-to-source mapping",
    "Repository as evidence source"
  ],
  "status": "scaffolded"
};

export default demo;
