import type { Env } from './types';
import { renderNotFound } from './ui/page';
import { getDemoControl } from './lib/demo-control';
import { json, safeError } from './lib/http';
import { crawlerBlockedResponse, getCrawlerControl, identifyOpenAIAgent } from './lib/crawler-control';
import { routeOperationalRequest } from './routing/operational-routes';
import { routeAssuranceRequest } from './routing/assurance-routes';
import { routePlatformLaboratoryRequest } from './routing/platform-laboratory-routes';
import {
  interfaceIdentityWantsHtml,
  isInterfaceIdentityApiLike,
  routeInterfaceIdentityRequest,
} from './routing/interface-identity-routes';

const API_PREFIXES = ['/__api/', '/v1/'];

export function isApiLike(path: string): boolean {
  return isInterfaceIdentityApiLike(path) || API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function wantsHtml(request: Request, path: string): boolean {
  if (request.method !== 'GET') return false;
  const interfacePreference = interfaceIdentityWantsHtml(request, path);
  if (interfacePreference !== undefined) return interfacePreference;
  if (isApiLike(path)) return false;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') || accept === '';
}

export function offlineApiResponse(message: string): Response {
  return json({ status: 'offline', message }, {
    status: 503,
    headers: {
      'cache-control': 'no-store',
      'retry-after': '60'
    }
  });
}

export async function routeRequest(request: Request, env: Env): Promise<Response> {
  try {
    return await routeRequestUnsafe(request, env);
  } catch (error) {
    return safeError(request, error);
  }
}

async function routeRequestUnsafe(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '/';

  const operationalResponse = await routeOperationalRequest(request, env, path);
  if (operationalResponse) return operationalResponse;

  const openAIAgent = identifyOpenAIAgent(request.headers.get('user-agent'));
  if (openAIAgent === 'GPTBot') return crawlerBlockedResponse(openAIAgent);
  if (openAIAgent && (await getCrawlerControl(env)).state === 'disabled') {
    return crawlerBlockedResponse(openAIAgent);
  }

  const assuranceResponseMatch = await routeAssuranceRequest(request, env, path);
  if (assuranceResponseMatch) return assuranceResponseMatch;

  const interfaceIdentityResponse = await routeInterfaceIdentityRequest(request, env, path);
  if (interfaceIdentityResponse) return interfaceIdentityResponse;

  const control = await getDemoControl(env);
  if (control.state === 'offline') {
    if (wantsHtml(request, path)) {
      const target = new URL('/offline', url.origin);
      target.searchParams.set('from', path);
      return Response.redirect(target.toString(), 302);
    }
    return offlineApiResponse(control.publicMessage);
  }

  const platformLaboratoryResponse = await routePlatformLaboratoryRequest(request, env, path);
  if (platformLaboratoryResponse) return platformLaboratoryResponse;

  return renderNotFound(env);
}
