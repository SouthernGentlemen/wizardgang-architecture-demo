import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { interfaceIdentityCapabilities } from '../src/interfaces/route-capabilities';
import {
  defineInterfaceIdentityCapability,
  interfaceIdentityRoute,
} from '../src/interfaces/route-capability';
import {
  createInterfaceIdentityRouteRouter,
  interfaceIdentityRouteRegistry,
  interfaceIdentityWantsHtml,
  isInterfaceIdentityApiLike,
} from '../src/routing/interface-identity-routes';
import { matchRoute } from '../src/routing/registry';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class InterfaceStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: { last_row_id: 1 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-05T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'enabled', updated_at: '2026-09-05T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

class InterfaceD1 {
  prepare(sql: string) { return new InterfaceStatement(sql); }
}

const onlineEnv = {
  DEMO_DB: new InterfaceD1(),
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as unknown as Env;

const routes = interfaceIdentityCapabilities.flatMap((capability) => capability.routes);
const routeById = (id: string) => {
  const route = routes.find((candidate) => candidate.id === id);
  if (!route) throw new Error(`Missing route ${id}`);
  return route;
};

describe('interface and identity declarative routing', () => {
  it('owns every migrated interface, protocol, identity, Git, governance, i18n, and frontend route', () => {
    expect(routes.map((route) => route.pattern).sort()).toEqual([
      '/',
      '/api',
      '/v1/openapi.json',
      '/v1/openapi.yaml',
      '/graphql',
      '/graphql/console',
      '/graphql/schema',
      '/__assets/graphiql/:asset',
      '/webhooks',
      '/v1/webhooks/demo',
      '/v1/webhooks/github',
      '/__api/webhooks/demo',
      '/__api/webhooks/events',
      '/__api/webhooks/reset',
      '/identity',
      '/__api/identity/oauth-pkce',
      '/__api/identity/authorize',
      '/__api/identity/token',
      '/__api/identity/sso',
      '/identity/microsoft',
      '/identity/microsoft/callback',
      '/identity/google',
      '/identity/google/callback',
      '/identity/github',
      '/identity/github/callback',
      '/identity/saml',
      '/identity/saml/acs',
      '/identity/saml/metadata',
      '/identity/session',
      '/identity/logout',
      '/__api/identity/saml/inspect',
      '/mcp',
      '/mcp/server',
      '/git',
      '/__api/git/evidence',
      '/__api/git/demo',
      '/__api/git/demo/release',
      '/governance',
      '/governance/concerns',
      '/__api/evidence/traceability',
      '/__api/governance/security-controls',
      '/__api/governance/ai-evaluation',
      '/i18n',
    ].sort());

    for (const route of routes) {
      expect(route.methods.length, route.id).toBeGreaterThan(0);
      expect(route.authentication, route.id).toBeDefined();
      expect(route.authorization, route.id).toBeDefined();
      expect(route.offline, route.id).toEqual({ mode: 'gated' });
      expect(route.cache, route.id).toBeDefined();
      expect(route.source.module, route.id).toMatch(/^src\//);
      expect(route.source.tests, route.id).toContain('tests/interface-identity-routing.test.ts');
      expect(route.handler, route.id).toBeTypeOf('function');
    }
  });

  it('uses the shared matcher for consistent method routing', async () => {
    const openApiPost = matchRoute(interfaceIdentityRouteRegistry, 'POST', '/v1/openapi.json');
    expect(openApiPost.status).toBe('method-not-allowed');
    if (openApiPost.status === 'method-not-allowed') expect(openApiPost.allowedMethods).toEqual(['GET']);

    const samlGet = matchRoute(interfaceIdentityRouteRegistry, 'GET', '/identity/saml/acs');
    expect(samlGet.status).toBe('method-not-allowed');
    if (samlGet.status === 'method-not-allowed') expect(samlGet.allowedMethods).toEqual(['POST']);

    const gitPut = matchRoute(interfaceIdentityRouteRegistry, 'PUT', '/__api/git/demo');
    expect(gitPut.status).toBe('method-not-allowed');
    if (gitPut.status === 'method-not-allowed') expect(gitPut.allowedMethods).toEqual(['GET', 'POST']);

    const router = createInterfaceIdentityRouteRouter();
    const response = await router.route(
      new Request('https://demo.wizardgang.ai/v1/openapi.json', { method: 'POST' }),
      onlineEnv,
      '/v1/openapi.json',
    );
    expect(response?.status).toBe(405);
    expect(response?.headers.get('allow')).toBe('GET');
  });

  it('declares the authentication, authorization, origin, and reporting boundaries', () => {
    expect(routeById('interfaces.identity.authorize')).toMatchObject({
      authentication: { mode: 'required', provider: 'identity-session' },
      authorization: { mode: 'policy', policy: 'demo:read or demo:write' },
      sameOrigin: { mode: 'required', methods: ['POST'] },
      visibility: 'private',
    });
    expect(routeById('interfaces.identity.saml.acs').sameOrigin).toEqual({ mode: 'not-required' });
    expect(routeById('interfaces.graphql.endpoint')).toMatchObject({
      authorization: { mode: 'policy', policy: 'demo:read; mutations require demo:write' },
      sameOrigin: { mode: 'required', methods: ['POST'] },
    });
    expect(routeById('interfaces.webhooks.github').authorization).toMatchObject({ mode: 'policy' });
    expect(routeById('interfaces.webhooks.synthetic').sameOrigin).toEqual({ mode: 'required', methods: ['POST'] });
    expect(routeById('interfaces.mcp.server').authorization).toMatchObject({ mode: 'policy' });
    expect(routeById('interfaces.git.demo-release')).toMatchObject({
      authentication: { mode: 'required', provider: 'admin-basic' },
      sameOrigin: { mode: 'required', methods: ['POST'] },
      visibility: 'private',
    });
    expect(routeById('interfaces.git.reporting').authorization).toEqual({
      mode: 'policy',
      policy: 'GET demo:read; POST reporting:write; disclosure follows principal and source visibility',
    });
  });

  it('registers protocol endpoints and callbacks without changing their URLs', () => {
    expect(routeById('interfaces.graphql.endpoint')).toMatchObject({ kind: 'protocol', methods: ['GET', 'POST'] });
    expect(routeById('interfaces.webhooks.github')).toMatchObject({ kind: 'protocol', methods: ['POST'] });
    expect(routeById('interfaces.identity.microsoft.callback')).toMatchObject({ pattern: '/identity/microsoft/callback', kind: 'protocol', methods: ['GET'] });
    expect(routeById('interfaces.identity.google.callback')).toMatchObject({ pattern: '/identity/google/callback', kind: 'protocol', methods: ['GET'] });
    expect(routeById('interfaces.identity.github.callback')).toMatchObject({ pattern: '/identity/github/callback', kind: 'protocol', methods: ['GET'] });
    expect(routeById('interfaces.identity.saml.acs')).toMatchObject({ pattern: '/identity/saml/acs', kind: 'protocol', methods: ['POST'] });
    expect(routeById('interfaces.mcp.server')).toMatchObject({ pattern: '/mcp/server', kind: 'protocol', methods: ['GET', 'POST', 'DELETE'] });
  });

  it('keeps GraphQL HTML negotiation and API-like classification capability-owned', () => {
    expect(interfaceIdentityWantsHtml(new Request('https://demo.wizardgang.ai/graphql'), '/graphql')).toBe(true);
    expect(interfaceIdentityWantsHtml(new Request('https://demo.wizardgang.ai/graphql', { headers: { accept: 'text/html' } }), '/graphql')).toBe(true);
    expect(interfaceIdentityWantsHtml(new Request('https://demo.wizardgang.ai/graphql', { headers: { accept: 'application/json' } }), '/graphql')).toBe(false);
    expect(isInterfaceIdentityApiLike('/graphql')).toBe(true);
    expect(isInterfaceIdentityApiLike('/mcp/server')).toBe(true);
    expect(isInterfaceIdentityApiLike('/identity')).toBe(false);
  });

  it('can register a compatible new interface without modifying the central router', async () => {
    const synthetic = defineInterfaceIdentityCapability('interfaces.synthetic', [
      interfaceIdentityRoute({
        id: 'interfaces.synthetic.ping',
        pattern: '/__api/interfaces-synthetic/ping',
        methods: ['GET'],
        kind: 'api',
        handler: () => new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } }),
        title: 'Synthetic interface',
        description: 'Test-only interface capability.',
        sourceModule: 'tests/interface-identity-routing.test.ts',
        sourceExport: 'synthetic',
      }),
    ]);
    const router = createInterfaceIdentityRouteRouter([...interfaceIdentityCapabilities, synthetic]);
    const response = await router.route(
      new Request('https://demo.wizardgang.ai/__api/interfaces-synthetic/ping'),
      onlineEnv,
      '/__api/interfaces-synthetic/ping',
    );
    expect(response?.status).toBe(200);
    expect(await response?.json()).toEqual({ ok: true });
    expect(fs.readFileSync('src/router.ts', 'utf8')).not.toContain('/__api/interfaces-synthetic/ping');
  });

  it('keeps unknown interface paths unregistered and 404s from the main router', async () => {
    const router = createInterfaceIdentityRouteRouter();
    expect(await router.route(
      new Request('https://demo.wizardgang.ai/identity/not-a-route'),
      onlineEnv,
      '/identity/not-a-route',
    )).toBeUndefined();

    const response = await routeRequest(
      new Request('https://demo.wizardgang.ai/identity/not-a-route'),
      onlineEnv,
    );
    expect(response.status).toBe(404);
  });

  it('removes migrated interface path checks and the demo fallback from the central router', () => {
    const centralRouterSource = fs.readFileSync('src/router.ts', 'utf8');
    expect(centralRouterSource).toContain('routeInterfaceIdentityRequest');
    expect(centralRouterSource).not.toContain('demosByRoute');

    for (const route of routes) {
      if (route.pattern === '/') continue;
      expect(centralRouterSource, route.pattern).not.toContain(`'${route.pattern}'`);
      expect(centralRouterSource, route.pattern).not.toContain(`\"${route.pattern}\"`);
    }
  });
});
