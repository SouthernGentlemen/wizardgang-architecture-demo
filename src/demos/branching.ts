import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "branching",
  "route": "/git/branching",
  "title": "Branching",
  "group": "Delivery",
  "sourcePath": "src/demos/branching.ts",
  "summary": "Simple branch lifecycle where development returns to main through validated review.",
  "proves": [
    "Stable main baseline",
    "Feature branch model",
    "PR/validation scaffold"
  ],
  "status": "scaffolded"
};

export default demo;
