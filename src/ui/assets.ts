import { socialCardResponse } from './brand-assets';
import { graphiqlAssetResponse } from './graphiql-assets';

export function uiAssetResponse(request: Request, asset: string): Response {
  if (asset === 'og.png') return socialCardResponse(request);
  return graphiqlAssetResponse(request, asset);
}
