import { describe, expect, it } from 'vitest';
import { logsContent } from '../src/demos/logs';
import { recordApplicationLog, type ApplicationLogRow } from '../src/lib/logs';
import { routeUrl } from '../src/routing/application-routes';
import type { Env } from '../src/types';

function storedLogEnv() {
  const rows: ApplicationLogRow[] = [];
  const queries: unknown[][] = [];
  const env = {
    DEMO_DB: { prepare: () => {
      let values: unknown[] = [];
      return {
        bind(...bound: unknown[]) { values = bound; return this; },
        async run() {
          rows.unshift({ id: rows.length + 1, level: values[0] as ApplicationLogRow['level'], source: String(values[1]), event_key: String(values[2]), message: String(values[3]), route: values[4] as string | null, request_id: values[5] as string | null, detail_json: values[6] as string | null, created_at: String(values[7]) });
          return { meta: { last_row_id: rows.length } };
        },
        async all<T>() { queries.push(values); return { results: rows as T[] }; },
      };
    } },
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  } as Env;
  return { env, queries };
}

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
    expect(content.body).toContain('id="log-explorer" open');
    expect(content.body).toContain('No events match the selected filters.');
    expect(content.body).not.toContain('name="view"');
    expect(content.body).not.toContain('?view=logs');
  });

  it('previews three distinct real events while retaining repeated records and sanitized detail in the explorer', async () => {
    const { env, queries } = storedLogEnv();
    for (const [eventKey, message] of [['fourth', 'Older event'], ['third', 'Third event'], ['second', 'Second event'], ['first', 'Repeated event'], ['first', '<script>latest</script>']]) {
      await recordApplicationLog(env, { source: 'test', eventKey, message, route: routeUrl('operations.logs'), requestId: 'req-example', detail: { token: 'never-expose-this', result: '<safe>' } });
    }
    const { body, cacheControl } = await logsContent(new Request('https://demo.wizardgang.ai/operations/logs'), env);
    const preview = body.slice(body.indexOf('id="log-examples-heading"'), body.indexOf('<details class="operations-inspection"'));
    const explorer = body.slice(body.indexOf('<details class="operations-inspection"'));
    expect(queries).toEqual([[50]]);
    expect(cacheControl).toBe('no-store');
    expect((preview.match(/class="operations-tour-card log-example"/g) || []).length).toBe(3);
    expect(preview).toContain('&lt;script&gt;latest&lt;/script&gt;');
    expect(preview).not.toContain('Repeated event');
    expect(preview).not.toContain('Older event');
    expect(preview.indexOf('latest')).toBeLessThan(preview.indexOf('Second event'));
    expect(preview.indexOf('Second event')).toBeLessThan(preview.indexOf('Third event'));
    expect(preview).toContain('req-example');
    expect(preview).toContain(routeUrl('operations.logs'));
    expect(explorer).toContain('Repeated event');
    expect(explorer).toContain('Older event');
    expect(explorer).toContain('<summary>View</summary><pre>');
    expect(explorer).toContain('[redacted]');
    expect(explorer).toContain('&lt;safe&gt;');
    expect(body).not.toContain('never-expose-this');
    expect(body).not.toContain('<script>latest</script>');
    expect(body).toContain('id="log-explorer">');
    expect(body.indexOf('Structured events')).toBeLessThan(body.indexOf('Recent event examples'));
    expect(body.indexOf('Recent event examples')).toBeLessThan(body.indexOf('Open log explorer'));
  });

  it('does not fabricate examples when history is empty or a record has no trace identifiers', async () => {
    const { env } = storedLogEnv();
    const empty = await logsContent(new Request('https://demo.wizardgang.ai/operations/logs'), env);
    expect(empty.body).toContain('No logs have been recorded yet.');
    expect(empty.body).not.toContain('class="operations-tour-card log-example"');
    await recordApplicationLog(env, { source: 'health', eventKey: 'health_check', message: 'Observed health.' });
    const single = await logsContent(new Request('https://demo.wizardgang.ai/operations/logs'), env);
    expect((single.body.match(/class="operations-tour-card log-example"/g) || []).length).toBe(1);
    expect(single.body).toContain('Not recorded');
  });

});
