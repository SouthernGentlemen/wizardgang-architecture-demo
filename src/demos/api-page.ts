import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { pageContent, type PageContent } from '../ui/page';
import { openApiConsole } from './openapi-console';

export function apiContent(env: Env): PageContent {
  const restUrl = `${routeUrl('demos.index')}#rest`;
  const contract = openApiConsole(routeUrl('interfaces.rest.openapi.json'));
  return pageContent(env, 'REST API', `
<section class="page-header lab-page-header api-page-header">
  <h1>REST API</h1>
  <p class="lede">Create and change one isolated resource, then inspect the complete machine-readable contract.</p>
</section>
<section class="panel rest-guided-flow" aria-labelledby="rest-guided-heading">
  <div class="section-head"><div><p class="eyebrow">Executable proof</p><h2 id="rest-guided-heading">REST in three steps</h2></div><span>GET → POST → PATCH</span></div>
  <p>Each step calls the live visitor sandbox and shows the exact request and response. Complete them in order.</p>
  <ol class="rest-guided-steps">
    <li data-rest-step="1" data-state="ready"><button type="button" data-rest-guided-action="list"><strong>1. GET records</strong><span>Read the current collection.</span></button></li>
    <li data-rest-step="2"><button type="button" data-rest-guided-action="create" disabled><strong>2. POST a record</strong><span>Create one named resource.</span></button></li>
    <li data-rest-step="3"><button type="button" data-rest-guided-action="update" disabled><strong>3. PATCH the record</strong><span>Change the stored value.</span></button></li>
  </ol>
  <p class="operation-status" role="status" aria-live="polite" data-rest-guided-status>Ready to read the collection.</p>
  <pre class="rest-guided-exchange" data-rest-guided-exchange>Choose “GET records” to begin.</pre>
</section>
<details class="rest-full-contract">
  <summary><h2>Full OpenAPI contract</h2><span>Six operations, schemas, and runnable examples</span></summary>
  ${contract}
</details>
<script>
(() => {
  const key = 'guided-' + Date.now().toString(36);
  const actions = [...document.querySelectorAll('[data-rest-guided-action]')];
  const status = document.querySelector('[data-rest-guided-status]');
  const exchange = document.querySelector('[data-rest-guided-exchange]');
  const definitions = {
    list: { method: 'GET', path: '/api/labs/rest-demo-records' },
    create: { method: 'POST', path: '/api/labs/rest-demo-records', body: { key, value: { status: 'created' } } },
    update: { method: 'PATCH', path: '/api/labs/rest-demo-records/' + encodeURIComponent(key), body: { value: { status: 'updated' } } },
  };
  const run = async (button) => {
    const name = button.dataset.restGuidedAction;
    const request = definitions[name];
    actions.forEach((action) => { action.disabled = true; });
    status.textContent = request.method + ' request in flight…';
    const started = performance.now();
    try {
      const response = await fetch(request.path, { method: request.method, headers: request.body ? { 'content-type': 'application/json' } : {}, ...(request.body ? { body: JSON.stringify(request.body) } : {}) });
      const text = await response.text();
      let responseBody = text || '(empty response)';
      try { responseBody = JSON.parse(text); } catch {}
      exchange.textContent = JSON.stringify({ request: { method: request.method, path: request.path, ...(request.body ? { body: request.body } : {}) }, response: { status: response.status, durationMs: Number((performance.now() - started).toFixed(1)), body: responseBody } }, null, 2);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const index = actions.indexOf(button);
      button.closest('[data-rest-step]').dataset.state = 'complete';
      const next = actions[index + 1];
      if (next) { next.disabled = false; next.closest('[data-rest-step]').dataset.state = 'ready'; status.textContent = request.method + ' completed. Continue to step ' + (index + 2) + '.'; }
      else status.textContent = 'Three-step REST flow complete. The response shows the updated value.';
    } catch (error) {
      button.disabled = false;
      status.textContent = request.method + ' failed: ' + String(error);
    }
  };
  actions.forEach((button) => button.addEventListener('click', () => run(button)));
})();
</script>`, {
    canonicalPath: restUrl, description: 'Explore live anonymous REST CRUD operations through an OpenAPI 3.0-style contract.', cacheControl: 'no-store',
  });
}
