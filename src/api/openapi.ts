import swagger from '../../contracts/openapi/swagger.json';
import { json, methodNotAllowed } from '../lib/http';

export function openApiResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return json(swagger, { headers: { 'cache-control': 'public, max-age=300' } });
}
