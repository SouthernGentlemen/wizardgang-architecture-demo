import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'mcp',
  route: '/interfaces?view=mcp',
  title: 'Model Context Protocol',
  group: 'Interfaces',
  sourcePath: 'src/demos/mcp.ts',
  summary: 'Connect a real MCP client to the live demo and invoke read-only tools through the same application permissions used by the rest of the platform.',
  proves: [
    'Real client interoperability over Streamable HTTP',
    'MCP 2026-07-28 with stateless 2025-era compatibility',
    'Schema-defined read-only tools behind shared authorization, D1, and sanitized operational evidence',
  ],
  status: 'working',
  interfaces: [{ method: 'GET, POST', path: '/mcp/server', description: 'Connect an MCP 2026-07-28 or stateless 2025-era client over Streamable HTTP.' }],
  supportingSources: [
    { label: 'View MCP implementation', path: 'src/api/mcp.ts' },
    { label: 'View tool manifest', path: 'contracts/mcp/tools.json' },
    { label: 'View interoperability tests', path: 'tests/mcp-client.test.ts' },
    { label: 'View shared authorization', path: 'src/lib/authorization.ts' },
  ],
};

export default demo;
