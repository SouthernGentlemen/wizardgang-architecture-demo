import { bindLocalization, resolveLocalization } from '../i18n/runtime';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { withSecurityHeaders } from '../lib/http';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { demonstrations } from './demos-page';

function demoHref(id: string): string {
  return `${routeUrl('demos.index')}#${id}`;
}

export async function demoPresentationResponse(request: Request, env: Env, demoId: string): Promise<Response> {
  const demo = demonstrations.find((candidate) => candidate.id === demoId);
  const headers = withSecurityHeaders(new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'private, no-store',
  }));
  if (!demo) return new Response(renderToStaticMarkup(createElement('p', { role: 'alert' }, 'Unknown demonstration.')), { status: 404, headers });

  const localizedEnv = bindLocalization(env, resolveLocalization(request));
  const canonicalPath = routeUrl('demos.index');
  const section = await demo.render(request, localizedEnv, {
    scope: demo.id,
    idPrefix: demo.id,
    headingLevel: 2,
    canonicalPath,
    presentationPath: demoHref(demo.id),
  });
  return new Response(section.body, { headers });
}
