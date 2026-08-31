import { describe, expect, it } from 'vitest';
import { recordApplicationLog } from '../src/lib/logs';
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
});
