import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const openApiPath = path.join(root, 'contracts', 'openapi', 'openapi.json');
const reportingPath = path.join(root, 'contracts', 'assurance', 'reporting.schema.json');
const registryPath = path.join(root, 'contracts', 'assurance', 'registry.schema.json');
const check = process.argv.includes('--check');

const openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
const reporting = JSON.parse(fs.readFileSync(reportingPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const schemas = openApi.components?.schemas;
if (!schemas || typeof schemas !== 'object') {
  throw new Error('OpenAPI components.schemas is required before canonical assurance schemas can be synchronized.');
}

if (check) {
  assert.deepStrictEqual(
    schemas.ReportingContract,
    reporting,
    'OpenAPI ReportingContract drifted from contracts/assurance/reporting.schema.json. Run npm run generate:openapi.',
  );
  assert.deepStrictEqual(
    schemas.AssuranceRegistryContract,
    registry,
    'OpenAPI AssuranceRegistryContract drifted from contracts/assurance/registry.schema.json. Run npm run generate:openapi.',
  );
} else {
  schemas.ReportingContract = reporting;
  schemas.AssuranceRegistryContract = registry;
  fs.writeFileSync(openApiPath, `${JSON.stringify(openApi, null, 2)}\n`);
}
