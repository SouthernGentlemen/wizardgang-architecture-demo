import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  "id": "mcp",
  "route": "/mcp",
  "title": "Model Context Protocol",
  "group": "AI Integration",
  "sourcePath": "src/demos/mcp.ts",
  "summary": "Controlled AI integration surface where tools operate inside normal application permissions and data boundaries.",
  "proves": [
    "JSON-RPC initialization, tool discovery, and tool invocation",
    "The same demo:read policy used by REST and GraphQL",
    "Bounded D1 access and public-safe tool-call evidence"
  ],
  "status": "working",
  "interfaces": [{ "method": "POST", "path": "/mcp", "description": "Invoke initialize, tools/list, or tools/call over JSON-RPC." }],
  "supportingSources": [{ "label": "View MCP implementation", "path": "src/api/mcp.ts" }, { "label": "View tool manifest", "path": "contracts/mcp/tools.json" }, { "label": "View shared authorization", "path": "src/lib/authorization.ts" }],
  "action": { "label": "Call the controlled MCP tool", "method": "POST", "path": "/mcp", "body": { "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "list_demo_records", "arguments": { "namespace": "public" } } } }
};

export default demo;
