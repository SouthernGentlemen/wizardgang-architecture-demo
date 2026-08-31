import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "api",
  "route": "/api",
  "title": "API Architecture",
  "group": "Integration",
  "sourcePath": "src/demos/api.ts",
  "summary": "Overview of the controlled application interface boundary used by external systems.",
  "proves": [
    "Versioned REST, GraphQL, webhook, and MCP interfaces",
    "Shared read/write authorization policy",
    "Bounded input validation, evidence, and offline failure behavior"
  ],
  "status": "working",
  "interfaces": [
    { "method": "GET / POST", "path": "/v1/demo-records", "description": "Versioned REST resource collection." },
    { "method": "POST", "path": "/graphql", "description": "Schema-driven read interface." },
    { "method": "POST", "path": "/mcp", "description": "Controlled JSON-RPC MCP tool interface." }
  ],
  "supportingSources": [{ "label": "View shared authorization", "path": "src/lib/authorization.ts" }, { "label": "View Swagger contract", "path": "contracts/openapi/swagger.json" }]
};

export default demo;
