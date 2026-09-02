import swagger from '../../contracts/openapi/swagger.json';
import { json, methodNotAllowed } from '../lib/http';

function yamlScalar(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return JSON.stringify(String(value));
}

function yaml(value: unknown, depth = 0): string {
  const indent = '  '.repeat(depth);
  if (Array.isArray(value) && value.length === 0) return `${indent}[]\n`;
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0) return `${indent}{}\n`;
  if (Array.isArray(value)) return value.map((item) => {
    if (item && typeof item === 'object') return `${indent}-\n${yaml(item, depth + 1)}`;
    return `${indent}- ${yamlScalar(item)}\n`;
  }).join('');
  if (value && typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    const safeKey = /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key) ? key : JSON.stringify(key);
    if (Array.isArray(item) && item.length === 0) return `${indent}${safeKey}: []\n`;
    if (item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item as Record<string, unknown>).length === 0) return `${indent}${safeKey}: {}\n`;
    if (item && typeof item === 'object') return `${indent}${safeKey}:\n${yaml(item, depth + 1)}`;
    return `${indent}${safeKey}: ${yamlScalar(item)}\n`;
  }).join('');
  return `${indent}${yamlScalar(value)}\n`;
}

export function openApiResponse(request: Request, format: 'json' | 'yaml' = 'json'): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  if (format === 'yaml') return new Response(yaml(swagger), { headers: {
    'content-type': 'application/yaml; charset=utf-8',
    'content-disposition': 'attachment; filename="wizardgang-openapi.yaml"',
    'cache-control': 'public, max-age=300',
    'x-content-type-options': 'nosniff',
  } });
  return json(swagger, { headers: { 'cache-control': 'public, max-age=300' } });
}
