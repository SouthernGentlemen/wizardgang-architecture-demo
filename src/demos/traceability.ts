import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "traceability",
  "route": "/traceability",
  "title": "Change Traceability",
  "group": "Governance",
  "sourcePath": "src/demos/traceability.ts",
  "summary": "Requirement-to-deployment evidence chain across issue, branch, commit, PR, validation, release, and deployment.",
  "proves": [
    "Requirement-to-operation evidence chain",
    "Running release metadata truthfully reports missing or supplied SHA/tag evidence",
    "Recent D1 audit events connect operational actions to implementation"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/__api/evidence/traceability", "description": "Inspect release metadata and recent audit evidence." }],
  "supportingSources": [{ "label": "View traceability implementation", "path": "src/api/governance.ts" }, { "label": "View evidence map", "path": "docs/EVIDENCE.md" }, { "label": "View release procedure", "path": "docs/RELEASE.md" }],
  "repositoryLinks": [{ "label": "Inspect commits", "path": "/commits/main" }, { "label": "Inspect Actions", "path": "/actions" }, { "label": "Inspect Releases", "path": "/releases" }],
  "action": { "label": "Inspect the live traceability chain", "method": "GET", "path": "/__api/evidence/traceability" }
};

export default demo;
