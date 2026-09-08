import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { pageContent, type PageContent } from '../ui/page';
import { localGraphiqlDocument } from '../ui/graphiql-assets';

export function graphqlContent(env: Env): PageContent {
  const sources = [
    ['Application route registry', 'src/routing/application-routes.ts'],
    ['GraphQL execution', 'src/api/graphql.ts'],
    ['Executable schema', 'contracts/graphql/schema.graphql'],
    ['GraphiQL assets', 'src/ui/graphiql-assets.ts'],
    ['GraphQL tests', 'tests/graphql.test.ts'],
  ];
  const graphqlUrl = routeUrl('interfaces.graphql.console');
  const graphiqlDocumentUrl = new URL(graphqlUrl, 'https://demo.wizardgang.ai').toString();
  const graphiqlDocument = localGraphiqlDocument(new Request(graphiqlDocumentUrl));
  const identityUrl = routeUrl('interfaces.identity.page');
  const restUrl = routeUrl('interfaces.rest');
  const webhooksUrl = routeUrl('interfaces.webhooks.console');
  const mcpUrl = routeUrl('interfaces.mcp.console');
  const d1Url = routeUrl('platform.d1');
  return pageContent(env, 'GraphQL API', `
<section class="page-header lab-page-header graphql-page-header" id="graphql">
  <h1>GraphQL API</h1>
  <p class="lede">Query and mutate the same D1-backed users through a typed GraphQL schema.</p>
  <div class="api-hero-badges"><span class="badge">GraphQL Yoga</span><span class="badge">GraphiQL</span><span class="badge">D1</span><span class="badge">Shared policy</span></div>
  <div class="page-tools"><a class="text-link" href="${escapeHtml(sourceUrl(env, 'src/demos/interfaces.ts'))}">View source ↗</a><a class="text-link" href="${escapeHtml(sourceUrl(env, 'contracts/graphql/schema.graphql'))}">View schema ↗</a></div>
</section>
<section class="graphql-workspace" aria-labelledby="graphiql-heading">
  <div class="graphql-workspace-heading"><div><p class="eyebrow">Live IDE</p><h2 id="graphiql-heading">GraphiQL</h2></div><p>Queries are public. <a href="${escapeHtml(identityUrl)}">Sign in</a> to enable mutations through the shared application policy.</p></div>
  <div class="graphql-frame"><iframe title="GraphiQL query editor" srcdoc="${escapeHtml(graphiqlDocument)}" loading="eager"></iframe></div>
</section>
<section class="graphql-controls" aria-labelledby="graphql-controls-heading">
  <div class="section-head"><h2 id="graphql-controls-heading">Execution controls</h2><span>Enforced before resolver execution</span></div>
  <div class="graphql-control-grid"><article><strong>8</strong><span>Depth limit</span></article><article><strong>50</strong><span>Field limit</span></article><article><strong>Off</strong><span>Batching</span></article><article><strong>16 KiB</strong><span>Request limit</span></article></div>
</section>
<section class="graphql-shared panel" aria-labelledby="graphql-shared-heading"><div><p class="eyebrow">Shared data</p><h2 id="graphql-shared-heading">GraphQL ↔ D1 Users</h2><p>The IDE and the D1 console call the same bounded user services. Transport changes; persistence and policy do not.</p></div><a class="button" href="${escapeHtml(d1Url)}">Open D1 view →</a></section>
<section class="related-interfaces" aria-labelledby="graphql-related-heading"><p class="eyebrow">Application interfaces</p><h2 id="graphql-related-heading">Related interfaces</h2><nav class="resource-list" aria-label="Related application interfaces"><a href="${escapeHtml(restUrl)}"><strong>REST API →</strong><code>${escapeHtml(restUrl)}</code></a><a href="${escapeHtml(webhooksUrl)}"><strong>Webhooks →</strong><code>${escapeHtml(webhooksUrl)}</code></a><a href="${escapeHtml(mcpUrl)}"><strong>MCP →</strong><code>${escapeHtml(mcpUrl)}</code></a><a href="${escapeHtml(identityUrl)}"><strong>Identity →</strong><code>${escapeHtml(identityUrl)}</code></a></nav></section>
<details class="implementation-notes"><summary>Implementation details</summary><div class="reference-links">${sources.map(([label, path]) => `<a href="${escapeHtml(sourceUrl(env, path))}">${escapeHtml(label)}</a>`).join('')}</div></details>`, {
    canonicalPath: graphqlUrl, description: 'Run the D1-backed GraphQL schema through a locally bundled GraphiQL IDE.', cacheControl: 'no-store',
  });
}
