import { describe, expect, it } from 'vitest';
import { recentApplicationLogs, recordApplicationLog } from '../src/lib/logs';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

function storedLogEnv() {
  const db = new SqliteD1();
  const env = {
    WG_DB: db,
    GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  } as Env;
  return { env, db };
}

describe('public-safe application logs', () => {
  it('redacts sensitive keys and values and keeps structured detail valid and bounded', async () => {
    const { env, db } = storedLogEnv();
    await recordApplicationLog(env, { source: 'test', eventKey: 'redaction', message: 'Safe diagnostic message.', detail: { password: 'do-not-store', nested: { authorization: 'Bearer private-value', note: 'Bearer abcdefghijklmnop' }, accountId: 'private-account', safe: 'x'.repeat(6000) } });
    const [stored] = db.events<{ detail_json: string }>('log');
    const detail = stored.body.detail_json;
    expect(detail.length).toBeLessThanOrEqual(4000);
    expect(() => JSON.parse(detail)).not.toThrow();
    for (const secret of ['do-not-store', 'private-account', 'abcdefghijklmnop']) expect(detail).not.toContain(secret);
    expect(detail).toContain('[redacted]');
    expect(stored.expiresAt).toBeGreaterThan(stored.at);
  });

  it('keeps machine log filtering bounded to 200 sanitized rows, newest first', async () => {
    const { env } = storedLogEnv();
    for (let index = 0; index < 205; index += 1) {
      await recordApplicationLog(env, { level: 'warn', source: 'rest', eventKey: `warn-${index}`, message: 'Rejected.', requestId: 'req-1' });
    }
    await recordApplicationLog(env, { level: 'info', source: 'rest', eventKey: 'info', message: 'Accepted.', requestId: 'req-1' });
    const results = await recentApplicationLogs(env, { level: 'warn', source: 'rest', requestId: 'req-1', limit: 999 });
    expect(results).toHaveLength(200);
    expect(results.every((row) => row.level === 'warn' && row.source === 'rest' && row.request_id === 'req-1')).toBe(true);
    expect(results[0].event_key).toBe('warn-204');
    expect(results.at(-1)?.event_key).toBe('warn-5');
    // Over-long filters are cut to the stored field bounds, so they cannot widen a match.
    expect(await recentApplicationLogs(env, { source: 'rest'.repeat(30) })).toEqual([]);
    expect(await recentApplicationLogs(env, { requestId: 'req-'.repeat(40) })).toEqual([]);
  });

  it('stores escaped-safe structured events without fabricating examples', async () => {
    const { env, db } = storedLogEnv();
    await recordApplicationLog(env, { source: 'test', eventKey: 'first', message: '<script>latest</script>', route: '/api/operations/health', requestId: 'req-example', detail: { token: 'never-expose-this' } });
    const results = await recentApplicationLogs(env, { limit: 50 });
    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('<script>latest</script>');
    expect(results[0].detail_json).toContain('[redacted]');
    expect(results[0].detail_json).not.toContain('never-expose-this');
    expect(db.events('log')).toHaveLength(1);
  });
});
