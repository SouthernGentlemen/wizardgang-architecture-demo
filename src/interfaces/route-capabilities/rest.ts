import apiDemo from '../../demos/api';
import { renderApiDemo } from '../../demos/api-page';
import { openApiResponse } from '../../api/openapi';
import { defineInterfaceIdentityCapability, interfaceIdentityRoute } from '../route-capability';

export const restRouteCapability = defineInterfaceIdentityCapability('interfaces.rest', [
  interfaceIdentityRoute({
    id: 'interfaces.rest.page',
    pattern: apiDemo.route,
    methods: ['GET'],
    kind: 'page',
    handler: (_request, { env }) => renderApiDemo(env),
    title: apiDemo.title,
    description: apiDemo.summary,
    sourceModule: 'src/demos/api-page.ts',
    sourceExport: 'renderApiDemo',
    tests: ['tests/api-records.test.ts', 'tests/interface.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.openapi.json',
    pattern: '/v1/openapi.json',
    methods: ['GET'],
    kind: 'api',
    handler: (request) => openApiResponse(request),
    title: 'OpenAPI JSON contract',
    description: 'Canonical OpenAPI 2.0 contract exposed as JSON.',
    sourceModule: 'src/api/openapi.ts',
    sourceExport: 'openApiResponse',
    cache: { mode: 'public', maxAgeSeconds: 300 },
    tests: ['tests/contracts.test.ts', 'tests/integration-interfaces.test.ts'],
  }),
  interfaceIdentityRoute({
    id: 'interfaces.openapi.yaml',
    pattern: '/v1/openapi.yaml',
    methods: ['GET'],
    kind: 'api',
    handler: (request) => openApiResponse(request, 'yaml'),
    title: 'OpenAPI YAML contract',
    description: 'Canonical OpenAPI 2.0 contract exposed as YAML.',
    sourceModule: 'src/api/openapi.ts',
    sourceExport: 'openApiResponse',
    cache: { mode: 'public', maxAgeSeconds: 300 },
    tests: ['tests/contracts.test.ts', 'tests/integration-interfaces.test.ts'],
  }),
]);
