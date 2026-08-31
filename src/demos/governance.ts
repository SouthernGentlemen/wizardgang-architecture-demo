import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "governance",
  "route": "/governance",
  "title": "Governance",
  "group": "Governance",
  "sourcePath": "src/demos/governance.ts",
  "summary": "Security controls, AI-system boundary evaluation, traceability, and audit evidence implemented through ordinary engineering work and inspected together.",
  "notice": "WCAG 2.2 / ISO 27001 / ISO 42001 references are alignment targets, not certification claims.",
  "proves": [
    "ISO/IEC 27001-aligned controls map to inspectable implementation evidence",
    "ISO/IEC 42001-aligned evaluation exercises approved, unknown-method, and invalid-scope cases",
    "Release metadata and recent D1 audit events form a visible evidence chain",
    "All alignment language remains explicitly uncertified"
  ],
  "status": "working",
  "supportingSources": [
    { "label": "View governance implementation", "path": "src/api/governance.ts" },
    { "label": "View evidence map", "path": "docs/EVIDENCE.md" },
    { "label": "View security guidance", "path": "SECURITY.md" },
    { "label": "View MCP implementation", "path": "src/api/mcp.ts" },
    { "label": "View audit persistence", "path": "src/lib/audit.ts" }
  ],
  "repositoryLinks": [{ "label": "Inspect commits", "path": "/commits/main" }, { "label": "Inspect Actions", "path": "/actions" }, { "label": "Inspect Releases", "path": "/releases" }],
  "actions": [
    {
      "id": "iso-27001",
      "title": "ISO/IEC 27001 alignment",
      "description": "Inspect access, secure-development, change, logging, secrets, availability, and evidence mappings linked to their public implementation sources.",
      "label": "Inspect the security-control map",
      "method": "GET",
      "path": "/__api/governance/security-controls"
    },
    {
      "id": "iso-42001",
      "title": "ISO/IEC 42001 alignment",
      "description": "Execute and audit the approved, unknown-method, and invalid-scope cases at the controlled MCP boundary.",
      "label": "Run the AI boundary evaluation",
      "method": "POST",
      "path": "/__api/governance/ai-evaluation"
    },
    {
      "id": "traceability",
      "aliases": ["evidence"],
      "title": "Traceability & evidence",
      "description": "Inspect the requirement-to-operation chain across source, validation, release metadata, deployment identity, and recent application audit events.",
      "label": "Inspect the live evidence chain",
      "method": "GET",
      "path": "/__api/evidence/traceability"
    }
  ]
};

export default demo;
