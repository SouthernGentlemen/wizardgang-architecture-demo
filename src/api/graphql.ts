import type { Env } from '../types';
import { authorize } from '../lib/authorization';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

interface GraphQLRequest { query?: unknown; variables?: unknown; operationName?: unknown }
interface RecordRow { id: number; namespace: string; record_key: string; value_json: string }

const SCHEMA = `type DemoRecord {
  id: ID!
  namespace: String!
  key: String!
  valueJson: String!
}

type Query {
  demoRecords(namespace: String): [DemoRecord!]!
}

schema { query: Query }
`;

function namespaceFrom(body: GraphQLRequest): string {
  const variables = body.variables && typeof body.variables === 'object' ? body.variables as Record<string, unknown> : {};
  const fromVariables = variables.namespace;
  const query = typeof body.query === 'string' ? body.query : '';
  const literal = query.match(/demoRecords\s*\(\s*namespace\s*:\s*"([^"]+)"\s*\)/)?.[1];
  const value = typeof fromVariables === 'string' ? fromVariables : literal ?? 'public';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(value)) throw new HttpError(400, 'invalid_namespace');
  return value;
}

export async function graphqlResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  try {
    const principal = await authorize(request, env, 'demo:read');
    if (principal instanceof Response) return principal;
    const body = await readJson<GraphQLRequest>(request);
    const query = typeof body.query === 'string' ? body.query : '';
    if (/\bmutation\b/i.test(query)) return json({ errors: [{ message: 'Mutations are not exposed by this public schema.' }] }, { status: 400 });
    if (!/\bdemoRecords\b/.test(query)) return json({ errors: [{ message: 'Unknown or missing query field.' }] }, { status: 400 });
    if (query.length > 4000) throw new HttpError(413, 'query_too_large');
    const namespace = namespaceFrom(body);
    const result = await env.DEMO_DB.prepare(
      `SELECT id, namespace, record_key, value_json FROM demo_records
       WHERE namespace = ? ORDER BY record_key LIMIT 100`,
    ).bind(namespace).all<RecordRow>();
    await recordApplicationLog(env, { source: 'graphql', eventKey: 'records_queried', message: `GraphQL queried ${result.results.length} demo record(s).`, route: '/graphql', detail: { namespace, resultCount: result.results.length, subject: principal.subject } });
    return json({ data: { demoRecords: result.results.map((row) => ({ id: String(row.id), namespace: row.namespace, key: row.record_key, valueJson: row.value_json })) } }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export function graphqlSchemaResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return new Response(SCHEMA, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' } });
}
