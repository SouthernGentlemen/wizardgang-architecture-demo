import { openApiResponse } from '../../api/openapi';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const restRouteCapability = defineInterfaceIdentityCapability('interfaces.rest', [

interfaceIdentityRoute({
  id: 'interfaces.rest', pattern: '/interfaces/rest', methods: ['GET'], kind: 'page',
  handler: async (_request, { env }) => { const [{ apiContent }, { renderPage }] = await Promise.all([import('../../demos/api-page'), import('../../ui/page')]); return renderPage(env, { ...apiContent(env), routeId: 'interfaces.rest' }); },
  title: 'REST API', description: 'Execute live REST requests and inspect the versioned OpenAPI 3.1 contract.',
  sourceModule: 'src/demos/api-page.ts', sourceExport: 'apiContent', tests: ['tests/interface-consolidation.test.ts'],
  page: { parent: 'interfaces.index', label: 'REST', summary: 'Execute live REST requests and inspect the OpenAPI 3.1 contract.', order: 0, navigation: 'secondary', architectureMap: true },
}),
  interfaceIdentityRoute({
    id: 'interfaces.openapi.json',
    pattern: '/api/openapi.json',
    methods: ['GET'],
    kind: 'api',
    handler: (request) => openApiResponse(request),
    title: 'OpenAPI JSON contract',
    description: 'Canonical OpenAPI 3.1 contract exposed as JSON.',
    sourceModule: 'src/api/openapi.ts',
    sourceExport: 'openApiResponse',
    cache: { mode: 'public', maxAgeSeconds: 300 },
    tests: ['tests/contracts.test.ts', 'tests/api-records.test.ts'],
  }),
]);
