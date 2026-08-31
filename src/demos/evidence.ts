import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "evidence",
  "route": "/evidence",
  "title": "Evidence & Auditability",
  "group": "Governance",
  "sourcePath": "src/demos/evidence.ts",
  "summary": "Evidence surface connecting GitHub change records, Cloudflare deployment/operation history, and application audit metadata.",
  "proves": [
    "D1 audit records for meaningful runtime and control actions",
    "Public source, workflow, tag, release, and version links",
    "Missing deployment evidence is visible rather than reconstructed"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/__api/evidence/traceability", "description": "Read current release and application audit evidence." }],
  "supportingSources": [{ "label": "View evidence API", "path": "src/api/governance.ts" }, { "label": "View audit persistence", "path": "src/lib/audit.ts" }, { "label": "View evidence map", "path": "docs/EVIDENCE.md" }],
  "repositoryLinks": [{ "label": "Inspect Actions evidence", "path": "/actions" }, { "label": "Inspect Releases", "path": "/releases" }],
  "action": { "label": "Inspect live evidence", "method": "GET", "path": "/__api/evidence/traceability" }
};

export default demo;
