export const removedHtmlPathnames = [
  { pathname: '/edge', outcome: '404' },
  { pathname: '/workers', outcome: '404' },
  { pathname: '/durable-objects', outcome: '404' },
  { pathname: '/d1', outcome: '404' },
  { pathname: '/r2', outcome: '404' },
  { pathname: '/api', outcome: '404' },
  { pathname: '/graphql', outcome: 'protocol' },
  { pathname: '/graphql/console', outcome: '404' },
  { pathname: '/webhooks', outcome: '404' },
  { pathname: '/identity', outcome: '404' },
  { pathname: '/mcp', outcome: '404' },
  { pathname: '/i18n', outcome: '404' },
  { pathname: '/accessibility', outcome: '404' },
  { pathname: '/git', outcome: '404' },
  { pathname: '/governance', outcome: '404' },
  { pathname: '/evidence', outcome: '404' },
  { pathname: '/compliance', outcome: '404' },
  { pathname: '/governance/concerns', outcome: '404' },
  { pathname: '/governance/risks', outcome: '404' },
  { pathname: '/governance/incidents', outcome: '404' },
  { pathname: '/dashboard', outcome: '404' },
  { pathname: '/dashboard/uptime', outcome: '404' },
  { pathname: '/dashboard/docs', outcome: '404' },
  { pathname: '/dashboard/logs', outcome: '404' },
  { pathname: '/dashboard/billing', outcome: '404' },
  { pathname: '/api/rest', outcome: '404', references: 'forbidden' },
  { pathname: '/api/openapi', outcome: '404', references: 'forbidden' },
  { pathname: '/api/graphql', outcome: '404', references: 'forbidden' },
  { pathname: '/api/webhooks', outcome: '404', references: 'forbidden' },
  { pathname: '/identity/oauth', outcome: '404', references: 'forbidden' },
  { pathname: '/identity/sso', outcome: '404', references: 'forbidden' },
  { pathname: '/git/versioning', outcome: '404', references: 'forbidden' },
  { pathname: '/git/branching', outcome: '404', references: 'forbidden' },
  { pathname: '/git/releases', outcome: '404', references: 'forbidden' },
  { pathname: '/git/actions', outcome: '404', references: 'forbidden' },
  { pathname: '/environments', outcome: '404', references: 'forbidden' },
  { pathname: '/governance/iso-27001', outcome: '404', references: 'forbidden' },
  { pathname: '/governance/iso-42001', outcome: '404', references: 'forbidden' },
  { pathname: '/traceability', outcome: '404', references: 'forbidden' },
  { pathname: '/dashboard/health', outcome: '404', references: 'forbidden' },
] as const;

export const removedHtml404Pathnames = removedHtmlPathnames
  .filter((entry) => entry.outcome === '404')
  .map((entry) => entry.pathname);

export const referenceFreeRemovedHtml404Pathnames = removedHtmlPathnames
  .filter((entry) => entry.outcome === '404' && 'references' in entry && entry.references === 'forbidden')
  .map((entry) => entry.pathname);
