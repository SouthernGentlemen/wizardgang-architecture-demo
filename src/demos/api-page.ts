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
  <p class="lede">Choose one operation, run it, inspect the actual response, then compare that behavior with the matching OpenAPI contract.</p>
</section>
<aside class="assurance-notice" aria-label="REST API boundary">
  <strong>Focused browser tutorial.</strong> These operations use the anonymous signed-cookie visitor API at <code>/api/labs/rest-demo-records</code>. The separate bearer-capable machine API remains documented by <code>/api/openapi.json</code>.
</aside>
${contract}`, {
    canonicalPath: restUrl,
    description: 'Run one live REST operation at a time and compare it with the relevant OpenAPI contract.',
    cacheControl: 'no-store',
  });
}
