import type { Env } from './types';
import { demos, demosByRoute } from './demos/registry';
import { renderDemo, renderIndex, renderNotFound } from './ui/page';
import { renderAdmin, renderOffline } from './ui/admin';
import { listDemoEvents, runBaselineDemo } from './api/demo';
import { healthResponse, logsResponse, versionResponse } from './api/operations';
import { renderLogsDemo } from './demos/logs';
import { requireAdmin } from './lib/admin-auth';
import { getDemoControl, setDemoControl } from './lib/demo-control';

const OPERATIONS_PREFIX = '/dashboard';
const API_PREFIXES = ['/__api/', '/v1/'];
const API_PATHS = new Set(['/graphql', '/mcp']);

export function bypassOfflineGate(path: string): boolean {
  return path === '/admin'
    || path === '/offline'
    || path === '/health'
    || path === '/version'
    || path === '/__api/operations/logs'
    || path === OPERATIONS_PREFIX
    || path.startsWith(`${OPERATIONS_PREFIX}/`);
}

export function isApiLike(path: string): boolean {
  return API_PATHS.has(path) || API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function wantsHtml(request: Request, path: string): boolean {
  if (request.method !== 'GET' || isApiLike(path)) return false;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') || accept === '';
}

function offlineApiResponse(message: string): Response {
  return new Response(JSON.stringify({ status: 'offline', message }), {
    status: 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '60'
    }
  });
}

export async function routeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '/';

  if (path === '/admin') {
    const identity = requireAdmin(request, env);
    if (identity instanceof Response) return identity;
    if (request.method === 'POST') {
      const form = await request.formData();
      const state = form.get('state') === 'offline' ? 'offline' : 'online';
      const fallback = state === 'offline' ? 'The demo is temporarily unavailable.' : 'The architecture demo is available.';
      const message = String(form.get('message') || fallback).trim().slice(0, 500) || fallback;
      const control = await setDemoControl(env, state, message, identity.username);
      return renderAdmin(env, control, `Demo is now ${state}.`);
    }
    if (request.method === 'GET') return renderAdmin(env, await getDemoControl(env));
    return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, POST', 'cache-control': 'no-store' } });
  }

  if (request.method === 'GET' && path === '/health') return healthResponse(env);
  if (request.method === 'GET' && path === '/version') return versionResponse(env);
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

  if (request.method === 'GET' && path === '/') return renderIndex(env, demos);
  if (request.method === 'GET' && path === '/dashboard/logs') return renderLogsDemo(request, env);
  if (request.method === 'POST' && path === '/__api/demo/run') return runBaselineDemo(request, env);
  if (request.method === 'GET' && path === '/__api/demo/events') return listDemoEvents(request, env);

  if (request.method === 'GET') {
    const demo = demosByRoute.get(path);
    if (demo) return renderDemo(env, demo);
  }

  return renderNotFound(env);
}
