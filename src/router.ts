import type { Env } from './types';
import { demos, demosByRoute } from './demos/registry';
import { renderDemo, renderIndex, renderNotFound } from './ui/page';
import { getDemoControl } from './lib/demo-control';
import { json, methodNotAllowed, safeError } from './lib/http';
import { graphqlResponse, graphqlSchemaResponse } from './api/graphql';
import { githubWebhookResponse, webhookDemoResponse, webhookEventsResponse, webhookReceiptResponse, webhookResetResponse } from './api/webhooks';
import { openApiResponse } from './api/openapi';
import { MCP_SERVER_PATH, mcpResponse } from './api/mcp';
import { authorizationDecisionResponse, demoAccessTokenResponse, identityLogoutResponse, identitySessionResponse, oauthPkceResponse, providerCallbackResponse, providerStartResponse, samlCallbackResponse, samlInspectionResponse, samlMetadataResponse, samlStartResponse, ssoBoundaryResponse } from './api/identity';
import { renderI18nDemo } from './demos/i18n-page';
import { renderConcerns } from './demos/assurance-pages';
import { aiEvaluationResponse, securityControlsResponse, traceabilityResponse } from './api/governance';
import { renderGraphqlDemo } from './demos/graphql-console';
import { renderWebhooksDemo } from './demos/webhook-console';
import { gitEvidenceResponse } from './api/git-evidence';
import { gitDemoReleaseResponse, gitDemoStartResponse, gitDemoStatusResponse } from './api/git-demo';
import { renderGitDemo } from './demos/git-page';
import { renderIdentityDemo } from './demos/identity-page';
import { renderMcpDemo } from './demos/mcp-page';
import { graphiqlAssetResponse, localGraphiqlResponse } from './ui/graphiql-assets';
import { renderApiDemo } from './demos/api-page';
import { crawlerBlockedResponse, getCrawlerControl, identifyOpenAIAgent } from './lib/crawler-control';
import { routeOperationalRequest } from './routing/operational-routes';
import { routeAssuranceRequest } from './routing/assurance-routes';
import { routePlatformLaboratoryRequest } from './routing/platform-laboratory-routes';

const API_PREFIXES = ['/__api/', '/v1/', '/graphql'];
const API_PATHS = new Set([MCP_SERVER_PATH]);

export function isApiLike(path: string): boolean {
  return API_PATHS.has(path) || API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function wantsHtml(request: Request, path: string): boolean {
  if (request.method !== 'GET') return false;
  const accept = request.headers.get('accept') || '';
  if (path === '/graphql') return accept.includes('text/html') || accept === '';
  if (isApiLike(path)) return false;
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

  if (path === '/v1/openapi.json') return openApiResponse(request);
  if (path === '/v1/openapi.yaml') return openApiResponse(request, 'yaml');
  if (path === '/graphql' && request.method === 'GET' && wantsHtml(request, path)) return renderGraphqlDemo(env);
  if (path === '/graphql') return graphqlResponse(request, env);
  if (path === '/graphql/console') return localGraphiqlResponse(request);
  if (path === '/graphql/schema') return graphqlSchemaResponse(request);
  if (path.startsWith('/__assets/graphiql/')) return graphiqlAssetResponse(request, path.slice('/__assets/graphiql/'.length));
  if (path === '/v1/webhooks/demo') return webhookReceiptResponse(request, env);
  if (path === '/v1/webhooks/github') return githubWebhookResponse(request, env);
  if (path === '/__api/webhooks/demo') return webhookDemoResponse(request, env);
  if (path === '/__api/webhooks/events') return webhookEventsResponse(request, env);
  if (path === '/__api/webhooks/reset') return webhookResetResponse(request, env);
  if (path === MCP_SERVER_PATH) return mcpResponse(request, env);
  if (path === '/mcp' && request.method !== 'GET') return methodNotAllowed(['GET']);
  if (path === '/__api/identity/oauth-pkce') return oauthPkceResponse(request, env);
  if (path === '/__api/identity/authorize') return authorizationDecisionResponse(request, env);
  if (path === '/__api/identity/token') return demoAccessTokenResponse(request, env);
  if (path === '/__api/identity/sso') return ssoBoundaryResponse(request, env);
  if (path === '/identity/microsoft') return providerStartResponse(request, env, 'microsoft');
  if (path === '/identity/microsoft/callback') return providerCallbackResponse(request, env, 'microsoft');
  if (path === '/identity/google') return providerStartResponse(request, env, 'google');
  if (path === '/identity/google/callback') return providerCallbackResponse(request, env, 'google');
  if (path === '/identity/github') return providerStartResponse(request, env, 'github');
  if (path === '/identity/github/callback') return providerCallbackResponse(request, env, 'github');
  if (path === '/identity/saml') return samlStartResponse(request, env);
  if (path === '/identity/saml/acs') return samlCallbackResponse(request, env);
  if (path === '/identity/saml/metadata') return samlMetadataResponse(request);
  if (path === '/identity/session') return identitySessionResponse(request, env);
  if (path === '/identity/logout') return identityLogoutResponse(request, env);
  if (path === '/__api/identity/saml/inspect') return samlInspectionResponse(request, env);
  if (path === '/__api/evidence/traceability') return traceabilityResponse(request, env);
  if (path === '/__api/governance/security-controls') return securityControlsResponse(request, env);
  if (path === '/__api/governance/ai-evaluation') return aiEvaluationResponse(request, env);
  if (path === '/__api/git/evidence') return gitEvidenceResponse(request, env);
  if (path === '/__api/git/demo') return request.method === 'GET' ? gitDemoStatusResponse(request, env) : gitDemoStartResponse(request, env);
  if (path === '/__api/git/demo/release') return gitDemoReleaseResponse(request, env);

  if (request.method === 'GET' && path === '/') return renderIndex(env, demos);
  if (request.method === 'GET' && path === '/api') return renderApiDemo(env);
  if (request.method === 'GET' && path === '/webhooks') return renderWebhooksDemo(env);
  if (request.method === 'GET' && path === '/identity') return renderIdentityDemo(env);
  if (request.method === 'GET' && path === '/i18n') return renderI18nDemo(request, env);
  if (request.method === 'GET' && path === '/governance/concerns') return renderConcerns(env);
  if (request.method === 'GET' && path === '/git') return renderGitDemo(env);
  if (request.method === 'GET' && path === '/mcp') return renderMcpDemo(request, env);

  if (request.method === 'GET') {
    const demo = demosByRoute.get(path);
    if (demo) return renderDemo(env, demo, demos);
  }

  return renderNotFound(env);
}
