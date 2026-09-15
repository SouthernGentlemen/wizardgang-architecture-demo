import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { localizationForEnv } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import { pageResponse } from './page';

export function renderNotFound(env: Env): Response {
  const localization = localizationForEnv(env);
  return pageResponse(env, 'Not found', `
<section>
  <p class="eyebrow">404 / unknown route</p>
  <h1>That route does not exist.</h1>
  <p class="lede">Every published route is registered in the route map and backed by a source module.</p>
  <div class="meta"><a href="${escapeHtml(localization.href(routeUrl('interfaces.frontend.index')))}">Home</a><a href="${escapeHtml(localization.href(routeUrl('demos.index')))}">Browse demos</a></div>
</section>`, { status: 404, noindex: true });
}
