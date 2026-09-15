import { describe, expect, it } from 'vitest';
import { recentApplicationLogs, recordApplicationLog, type ApplicationLogRow } from '../src/lib/logs';
import type { Env } from '../src/types';

function storedLogEnv() {
  const rows: ApplicationLogRow[] = [];
  const queries: Array<{ sql: string; values: unknown[] }> = [];
  const env = {
    DEMO_DB: {
      prepare: (sql: string) => {
        let values: unknown[] = [];
        return {
          bind(...bound: unknown[]) { values = bound; return this; },
          async run() {
            rows.unshift({ id: rows.length + 1, level: values[0] as ApplicationLogRow['level'], source: String(values[1]), event_key: String(values[2]), message: String(values[3]), route: values[4] as string | null, request_id: values[5] as string | null, detail_json: values[6] as string | null, created_at: String(values[7]) });
            return { meta: { last_row_id: rows.length } };
          },
          async all<T>() {
            queries.push({ sql, values });
            return { results: rows as T[] };
          },
        };
      },
    },
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  } as Env;
  return { env, queries, rows };
}

describe('public-safe application logs', () => {
  it('redacts sensitive keys and values and keeps structured detail valid and bounded', async () => {
    let binds: unknown[] = [];
    const env = { DEMO_DB: { prepare: () => ({ bind(...values: unknown[]) { binds = values; return this; }, async run() { return { meta: { last_row_id: 1 } }; }, async all<T>() { return { results: [] as T[] }; } }) } } as Env;
    await recordApplicationLog(env, { source: 'test', eventKey: 'redaction', message: 'Safe diagnostic message.', detail: { password: 'do-not-store', nested: { authorization: 'Bearer private-value', note: 'Bearer abcdefghijklmnop' }, accountId: 'private-account', safe: 'x'.repeat(6000) } });
    const detail = String(binds[6]);
    expect(detail.length).toBeLessThanOrEqual(4000);
    expect(() => JSON.parse(detail)).not.toThrow();
    for (const secret of ['do-not-store', 'private-account', 'abcdefghijklmnop']) expect(detail).not.toContain(secret);
    expect(detail).toContain('[redacted]');
  });

  it('keeps machine log filtering bounded to 200 sanitized rows', async () => {
    const { env, queries } = storedLogEnv();
    await recentApplicationLogs(env, { level: 'warn', source: 'rest'.repeat(30), requestId: 'req-'.repeat(40), limit: 999 });
    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('level = ?');
    expect(queries[0].sql).toContain('source = ?');
    expect(queries[0].sql).toContain('request_id = ?');
    expect(queries[0].values.at(-1)).toBe(200);
    expect(String(queries[0].values[1]).length).toBeLessThanOrEqual(80);
    expect(String(queries[0].values[2]).length).toBeLessThanOrEqual(120);
  });

  it('stores escaped-safe structured events without fabricating examples', async () => {
    const { env, rows } = storedLogEnv();
    await recordApplicationLog(env, { source: 'test', eventKey: 'first', message: '<script>latest</script>', route: '/api/operations/health', requestId: 'req-example', detail: { token: 'never-expose-this' } });
    const results = await recentApplicationLogs(env, { limit: 50 });
    expect(results).toHaveLength(1);
    expect(results[0].message).toBe('<script>latest</script>');
    expect(results[0].detail_json).toContain('[redacted]');
    expect(results[0].detail_json).not.toContain('never-expose-this');
    expect(rows).toHaveLength(1);
  });
});
