import { describe, expect, it } from 'vitest';
import { operationsActivitySection } from '../src/demos/operations';
import { recordApplicationLog, type ApplicationLogRow } from '../src/lib/logs';
import type { HealthSnapshot } from '../src/api/operations';
import { routeUrl } from '../src/routing/application-routes';
import type { Env } from '../src/types';

const health: HealthSnapshot = { status: 'operational', checkedAt: '2026-09-10T12:00:00.000Z', demo: { state: 'online', message: 'Available.' }, services: { worker: 'operational', d1: 'operational', r2: 'unconfigured', durableObjects: 'unconfigured' }, responseMs: { d1: 1 } };

function storedLogEnv() {
  const rows: ApplicationLogRow[] = []; const queries: unknown[][] = [];
  const env = { DEMO_DB: { prepare: () => { let values: unknown[] = []; return { bind(...bound: unknown[]) { values = bound; return this; }, async run() { rows.unshift({ id: rows.length + 1, level: values[0] as ApplicationLogRow['level'], source: String(values[1]), event_key: String(values[2]), message: String(values[3]), route: values[4] as string | null, request_id: values[5] as string | null, detail_json: values[6] as string | null, created_at: String(values[7]) }); return { meta: { last_row_id: rows.length } }; }, async all<T>() { queries.push(values); return { results: rows as T[] }; } }; } }, GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main' } as Env;
  return { env, queries };
}

describe('public-safe application logs', () => {
  it('redacts sensitive keys and values and keeps structured detail valid and bounded', async () => {
    let binds: unknown[] = [];
    const env = { DEMO_DB: { prepare: () => ({ bind(...values: unknown[]) { binds = values; return this; }, async run() { return { meta: { last_row_id: 1 } }; }, async all<T>() { return { results: [] as T[] }; } }) } } as Env;
    await recordApplicationLog(env, { source: 'test', eventKey: 'redaction', message: 'Safe diagnostic message.', detail: { password: 'do-not-store', nested: { authorization: 'Bearer private-value', note: 'Bearer abcdefghijklmnop' }, accountId: 'private-account', safe: 'x'.repeat(6000) } });
    const detail = String(binds[6]); expect(detail.length).toBeLessThanOrEqual(4000); expect(() => JSON.parse(detail)).not.toThrow();
    for (const secret of ['do-not-store', 'private-account', 'abcdefghijklmnop']) expect(detail).not.toContain(secret); expect(detail).toContain('[redacted]');
  });

  it('keeps log filters as query state on /operations and caps the explorer at 200 rows', async () => {
    const env = { DEMO_DB: { prepare: () => ({ bind() { return this; }, async run() { return { meta: { last_row_id: 1 } }; }, async all<T>() { return { results: [] as T[] }; } }) }, GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo', GITHUB_BRANCH: 'main' } as Env;
    const section = await operationsActivitySection(new Request('https://demo.wizardgang.ai/operations?level=warn&source=rest&limit=999&requestId=req-123'), env, health);
    expect(section.html).toContain('action="/operations#activity"'); expect(section.html).toContain('href="/operations#activity"'); expect(section.html).toContain('limit=200'); expect(section.html).toContain('level=warn'); expect(section.html).toContain('source=rest'); expect(section.html).toContain('requestId=req-123');
    expect(section.html).toContain('value="warn"'); expect(section.html).toContain('value="rest"'); expect(section.html).toContain('value="req-123"'); expect(section.html).toContain('type="number" min="1" max="200" value="200"'); expect(section.html).toContain('No events match the selected filters.'); expect(section.html).not.toContain('name="view"');

    const invalid = await operationsActivitySection(new Request('https://demo.wizardgang.ai/operations?level=not-a-level'), env, health);
    expect(invalid.html).not.toContain('value="not-a-level"');
    expect(invalid.html).not.toContain('level=not-a-level');
    expect(invalid.html).toContain('No logs have been recorded yet.');
  });

  it('previews at most three real events and escapes public messages', async () => {
    const { env, queries } = storedLogEnv();
    for (const [eventKey, message] of [['fourth', 'Older event'], ['third', 'Third event'], ['second', 'Second event'], ['first', '<script>latest</script>']]) await recordApplicationLog(env, { source: 'test', eventKey, message, route: routeUrl('operations.index'), requestId: 'req-example', detail: { token: 'never-expose-this' } });
    const section = await operationsActivitySection(new Request('https://demo.wizardgang.ai/operations'), env, health);
    expect(queries).toEqual([[50]]); expect((section.html.match(/class="activity-item"/g) || []).length).toBe(3); expect(section.html).toContain('&lt;script&gt;latest&lt;/script&gt;'); expect(section.html).not.toContain('<script>latest</script>'); expect(section.html).toContain('[redacted]'); expect(section.html).not.toContain('never-expose-this');
  });

  it('does not fabricate examples when history is empty', async () => {
    const { env } = storedLogEnv(); const empty = await operationsActivitySection(new Request('https://demo.wizardgang.ai/operations'), env, health); expect(empty.html).toContain('No logs have been recorded yet.'); expect(empty.html).not.toContain('class="activity-item"');
  });
});
