import {
  createFileSchemaLoader,
  formatJsonSchemaErrors,
  validateJsonSchema,
} from './json-schema.mjs';
import { readJsonFile } from './assurance-registry.mjs';

export const ASSURANCE_JSON_SCHEMA_DRAFT = 'https://json-schema.org/draft/2020-12/schema';

export function createAssuranceSchemaLoader(root) {
  const loadSchemaFile = createFileSchemaLoader(root);
  return (reference, fromSchemaPath) => {
    const loaded = loadSchemaFile(reference, fromSchemaPath);
    if (!loaded.schemaPath.startsWith('contracts/assurance/')) {
      throw new Error(`${fromSchemaPath}: assurance schema reference must stay under contracts/assurance: ${reference}`);
    }
    if (loaded.schema.$schema !== ASSURANCE_JSON_SCHEMA_DRAFT) {
      throw new Error(`${loaded.schemaPath}: expected JSON Schema draft 2020-12`);
    }
    return loaded;
  };
}

export function validateAssuranceSchemaValue(root, dataPath, schemaPath, value) {
  let schema;
  try {
    schema = readJsonFile(root, schemaPath);
  } catch (error) {
    return [`${schemaPath}: unable to read schema: ${error instanceof Error ? error.message : String(error)}`];
  }
  if (schema.$schema !== ASSURANCE_JSON_SCHEMA_DRAFT) {
    return [`${schemaPath}: expected JSON Schema draft 2020-12`];
  }
  try {
    return formatJsonSchemaErrors(
      dataPath,
      schemaPath,
      validateJsonSchema(value, schema, {
        schemaPath,
        loadSchema: createAssuranceSchemaLoader(root),
      }),
    );
  } catch (error) {
    return [`${dataPath}: schema validation via ${schemaPath} could not run: ${error instanceof Error ? error.message : String(error)}`];
  }
}

export function validateRegisteredAssuranceResource(root, resource, value = readJsonFile(root, resource.path)) {
  return validateAssuranceSchemaValue(root, resource.path, resource.schema, value);
}
