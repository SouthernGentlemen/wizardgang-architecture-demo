import { describe, expect, it } from 'vitest';
import { d1LabResponse } from '../src/api/d1-lab';
import { createSignedDemoSessionValue, verifySignedDemoSessionValue } from '../src/lib/demo-session';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

function environment(database = new SqliteD1()): Env {
  return {
    WG_DB: database,
    WG_SESSION_KEY: 'test-session-secret-with-at-least-32-characters',
    GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

function mutation(path: string, method: string, body?: unknown, cookie?: string): Request {
  return new Request(`https://demo.example${path}`, {
    method,
    headers: { origin: 'https://demo.example', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe('signed visitor session', () => {
  it('round-trips a signed opaque ID and rejects tampering', async () => {
    const secret = 'test-session-secret-with-at-least-32-characters';
    const id = crypto.randomUUID();
    const value = await createSignedDemoSessionValue(id, secret);
    expect(await verifySignedDemoSessionValue(value, secret)).toBe(id);
    const replacement = value.endsWith('0') ? '1' : '0';
    expect(await verifySignedDemoSessionValue(`${value.slice(0, -1)}${replacement}`, secret)).toBeNull();
  });
});

describe('D1 visitor laboratory', () => {
  it('seeds, creates, updates, deletes, and resets isolated users', async () => {
    const database = new SqliteD1();
    const env = environment(database);
    const initial = await d1LabResponse(new Request('https://demo.example/api/labs/d1-users'), env, 'users');
    expect(initial.status).toBe(200);
    expect(await initial.clone().json()).toMatchObject({ operation: 'd1.users.list', rowCount: 3 });
    const setCookie = initial.headers.get('set-cookie')!;
    const cookie = setCookie.split(';')[0];

    const created = await d1LabResponse(mutation('/api/labs/d1-users', 'POST', { name: 'Mary Jackson', email: 'mary@example.test', role: 'member' }, cookie), env, 'users');
    const createdBody = await created.json() as { result: { user: { id: string } } };
    expect(created.status).toBe(201);

    const id = createdBody.result.user.id;
    const updated = await d1LabResponse(mutation(`/api/labs/d1-users/${id}`, 'PATCH', { name: 'Mary W. Jackson', email: 'mary@example.test', role: 'admin' }, cookie), env, 'users', id);
    expect(await updated.json()).toMatchObject({ result: { user: { name: 'Mary W. Jackson', role: 'admin' } } });

    expect((await d1LabResponse(mutation(`/api/labs/d1-users/${id}`, 'DELETE', undefined, cookie), env, 'users', id)).status).toBe(200);
    const duplicate = await d1LabResponse(mutation('/api/labs/d1-users', 'POST', { name: 'Second Ada', email: 'ada@example.test', role: 'viewer' }, cookie), env, 'users');
    expect(duplicate.status).toBe(409);
    expect((await d1LabResponse(mutation('/api/labs/d1-reset', 'POST', undefined, cookie), env, 'reset')).status).toBe(200);
    const [sessionId] = database.records('demo-sessions').keys();
    const users = [...database.records('lab-users').values()];
    expect(users.filter((row) => row.owner === sessionId)).toHaveLength(3);
    expect(users.every((row) => row.expiresAt !== null)).toBe(true);
    expect([...database.records('lab-tasks').values()].filter((row) => row.owner === sessionId)).toHaveLength(4);
  });

  it('rejects cross-origin writes and keeps two sessions isolated', async () => {
    const database = new SqliteD1();
    const env = environment(database);
    const first = await d1LabResponse(new Request('https://demo.example/api/labs/d1-users'), env, 'users');
    const second = await d1LabResponse(new Request('https://demo.example/api/labs/d1-users'), env, 'users');
    expect(first.headers.get('set-cookie')).not.toBe(second.headers.get('set-cookie'));

    const denied = await d1LabResponse(new Request('https://demo.example/api/labs/d1-users', {
      method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' }, body: '{}',
    }), env, 'users');
    expect(denied.status).toBe(403);
    expect(database.records('demo-sessions').size).toBe(2);

    // A user id from one sandbox is not found from another.
    const firstUser = (await first.json() as { result: { users: Array<{ id: string }> } }).result.users[0].id;
    const secondCookie = second.headers.get('set-cookie')!.split(';')[0];
    const crossed = await d1LabResponse(mutation(`/api/labs/d1-users/${firstUser}`, 'DELETE', undefined, secondCookie), env, 'users', firstUser);
    expect(crossed.status).toBe(404);
  });
});
