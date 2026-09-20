import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { useRequestLocalization } from './document';
import { reactPageResponse } from './page';

export function NotFoundPage() {
  const localization = useRequestLocalization();
  return <section>
    <p className="eyebrow">{localization.exact('404 / unknown route')}</p>
    <h1>{localization.exact('That route does not exist.')}</h1>
    <p className="lede">{localization.exact('Every published route is registered in the route map and backed by a source module.')}</p>
    <div className="meta"><a href={localization.href(routeUrl('interfaces.frontend.index'))}>Home</a><a href={localization.href(routeUrl('demos.index'))}>Browse demos</a></div>
  </section>;
}

export function renderNotFound(env: Env): Response {
  return reactPageResponse(env, 'Not found', <NotFoundPage />, { status: 404, noindex: true });
}
