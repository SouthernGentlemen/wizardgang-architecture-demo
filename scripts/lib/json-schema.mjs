import fs from 'node:fs';
import path from 'node:path';

const supportedFormats = new Set(['date', 'date-time', 'uri']);
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimePattern = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/i;

function jsonPointerToken(value) {
  return String(value).replaceAll('~', '~0').replaceAll('/', '~1');
}

function deepEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right) return false;
  if (left === null || right === null || typeof left !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left)) {
    return left.length === right.length && left.every((value, index) => deepEqual(value, right[index]));
  }
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return deepEqual(leftKeys, rightKeys) && leftKeys.every((key) => deepEqual(left[key], right[key]));
}

function resolveJsonPointer(rootSchema, pointer) {
  if (pointer === '#' || pointer === '') return rootSchema;
  if (!pointer.startsWith('#/')) throw new Error(`unsupported JSON Schema fragment ${pointer}`);
  return pointer.slice(2).split('/').reduce((value, token) => {
    const decoded = token.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!value || typeof value !== 'object' || !(decoded in value)) {
      throw new Error(`unresolved JSON Schema reference ${pointer}`);
    }
    return value[decoded];
  }, rootSchema);
}

function typeMatches(value, type) {
  switch (type) {
    case 'null': return value === null;
    case 'boolean': return typeof value === 'boolean';
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'integer': return Number.isInteger(value);
    case 'string': return typeof value === 'string';
    default: return false;
  }
}

function validDate(value) {
  const match = datePattern.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(0);
  parsed.setUTCHours(0, 0, 0, 0);
  parsed.setUTCFullYear(year, month - 1, day);
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function validFormat(value, format) {
  if (format === 'date') return validDate(value);
  if (format === 'date-time') {
    const match = dateTimePattern.exec(value);
    return Boolean(match) && validDate(match[1]) && !Number.isNaN(Date.parse(value));
  }
  if (format === 'uri') {
    try {
      const parsed = new URL(value);
      return Boolean(parsed.protocol);
    } catch {
      return false;
    }
  }
  return true;
}

function splitReference(ref) {
  const hashIndex = ref.indexOf('#');
  if (hashIndex === -1) return { document: ref, fragment: '#' };
  return {
    document: ref.slice(0, hashIndex),
    fragment: `#${ref.slice(hashIndex + 1)}`,
  };
}

function resolveReference(ref, context) {
  const { document, fragment } = splitReference(ref);
  if (!document) {
    return {
      target: resolveJsonPointer(context.rootSchema, fragment),
      context,
      schemaPath: fragment,
    };
  }
  if (!context.loadSchema) throw new Error(`unsupported non-local JSON Schema reference ${ref}`);
  const loaded = context.loadSchema(document, context.schemaPath);
  if (!loaded || !loaded.schema || typeof loaded.schema !== 'object' || Array.isArray(loaded.schema)) {
    throw new Error(`unable to load JSON Schema reference ${ref}`);
  }
  assertSupportedNode(loaded.schema, loaded.schemaPath);
  const nestedContext = {
    ...context,
    rootSchema: loaded.schema,
    schemaPath: loaded.schemaPath,
  };
  return {
    target: resolveJsonPointer(loaded.schema, fragment),
    context: nestedContext,
    schemaPath: fragment,
  };
}

function validateNode(value, schema, context, instancePath = '$', schemaPath = '#') {
  if (schema === true) return [];
  if (schema === false) return [{ instancePath, schemaPath, message: 'is rejected by the schema' }];
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new Error(`${context.schemaPath}${schemaPath}: invalid JSON Schema node`);
  }

  const errors = [];
  const push = (message, keyword = '') => errors.push({
    instancePath,
    schemaPath: keyword ? `${schemaPath}/${keyword}` : schemaPath,
    message,
  });

  if (schema.$ref) {
    const resolved = resolveReference(schema.$ref, context);
    const refKey = `${resolved.context.schemaPath}${resolved.schemaPath}`;
    if (context.refStack?.has(refKey)) throw new Error(`cyclic JSON Schema reference ${schema.$ref}`);
    const refStack = new Set(context.refStack ?? []);
    refStack.add(refKey);
    errors.push(...validateNode(
      value,
      resolved.target,
      { ...resolved.context, refStack },
      instancePath,
      resolved.schemaPath,
    ));
  }

  for (const [index, child] of (schema.allOf ?? []).entries()) {
    errors.push(...validateNode(value, child, context, instancePath, `${schemaPath}/allOf/${index}`));
  }

  if (schema.anyOf) {
    const matches = schema.anyOf.filter((child, index) => validateNode(value, child, context, instancePath, `${schemaPath}/anyOf/${index}`).length === 0).length;
    if (matches === 0) push('must match at least one anyOf schema', 'anyOf');
  }

  if (schema.oneOf) {
    const matches = schema.oneOf.filter((child, index) => validateNode(value, child, context, instancePath, `${schemaPath}/oneOf/${index}`).length === 0).length;
    if (matches !== 1) push(`must match exactly one oneOf schema; matched ${matches}`, 'oneOf');
  }

  if (schema.not !== undefined && validateNode(value, schema.not, context, instancePath, `${schemaPath}/not`).length === 0) {
    push('must not match the prohibited schema', 'not');
  }

  if (schema.if !== undefined) {
    const conditionMatches = validateNode(value, schema.if, context, instancePath, `${schemaPath}/if`).length === 0;
    if (conditionMatches && schema.then !== undefined) errors.push(...validateNode(value, schema.then, context, instancePath, `${schemaPath}/then`));
    if (!conditionMatches && schema.else !== undefined) errors.push(...validateNode(value, schema.else, context, instancePath, `${schemaPath}/else`));
  }

  if (Object.hasOwn(schema, 'const') && !deepEqual(value, schema.const)) push(`must equal ${JSON.stringify(schema.const)}`, 'const');
  if (schema.enum && !schema.enum.some((candidate) => deepEqual(value, candidate))) push(`must be one of ${schema.enum.map((candidate) => JSON.stringify(candidate)).join(', ')}`, 'enum');

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(value, type))) {
      push(`must be of type ${types.join(' or ')}`, 'type');
      return errors;
    }
  }

  if (typeof value === 'string') {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) push(`must have length >= ${schema.minLength}`, 'minLength');
    if (schema.maxLength !== undefined && length > schema.maxLength) push(`must have length <= ${schema.maxLength}`, 'maxLength');
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) push(`must match pattern ${schema.pattern}`, 'pattern');
    if (schema.format !== undefined) {
      if (!supportedFormats.has(schema.format)) throw new Error(`${context.schemaPath}${schemaPath}: unsupported format ${schema.format}`);
      if (!validFormat(value, schema.format)) push(`must match format ${schema.format}`, 'format');
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) push(`must be >= ${schema.minimum}`, 'minimum');
    if (schema.maximum !== undefined && value > schema.maximum) push(`must be <= ${schema.maximum}`, 'maximum');
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) push(`must be > ${schema.exclusiveMinimum}`, 'exclusiveMinimum');
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) push(`must be < ${schema.exclusiveMaximum}`, 'exclusiveMaximum');
    if (schema.multipleOf !== undefined && Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > Number.EPSILON) push(`must be a multiple of ${schema.multipleOf}`, 'multipleOf');
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) push(`must contain at least ${schema.minItems} items`, 'minItems');
    if (schema.maxItems !== undefined && value.length > schema.maxItems) push(`must contain at most ${schema.maxItems} items`, 'maxItems');
    if (schema.uniqueItems) {
      for (let left = 0; left < value.length; left += 1) {
        for (let right = left + 1; right < value.length; right += 1) {
          if (deepEqual(value[left], value[right])) push(`items ${left} and ${right} must be unique`, 'uniqueItems');
        }
      }
    }
    if (Object.hasOwn(schema, 'items')) {
      value.forEach((item, index) => errors.push(...validateNode(item, schema.items, context, `${instancePath}[${index}]`, `${schemaPath}/items`)));
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const required = schema.required ?? [];
    for (const key of required) {
      if (!Object.hasOwn(value, key)) errors.push({
        instancePath,
        schemaPath: `${schemaPath}/required`,
        message: `must contain required property ${key}`,
      });
    }

    for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) {
        errors.push(...validateNode(value[key], propertySchema, context, `${instancePath}.${key}`, `${schemaPath}/properties/${jsonPointerToken(key)}`));
      }
    }

    for (const [key, dependencies] of Object.entries(schema.dependentRequired ?? {})) {
      if (Object.hasOwn(value, key)) {
        for (const dependency of dependencies) {
          if (!Object.hasOwn(value, dependency)) errors.push({
            instancePath,
            schemaPath: `${schemaPath}/dependentRequired/${jsonPointerToken(key)}`,
            message: `${key} requires property ${dependency}`,
          });
        }
      }
    }

    const known = new Set(Object.keys(schema.properties ?? {}));
    for (const key of Object.keys(value)) {
      if (known.has(key)) continue;
      if (schema.additionalProperties === false) {
        errors.push({
          instancePath: `${instancePath}.${key}`,
          schemaPath: `${schemaPath}/additionalProperties`,
          message: `additional property ${key} is not allowed`,
        });
      } else if (schema.additionalProperties !== undefined && schema.additionalProperties !== true) {
        errors.push(...validateNode(value[key], schema.additionalProperties, context, `${instancePath}.${key}`, `${schemaPath}/additionalProperties`));
      }
    }
  }

  return errors;
}

const annotationKeywords = new Set(['$schema', '$id', 'title', 'description', '$comment', 'default', 'examples']);
const directSchemaKeywords = new Set(['items', 'additionalProperties', 'not', 'if', 'then', 'else']);
const arraySchemaKeywords = new Set(['allOf', 'anyOf', 'oneOf']);
const scalarKeywords = new Set([
  '$ref', 'type', 'const', 'enum', 'required', 'pattern', 'format', 'minLength', 'maxLength',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'minItems', 'maxItems',
  'uniqueItems', 'dependentRequired',
]);

function assertSupportedNode(schema, schemaPath, pointer = '#') {
  if (typeof schema === 'boolean') return;
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error(`${schemaPath}${pointer}: invalid JSON Schema node`);

  for (const key of Object.keys(schema)) {
    if (annotationKeywords.has(key) || scalarKeywords.has(key) || directSchemaKeywords.has(key) || arraySchemaKeywords.has(key) || key === 'properties' || key === '$defs') continue;
    throw new Error(`${schemaPath}${pointer}: unsupported JSON Schema keyword ${key}`);
  }

  for (const [key, child] of Object.entries(schema.properties ?? {})) assertSupportedNode(child, schemaPath, `${pointer}/properties/${jsonPointerToken(key)}`);
  for (const [key, child] of Object.entries(schema.$defs ?? {})) assertSupportedNode(child, schemaPath, `${pointer}/$defs/${jsonPointerToken(key)}`);
  for (const key of directSchemaKeywords) {
    if (Object.hasOwn(schema, key)) assertSupportedNode(schema[key], schemaPath, `${pointer}/${key}`);
  }
  for (const key of arraySchemaKeywords) {
    for (const [index, child] of (schema[key] ?? []).entries()) assertSupportedNode(child, schemaPath, `${pointer}/${key}/${index}`);
  }
}

export function createFileSchemaLoader(root = process.cwd()) {
  const absoluteRoot = path.resolve(root);
  const cache = new Map();
  return (reference, fromSchemaPath) => {
    if (!reference || reference.includes('#')) throw new Error(`invalid JSON Schema document reference ${reference}`);
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(reference)) throw new Error(`unsupported absolute JSON Schema reference ${reference}`);
    const fromDirectory = path.posix.dirname(fromSchemaPath);
    const resolvedPath = path.posix.normalize(path.posix.join(fromDirectory, reference));
    const absolutePath = path.resolve(absoluteRoot, ...resolvedPath.split('/'));
    const relativePath = path.relative(absoluteRoot, absolutePath);
    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`JSON Schema reference escapes repository root: ${reference}`);
    }
    const normalizedPath = relativePath.split(path.sep).join('/');
    if (!cache.has(normalizedPath)) {
      cache.set(normalizedPath, JSON.parse(fs.readFileSync(absolutePath, 'utf8')));
    }
    return { schema: cache.get(normalizedPath), schemaPath: normalizedPath };
  };
}

export function validateJsonSchema(value, schema, { schemaPath = '<schema>', loadSchema } = {}) {
  assertSupportedNode(schema, schemaPath);
  return validateNode(value, schema, { rootSchema: schema, schemaPath, loadSchema, refStack: new Set() });
}

export function formatJsonSchemaErrors(dataPath, schemaPath, errors) {
  return errors.map((error) => `${dataPath}: ${error.instancePath} ${error.message} (${schemaPath}${error.schemaPath})`);
}
