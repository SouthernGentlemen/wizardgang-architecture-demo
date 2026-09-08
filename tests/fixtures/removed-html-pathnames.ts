export const removedHtmlPathnames = [
  { pathname: '/edge', outcome: '404', supersededBy: 'platform.edge' },
  { pathname: '/workers', outcome: '404', supersededBy: 'platform.workers' },
  { pathname: '/durable-objects', outcome: '404', supersededBy: 'platform.durable-objects' },
  { pathname: '/d1', outcome: '404', supersededBy: 'platform.d1' },
  { pathname: '/r2', outcome: '404', supersededBy: 'platform.r2' },
  { pathname: '/api', outcome: '404', supersededBy: 'interfaces.rest' },
  { pathname: '/graphql', outcome: 'protocol' },
  { pathname: '/graphql/console', outcome: '404' },
  { pathname: '/webhooks', outcome: '404', supersededBy: 'interfaces.webhooks.console' },
  { pathname: '/identity', outcome: '404', supersededBy: 'interfaces.identity.page' },
  { pathname: '/mcp', outcome: 'protocol' },
  { pathname: '/mcp/server', outcome: '404', supersededBy: 'interfaces.mcp.console' },
  { pathname: '/i18n', outcome: '404', supersededBy: 'interfaces.i18n' },
  { pathname: '/accessibility', outcome: '404', supersededBy: 'interfaces.accessibility' },
  { pathname: '/git', outcome: '404', supersededBy: 'assurance.delivery' },
  { pathname: '/governance', outcome: '404', supersededBy: 'assurance.governance' },
  { pathname: '/evidence', outcome: '404', supersededBy: 'assurance.evidence' },
  { pathname: '/compliance', outcome: '404', supersededBy: 'assurance.compliance' },
  { pathname: '/governance/concerns', outcome: '404', supersededBy: 'assurance.concerns' },
  { pathname: '/governance/risks', outcome: '404', supersededBy: 'assurance.risks' },
  { pathname: '/governance/incidents', outcome: '404', supersededBy: 'assurance.incidents' },
  { pathname: '/dashboard', outcome: '404', supersededBy: 'operations.index' },
  { pathname: '/dashboard/uptime', outcome: '404', supersededBy: 'operations.availability' },
  { pathname: '/dashboard/docs', outcome: '404', supersededBy: 'operations.docs' },
  { pathname: '/dashboard/logs', outcome: '404', supersededBy: 'operations.logs' },
  { pathname: '/dashboard/billing', outcome: '404' },
  { pathname: '/api/rest', outcome: '404', references: 'forbidden' },
  { pathname: '/api/openapi', outcome: '404', references: 'forbidden' },
  { pathname: '/api/graphql', outcome: '404', references: 'forbidden' },
  { pathname: '/api/webhooks', outcome: '404', references: 'forbidden' },
  { pathname: '/identity/oauth', outcome: '404', references: 'forbidden', supersededBy: 'interfaces.identity.page' },
  { pathname: '/identity/sso', outcome: '404', references: 'forbidden', supersededBy: 'interfaces.identity.page' },
  { pathname: '/git/versioning', outcome: '404', references: 'forbidden', supersededBy: 'assurance.delivery' },
  { pathname: '/git/branching', outcome: '404', references: 'forbidden', supersededBy: 'assurance.delivery' },
  { pathname: '/git/releases', outcome: '404', references: 'forbidden', supersededBy: 'assurance.delivery' },
  { pathname: '/git/actions', outcome: '404', references: 'forbidden', supersededBy: 'assurance.delivery' },
  { pathname: '/environments', outcome: '404', references: 'forbidden', supersededBy: 'assurance.delivery' },
  { pathname: '/governance/iso-27001', outcome: '404', references: 'forbidden', supersededBy: 'assurance.compliance' },
  { pathname: '/governance/iso-42001', outcome: '404', references: 'forbidden', supersededBy: 'assurance.compliance' },
  { pathname: '/traceability', outcome: '404', references: 'forbidden', supersededBy: 'assurance.evidence' },
  { pathname: '/dashboard/health', outcome: '404', references: 'forbidden', supersededBy: 'operations.availability' },
] as const;

export const removedHtml404Pathnames = removedHtmlPathnames
  .filter((entry) => entry.outcome === '404')
  .map((entry) => entry.pathname);

export const referenceFreeRemovedHtml404Pathnames = removedHtmlPathnames
  .filter((entry) => entry.outcome === '404' && 'references' in entry && entry.references === 'forbidden')
  .map((entry) => entry.pathname);
