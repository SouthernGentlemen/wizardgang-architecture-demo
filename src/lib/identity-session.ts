import type { Env } from '../types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_SECONDS = 30 * 60;
const FLOW_SECONDS = 10 * 60;
const ACCESS_TOKEN_SECONDS = 10 * 60;

export const IDENTITY_SESSION_COOKIE = '__Host-wg_identity';
export const IDENTITY_FLOW_COOKIE = '__Host-wg_identity_flow';
export const SAML_FLOW_COOKIE = '__Host-wg_saml_flow';

export type IdentityProvider = 'microsoft' | 'google' | 'github';
export type IdentityProtocol = 'oidc' | 'oauth2' | 'saml2';
export type IdentityAssurance = 'mfa' | 'provider-authenticated';
export type ApplicationRole = 'operator' | 'viewer';

export interface NormalizedIdentity {
  provider: IdentityProvider;
  protocol: IdentityProtocol;
  subject: string;
  email?: string;
  emailVerified?: boolean;
  displayName: string;
  username?: string;
  organization?: string;
  assurance: IdentityAssurance;
  role: ApplicationRole;
  authenticatedAt: string;
  expiresAt: string;
}

export interface IdentityValidation {
  key: string;
  label: string;
  status: 'valid' | 'not_applicable';
  detail: string;
}

export interface IdentitySession {
  identity: NormalizedIdentity;
  providerPayloadLabel: string;
  providerPayload: Record<string, unknown>;
  validation: IdentityValidation[];
  protocol: {
    name: string;
    steps: string[];
    sanitizedAssertion?: string;
  };
  issuedAt: string;
  expiresAt: string;
}

export interface DemoAccessToken {
  subject: string;
  authentication: IdentityProtocol;
  provider: IdentityProvider;
  permissions: ['demo:read', 'demo:write'];
  namespace: string;
  issuedAt: string;
  expiresAt: string;
}

export interface IdentityFlow {
  provider: IdentityProvider | 'saml';
  state: string;
  nonce?: string;
  verifier?: string;
  startedAt: number;
}

interface SessionReference {
  id: string;
  expiresAt: number;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function randomValue(bytes = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function keyFor(secret: string, purpose: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${purpose}\u0000${secret}`));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function identitySecret(env: Env): string | null {
  const secret = env.IDENTITY_SESSION_SECRET?.trim();
  return secret && encoder.encode(secret).byteLength >= 32 ? secret : null;
}

export function hasIdentitySecret(env: Env): boolean {
  return identitySecret(env) !== null;
}

async function seal(value: unknown, secret: string, purpose: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const additionalData = encoder.encode(`v1:${purpose}`);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData },
    await keyFor(secret, purpose),
    encoder.encode(JSON.stringify(value)),
  );
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

async function unseal<T>(value: string, secret: string, purpose: string): Promise<T | null> {
  try {
    const [version, encodedIv, encodedCiphertext, extra] = value.split('.');
    if (version !== 'v1' || !encodedIv || !encodedCiphertext || extra) return null;
    const iv = new Uint8Array(fromBase64Url(encodedIv));
    const ciphertext = new Uint8Array(fromBase64Url(encodedCiphertext));
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: encoder.encode(`v1:${purpose}`) },
      await keyFor(secret, purpose),
      ciphertext,
    );
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch {
    return null;
  }
}

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim() || null;
  }
  return null;
}

function cookie(name: string, value: string, maxAge: number, sameSite: 'Lax' | 'None'): string {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=${sameSite}`;
}

export function clearIdentityCookie(name = IDENTITY_SESSION_COOKIE, sameSite: 'Lax' | 'None' = 'Lax'): string {
  return cookie(name, '', 0, sameSite);
}

export async function writeFlowCookie(env: Env, flow: IdentityFlow): Promise<string> {
  const secret = identitySecret(env);
  if (!secret) throw new Error('identity_not_configured');
  const name = flow.provider === 'saml' ? SAML_FLOW_COOKIE : IDENTITY_FLOW_COOKIE;
  const sameSite = flow.provider === 'saml' ? 'None' : 'Lax';
  return cookie(name, await seal(flow, secret, 'identity-flow'), FLOW_SECONDS, sameSite);
}

export async function readFlowCookie(request: Request, env: Env, provider: IdentityFlow['provider']): Promise<IdentityFlow | null> {
  const secret = identitySecret(env);
  if (!secret) return null;
  const name = provider === 'saml' ? SAML_FLOW_COOKIE : IDENTITY_FLOW_COOKIE;
  const encoded = cookieValue(request, name);
  if (!encoded) return null;
  const flow = await unseal<IdentityFlow>(encoded, secret, 'identity-flow');
  if (!flow || flow.provider !== provider || !flow.state || Date.now() - flow.startedAt > FLOW_SECONDS * 1000) return null;
  return flow;
}

export function clearFlowCookie(provider: IdentityFlow['provider']): string {
  return provider === 'saml'
    ? clearIdentityCookie(SAML_FLOW_COOKIE, 'None')
    : clearIdentityCookie(IDENTITY_FLOW_COOKIE);
}

export async function createIdentitySession(env: Env, session: IdentitySession): Promise<string> {
  const secret = identitySecret(env);
  if (!secret) throw new Error('identity_not_configured');
  const id = randomValue();
  const now = new Date();
  const requestedExpiry = Date.parse(session.expiresAt);
  const maximumExpiry = now.getTime() + SESSION_SECONDS * 1000;
  const expiresAt = new Date(Number.isFinite(requestedExpiry) ? Math.min(requestedExpiry, maximumExpiry) : maximumExpiry);
  await env.DEMO_DB.prepare(
    `DELETE FROM identity_sessions
     WHERE expires_at <= ? OR (revoked_at IS NOT NULL AND revoked_at <= ?)`,
  ).bind(now.toISOString(), new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()).run();
  const persisted: IdentitySession = {
    ...session,
    identity: { ...session.identity, expiresAt: expiresAt.toISOString() },
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  await env.DEMO_DB.prepare(
    `INSERT INTO identity_sessions
      (session_id_sha256, payload_ciphertext, created_at, expires_at, revoked_at)
     VALUES (?, ?, ?, ?, NULL)`,
  ).bind(
    await sha256(id),
    await seal(persisted, secret, 'identity-session-payload'),
    persisted.issuedAt,
    persisted.expiresAt,
  ).run();
  const reference: SessionReference = { id, expiresAt: expiresAt.getTime() };
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  return cookie(IDENTITY_SESSION_COOKIE, await seal(reference, secret, 'identity-session-reference'), maxAge, 'Lax');
}

export async function readIdentitySession(request: Request, env: Env): Promise<IdentitySession | null> {
  const secret = identitySecret(env);
  const encoded = cookieValue(request, IDENTITY_SESSION_COOKIE);
  if (!secret || !encoded) return null;
  const reference = await unseal<SessionReference>(encoded, secret, 'identity-session-reference');
  if (!reference?.id || !Number.isFinite(reference.expiresAt) || reference.expiresAt <= Date.now()) return null;
  const result = await env.DEMO_DB.prepare(
    `SELECT payload_ciphertext, expires_at
     FROM identity_sessions
     WHERE session_id_sha256 = ? AND revoked_at IS NULL AND expires_at > ?
     LIMIT 1`,
  ).bind(await sha256(reference.id), new Date().toISOString()).all<{ payload_ciphertext: string; expires_at: string }>();
  const row = result.results[0];
  if (!row) return null;
  const session = await unseal<IdentitySession>(row.payload_ciphertext, secret, 'identity-session-payload');
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  return session;
}

export async function createDemoAccessToken(env: Env, session: IdentitySession): Promise<{ token: string; claims: DemoAccessToken }> {
  const secret = identitySecret(env);
  if (!secret) throw new Error('identity_not_configured');
  const now = Date.now();
  const sessionExpiry = Date.parse(session.expiresAt);
  const expiresAt = new Date(Math.min(now + ACCESS_TOKEN_SECONDS * 1000, sessionExpiry));
  const subject = `${session.identity.provider}:${session.identity.subject}`;
  const subjectSha256 = await sha256(subject);
  const claims: DemoAccessToken = {
    subject,
    authentication: session.identity.protocol,
    provider: session.identity.provider,
    permissions: ['demo:read', 'demo:write'],
    namespace: `sandbox-${subjectSha256.slice(0, 24)}`,
    issuedAt: new Date(now).toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  return { token: await seal(claims, secret, 'demo-access-token'), claims };
}

export async function readDemoAccessToken(env: Env, token: string): Promise<DemoAccessToken | null> {
  const secret = identitySecret(env);
  if (!secret || !token.startsWith('v1.')) return null;
  const claims = await unseal<DemoAccessToken>(token, secret, 'demo-access-token');
  const issuedAt = Date.parse(claims?.issuedAt ?? '');
  const expiresAt = Date.parse(claims?.expiresAt ?? '');
  if (!claims
    || !claims.subject
    || !['oidc', 'oauth2', 'saml2'].includes(claims.authentication)
    || !['microsoft', 'google', 'github'].includes(claims.provider)
    || !claims.subject.startsWith(`${claims.provider}:`)
    || !Array.isArray(claims.permissions)
    || !claims.permissions.includes('demo:read')
    || !claims.permissions.includes('demo:write')
    || !/^sandbox-[0-9a-f]{24}$/.test(claims.namespace)
    || !Number.isFinite(issuedAt)
    || !Number.isFinite(expiresAt)
    || issuedAt > Date.now() + 60_000
    || expiresAt <= Date.now()
    || expiresAt - issuedAt > ACCESS_TOKEN_SECONDS * 1000 + 1_000) return null;
  return claims;
}

export async function revokeIdentitySession(request: Request, env: Env): Promise<void> {
  const secret = identitySecret(env);
  const encoded = cookieValue(request, IDENTITY_SESSION_COOKIE);
  if (!secret || !encoded) return;
  const reference = await unseal<SessionReference>(encoded, secret, 'identity-session-reference');
  if (!reference?.id) return;
  await env.DEMO_DB.prepare(
    `UPDATE identity_sessions SET revoked_at = ? WHERE session_id_sha256 = ? AND revoked_at IS NULL`,
  ).bind(new Date().toISOString(), await sha256(reference.id)).run();
}
