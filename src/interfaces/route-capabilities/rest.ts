import { openApiResponse } from '../../api/openapi';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const restRouteCapability = defineInterfaceIdentityCapability('interfaces.rest', [
  interfaceIdentityRoute({
    id: 'interfaces.openapi.json',
    pattern: '/v1/openapi.json',
    methods: ['GET'],
    kind: 'api',
    handler: (request) => openApiResponse(request),
    title: 'OpenAPI JSON contract',
    description: 'Canonical OpenAPI 3.1 contract exposed as JSON.',
    sourceModule: 'src/api/openapi.ts',
    sourceExport: 'openApiResponse',
    cache: { mode: 'public', maxAgeSeconds: 300 },
    tests: ['tests/contracts.test.ts', 'tests/integration-interfaces.test.ts'],
  }),
]);
