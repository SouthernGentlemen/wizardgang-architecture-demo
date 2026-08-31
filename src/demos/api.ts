import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "api",
  "route": "/api",
  "title": "API Architecture",
  "group": "Integration",
  "sourcePath": "src/demos/api.ts",
  "summary": "Overview of the controlled application interface boundary used by external systems.",
  "proves": [
    "Explicit public API surface",
    "Versioned endpoint separation",
    "Shared authorization/validation boundary"
  ],
  "status": "scaffolded"
};

export default demo;
