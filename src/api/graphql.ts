import { GraphQLError, Kind, parse, type DocumentNode, type SelectionSetNode } from 'graphql';
import { createSchema, createYoga } from 'graphql-yoga';
import type { Env } from '../types';
import { requireSameOrigin } from '../lib/admin-auth';
import { authorize, type Principal } from '../lib/authorization';
import { ensureDemoSession, withDemoSession, type DemoSession } from '../lib/demo-session';
import { createDemoUser, deleteDemoUser, getDemoUser, listDemoUsers, updateDemoUser } from '../lib/demo-users';
import { json, methodNotAllowed, withSecurityHeaders } from '../lib/http';
import { localGraphiqlResponse } from '../ui/graphiql-assets';

interface GraphQLServerContext { env: Env; request: Request; principal: Principal; session?: DemoSession }

const SCHEMA = `"""Executable public schema backed by the shared D1 demonstration database."""
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
    catch { /* Yoga returns a service-unavailable error for sandbox-backed fields. */ }
  }
  let response = await yoga.fetch(request, { env, request, principal, session });
  if (request.method === 'POST' && response.status === 200 && (response.headers.get('content-type') || '').includes('application/json')) {
    const payload = await response.clone().json() as { data?: unknown; errors?: unknown[] };
    if (payload.data === undefined && payload.errors?.length) response = new Response(response.body, { status: 400, headers: response.headers });
  }
  return secured(response, session);
}
