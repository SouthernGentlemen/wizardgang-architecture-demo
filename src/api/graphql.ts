import { GraphQLError, Kind, parse, type DocumentNode, type SelectionSetNode } from 'graphql';
import { createSchema, createYoga } from 'graphql-yoga';
import type { Env } from '../types';
import { requireSameOrigin } from '../lib/admin-auth';
import { authorize, type Principal } from '../lib/authorization';
import { ensureDemoSession, withDemoSession, type DemoSession } from '../lib/demo-session';
import { createDemoUser, deleteDemoUser, getDemoUser, listDemoUsers, updateDemoUser } from '../lib/demo-users';
import { json, methodNotAllowed, withSecurityHeaders } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';
import { localGraphiqlResponse } from '../ui/graphiql-assets';

interface RecordRow { id: number; namespace: string; record_key: string; value_json: string }
interface GraphQLServerContext { env: Env; request: Request; principal: Principal; session?: DemoSession }

const SCHEMA = `"""Executable public schema backed by the shared D1 demonstration database."""
type DemoRecord {
  id: ID!
  namespace: String!
  key: String!
  valueJson: String!
}

type User {
  id: ID!
  name: String!
  email: String!
  role: UserRole!
  createdAt: String!
  updatedAt: String!
}

enum UserRole { ADMIN MEMBER VIEWER }
input CreateUserInput { name: String!, email: String!, role: UserRole! }
input UpdateUserInput { name: String!, email: String!, role: UserRole! }

type Query {
  demoRecords(namespace: String): [DemoRecord!]!
  users: [User!]!
  user(id: ID!): User
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

schema { query: Query, mutation: Mutation }
`;

function sandbox(context: GraphQLServerContext): DemoSession {
  if (!context.session) throw new GraphQLError('Visitor sandbox is not configured.', { extensions: { code: 'SERVICE_UNAVAILABLE' } });
  return context.session;
}

function authorizeMutation(context: GraphQLServerContext): void {
  if (!context.principal.permissions.includes('demo:write')) throw new GraphQLError('Authentication is required for mutations.', { extensions: { code: 'UNAUTHENTICATED' } });
  if (!context.request.headers.has('authorization') && requireSameOrigin(context.request)) throw new GraphQLError('A same-origin session mutation is required.', { extensions: { code: 'FORBIDDEN' } });
}

const schema = createSchema<GraphQLServerContext>({
  typeDefs: SCHEMA,
  resolvers: {
    UserRole: { ADMIN: 'admin', MEMBER: 'member', VIEWER: 'viewer' },
    Query: {
      async demoRecords(_: unknown, args: { namespace?: string }, context: GraphQLServerContext) {
        const namespace = context.principal.namespace ?? (context.principal.authentication === 'anonymous' ? 'public' : args.namespace ?? 'public');
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(namespace)) throw new GraphQLError('Invalid namespace.', { extensions: { code: 'BAD_USER_INPUT' } });
        const result = await context.env.DEMO_DB.prepare(
          'SELECT id, namespace, record_key, value_json FROM demo_records WHERE namespace = ? ORDER BY record_key LIMIT 100',
        ).bind(namespace).all<RecordRow>();
        await recordApplicationLog(context.env, { source: 'graphql', eventKey: 'records_queried', message: `GraphQL queried ${result.results.length} demo record(s).`, route: '/graphql', detail: { namespace, resultCount: result.results.length, authentication: context.principal.authentication } });
        return result.results.map((row) => ({ id: String(row.id), namespace: row.namespace, key: row.record_key, valueJson: row.value_json }));
      },
      async users(_: unknown, _args: unknown, context: GraphQLServerContext) {
        return listDemoUsers(context.env, sandbox(context).id);
      },
      async user(_: unknown, args: { id: string }, context: GraphQLServerContext) {
        return getDemoUser(context.env, sandbox(context).id, args.id);
      },
    },
    Mutation: {
      async createUser(_: unknown, args: { input: { name: string; email: string; role: string } }, context: GraphQLServerContext) {
        authorizeMutation(context);
        return createDemoUser(context.env, sandbox(context).id, { ...args.input, role: args.input.role.toLowerCase() });
      },
      async updateUser(_: unknown, args: { id: string; input: { name: string; email: string; role: string } }, context: GraphQLServerContext) {
        authorizeMutation(context);
        return updateDemoUser(context.env, sandbox(context).id, args.id, { ...args.input, role: args.input.role.toLowerCase() });
      },
      async deleteUser(_: unknown, args: { id: string }, context: GraphQLServerContext) {
        authorizeMutation(context);
        await deleteDemoUser(context.env, sandbox(context).id, args.id);
        return true;
      },
    },
  },
});

const yoga = createYoga<GraphQLServerContext>({
  schema,
  graphqlEndpoint: '/graphql',
  landingPage: false,
  batching: false,
  maskedErrors: {
    errorMessage: 'Unexpected GraphQL execution error.',
    maskError(error, message) {
      const candidate = error as { message?: unknown; extensions?: { code?: unknown }; originalError?: { extensions?: { code?: unknown } } };
      const code = String(candidate.extensions?.code ?? candidate.originalError?.extensions?.code ?? '');
      if (['UNAUTHENTICATED', 'FORBIDDEN', 'BAD_USER_INPUT', 'SERVICE_UNAVAILABLE'].includes(code) && error instanceof Error) return error;
      return new GraphQLError(message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    },
  },
  graphiql: false,
});

function documentMetrics(document: DocumentNode): { fields: number; depth: number } {
  let fields = 0;
  let maximumDepth = 0;
  const walk = (selectionSet: SelectionSetNode | undefined, depth: number) => {
    if (!selectionSet) return;
    maximumDepth = Math.max(maximumDepth, depth);
    for (const selection of selectionSet.selections) {
      if (selection.kind === Kind.FIELD) { fields += 1; walk(selection.selectionSet, depth + 1); }
      else if (selection.kind === Kind.INLINE_FRAGMENT) walk(selection.selectionSet, depth + 1);
    }
  };
  for (const definition of document.definitions) if (definition.kind === Kind.OPERATION_DEFINITION || definition.kind === Kind.FRAGMENT_DEFINITION) walk(definition.selectionSet, 1);
  return { fields, depth: maximumDepth };
}

async function limitsFailure(request: Request): Promise<Response | null> {
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > 16_384) return json({ errors: [{ message: 'GraphQL request is too large.' }] }, { status: 413 });
  if (request.method !== 'POST') return null;
  const text = await request.clone().text();
  if (new TextEncoder().encode(text).byteLength > 16_384) return json({ errors: [{ message: 'GraphQL request is too large.' }] }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return null; }
  if (Array.isArray(body)) return json({ errors: [{ message: 'Batched GraphQL requests are disabled.' }] }, { status: 400 });
  const query = body && typeof body === 'object' ? (body as { query?: unknown }).query : undefined;
  if (typeof query !== 'string') return null;
  try {
    const metrics = documentMetrics(parse(query));
    const introspection = /\b__(schema|type)\b/.test(query);
    const depthLimit = introspection ? 20 : 8;
    const fieldLimit = introspection ? 500 : 50;
    if (metrics.depth > depthLimit || metrics.fields > fieldLimit) return json({ errors: [{ message: 'GraphQL operation exceeds the public demo complexity limit.' }] }, { status: 400 });
  } catch { /* Yoga returns the canonical parse error. */ }
  return null;
}

function secured(response: Response, session?: DemoSession): Response {
  const headers = new Headers(response.headers);
  withSecurityHeaders(headers);
  const wrapped = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  return session ? withDemoSession(wrapped, session) : wrapped;
}

export async function graphqlResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') return methodNotAllowed(['GET', 'POST']);
  const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
  if (request.method === 'GET' && acceptsHtml) return localGraphiqlResponse(request);
  const failure = await limitsFailure(request);
  if (failure) return failure;
  const principal = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
  if (principal instanceof Response) return principal;
  let session: DemoSession | undefined;
  if (env.DEMO_SESSION_SECRET) {
    try { session = await ensureDemoSession(request, env); }
    catch { /* Legacy demoRecords remains available if the optional sandbox is misconfigured. */ }
  }
  let response = await yoga.fetch(request, { env, request, principal, session });
  if (request.method === 'POST' && response.status === 200 && (response.headers.get('content-type') || '').includes('application/json')) {
    const payload = await response.clone().json() as { data?: unknown; errors?: unknown[] };
    if (payload.data === undefined && payload.errors?.length) response = new Response(response.body, { status: 400, headers: response.headers });
  }
  return secured(response, session);
}

export function graphqlSchemaResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return new Response(SCHEMA, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' } });
}
