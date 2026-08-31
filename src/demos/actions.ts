import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "actions",
  "route": "/git/actions",
  "title": "GitHub Actions",
  "group": "Delivery",
  "sourcePath": "src/demos/actions.ts",
  "summary": "Automated validation, testing, release, and deployment controls.",
  "proves": [
    "CI workflow source link",
    "Typecheck/test scaffold",
    "Deploy workflow scaffold"
  ],
  "status": "scaffolded"
};

export default demo;
