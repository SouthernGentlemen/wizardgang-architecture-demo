import mcpDemo from '../../demos/mcp';
import { MCP_SERVER_PATH, mcpResponse } from '../../api/mcp';
import { renderMcpDemo } from '../../demos/mcp-page';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const mcpRouteCapability = defineInterfaceIdentityCapability('interfaces.mcp', [
  interfaceIdentityRoute({
    id: 'interfaces.mcp.page',
    pattern: mcpDemo.route,
    methods: ['GET'],
    kind: 'page',
    handler: (request, { env }) => renderMcpDemo(request, env),
    title: mcpDemo.title,
    description: mcpDemo.summary,
    sourceModule: 'src/demos/mcp-page.ts',
    sourceExport: 'renderMcpDemo',
    tests: ['tests/mcp-client.test.ts', 'tests/interface.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.mcp.server',
    pattern: MCP_SERVER_PATH,
    methods: ['GET', 'POST', 'DELETE'],
    kind: 'protocol',
    handler: (request, { env }) => mcpResponse(request, env),
    title: 'MCP streamable HTTP server',
    description: 'MCP transport endpoint retaining protocol-method validation, foreign-Origin rejection, demo:read authorization, and read-only tool policy.',
    sourceModule: 'src/api/mcp.ts',
    sourceExport: 'mcpResponse',
    authorization: { mode: 'policy', policy: 'demo:read + MCP method/tool authorization + foreign-Origin rejection' },
    tests: ['tests/mcp-client.test.ts', 'tests/governance.test.ts'],
  }),
]);
