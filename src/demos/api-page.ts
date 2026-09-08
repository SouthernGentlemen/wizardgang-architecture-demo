import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { routeUrl } from '../routing/application-routes';
import { pageContent, type PageContent } from '../ui/page';
import { openApiConsole } from './openapi-console';

export function apiContent(env: Env): PageContent {
  const restUrl = routeUrl('interfaces.rest');
  const graphqlUrl = routeUrl('interfaces.graphql.console');
  const webhooksUrl = routeUrl('interfaces.webhooks.console');
  const mcpUrl = routeUrl('interfaces.mcp.console');
  const identityUrl = routeUrl('interfaces.identity.page');
  return pageContent(env, 'REST API', `
<section class="page-header lab-page-header api-page-header">
  <h1>REST API</h1>
  <p class="lede">Execute requests against the live versioned API and inspect the OpenAPI 3.1 contract that generates this explorer.</p>
  <div class="api-hero-badges"><span class="badge">REST</span><span class="badge">OpenAPI 3.1</span><span class="badge">D1</span><span class="badge">v1</span></div>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/api.ts'))}">View source ↗</a></div>
</section>
${openApiConsole()}
<section class="related-interfaces" aria-labelledby="related-interfaces-heading">
  <p class="eyebrow">Same policy, different transports</p><h2 id="related-interfaces-heading">Related interfaces</h2>
  <nav class="resource-list" aria-label="Related application interfaces"><a href="${escapeHtml(graphqlUrl)}"><strong>GraphQL →</strong><code>${escapeHtml(graphqlUrl)}</code></a><a href="${escapeHtml(webhooksUrl)}"><strong>Webhooks →</strong><code>${escapeHtml(webhooksUrl)}</code></a><a href="${escapeHtml(mcpUrl)}"><strong>MCP →</strong><code>${escapeHtml(mcpUrl)}</code></a><a href="${escapeHtml(identityUrl)}"><strong>Identity →</strong><code>${escapeHtml(identityUrl)}</code></a></nav>
</section>
<details class="implementation-notes"><summary>Implementation details</summary><ul><li>Permanent operator credentials remain environment-owned and never enter the browser.</li><li>Visitor tokens expire after ten minutes and can address only a server-derived namespace.</li><li>D1 audit events and public-safe logs record behavior without recording bearer values or request bodies.</li></ul></details>`, {
    canonicalPath: restUrl, description: 'Execute live REST requests and inspect the versioned OpenAPI 3.1 contract.', cacheControl: 'no-store',
  });
}
