import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "d1",
  "route": "/d1",
  "title": "Cloudflare D1",
  "group": "Runtime",
  "sourcePath": "src/demos/d1.ts",
  "summary": "Relational persistence for structured application records and audit metadata.",
  "proves": [
    "Shared DEMO_DB binding",
    "Write to demo-blob",
    "Relational audit record"
  ],
  "status": "scaffolded"
};

export default demo;
