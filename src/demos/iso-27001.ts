import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "iso27001",
  "route": "/governance/iso-27001",
  "title": "ISO/IEC 27001 Alignment",
  "group": "Governance",
  "sourcePath": "src/demos/iso-27001.ts",
  "summary": "Security governance reference covering access control, secure development, change, release, logging, configuration, and evidence retention.",
  "proves": [
    "Access, secure development, change, logging, secrets, and availability evidence",
    "Every mapping links to the implementing public source",
    "Alignment only; no certification claim"
  ],
  "status": "working",
  "interfaces": [{ "method": "GET", "path": "/__api/governance/security-controls", "description": "Return the live engineering-control evidence map." }],
  "supportingSources": [{ "label": "View control map implementation", "path": "src/api/governance.ts" }, { "label": "View security guidance", "path": "SECURITY.md" }],
  "action": { "label": "Inspect ISO/IEC 27001-aligned evidence", "method": "GET", "path": "/__api/governance/security-controls" }
};

export default demo;
