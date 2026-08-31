import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "identity",
  "route": "/identity",
  "title": "Authentication & Authorization",
  "group": "Identity",
  "sourcePath": "src/demos/identity.ts",
  "summary": "Identity overview separating authentication from authorization.",
  "proves": [
    "Identity boundary route",
    "Authentication vs authorization framing",
    "Shared audit baseline"
  ],
  "status": "scaffolded"
};

export default demo;
