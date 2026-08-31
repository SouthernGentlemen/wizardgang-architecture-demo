import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "traceability",
  "route": "/traceability",
  "title": "Change Traceability",
  "group": "Governance",
  "sourcePath": "src/demos/traceability.ts",
  "summary": "Requirement-to-deployment evidence chain across issue, branch, commit, PR, validation, release, and deployment.",
  "proves": [
    "Public source linkage",
    "D1 event baseline",
    "Traceability route for later GitHub evidence"
  ],
  "status": "scaffolded"
};

export default demo;
