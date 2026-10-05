import { describe, expect, it } from 'vitest';
import { r2FilesResetResponse, r2FilesResponse } from '../src/api/r2';
import type { Env } from '../src/types';
import { wgStorage, type MemoryR2, type SqliteD1 } from './helpers/wg-storage';

function env(): Env & { WG_DB: SqliteD1; WG_R2: MemoryR2 } {
  return {
    ...wgStorage(),
    WG_SESSION_KEY: 'test-session-secret-with-at-least-32-characters',
    GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo', GITHUB_BRANCH: 'main',
  };
}

describe('R2 visitor file manager', () => {
  it('uploads real bytes, lists safe metadata, previews, deletes, and resets only the session', async () => {
    const environment = env();
    const listed = await r2FilesResponse(new Request('https://demo.example/api/labs/r2-files'), environment);
    const cookie = listed.headers.get('set-cookie')!.split(';')[0];
    expect(await listed.clone().json()).toMatchObject({ operation: 'r2.files.list', objectCount: 2 });

    const form = new FormData(); form.append('file', new Blob(['hello r2'], { type: 'text/plain' }), 'hello.txt');
    const uploaded = await r2FilesResponse(new Request('https://demo.example/api/labs/r2-files', { method: 'POST', headers: { origin: 'https://demo.example', cookie }, body: form }), environment);
    const uploadBody = await uploaded.json() as { result: { file: { id: string; key: string } } };
    expect(uploadBody.result.file.key).toContain('uploads/this-session/');
    expect([...environment.WG_R2.objects.keys()].sort()).toEqual([
      'demo/documents/architecture-demo.txt',
      'demo/images/architecture-map.svg',
      expect.stringMatching(/^demo\/uploads\/[0-9a-f-]{36}\/[0-9a-f-]{36}-hello.txt$/),
    ]);
    const [upload] = [...environment.WG_DB.records('r2-objects').values()].filter((row) => row.owner !== null);
    expect(upload.expiresAt).not.toBeNull();

    const id = uploadBody.result.file.id;
    const preview = await r2FilesResponse(new Request(`https://demo.example/api/labs/r2-files/${id}`, { headers: { cookie } }), environment, id);
    expect(await preview.text()).toBe('hello r2');
    expect(preview.headers.get('content-disposition')).toContain('inline');

    expect((await r2FilesResponse(new Request(`https://demo.example/api/labs/r2-files/${id}`, { method: 'DELETE', headers: { origin: 'https://demo.example', cookie } }), environment, id)).status).toBe(200);
    expect(environment.WG_R2.objects.size).toBe(2);
    expect((await r2FilesResetResponse(new Request('https://demo.example/api/labs/r2-reset', { method: 'POST', headers: { origin: 'https://demo.example', cookie } }), environment)).status).toBe(200);
  });

  it('rejects cross-origin upload before creating a sandbox', async () => {
    const environment = env();
    const response = await r2FilesResponse(new Request('https://demo.example/api/labs/r2-files', { method: 'POST', headers: { origin: 'https://attacker.example' } }), environment);
    expect(response.status).toBe(403);
    expect(environment.WG_DB.records('demo-sessions').size).toBe(0);
  });
});

