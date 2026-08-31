import type { Env } from '../types';
import { recordDemoEvent } from '../lib/audit';
import { HttpError, errorResponse, json, methodNotAllowed } from '../lib/http';
import { recordApplicationLog } from '../lib/logs';

const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

async function sha256(payload: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(payload)));
}

function validDeliveryId(value: string | null): value is string {
  return Boolean(value && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(value));
}

async function verifySignature(secret: string, payload: string, signature: string): Promise<boolean> {
  const expected = await hmac(secret, payload);
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0;
}

export async function webhookReceiptResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  try {
    if (!env.WEBHOOK_DEMO_SECRET) return json({ error: 'webhook_demo_not_configured' }, { status: 503 });
    const declared = Number(request.headers.get('content-length') || '0');
    if (declared > 16_384) throw new HttpError(413, 'request_body_too_large');
    const payload = await request.text();
    if (encoder.encode(payload).byteLength > 16_384) throw new HttpError(413, 'request_body_too_large');
    const deliveryId = request.headers.get('x-demo-delivery-id');
    const signature = request.headers.get('x-demo-signature') || '';
    if (!validDeliveryId(deliveryId)) throw new HttpError(400, 'invalid_delivery_id');
    if (!(await verifySignature(env.WEBHOOK_DEMO_SECRET, payload, signature))) return json({ error: 'invalid_signature' }, { status: 401 });
    let parsed: { type?: unknown };
    try { parsed = JSON.parse(payload) as { type?: unknown }; } catch { throw new HttpError(400, 'invalid_json'); }
    if (typeof parsed.type !== 'string' || !/^demo\.[a-z.]{1,60}$/.test(parsed.type)) throw new HttpError(400, 'invalid_event_type');
    const receivedAt = new Date().toISOString();
    const digest = await sha256(payload);
    try {
      await env.DEMO_DB.prepare('INSERT INTO webhook_receipts (event_type, delivery_id, payload_sha256, received_at) VALUES (?, ?, ?, ?)').bind(parsed.type, deliveryId, digest, receivedAt).run();
    } catch {
      return json({ error: 'duplicate_delivery', deliveryId }, { status: 409 });
    }
    const event = await recordDemoEvent(env, 'webhooks', 'signed_webhook_received', { eventType: parsed.type, deliveryId, payloadSha256: digest });
    await recordApplicationLog(env, { source: 'webhooks', eventKey: 'signed_webhook_received', message: `Verified webhook ${deliveryId} was accepted.`, route: '/v1/webhooks/demo', detail: { eventType: parsed.type, deliveryId, payloadSha256: digest, eventId: event.id } });
    return json({ accepted: true, deliveryId, eventType: parsed.type, receivedAt, payloadSha256: digest, auditEventId: event.id }, { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function webhookDemoResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  if (!env.WEBHOOK_DEMO_SECRET) return json({ error: 'webhook_demo_not_configured' }, { status: 503 });
  const deliveryId = `visitor-${crypto.randomUUID()}`;
  const payload = JSON.stringify({ type: 'demo.record.changed', data: { key: 'visitor-example' }, sentAt: new Date().toISOString() });
  return webhookReceiptResponse(new Request(new URL('/v1/webhooks/demo', request.url), {
    method: 'POST', body: payload, headers: { 'content-type': 'application/json', 'x-demo-delivery-id': deliveryId, 'x-demo-signature': await hmac(env.WEBHOOK_DEMO_SECRET, payload) },
  }), env);
}

export { hmac as signWebhookForTest };
