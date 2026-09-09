import type { Env } from '../types';
import { routeUrl } from '../routing/application-routes';
import { pageContent, type PageContent } from '../ui/page';
import { openApiConsole } from './openapi-console';

export function apiContent(env: Env): PageContent {
  const restUrl = routeUrl('interfaces.rest');
  return pageContent(env, 'REST API', `
<section class="page-header lab-page-header api-page-header">
  <h1>REST API</h1>
</section>
${openApiConsole(routeUrl('interfaces.rest.openapi.json'))}`, {
    canonicalPath: restUrl, description: 'Explore live anonymous REST CRUD operations through an OpenAPI 3.0-style contract.', cacheControl: 'no-store',
  });
}
