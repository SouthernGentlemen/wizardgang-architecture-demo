import type { Env } from '../types';

export async function putDemoObject(env: Env, key: string, body: string): Promise<void> {
  if (!env.DEMO_R2) throw new Error('DEMO_R2 is not configured');
  await env.DEMO_R2.put(key, body, { httpMetadata: { contentType: 'text/plain; charset=utf-8' } });
}

export async function getDemoObject(env: Env, key: string): Promise<string | null> {
  if (!env.DEMO_R2) throw new Error('DEMO_R2 is not configured');
  const object = await env.DEMO_R2.get(key);
  return object ? object.text() : null;
}

export async function deleteDemoObject(env: Env, key: string): Promise<void> {
  if (!env.DEMO_R2) throw new Error('DEMO_R2 is not configured');
  await env.DEMO_R2.delete(key);
}
