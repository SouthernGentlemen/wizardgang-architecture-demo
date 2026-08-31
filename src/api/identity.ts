import type { Env } from '../types';
import { recordDemoEvent } from '../lib/audit';
import { HttpError, errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function challenge(verifier: string): Promise<string> {
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
}

async function subjectDigest(subject: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(subject)));
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export async function oauthPkceResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const random = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64Url(random);
  const codeChallenge = await challenge(verifier);
  const state = crypto.randomUUID();
  const event = await recordDemoEvent(env, 'oauth', 'pkce_material_generated', { method: 'S256', stateBound: true });
  await recordApplicationLog(env, { source: 'oauth', eventKey: 'pkce_material_generated', message: 'Generated one-time OAuth PKCE demonstration material.', route: '/__api/identity/oauth-pkce', detail: { method: 'S256', eventId: event.id } });
  return json({
    authenticationStep: 'OAuth 2.0 authorization code flow with PKCE',
    verifier,
    challenge: codeChallenge,
    challengeMethod: 'S256',
    state,
    nextBoundary: 'An identity provider authenticates the user; the application must then make a separate authorization decision.',
    limitation: 'This public demonstration generates protocol material but does not connect to a real identity provider or issue a session.',
    auditEventId: event.id,
  }, { headers: { 'cache-control': 'no-store' } });
}

interface PolicyInput { authentication?: unknown; requestedAction?: unknown }

export async function authorizationDecisionResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  try {
    const body = await readJson<PolicyInput>(request, 4096);
    const authentication = body.authentication && typeof body.authentication === 'object' ? body.authentication as Record<string, unknown> : {};
    const subject = typeof authentication.subject === 'string' && /^[a-zA-Z0-9@._-]{1,80}$/.test(authentication.subject) ? authentication.subject : null;
    const assurance = authentication.assurance === 'mfa' ? 'mfa' : authentication.assurance === 'single-factor' ? 'single-factor' : null;
    const role = authentication.role === 'operator' ? 'operator' : authentication.role === 'viewer' ? 'viewer' : null;
    const action = body.requestedAction === 'demo:write' ? 'demo:write' : body.requestedAction === 'demo:read' ? 'demo:read' : null;
    if (!subject || !assurance || !role || !action) throw new HttpError(400, 'invalid_policy_input');
    const allowed = action === 'demo:read' || (action === 'demo:write' && role === 'operator' && assurance === 'mfa');
    const event = await recordDemoEvent(env, 'identity', 'authorization_evaluated', { subjectSha256: await subjectDigest(subject), assurance, role, action, allowed });
    await recordApplicationLog(env, { source: 'identity', eventKey: 'authorization_evaluated', message: `Authorization policy ${allowed ? 'allowed' : 'denied'} ${action}.`, route: '/__api/identity/authorize', detail: { assurance, role, action, allowed, eventId: event.id } });
    return json({
      authentication: { establishedSubject: subject, assurance, source: 'supplied provider-neutral demonstration context' },
      authorization: { requestedAction: action, role, decision: allowed ? 'allow' : 'deny', policy: 'read: viewer or operator; write: operator plus MFA' },
      separation: 'Authentication establishes subject and assurance. Application policy independently decides the permitted action.',
      limitation: 'The public input models a previously validated identity assertion; it is not itself trusted as authentication.',
      auditEventId: event.id,
    }, { status: allowed ? 200 : 403, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export function ssoBoundaryResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return json({
    authentication: {
      experience: 'Single sign-on',
      possibleProtocol: 'SAML 2.0 or OpenID Connect',
      responsibilities: ['redirect to trusted identity provider', 'validate issuer, audience, signature, time bounds, nonce/state', 'establish an expiring application session'],
    },
    authorization: {
      owner: 'WizardGang demo application',
      responsibilities: ['map validated identity attributes', 'evaluate least-privilege application policy', 'deny access not explicitly granted'],
    },
    configured: false,
    reason: 'No public identity-provider tenant or secrets are committed to this repository.',
  }, { headers: { 'cache-control': 'no-store' } });
}

const SAML_METADATA = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://demo.wizardgang.ai/identity/saml">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://demo.wizardgang.ai/identity/saml/callback" index="0" />
  </SPSSODescriptor>
</EntityDescriptor>`;

export function samlMetadataResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return new Response(SAML_METADATA, { headers: { 'content-type': 'application/samlmetadata+xml; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' } });
}

export function samlInspectionResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  return json({
    metadata: { entityId: 'https://demo.wizardgang.ai/identity/saml', assertionConsumerService: 'https://demo.wizardgang.ai/identity/saml/callback', binding: 'HTTP-POST' },
    authenticationRequirements: ['validate XML signature against a configured IdP certificate', 'validate issuer, audience, destination, recipient, and time bounds', 'reject replay', 'establish an expiring application session'],
    authorizationAfterAuthentication: 'Map only validated attributes into application roles, then evaluate the same application policy used by other authenticated callers.',
    configured: false,
    reason: 'Provider signing certificates and tenant identifiers must be supplied outside Git for a real federation.',
  }, { headers: { 'cache-control': 'no-store' } });
}
