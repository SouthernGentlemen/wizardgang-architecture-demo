import type { Env } from './types';
import { demos, demosByRoute } from './demos/registry';
import { renderDemo, renderIndex, renderNotFound } from './ui/page';
import { sitemapResponse } from './api/sitemap';
import { renderAdmin, renderOffline } from './ui/admin';
import { healthResponse, logsResponse, versionResponse } from './api/operations';
import { renderLogsDemo } from './demos/logs';
import { requireAdmin } from './lib/admin-auth';
import { requireSameOrigin } from './lib/admin-auth';
import { getDemoControl, setDemoControl } from './lib/demo-control';
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
import { billingScenarioResponse } from './api/billing';
import { renderBilling, renderDashboard, renderDocs, renderUptime } from './demos/operations-pages';
import { aiEvaluationResponse, securityControlsResponse, traceabilityResponse } from './api/governance';
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
import { socialCardResponse } from './ui/brand-assets';
import { crawlerBlockedResponse, getCrawlerControl, identifyOpenAIAgent, robotsResponse, setCrawlerControl } from './lib/crawler-control';

const OPERATIONS_PREFIX = '/dashboard';
const API_PREFIXES = ['/__api/', '/v1/', '/graphql'];
const API_PATHS = new Set([MCP_SERVER_PATH]);

export const RETIRED_PAGE_REDIRECTS = new Map<string, string>([
  ['/api/rest', '/api#rest'],
  ['/api/openapi', '/api#openapi'],
  ['/api/graphql', '/graphql#graphql'],
  ['/api/webhooks', '/webhooks#webhooks'],
  ['/identity/oauth', '/identity#oauth'],
  ['/identity/sso', '/identity#sso'],
  ['/git/versioning', '/git#versioning'],
  ['/git/branching', '/git#branching'],
  ['/git/releases', '/git#releases'],
  ['/git/actions', '/git#actions'],
  ['/environments', '/git#environments'],
  ['/governance/iso-27001', '/governance#iso-27001'],
  ['/governance/iso-42001', '/governance#iso-42001'],
  ['/traceability', '/governance#traceability'],
  ['/evidence', '/governance#evidence'],
  ['/dashboard/health', '/dashboard#health'],
]);

export function bypassOfflineGate(path: string): boolean {
  return path === '/admin'
    || path === '/offline'
    || path === '/og.png'
    || path === '/robots.txt'
    || path === '/health'
    || path === '/version'
    || path === '/__api/operations/logs'
    || path === '/__api/operations/billing'
    || path === OPERATIONS_PREFIX
    || path.startsWith(`${OPERATIONS_PREFIX}/`);
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

  if (path === '/admin') {
    const identity = await requireAdmin(request, env);
    if (identity instanceof Response) return identity;
    if (request.method === 'POST') {
      const originFailure = requireSameOrigin(request);
      if (originFailure) return originFailure;
      const form = await request.formData();
      const requestedControl = form.get('control');
      if (requestedControl === 'chatgpt-crawl') {
        const requestedState = form.get('state');
        if (requestedState !== 'enabled' && requestedState !== 'disabled') {
          return json({ error: 'invalid_crawler_state' }, { status: 400, headers: { 'cache-control': 'no-store' } });
        }
        await setCrawlerControl(env, requestedState, identity.username);
        const location = new URL('/admin', url.origin);
        location.searchParams.set('changed', `chatgpt-crawl-${requestedState}`);
        location.hash = 'chatgpt-crawl';
        return new Response(null, { status: 303, headers: { location: location.toString(), 'cache-control': 'no-store' } });
      }
      if (requestedControl !== null && requestedControl !== 'demo') {
        return json({ error: 'invalid_admin_control' }, { status: 400, headers: { 'cache-control': 'no-store' } });
      }
      const state = form.get('state') === 'offline' ? 'offline' : 'online';
      const fallback = state === 'offline' ? 'The demo is temporarily unavailable.' : 'The architecture demo is available.';
      const message = String(form.get('message') || fallback).trim().slice(0, 500) || fallback;
      await setDemoControl(env, state, message, identity.username);
      const location = new URL('/admin', url.origin);
      location.searchParams.set('changed', state);
      return new Response(null, { status: 303, headers: { location: location.toString(), 'cache-control': 'no-store' } });
    }
    if (request.method === 'GET') {
      const changed = url.searchParams.get('changed');
      const [demoControl, crawlerControl] = await Promise.all([getDemoControl(env), getCrawlerControl(env)]);
      const notice = changed === 'online' || changed === 'offline'
        ? `Demo is now ${changed}.`
        : changed === 'chatgpt-crawl-enabled' || changed === 'chatgpt-crawl-disabled'
          ? `ChatGPT crawl access is now ${changed.endsWith('enabled') ? 'enabled' : 'disabled'}.`
          : '';
      return renderAdmin(env, demoControl, crawlerControl, notice);
    }
    return methodNotAllowed(['GET', 'POST']);
  }

  if ((request.method === 'GET' || request.method === 'HEAD') && path === '/robots.txt') {
    return robotsResponse(request, await getCrawlerControl(env));
  }

  const openAIAgent = identifyOpenAIAgent(request.headers.get('user-agent'));
  if (openAIAgent === 'GPTBot') return crawlerBlockedResponse(openAIAgent);
  if (openAIAgent && (await getCrawlerControl(env)).state === 'disabled') {
    return crawlerBlockedResponse(openAIAgent);
  }

  if (request.method === 'GET' && path === '/health') return healthResponse(env);
  if (request.method === 'GET' && path === '/version') return versionResponse(env);
  if ((request.method === 'GET' || request.method === 'HEAD') && path === '/og.png') return socialCardResponse(request);
  if (request.method === 'GET' && path === '/__api/operations/logs') return logsResponse(request, env);

  const control = await getDemoControl(env);
  if (request.method === 'GET' && path === '/offline') {
    return renderOffline(env, control, url.searchParams.get('from') || '/');
  }

  if (control.state === 'offline' && !bypassOfflineGate(path)) {
    if (wantsHtml(request, path)) {
      const target = new URL('/offline', url.origin);
      target.searchParams.set('from', path);
      return Response.redirect(target.toString(), 302);
    }
    return offlineApiResponse(control.publicMessage);
  }

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
  if (path === '/__api/operations/billing') return billingScenarioResponse(request, env);
  if (path === '/__api/evidence/traceability') return traceabilityResponse(request, env);
  if (path === '/__api/governance/security-controls') return securityControlsResponse(request, env);
  if (path === '/__api/governance/ai-evaluation') return aiEvaluationResponse(request, env);
  if (path === '/__api/accessibility/lab') return accessibilityLabResponse(request);
  if (path === '/__api/git/evidence') return gitEvidenceResponse(request, env);
  if (path === '/__api/git/demo') return request.method === 'GET' ? gitDemoStatusResponse(request, env) : gitDemoStartResponse(request, env);
  if (path === '/__api/git/demo/release') return gitDemoReleaseResponse(request, env);

  if (request.method === 'GET') {
    const redirect = RETIRED_PAGE_REDIRECTS.get(path);
    if (redirect) return Response.redirect(new URL(redirect, url.origin).toString(), 301);
  }

  if (request.method === 'GET' && path === '/sitemap.xml') return sitemapResponse(request, demos);
  if (request.method === 'GET' && path === '/') return renderIndex(env, demos);
  if (request.method === 'GET' && path === '/d1') return renderD1Demo(env);
  if (request.method === 'GET' && path === '/r2') return renderR2Demo(env);
  if (request.method === 'GET' && path === '/api') return renderApiDemo(env);
  if (request.method === 'GET' && path === '/webhooks') return renderWebhooksDemo(env);
  if (request.method === 'GET' && path === '/identity') return renderIdentityDemo(env);
  if (request.method === 'GET' && path === '/i18n') return renderI18nDemo(request, env);
  if (request.method === 'GET' && path === '/accessibility') return renderAccessibilityDemo(request, env);
  if (request.method === 'GET' && path === '/git') return renderGitDemo(env);
  if (request.method === 'GET' && path === '/mcp') return renderMcpDemo(request, env);
  if (request.method === 'GET' && path === '/dashboard') return renderDashboard(env);
  if (request.method === 'GET' && path === '/dashboard/uptime') return renderUptime(env);
  if (request.method === 'GET' && path === '/dashboard/docs') return renderDocs(env);
  if (request.method === 'GET' && path === '/dashboard/billing') return renderBilling(env);
  if (request.method === 'GET' && path === '/dashboard/logs') return renderLogsDemo(request, env);

  if (request.method === 'GET') {
    const demo = demosByRoute.get(path);
    if (demo) return renderDemo(env, demo, demos);
  }

  return renderNotFound(env);
}
