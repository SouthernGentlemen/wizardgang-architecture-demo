import type { Env } from '../types';
import { withSecurityHeaders } from '../lib/http';
import { browserAssetName, registeredBrowserAssetPath } from './asset-map';

const ACCESSIBILITY_LAB_ASSETS = new Set([
  browserAssetName('styles.demos'),
  browserAssetName('vendor.axe'),
  browserAssetName('scripts.accessibilityLab'),
]);

function assetFailure(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: withSecurityHeaders(new Headers({
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    })),
  });
}

export async function uiAssetResponse(request: Request, env: Env, asset: string): Promise<Response> {
  const path = registeredBrowserAssetPath(asset);
  if (!path) return assetFailure(404, 'Not found.');
  if (!env.ASSETS) return assetFailure(503, 'Static assets unavailable.');

  const target = new URL(path, request.url);
  const source = await env.ASSETS.fetch(new Request(target, request));
  const headers = withSecurityHeaders(new Headers(source.headers));
  headers.set('cache-control', source.ok ? 'public, max-age=31536000, immutable' : 'no-store');
  if (ACCESSIBILITY_LAB_ASSETS.has(asset)) {
    headers.set('access-control-allow-origin', '*');
    headers.set('cross-origin-resource-policy', 'cross-origin');
  }
  return new Response(request.method === 'HEAD' ? null : source.body, {
    status: source.status,
    statusText: source.statusText,
    headers,
  });
}
