import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "iso42001",
  "route": "/governance/iso-42001",
  "title": "ISO/IEC 42001 Alignment",
  "group": "Governance",
  "sourcePath": "src/demos/iso-42001.ts",
  "summary": "AI governance reference covering system boundaries, permissions, evaluation, oversight, monitoring, fallback, and evidence.",
  "proves": [
    "Defined MCP system boundary, intended use, oversight, and fallback",
    "Executable approved, unknown-method, and invalid-scope evaluations",
    "Alignment only; no certification claim"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/__api/governance/ai-evaluation", "description": "Run and audit controlled MCP boundary evaluations." }],
  "supportingSources": [{ "label": "View AI evaluation implementation", "path": "src/api/governance.ts" }, { "label": "View MCP implementation", "path": "src/api/mcp.ts" }, { "label": "View tool contract", "path": "contracts/mcp/tools.json" }],
  "action": { "label": "Run the AI boundary evaluation", "method": "POST", "path": "/__api/governance/ai-evaluation" }
};

export default demo;
