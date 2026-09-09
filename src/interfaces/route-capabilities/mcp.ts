import { MCP_SERVER_PATH, mcpResponse } from '../../api/mcp';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const mcpRouteCapability = defineInterfaceIdentityCapability('interfaces.mcp', [

interfaceIdentityRoute({
  id: 'interfaces.mcp.console', pattern: '/interfaces/mcp', methods: ['GET'], kind: 'page',
  handler: async (request, { env }) => { const [{ mcpContent }, { renderPage }] = await Promise.all([import('../../demos/mcp-page'), import('../../ui/page')]); return renderPage(env, { ...await mcpContent(request, env), routeId: 'interfaces.mcp.console' }); },
  title: 'Model Context Protocol console', description: 'Connect compatible MCP clients and inspect read-only tool activity.',
  sourceModule: 'src/demos/mcp-page.ts', sourceExport: 'mcpContent', tests: ['tests/interface-consolidation.test.ts', 'tests/mcp-client.test.ts'],
  page: { parent: 'interfaces.index', label: 'MCP', summary: 'Connect an MCP client, discover read-only tools, and inspect live activity.', order: 4, navigation: 'secondary', architectureMap: true },
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
    tests: ['tests/mcp-client.test.ts', 'tests/governance.test.ts', 'tests/interface-consolidation.test.ts'],
  }),
]);
