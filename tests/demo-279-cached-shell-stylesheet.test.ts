import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { routeUrl } from '../src/routing/application-routes';
import { styles } from '../src/ui/styles';
import { runtimeStyles } from '../src/ui/runtime-styles';
import {
  criticalStyles,
  demoStyles,
  shellStyles,
  shellStylesheetAsset,
} from '../src/ui/style-delivery';
import type { D1PreparedStatement, Env } from '../src/types';

class PerfStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: PerfD1, private readonly sql: string) { db.queries.push(sql); }
  bind(...values: unknown[]) { this.values = values; this.db.binds.push(...values); return this; }
  async run() { return { meta: { last_row_id: this.db.nextId++ } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: this.db.state, public_message: 'Available.', updated_at: '2026-09-16T00:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM crawler_control')) return { results: [{ state: this.db.crawlerState, updated_at: '2026-09-16T00:00:00.000Z', updated_by: 'test' }] as T[] };
    return { results: [] as T[] };
  }
}

class PerfD1 {
  nextId = 1;
  queries: string[] = [];
  binds: unknown[] = [];
  state: 'online' | 'offline' = 'online';
  crawlerState: 'enabled' | 'disabled' = 'disabled';
  prepare(sql: string) { return new PerfStatement(this, sql); }
}

function env(): Env & { DEMO_DB: PerfD1 } {
  return {
    DEMO_DB: new PerfD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    DEMO_ADMIN_USER: 'operator',
    DEMO_ADMIN_PASSWORD: 'test-admin-password',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

const encoder = new TextEncoder();
const bytes = (value: string) => encoder.encode(value).byteLength;
const demosPath = routeUrl('demos.index');
const assetPath = routeUrl('operations.assets', { asset: shellStylesheetAsset });
const publicPaths = [
  routeUrl('interfaces.frontend.index'),
  demosPath,
  routeUrl('assurance.index'),
  routeUrl('security.index'),
] as const;

async function htmlResponse(path: string): Promise<{ html: string; response: Response }> {
  const response = await routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'text/html' } }), env());
  return { html: await response.text(), response };
}

function legacyHtml(html: string, path: string): string {
  const shellMarkup = `<style data-critical-shell>${criticalStyles}</style>\n  <link rel="stylesheet" href="${assetPath}">`;
  let reconstructed = html.replace(shellMarkup, `<style>${styles}${runtimeStyles}</style>`);
  if (path === demosPath) reconstructed = reconstructed.replace(`<style data-demo-styles>${demoStyles}</style>`, '');
  return reconstructed;
}

describe('DEMO-279 cached shell stylesheet', () => {
  it('partitions shared and demo CSS behind a content-hashed immutable asset', async () => {
    expect(shellStylesheetAsset).toMatch(/^shell\.[0-9a-f]{8}\.css$/);
    expect(shellStyles).toContain('.site-header');
    expect(shellStyles).not.toContain('.d1-page-header');
    expect(demoStyles).toContain('.d1-page-header');
    expect(bytes(criticalStyles)).toBeLessThan(bytes(shellStyles));

    const get = await routeRequest(new Request(`https://demo.wizardgang.ai${assetPath}`), env());
    expect(get.status).toBe(200);
    expect(get.headers.get('content-type')).toBe('text/css; charset=utf-8');
    expect(get.headers.get('cache-control')).toContain('max-age=31536000');
    expect(get.headers.get('cache-control')).toContain('immutable');
    expect(get.headers.get('etag')).toMatch(/^"[0-9a-f]{8}"$/);
    expect(await get.text()).toBe(shellStyles);

    const head = await routeRequest(new Request(`https://demo.wizardgang.ai${assetPath}`, { method: 'HEAD' }), env());
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
  });

  it('keeps only critical shell CSS inline and injects demo CSS only on the demos route', async () => {
    for (const path of publicPaths) {
      const { html, response } = await htmlResponse(path);
      expect(response.status, path).toBe(200);
      expect(html, path).toContain('<style data-critical-shell>');
      expect(html, path).toContain(`<link rel="stylesheet" href="${assetPath}">`);
      expect(response.headers.get('content-security-policy'), path).toContain("style-src 'self' 'unsafe-inline'");
      if (path === demosPath) {
        expect(html).toContain('<style data-demo-styles>');
        expect(html).toContain('.d1-page-header');
      } else {
        expect(html, path).not.toContain('<style data-demo-styles>');
        expect(html, path).not.toContain('.d1-page-header');
      }
    }
  });

  it('records before/after transfer bytes for the controlled record', async () => {
    const shellAssetBytes = bytes(shellStyles);
    const measurements = [] as Array<{
      path: string;
      before: number;
      afterCold: number;
      afterCached: number;
      htmlAfter: number;
      shellAsset: number;
    }>;

    for (const path of publicPaths) {
      const { html } = await htmlResponse(path);
      const htmlAfter = bytes(html);
      const before = bytes(legacyHtml(html, path));
      const measurement = {
        path,
        before,
        afterCold: htmlAfter + shellAssetBytes,
        afterCached: htmlAfter,
        htmlAfter,
        shellAsset: shellAssetBytes,
      };
      measurements.push(measurement);
      expect(measurement.afterCached, path).toBeLessThan(before);
    }

    console.log(`DEMO-279 transfer bytes ${JSON.stringify(measurements)}`);
  });
});
