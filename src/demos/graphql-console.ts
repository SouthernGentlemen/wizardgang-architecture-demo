import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { escapeHtml } from '../lib/html';
import { pageContent, type PageContent } from '../ui/page';

export function graphqlContent(env: Env): PageContent {
  const graphqlUrl = `${routeUrl('demos.index')}#graphql`;
  const identityUrl = `${routeUrl('demos.index')}#identity`;
  const d1Url = `${routeUrl('demos.index')}#d1`;
  const examples = [
    { title: 'List users', query: 'query Users { users { id name email role } }' },
    { title: 'Read one user', query: 'query User { user(id: "user-001") { id name email role } }' },
  ];
  const examplesMarkup = examples.map((example, index) => `<article class="graphql-example"><div class="section-head"><h3>${escapeHtml(example.title)}</h3><button type="button" class="button" data-graphql-example="${index}" aria-describedby="graphql-example-status-${index}">Run example</button></div><pre><code>${escapeHtml(example.query)}</code></pre><p class="subtle" id="graphql-example-status-${index}" data-graphql-example-status="${index}" role="status" aria-live="polite">Ready.</p><pre class="graphql-example-result" data-graphql-result="${index}" tabindex="0" aria-label="${escapeHtml(example.title)} response" hidden></pre></article>`).join('');
  const exampleQueries = JSON.stringify(examples.map((example) => example.query)).replaceAll('</script', '<\\/script');
  const starterQuery = examples[0].query;
  return pageContent(env, 'GraphQL API', `
<section class="page-header lab-page-header graphql-page-header" id="graphql">
  <h1>GraphQL API</h1>
  <p class="lede">Run readable queries against a typed user directory. The examples and first-party query runner below call the live machine endpoint directly.</p>
</section>
<section class="graphql-examples" aria-labelledby="graphql-examples-heading"><div class="section-head"><h2 id="graphql-examples-heading">Working examples</h2><span>Public queries · JSON responses</span></div><div class="graphql-example-grid">${examplesMarkup}</div></section>
<!-- The previous embedded GraphiQL surface used srcdoc=; DEMO-237 removes that public interaction in favor of the first-party runner below. -->
<section class="graphql-workspace panel" aria-labelledby="graphql-runner-heading">
  <div class="graphql-workspace-heading"><div><p class="eyebrow">First-party interface</p><h2 id="graphql-runner-heading">Accessible query runner</h2></div><p>Queries are public. <a href="${escapeHtml(identityUrl)}">Sign in for mutation access</a> through the shared application policy.</p></div>
  <p>Enter a GraphQL query as text, run it with the button or keyboard, and review the JSON response. The protocol endpoint remains machine-only when requested as HTML.</p>
  <form data-graphql-form>
    <label for="graphql-query">GraphQL query</label>
    <textarea id="graphql-query" name="query" rows="9" spellcheck="false" autocomplete="off" autocapitalize="off" aria-describedby="graphql-query-help">${escapeHtml(starterQuery)}</textarea>
    <p class="subtle" id="graphql-query-help">Use standard GraphQL query syntax. This public runner does not require a pointer or an embedded third-party editor.</p>
    <button type="submit" class="button button-primary" data-graphql-run>Run query</button>
  </form>
  <p class="subtle" id="graphql-runner-status" data-graphql-runner-status role="status" aria-live="polite">Ready.</p>
  <section aria-labelledby="graphql-response-heading"><h3 id="graphql-response-heading">Response</h3><pre data-graphql-workspace-result tabindex="0">Run a query to inspect the JSON response.</pre></section>
</section>
<script>(() => {
  const queries = ${exampleQueries};
  const execute = async (query, output, status, trigger) => {
    if (!query.trim()) { status.textContent = 'Enter a GraphQL query before running it.'; return; }
    if (trigger) trigger.disabled = true;
    status.textContent = 'Running query…';
    if (output.hasAttribute('hidden')) output.hidden = false;
    output.textContent = 'Waiting for response…';
    try {
      const response = await fetch('/graphql', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ query }) });
      const text = await response.text();
      let formatted = text || '(empty response)';
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      output.textContent = formatted;
      status.textContent = response.ok ? 'Query complete. Response is available below.' : 'Query completed with an error response. Review the response below.';
    } catch (error) {
      output.textContent = String(error);
      status.textContent = 'Query failed. Review the error below.';
    } finally {
      if (trigger) trigger.disabled = false;
    }
  };
  document.querySelectorAll('[data-graphql-example]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.graphqlExample);
    execute(queries[index], document.querySelector('[data-graphql-result="' + index + '"]'), document.querySelector('[data-graphql-example-status="' + index + '"]'), button);
  }));
  const form = document.querySelector('[data-graphql-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    execute(document.querySelector('#graphql-query').value, document.querySelector('[data-graphql-workspace-result]'), document.querySelector('[data-graphql-runner-status]'), document.querySelector('[data-graphql-run]'));
  });
})();</script>
<section class="graphql-controls" aria-labelledby="graphql-controls-heading">
  <div class="section-head"><h2 id="graphql-controls-heading">Execution controls</h2><span>Enforced before resolver execution</span></div>
  <div class="graphql-control-grid"><article><strong>8</strong><span>Depth limit</span></article><article><strong>50</strong><span>Field limit</span></article><article><strong>Off</strong><span>Batching</span></article><article><strong>16 KiB</strong><span>Request limit</span></article></div>
</section>
<section class="graphql-shared panel" aria-labelledby="graphql-shared-heading"><div><p class="eyebrow">Shared data</p><h2 id="graphql-shared-heading">GraphQL ↔ D1 Users</h2><p>The query runner and the D1 console call the same bounded user services. Transport changes; persistence and policy do not.</p></div><a class="button" href="${escapeHtml(d1Url)}">Open D1 view →</a></section>
`, {
    canonicalPath: graphqlUrl, description: 'Run working public GraphQL examples with an accessible first-party query runner.', cacheControl: 'no-store',
  });
}
