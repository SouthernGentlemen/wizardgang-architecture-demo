import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { shell } from '../ui/page';
import { swaggerConsole } from './swagger-console';

export function renderApiDemo(env: Env): Response {
  return shell(env, 'REST API', `
<section class="page-header lab-page-header api-page-header">
  <p class="eyebrow">Interfaces / API</p>
  <h1>REST API</h1>
  <p class="lede">Execute requests against the live versioned API and inspect the OpenAPI 2.0 contract that generates this explorer.</p>
  <div class="api-hero-badges"><span class="badge">REST</span><span class="badge">OpenAPI 2.0</span><span class="badge">D1</span><span class="badge">v1</span></div>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/api.ts'))}">View source ↗</a></div>
</section>
${swaggerConsole()}
<section class="related-interfaces" aria-labelledby="related-interfaces-heading">
  <p class="eyebrow">Same policy, different transports</p><h2 id="related-interfaces-heading">Related interfaces</h2>
  <nav class="resource-list" aria-label="Related application interfaces"><a href="/graphql"><strong>GraphQL →</strong><code>/graphql</code></a><a href="/webhooks"><strong>Webhooks →</strong><code>/webhooks</code></a><a href="/mcp"><strong>MCP →</strong><code>/mcp</code></a><a href="/identity"><strong>Identity →</strong><code>/identity</code></a></nav>
</section>
<details class="implementation-notes"><summary>Implementation details</summary><ul><li>Permanent operator credentials remain environment-owned and never enter the browser.</li><li>Visitor tokens expire after ten minutes and can address only a server-derived namespace.</li><li>D1 audit events and public-safe logs record behavior without recording bearer values or request bodies.</li></ul></details>`, {
    activeRoute: '/api', description: 'Execute live REST requests and inspect the versioned OpenAPI 2.0 contract.', cacheControl: 'no-store',
  });
}
