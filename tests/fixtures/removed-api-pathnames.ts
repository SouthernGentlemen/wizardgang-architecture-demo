export const retiredApiReferencePrefixes = ['/v1', '/__api', '/health', '/version'] as const;

export const removedPlatformLaboratoryPathnames = [
  '/__api/edge/inspect',
  '/__api/workers/compute',
  '/__api/durable/counter',
  '/__api/d1/users',
  '/__api/d1/users/example',
  '/__api/d1/tasks',
  '/__api/d1/tasks/example',
  '/__api/d1/reset',
  '/v1/demo-records',
  '/v1/demo-records/example',
  '/__api/api-sandbox/reset',
  '/__api/r2/demo',
  '/__api/r2/object',
  '/__api/r2/files',
  '/__api/r2/files/example',
  '/__api/r2/reset',
  '/__api/accessibility/lab',
  '/__api/webhooks/demo',
  '/__api/webhooks/events',
  '/__api/webhooks/reset',
  '/__api/git/demo',
  '/__api/git/demo/release',
  '/__api/evidence/traceability',
  '/__api/governance/security-controls',
  '/__api/governance/ai-evaluation',
] as const;

export const removedIdentityAndProtocolPathnames = [
  '/identity/microsoft', '/identity/microsoft/callback', '/identity/google', '/identity/google/callback',
  '/identity/github', '/identity/github/callback', '/identity/saml', '/identity/saml/acs', '/identity/saml/metadata',
  '/identity/session', '/identity/logout', '/__api/identity/oauth-pkce', '/__api/identity/authorize', '/__api/identity/token',
  '/__api/identity/sso', '/__api/identity/saml/inspect', '/mcp/server', '/graphql/console', '/graphql/schema',
  '/__assets/graphiql/graphiql.min.js', '/v1/webhooks/demo', '/v1/webhooks/github', '/og.png',
] as const;

export const removedRouterFallbackPathnames = ['/__api/demo/run', '/__api/demo/events'] as const;

export const noncanonicalSyntheticLabPathname = '/__api/synthetic/ping';
