import { openApiResponse } from '../../api/openapi';
import { restDemoOpenApiResponse } from '../../api/rest-demo-openapi';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const restRouteCapability = defineInterfaceIdentityCapability('interfaces.rest', [

  interfaceIdentityRoute({
    id: 'interfaces.rest.openapi.json',
    pattern: '/api/labs/rest-demo-openapi.json',
    methods: ['GET'],
    kind: 'api',
    handler: (request) => restDemoOpenApiResponse(request),
    title: 'REST demo OpenAPI JSON',
    description: 'Focused OpenAPI 3.0.3 browser-tutorial contract for anonymous, signed-cookie visitor records.',
    sourceModule: 'src/api/rest-demo-openapi.ts',
    sourceExport: 'restDemoOpenApiResponse',
    cache: { mode: 'public', maxAgeSeconds: 300 },
    tests: ['tests/router.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.openapi.json',
    pattern: '/api/openapi.json',
    methods: ['GET'],
    kind: 'api',
    handler: (request) => openApiResponse(request),
    title: 'OpenAPI JSON contract',
    description: 'General OpenAPI 3.1 machine contract, including bearer-capable authorized record operations.',
    sourceModule: 'src/api/openapi.ts',
    sourceExport: 'openApiResponse',
    cache: { mode: 'public', maxAgeSeconds: 300 },
    tests: ['tests/contracts.test.ts', 'tests/api-records.test.ts'],
  }),
]);
