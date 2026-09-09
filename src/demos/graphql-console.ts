import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { escapeHtml } from '../lib/html';
import { pageContent, type PageContent } from '../ui/page';
import { localGraphiqlDocument } from '../ui/graphiql-assets';

export function graphqlContent(env: Env): PageContent {
  const graphqlUrl = routeUrl('interfaces.graphql.console');
  const graphiqlDocumentUrl = new URL(graphqlUrl, 'https://demo.wizardgang.ai').toString();
  const graphiqlDocument = localGraphiqlDocument(new Request(graphiqlDocumentUrl));
  const identityUrl = routeUrl('interfaces.identity.page');
  const d1Url = routeUrl('platform.d1');
  const examples = [
    { title: 'List users', query: 'query Users { users { id name email role } }' },
    { title: 'Read one user', query: 'query User { user(id: "user-001") { id name email role } }' },
  ];
  const examplesMarkup = examples.map((example, index) => `<article class="graphql-example"><div class="section-head"><h3>${escapeHtml(example.title)}</h3><button type="button" class="button" data-graphql-example="${index}">Run example</button></div><pre><code>${escapeHtml(example.query)}</code></pre><pre class="graphql-example-result" data-graphql-result="${index}" hidden></pre></article>`).join('');
  const exampleQueries = JSON.stringify(examples.map((example) => example.query)).replaceAll('</script', '<\\/script');
  return pageContent(env, 'GraphQL API', `
<section class="page-header lab-page-header graphql-page-header" id="graphql">
  <h1>GraphQL API</h1>
  <p class="lede">Run readable queries against a typed user directory. The examples below call the live endpoint directly.</p>
</section>
<section class="graphql-examples" aria-labelledby="graphql-examples-heading"><div class="section-head"><h2 id="graphql-examples-heading">Working examples</h2><span>Public queries · JSON responses</span></div><div class="graphql-example-grid">${examplesMarkup}</div><script>(() => { const queries = ${exampleQueries}; document.querySelectorAll('[data-graphql-example]').forEach((button) => button.addEventListener('click', async () => { const index = Number(button.dataset.graphqlExample); const output = document.querySelector('[data-graphql-result="' + index + '"]'); button.disabled = true; output.hidden = false; output.textContent = 'Running…'; try { const response = await fetch('/graphql', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ query: queries[index] }) }); const payload = await response.json(); output.textContent = JSON.stringify(payload, null, 2); } catch (error) { output.textContent = String(error); } finally { button.disabled = false; } })); })();</script></section>
<section class="graphql-workspace" aria-labelledby="graphiql-heading">
  <div class="graphql-workspace-heading"><div><p class="eyebrow">Live IDE</p><h2 id="graphiql-heading">GraphiQL</h2></div><p>Queries are public. <a href="${escapeHtml(identityUrl)}">Sign in</a> to enable mutations through the shared application policy.</p></div>
  <div class="graphql-frame"><iframe title="GraphiQL query editor" srcdoc="${escapeHtml(graphiqlDocument)}" loading="eager"></iframe></div>
</section>
<section class="graphql-controls" aria-labelledby="graphql-controls-heading">
  <div class="section-head"><h2 id="graphql-controls-heading">Execution controls</h2><span>Enforced before resolver execution</span></div>
  <div class="graphql-control-grid"><article><strong>8</strong><span>Depth limit</span></article><article><strong>50</strong><span>Field limit</span></article><article><strong>Off</strong><span>Batching</span></article><article><strong>16 KiB</strong><span>Request limit</span></article></div>
</section>
<section class="graphql-shared panel" aria-labelledby="graphql-shared-heading"><div><p class="eyebrow">Shared data</p><h2 id="graphql-shared-heading">GraphQL ↔ D1 Users</h2><p>The IDE and the D1 console call the same bounded user services. Transport changes; persistence and policy do not.</p></div><a class="button" href="${escapeHtml(d1Url)}">Open D1 view →</a></section>
`, {
    canonicalPath: graphqlUrl, description: 'Run working public GraphQL examples and explore the bundled GraphiQL IDE.', cacheControl: 'no-store',
  });
}
