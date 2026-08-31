import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "rest",
  "route": "/api/rest",
  "title": "REST / JSON",
  "group": "Integration",
  "sourcePath": "src/demos/rest.ts",
  "summary": "Conventional RESTful integration using JSON payloads and explicit resource endpoints.",
  "proves": [
    "Dedicated REST exhibit route",
    "Separation between exhibit UI and /v1 API surface",
    "D1-backed demo data"
  ],
  "status": "scaffolded"
};

export default demo;
