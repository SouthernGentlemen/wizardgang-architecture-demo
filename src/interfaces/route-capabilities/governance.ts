import governanceDemo from '../../demos/governance';
import concernsDemo from '../../demos/concerns';
import { demos } from '../../demos/registry';
import { aiEvaluationResponse, securityControlsResponse, traceabilityResponse } from '../../api/governance';
import { renderConcerns } from '../../demos/assurance-pages';
import { renderDemo } from '../../ui/page';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const governanceRouteCapability = defineInterfaceIdentityCapability('interfaces.governance', [
  interfaceIdentityRoute({
    id: 'interfaces.governance.page',
    pattern: governanceDemo.route,
    methods: ['GET'],
    kind: 'page',
    handler: (_request, { env }) => renderDemo(env, governanceDemo, demos),
    title: governanceDemo.title,
    description: governanceDemo.summary,
    sourceModule: 'src/ui/page.ts',
    sourceExport: 'renderDemo',
    tests: ['tests/governance.test.ts', 'tests/interface.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.governance.concerns',
    pattern: concernsDemo.route,
    methods: ['GET'],
    kind: 'page',
    handler: (_request, { env }) => renderConcerns(env),
    title: concernsDemo.title,
    description: concernsDemo.summary,
    sourceModule: 'src/demos/assurance-pages.ts',
    sourceExport: 'renderConcerns',
    tests: ['tests/governance.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.governance.traceability',
    pattern: '/__api/evidence/traceability',
    methods: ['GET'],
    kind: 'api',
    handler: (request, { env }) => traceabilityResponse(request, env),
    title: 'Governance traceability evidence',
    description: 'Requirement-to-operation traceability over source, validation, release, deployment, and audit evidence.',
    sourceModule: 'src/api/governance.ts',
    sourceExport: 'traceabilityResponse',
    tests: ['tests/governance.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.governance.security-controls',
    pattern: '/__api/governance/security-controls',
    methods: ['GET'],
    kind: 'api',
    handler: (request, { env }) => securityControlsResponse(request, env),
    title: 'Governance security controls',
    description: 'Public security-control mapping to implementation and evidence.',
    sourceModule: 'src/api/governance.ts',
    sourceExport: 'securityControlsResponse',
    tests: ['tests/governance.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.governance.ai-evaluation',
    pattern: '/__api/governance/ai-evaluation',
    methods: ['POST'],
    kind: 'api',
    handler: (request, { env }) => aiEvaluationResponse(request, env),
    title: 'Governance AI boundary evaluation',
    description: 'Controlled evaluation of approved, unknown, and invalid MCP method/tool cases.',
    sourceModule: 'src/api/governance.ts',
    sourceExport: 'aiEvaluationResponse',
    authorization: { mode: 'policy', policy: 'MCP method/tool authorization exercised by governance evaluation' },
    tests: ['tests/governance.test.ts', 'tests/mcp-client.test.ts'],
  }),
]);
