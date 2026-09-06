import openapi from '../../contracts/openapi/openapi.json';
import { json, methodNotAllowed } from '../lib/http';

export function openApiResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return json(openapi, {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-disposition': 'inline; filename="wizardgang-openapi.json"',
    },
  });
}
