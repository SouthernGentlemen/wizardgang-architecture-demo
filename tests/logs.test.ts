import { describe, expect, it } from 'vitest';
import { logsContent } from '../src/demos/logs';
import { recordApplicationLog } from '../src/lib/logs';
import { routeUrl } from '../src/routing/application-routes';
import type { Env } from '../src/types';

describe('public-safe application logs', () => {
  it('redacts sensitive keys and values and keeps structured detail valid and bounded', async () => {
    let binds: unknown[] = [];
    const env = {
      DEMO_DB: { prepare: () => ({ bind(...values: unknown[]) { binds = values; return this; }, async run() { return { meta: { last_row_id: 1 } }; }, async all<T>() { return { results: [] as T[] }; } }) },
    } as Env;
    await recordApplicationLog(env, {
      source: 'test', eventKey: 'redaction', message: 'Safe diagnostic message.',
      detail: { password: 'do-not-store', nested: { authorization: 'Bearer private-value', note: 'Bearer abcdefghijklmnop' }, accountId: 'private-account', safe: 'x'.repeat(6000) },
    });
    const detail = String(binds[6]);
    expect(detail.length).toBeLessThanOrEqual(4000);
    expect(() => JSON.parse(detail)).not.toThrow();
    expect(detail).not.toContain('do-not-store');
    expect(detail).not.toContain('private-account');
    expect(detail).not.toContain('abcdefghijklmnop');
    expect(detail).toContain('[redacted]');
  });

  it('keeps log filters as query state on the canonical logs route', async () => {
    const env = {
      DEMO_DB: {
        prepare: () => ({
          bind() { return this; },
          async run() { return { meta: { last_row_id: 1 } }; },
          async all<T>() { return { results: [] as T[] }; },
        }),
      },
      GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
      GITHUB_BRANCH: 'main',
    } as Env;
    const content = await logsContent(new Request('https://demo.wizardgang.ai/operations/logs?level=warn&source=rest&limit=25&requestId=req-123'), env);
    expect(content.canonicalPath).toBe(routeUrl('operations.logs'));
    expect(content.body).toContain('action="/operations/logs"');
    expect(content.body).toContain('href="/operations/logs"');
    expect(content.body).toContain('href="/api/operations/logs?limit=25&amp;level=warn&amp;source=rest&amp;requestId=req-123"');
    expect(content.body).toContain('value="warn" selected');
    expect(content.body).toContain('value="rest"');
    expect(content.body).toContain('value="req-123"');
    expect(content.body).not.toContain('name="view"');
    expect(content.body).not.toContain('?view=logs');
  });
});
