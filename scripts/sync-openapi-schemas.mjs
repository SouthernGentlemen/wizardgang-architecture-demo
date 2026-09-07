import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const openApiPath = path.join(root, 'contracts', 'openapi', 'openapi.json');
const reportingPath = path.join(root, 'contracts', 'assurance', 'reporting.schema.json');
const check = process.argv.includes('--check');

const openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
const reporting = JSON.parse(fs.readFileSync(reportingPath, 'utf8'));

const schemas = openApi.components?.schemas;
if (!schemas || typeof schemas !== 'object') {
  throw new Error('OpenAPI components.schemas is required before canonical assurance schemas can be synchronized.');
}

const jsonObjectResponse = (description, schema = { type: 'object' }) => ({
  description,
  content: {
    'application/json': { schema },
  },
});

const reportingDefinition = (name) => ({ $ref: `${reporting.$id}#/$defs/${name}` });

const errorResponses = {
  '400': jsonObjectResponse('Invalid request.'),
  '401': jsonObjectResponse('Authentication required.'),
  '403': jsonObjectResponse('Insufficient permission.'),
  '404': jsonObjectResponse('Resource not found.'),
};

const collectionParameter = {
  name: 'collection',
  in: 'path',
  required: true,
  schema: { type: 'string', minLength: 1 },
};
const recordParameter = {
  name: 'recordId',
  in: 'path',
  required: true,
  schema: { type: 'string', minLength: 1 },
};
const reportingQueryParameters = [
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
  { name: 'cursor', in: 'query', schema: { type: 'string', minLength: 1 } },
  { name: 'export', in: 'query', schema: { type: 'string', enum: ['1'] } },
  { name: 'repository', in: 'query', schema: { type: 'string' } },
  { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Collection-specific structured reporting filter when declared.' },
  { name: 'lifecycle', in: 'query', schema: { type: 'string' }, description: 'Collection-specific structured reporting filter when declared.' },
  { name: 'framework', in: 'query', schema: { type: 'string' }, description: 'Collection-specific structured reporting filter when declared.' },
  { name: 'level', in: 'query', schema: { type: 'string' }, description: 'Collection-specific structured reporting filter when declared.' },
  { name: 'residual', in: 'query', schema: { type: 'string' }, description: 'Collection-specific structured reporting filter when declared.' },
];

function reportingPaths() {
  return {
    '/api/reporting': {
      get: {
        summary: 'Discover canonical reporting collections',
        'x-route-id': 'reporting.index',
        responses: {
          '200': jsonObjectResponse('Disclosure-safe reporting collection inventory.', reportingDefinition('collectionIndexResult')),
          ...errorResponses,
        },
      },
    },
    '/api/reporting/{collection}': {
      get: {
        summary: 'Query a canonical reporting collection',
        'x-route-id': 'reporting.collection',
        parameters: [collectionParameter, ...reportingQueryParameters],
        responses: {
          '200': jsonObjectResponse('Canonical reporting query result.', reportingDefinition('queryResult')),
          ...errorResponses,
        },
      },
    },
    '/api/reporting/{collection}/{recordId}': {
      get: {
        summary: 'Read a canonical reporting record',
        'x-route-id': 'reporting.record',
        parameters: [collectionParameter, recordParameter, ...reportingQueryParameters.filter((parameter) => parameter.name !== 'export')],
        responses: {
          '200': jsonObjectResponse('Canonical single-record reporting result.', reportingDefinition('queryResult')),
          ...errorResponses,
        },
      },
      patch: {
        summary: 'Update a writable provider-backed reporting record',
        'x-route-id': 'reporting.record',
        security: [{ BearerToken: [] }],
        parameters: [collectionParameter, recordParameter],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: reportingDefinition('updateRequest'),
            },
          },
        },
        responses: {
          '200': jsonObjectResponse('Updated canonical reporting record.', reportingDefinition('queryResult')),
          '400': jsonObjectResponse('Invalid update payload or revision.'),
          '401': jsonObjectResponse('Authentication required.'),
          '403': jsonObjectResponse('Insufficient reporting permission.'),
          '404': jsonObjectResponse('Reporting collection or record not found.'),
          '405': jsonObjectResponse('The reporting source is read-only.'),
          '409': jsonObjectResponse('Revision conflict.'),
        },
      },
    },
  };
}

function operationsPaths() {
  return {
    '/api/operations/health': {
      get: {
        summary: 'Read runtime and dependency health',
        'x-route-id': 'operations.health',
        responses: { '200': jsonObjectResponse('Current health state.'), '503': jsonObjectResponse('A required dependency is unhealthy.') },
      },
    },
    '/api/operations/version': {
      get: {
        summary: 'Read deployed version metadata',
        'x-route-id': 'operations.version',
        responses: { '200': jsonObjectResponse('Current deployed version and source metadata.') },
      },
    },
    '/api/operations/logs': {
      get: {
        summary: 'Read sanitized application logs',
        'x-route-id': 'operations.api-logs',
        responses: { '200': jsonObjectResponse('Sanitized operational log telemetry.'), ...errorResponses },
      },
    },
    '/api/operations/budget': {
      post: {
        summary: 'Calculate the synthetic operations budget demonstration',
        'x-route-id': 'operations.api-budget',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': jsonObjectResponse('Synthetic budget calculation.'), '400': jsonObjectResponse('Invalid budget input.') },
      },
    },
  };
}

function canonicalize(document) {
  const retained = {};
  for (const [currentPath, pathItem] of Object.entries(document.paths ?? {})) {
    if (
      currentPath.startsWith('/assurance')
      || currentPath.startsWith('/api/reporting')
      || currentPath.startsWith('/api/operations/')
      || currentPath === '/api/openapi.json'
    ) continue;
    retained[currentPath] = pathItem;
  }

  const firstServer = document.servers?.[0] && typeof document.servers[0] === 'object'
    ? document.servers[0]
    : {};
  document.servers = [{ ...firstServer, url: 'https://demo.wizardgang.ai' }];
  document.paths = {
    ...retained,
    ...reportingPaths(),
    ...operationsPaths(),
    '/api/openapi.json': {
      get: {
        summary: 'Read the canonical OpenAPI 3.1 document',
        'x-route-id': 'interfaces.openapi.json',
        responses: {
          '200': jsonObjectResponse('Canonical OpenAPI 3.1 document.'),
        },
      },
    },
  };
  for (const name of ['ReportingContract', 'AssuranceQueryResult', 'AssuranceRegistryContract', 'AssuranceRegistryDiscovery']) {
    delete document.components.schemas[name];
  }
  for (const name of Object.keys(document.components.responses ?? {})) {
    if (name.startsWith('Assurance')) delete document.components.responses[name];
  }
  delete document.components.headers?.ETag;
  delete document.components.headers?.AssuranceSchemaVersion;
  return document;
}

const expected = canonicalize(structuredClone(openApi));

if (check) {
  assert.equal(
    JSON.stringify(openApi.components.schemas).includes(reporting.$id),
    false,
    'OpenAPI components must not duplicate or wrap the canonical reporting schema.',
  );
  assert.deepStrictEqual(
    openApi.servers,
    expected.servers,
    'OpenAPI server URL is not canonical. Run npm run generate:openapi.',
  );
  assert.deepStrictEqual(
    openApi.paths,
    expected.paths,
    'OpenAPI paths do not match the canonical reporting and operations API surface. Run npm run generate:openapi.',
  );
} else {
  fs.writeFileSync(openApiPath, `${JSON.stringify(expected, null, 2)}\n`);
}
