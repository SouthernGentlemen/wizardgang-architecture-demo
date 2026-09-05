import type { Env } from './types';
import { demos, demosByRoute } from './demos/registry';
import { renderDemo, renderIndex, renderNotFound } from './ui/page';
import { getDemoControl } from './lib/demo-control';
import { json, methodNotAllowed, safeError } from './lib/http';
import { recordsResponse, resetRecordSandboxResponse } from './api/records';
import { edgeInspectionResponse, workerComputeResponse } from './api/runtime';
import { r2DemoObjectResponse, r2FilesResetResponse, r2FilesResponse, r2ObjectResponse } from './api/r2';
import { durableCounterResponse } from './api/durable';
import { graphqlResponse, graphqlSchemaResponse } from './api/graphql';
import { githubWebhookResponse, webhookDemoResponse, webhookEventsResponse, webhookReceiptResponse, webhookResetResponse } from './api/webhooks';
import { openApiResponse } from './api/openapi';
import { MCP_SERVER_PATH, mcpResponse } from './api/mcp';
import { authorizationDecisionResponse, demoAccessTokenResponse, identityLogoutResponse, identitySessionResponse, oauthPkceResponse, providerCallbackResponse, providerStartResponse, samlCallbackResponse, samlInspectionResponse, samlMetadataResponse, samlStartResponse, ssoBoundaryResponse } from './api/identity';
import { renderI18nDemo } from './demos/i18n-page';
import { renderAccessibilityDemo } from './demos/accessibility-page';
import { renderComplianceDemo } from './demos/compliance-page';
import { renderEvidenceDemo } from './demos/evidence-page';
import { renderConcerns, renderIncidents, renderRisks } from './demos/assurance-pages';
import { renderSecurity } from './demos/security-page';
import { aiEvaluationResponse, securityControlsResponse, traceabilityResponse } from './api/governance';
import { assuranceComplianceResponse, assuranceIncidentsResponse, assuranceRisksResponse, genericAssuranceResponse } from './api/assurance';
import { assuranceAdvisoriesResponse } from './api/advisories';
import { assuranceEvidenceResponse, assuranceResponse } from './api/assurance-registry';
import { d1LabResponse } from './api/d1-lab';
import { renderD1Demo } from './demos/d1-page';
import { renderGraphqlDemo } from './demos/graphql-console';
import { renderR2Demo } from './demos/r2-page';
import { accessibilityLabResponse } from './ui/accessibility-lab';
import { renderWebhooksDemo } from './demos/webhook-console';
import { gitEvidenceResponse } from './api/git-evidence';
import { gitDemoReleaseResponse, gitDemoStartResponse, gitDemoStatusResponse } from './api/git-demo';
import { renderGitDemo } from './demos/git-page';
import { renderIdentityDemo } from './demos/identity-page';
import { renderMcpDemo } from './demos/mcp-page';
import { graphiqlAssetResponse, localGraphiqlResponse } from './ui/graphiql-assets';
import { renderApiDemo } from './demos/api-page';
import { crawlerBlockedResponse, getCrawlerControl, identifyOpenAIAgent } from './lib/crawler-control';
import {
  assuranceHtmlRoute,
  matchAssuranceRoute,
  validateAssuranceRouteHandlerSupport,
  type AssuranceRouteHandlerSupport,
  type AssuranceRouteMatch,
} from './assurance/routes';
import { routeOperationalRequest } from './routing/operational-routes';

const API_PREFIXES = ['/__api/', '/v1/', '/graphql'];
const API_PATHS = new Set([MCP_SERVER_PATH]);
const LEGACY_OFFLINE_AVAILABLE_PATHS = new Set([assuranceHtmlRoute('advisories')]);

type AssuranceHandler = (request: Request, env: Env, match: AssuranceRouteMatch) => Response | Promise<Response>;

interface AssuranceApiHandlerRegistration {
  handler: AssuranceHandler;
  apiRecord?: boolean;
}

const ASSURANCE_API_HANDLERS: Record<string, AssuranceApiHandlerRegistration> = {
  registry: { handler: (request, env) => assuranceResponse(request, env) },
  evidence: { handler: (request, env) => assuranceEvidenceResponse(request, env) },
  compliance: {
    handler: (request, _env, match) => assuranceComplianceResponse(request, match.kind === 'api-record' ? match.recordId : undefined),
    apiRecord: true,
  },
  risks: { handler: (request) => assuranceRisksResponse(request) },
  incidents: { handler: (request) => assuranceIncidentsResponse(request) },
  advisories: { handler: (request) => assuranceAdvisoriesResponse(request) },
};

const ASSURANCE_HTML_HANDLERS: Record<string, AssuranceHandler> = {
  evidence: (request, env) => renderEvidenceDemo(request, env),
  compliance: (request, env) => renderComplianceDemo(request, env),
  risks: (request, env) => renderRisks(request, env),
  incidents: (_request, env) => renderIncidents(env),
  advisories: (_request, env) => renderSecurity(env),
};

const assuranceHandlerOwners = new Set([
  ...Object.keys(ASSURANCE_API_HANDLERS),
  ...Object.keys(ASSURANCE_HTML_HANDLERS),
]);

export const ASSURANCE_ROUTE_HANDLER_SUPPORT: Record<string, AssuranceRouteHandlerSupport> = {
  ...Object.fromEntries(
    [...assuranceHandlerOwners].map((owner) => [owner, {
      html: Boolean(ASSURANCE_HTML_HANDLERS[owner]),
      apiCollection: Boolean(ASSURANCE_API_HANDLERS[owner]),
      apiRecord: Boolean(ASSURANCE_API_HANDLERS[owner]?.apiRecord),
    }]),
  ),
  '*': { apiCollection: true, apiRecord: true },
};

const assuranceHandlerErrors = validateAssuranceRouteHandlerSupport(ASSURANCE_ROUTE_HANDLER_SUPPORT);
if (assuranceHandlerErrors.length > 0) {
  throw new Error(`Invalid assurance route handler support:\n${assuranceHandlerErrors.join('\n')}`);
}

async function routeAssuranceRequest(request: Request, env: Env, path: string): Promise<Response | undefined> {
  const match = matchAssuranceRoute(path);
  if (!match || match.kind === 'alias') return undefined;
  if (match.kind === 'html') {
    if (request.method !== 'GET') return undefined;
    const handler = ASSURANCE_HTML_HANDLERS[match.owner];
    return handler ? handler(request, env, match) : undefined;
  }
  const registration = ASSURANCE_API_HANDLERS[match.owner];
  if (registration) return registration.handler(request, env, match);
  return genericAssuranceResponse(request, match.owner, match.kind === 'api-record' ? match.recordId : undefined);
}

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

  const control = await getDemoControl(env);
  if (control.state === 'offline' && !LEGACY_OFFLINE_AVAILABLE_PATHS.has(path)) {
    if (wantsHtml(request, path)) {
      const target = new URL('/offline', url.origin);
      target.searchParams.set('from', path);
      return Response.redirect(target.toString(), 302);
    }
    return offlineApiResponse(control.publicMessage);
  }

  const assuranceResponseMatch = await routeAssuranceRequest(request, env, path);
  if (assuranceResponseMatch) return assuranceResponseMatch;

  if (path === '/v1/demo-records') return recordsResponse(request, env);
  if (path.startsWith('/v1/demo-records/')) return recordsResponse(request, env, path.slice('/v1/demo-records/'.length));
  if (path === '/__api/api-sandbox/reset') return resetRecordSandboxResponse(request, env);
  if (path === '/__api/d1/users') return d1LabResponse(request, env, 'users');
  if (path.startsWith('/__api/d1/users/')) return d1LabResponse(request, env, 'users', path.slice('/__api/d1/users/'.length));
  if (path === '/__api/d1/tasks') return d1LabResponse(request, env, 'tasks');
  if (path.startsWith('/__api/d1/tasks/')) return d1LabResponse(request, env, 'tasks', path.slice('/__api/d1/tasks/'.length));
  if (path === '/__api/d1/reset') return d1LabResponse(request, env, 'reset');
  if (path === '/__api/edge/inspect') return edgeInspectionResponse(request, env);
  if (path === '/__api/workers/compute') return workerComputeResponse(request, env);
  if (path === '/__api/r2/demo') return r2DemoObjectResponse(request, env);
  if (path === '/__api/r2/object') return r2ObjectResponse(request, env);
  if (path === '/__api/r2/files') return r2FilesResponse(request, env);
  if (path.startsWith('/__api/r2/files/')) return r2FilesResponse(request, env, path.slice('/__api/r2/files/'.length));
  if (path === '/__api/r2/reset') return r2FilesResetResponse(request, env);
  if (path === '/__api/durable/counter') return durableCounterResponse(request, env);
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
  if (path === '/__api/accessibility/lab') return accessibilityLabResponse(request);
  if (path === '/__api/git/evidence') return gitEvidenceResponse(request, env);
  if (path === '/__api/git/demo') return request.method === 'GET' ? gitDemoStatusResponse(request, env) : gitDemoStartResponse(request, env);
  if (path === '/__api/git/demo/release') return gitDemoReleaseResponse(request, env);

  if (request.method === 'GET' && path === '/') return renderIndex(env, demos);
  if (request.method === 'GET' && path === '/d1') return renderD1Demo(env);
  if (request.method === 'GET' && path === '/r2') return renderR2Demo(env);
  if (request.method === 'GET' && path === '/api') return renderApiDemo(env);
  if (request.method === 'GET' && path === '/webhooks') return renderWebhooksDemo(env);
  if (request.method === 'GET' && path === '/identity') return renderIdentityDemo(env);
  if (request.method === 'GET' && path === '/i18n') return renderI18nDemo(request, env);
  if (request.method === 'GET' && path === '/accessibility') return renderAccessibilityDemo(request, env);
  if (request.method === 'GET' && path === '/governance/concerns') return renderConcerns(env);
  if (request.method === 'GET' && path === '/git') return renderGitDemo(env);
  if (request.method === 'GET' && path === '/mcp') return renderMcpDemo(request, env);

  if (request.method === 'GET') {
    const demo = demosByRoute.get(path);
    if (demo) return renderDemo(env, demo, demos);
  }

  return renderNotFound(env);
}
