import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "webhooks",
  "route": "/api/webhooks",
  "title": "Webhooks",
  "group": "Integration",
  "sourcePath": "src/demos/webhooks.ts",
  "summary": "Inbound and outbound event integration through defined HTTP callbacks.",
  "proves": [
    "HMAC-SHA256 verification over the exact request body",
    "Unique delivery IDs reject replay",
    "D1 stores the receipt digest and audit evidence, never the signing secret"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/v1/webhooks/demo", "description": "Receive a signed webhook." }, { "method": "POST", "path": "/__api/webhooks/demo", "description": "Generate and verify a visitor-safe signed delivery." }],
  "supportingSources": [{ "label": "View webhook implementation", "path": "src/api/webhooks.ts" }, { "label": "View event contract", "path": "contracts/webhooks/events.json" }, { "label": "View receipt migration", "path": "migrations/0005_capability_records.sql" }],
  "action": { "label": "Send a signed demo webhook", "method": "POST", "path": "/__api/webhooks/demo" }
};

export default demo;
