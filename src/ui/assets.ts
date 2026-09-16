import { withSecurityHeaders } from '../lib/http';
import { socialCardResponse } from './brand-assets';
import { graphiqlAssetResponse } from './graphiql-assets';
import { shellStyles, shellStylesheetAsset, shellStylesheetHash } from './style-delivery';

function shellStylesheetResponse(request: Request): Response {
  const headers = withSecurityHeaders(new Headers({
    'content-type': 'text/css; charset=utf-8',
    'cache-control': 'public, max-age=31536000, immutable',
    etag: `"${shellStylesheetHash}"`,
  }));
  return new Response(request.method === 'HEAD' ? null : shellStyles, { headers });
}

export function uiAssetResponse(request: Request, asset: string): Response {
  if (asset === shellStylesheetAsset) return shellStylesheetResponse(request);
  if (asset === 'og.png') return socialCardResponse(request);
  return graphiqlAssetResponse(request, asset);
}
