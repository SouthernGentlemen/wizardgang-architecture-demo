import {
  D1_RELATIONAL_STORAGE,
  NO_STORAGE,
  definePlatformLaboratoryCapability,
  noRequestBody,
} from '../route-capability';

const tests = [
  'tests/platform-laboratory-routing.test.ts',
  'tests/governance.test.ts',
  'tests/mcp-client.test.ts',
  'tests/router.test.ts',
] as const;
const docs = ['docs/ROUTES.md', 'docs/ROUTE-REGISTRY.md'] as const;

export const governanceLaboratoryCapability = definePlatformLaboratoryCapability({
  id: 'platform.governance',
  routes: [
    {
      id: 'platform.governance.traceability',
      labId: 'governance-traceability',
      pattern: '/api/labs/governance-traceability',
      methods: ['GET'],
      requestSchemas: { GET: 'none' },
      kind: 'api',
      handler: async (request, env) => {
        const { traceabilityResponse } = await import('../../api/governance');
        return traceabilityResponse(request, env);
      },
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Governance traceability laboratory API',
        description: 'Requirement-to-operation traceability over source, validation, release, deployment, and audit evidence.',
        docs,
      },
      source: { module: 'src/platform/route-capabilities/governance.ts', exportName: 'governanceLaboratoryCapability', tests },
      requestLimits: noRequestBody('GET consumes no request body.'),
      storage: D1_RELATIONAL_STORAGE,
    },
    {
      id: 'platform.governance.security-controls',
      labId: 'governance-security-controls',
      pattern: '/api/labs/governance-security-controls',
      methods: ['GET'],
      requestSchemas: { GET: 'none' },
      kind: 'api',
      handler: async (request, env) => {
        const { securityControlsResponse } = await import('../../api/governance');
        return securityControlsResponse(request, env);
      },
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'none' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Governance security-controls laboratory API',
        description: 'Public security-control mapping to canonical implementation and evidence records.',
        docs,
      },
      source: { module: 'src/platform/route-capabilities/governance.ts', exportName: 'governanceLaboratoryCapability', tests },
      requestLimits: noRequestBody('GET consumes no request body.'),
      storage: NO_STORAGE,
    },
    {
      id: 'platform.governance.ai-evaluation',
      labId: 'governance-ai-evaluation',
      pattern: '/api/labs/governance-ai-evaluation',
      methods: ['POST'],
      requestSchemas: { POST: 'none' },
      kind: 'api',
      handler: async (request, env) => {
        const { aiEvaluationResponse } = await import('../../api/governance');
        return aiEvaluationResponse(request, env);
      },
      authentication: { mode: 'anonymous' },
      authorization: { mode: 'policy', policy: 'MCP method/tool authorization exercised by governance evaluation' },
      visibility: 'public',
      sameOrigin: { mode: 'not-required' },
      offline: { mode: 'gated' },
      cache: { mode: 'no-store' },
      crawler: { crawling: 'controlled', indexing: 'deny' },
      documentation: {
        title: 'Governance AI-boundary laboratory API',
        description: 'Controlled evaluation of approved, unknown, and invalid MCP method/tool cases.',
        docs,
      },
      source: { module: 'src/platform/route-capabilities/governance.ts', exportName: 'governanceLaboratoryCapability', tests },
      requestLimits: noRequestBody('POST runs the fixed evaluation matrix and consumes no request body.'),
      storage: D1_RELATIONAL_STORAGE,
    },
  ],
});
