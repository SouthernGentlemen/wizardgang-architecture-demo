import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "governance",
  "route": "/governance",
  "title": "Governance",
  "group": "Governance",
  "sourcePath": "src/demos/governance.ts",
  "summary": "Overview of security, AI governance, evidence, and auditability controls implemented through ordinary engineering work.",
  "proves": [
    "Security and AI controls map to inspectable implementation evidence",
    "Operational events and evaluations produce D1 evidence",
    "All alignment language remains explicitly uncertified"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/__api/governance/security-controls", "description": "Inspect the security-control evidence map." }, { "method": "POST", "path": "/__api/governance/ai-evaluation", "description": "Execute the AI/MCP boundary evaluation." }],
  "supportingSources": [{ "label": "View governance implementation", "path": "src/api/governance.ts" }, { "label": "View evidence map", "path": "docs/EVIDENCE.md" }],
  "action": { "label": "Inspect security governance evidence", "method": "GET", "path": "/__api/governance/security-controls" }
};

export default demo;
