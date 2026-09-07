import reportingSchema from '../../contracts/assurance/reporting.schema.json';

type JsonSchema = boolean | Record<string, unknown>;
export type ReportingContractDefinition = keyof typeof reportingSchema.$defs;

function objectValue(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function resolveReference(reference: string): JsonSchema {
  if (!reference.startsWith('#/')) throw new TypeError(`Reporting contract contains unsupported reference '${reference}'.`);
  let current: unknown = reportingSchema;
  for (const raw of reference.slice(2).split('/')) {
    const segment = raw.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!objectValue(current) || !(segment in current)) {
      throw new TypeError(`Reporting contract reference '${reference}' does not resolve.`);
    }
    current = current[segment];
  }
  if (typeof current !== 'boolean' && !objectValue(current)) {
    throw new TypeError(`Reporting contract reference '${reference}' is not a schema.`);
  }
  return current;
}

function typeMatches(value: unknown, expected: string): boolean {
  if (expected === 'null') return value === null;
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return objectValue(value);
  if (expected === 'integer') return Number.isInteger(value);
  if (expected === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === expected;
}

function validateNode(schema: JsonSchema, value: unknown, path: string, issues: string[]): void {
  if (schema === true) return;
  if (schema === false) {
    issues.push(`${path} is forbidden`);
    return;
  }

  if (typeof schema.$ref === 'string') {
    validateNode(resolveReference(schema.$ref), value, path, issues);
    return;
  }

  if (Array.isArray(schema.allOf)) {
    for (const entry of schema.allOf) validateNode(entry as JsonSchema, value, path, issues);
  }
  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter((entry) => {
      const branchIssues: string[] = [];
      validateNode(entry as JsonSchema, value, path, branchIssues);
      return branchIssues.length === 0;
    }).length;
    if (matches !== 1) issues.push(`${path} must match exactly one allowed shape`);
  }
  if (schema.if !== undefined) {
    const conditionIssues: string[] = [];
    validateNode(schema.if as JsonSchema, value, path, conditionIssues);
    if (conditionIssues.length === 0 && schema.then !== undefined) {
      validateNode(schema.then as JsonSchema, value, path, issues);
    }
  }

  if ('const' in schema && !sameValue(value, schema.const)) issues.push(`${path} must equal the contract constant`);
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => sameValue(value, candidate))) {
    issues.push(`${path} is not an allowed value`);
  }

  const expectedTypes = typeof schema.type === 'string'
    ? [schema.type]
    : Array.isArray(schema.type) ? schema.type.filter((entry): entry is string => typeof entry === 'string') : [];
  if (expectedTypes.length > 0 && !expectedTypes.some((expected) => typeMatches(value, expected))) {
    issues.push(`${path} must be ${expectedTypes.join(' or ')}`);
    return;
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) issues.push(`${path} is too short`);
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) issues.push(`${path} has an invalid format`);
    if (schema.format === 'date-time' && Number.isNaN(Date.parse(value))) issues.push(`${path} must be a date-time`);
    if (schema.format === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)))) {
      issues.push(`${path} must be a date`);
    }
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) issues.push(`${path} is below its minimum`);
    if (typeof schema.maximum === 'number' && value > schema.maximum) issues.push(`${path} exceeds its maximum`);
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) issues.push(`${path} has too few items`);
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) issues.push(`${path} has too many items`);
    if (schema.uniqueItems === true && new Set(value.map((entry) => JSON.stringify(entry))).size !== value.length) {
      issues.push(`${path} contains duplicate items`);
    }
    if (schema.items !== undefined) {
      value.forEach((entry, index) => validateNode(schema.items as JsonSchema, entry, `${path}[${index}]`, issues));
    }
  }

  if (objectValue(value)) {
    if (typeof schema.minProperties === 'number' && Object.keys(value).length < schema.minProperties) {
      issues.push(`${path} has too few properties`);
    }
    const properties = objectValue(schema.properties) ? schema.properties : {};
    const required = Array.isArray(schema.required)
      ? schema.required.filter((entry): entry is string => typeof entry === 'string')
      : [];
    for (const name of required) if (!(name in value)) issues.push(`${path}.${name} is required`);
    for (const [name, child] of Object.entries(value)) {
      if (name in properties) {
        validateNode(properties[name] as JsonSchema, child, `${path}.${name}`, issues);
      } else if (schema.additionalProperties === false) {
        issues.push(`${path}.${name} is not allowed`);
      } else if (objectValue(schema.additionalProperties) || typeof schema.additionalProperties === 'boolean') {
        validateNode(schema.additionalProperties as JsonSchema, child, `${path}.${name}`, issues);
      }
    }
  }
}

export function reportingContractIssues(
  value: unknown,
  definition: ReportingContractDefinition,
): string[] {
  const schema = reportingSchema.$defs[definition] as JsonSchema;
  const issues: string[] = [];
  validateNode(schema, value, '$', issues);
  return issues;
}

export function isReportingContract(
  value: unknown,
  definition: ReportingContractDefinition,
): boolean {
  return reportingContractIssues(value, definition).length === 0;
}

export function assertReportingContract(
  value: unknown,
  definition: ReportingContractDefinition,
): void {
  const issues = reportingContractIssues(value, definition);
  if (issues.length > 0) {
    throw new TypeError(`Reporting response violates ${definition}: ${issues.slice(0, 8).join('; ')}`);
  }
}
