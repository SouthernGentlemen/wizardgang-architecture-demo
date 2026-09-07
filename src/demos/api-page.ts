import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { shell } from '../ui/page';
import { openApiConsole } from './openapi-console';

export function renderApiDemo(env: Env): Response {
  return shell(env, 'REST API', `
<section class="page-header lab-page-header api-page-header">
  <p class="eyebrow">Interfaces / API</p>
  <h1>REST API</h1>
  <p class="lede">Execute requests against the live versioned API and inspect the OpenAPI 3.1 contract that generates this explorer.</p>
  <div class="api-hero-badges"><span class="badge">REST</span><span class="badge">OpenAPI 3.1</span><span class="badge">D1</span><span class="badge">v1</span></div>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/api.ts'))}">View source ↗</a></div>
</section>
${openApiConsole()}
<section class="related-interfaces" aria-labelledby="related-interfaces-heading">
  <p class="eyebrow">Same policy, different transports</p><h2 id="related-interfaces-heading">Related interfaces</h2>
  <nav class="resource-list" aria-label="Related application interfaces"><a href="/interfaces?view=graphql"><strong>GraphQL →</strong><code>/interfaces?view=graphql</code></a><a href="/interfaces?view=webhooks"><strong>Webhooks →</strong><code>/interfaces?view=webhooks</code></a><a href="/interfaces?view=mcp"><strong>MCP →</strong><code>/interfaces?view=mcp</code></a><a href="/interfaces?view=identity"><strong>Identity →</strong><code>/interfaces?view=identity</code></a></nav>
</section>
<details class="implementation-notes"><summary>Implementation details</summary><ul><li>Permanent operator credentials remain environment-owned and never enter the browser.</li><li>Visitor tokens expire after ten minutes and can address only a server-derived namespace.</li><li>D1 audit events and public-safe logs record behavior without recording bearer values or request bodies.</li></ul></details>`, {
    activeRoute: '/interfaces', description: 'Execute live REST requests and inspect the versioned OpenAPI 3.1 contract.', cacheControl: 'no-store',
  });
}
