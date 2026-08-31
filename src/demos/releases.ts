import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "releases",
  "route": "/git/releases",
  "title": "Release Management",
  "group": "Delivery",
  "sourcePath": "src/demos/releases.ts",
  "summary": "Semantic versioning, Git tags, GitHub Releases, and traceability from running version to source.",
  "proves": [
    "Semantic versioning target",
    "Release/tag evidence route",
    "Deployment traceability scaffold"
  ],
  "status": "scaffolded"
};

export default demo;
