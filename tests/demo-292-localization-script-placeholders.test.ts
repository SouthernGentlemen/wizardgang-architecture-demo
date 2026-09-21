import { describe, expect, it } from 'vitest';
import {
  defaultLocale,
  supportedLocales,
} from '../src/i18n/runtime';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class PlaceholderStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}

  bind() {
    return this;
  }

  async run() {
    return { meta: { last_row_id: 1, changes: 0 } };
  }

  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return {
        results: [{
          state: 'online',
          public_message: 'Available.',
          updated_at: '2026-09-17T12:00:00.000Z',
          updated_by: 'test',
        }] as T[],
      };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return {
        results: [{
          state: 'enabled',
          updated_at: '2026-09-17T12:00:00.000Z',
          updated_by: 'test',
        }] as T[],
      };
    }
    return { results: [] as T[] };
  }
}

class PlaceholderD1 {
  prepare(sql: string) {
    return new PlaceholderStatement(sql);
  }
}

function environment(): Env {
  return {
    DEMO_DB: new PlaceholderD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

describe('DEMO-292 localization script placeholder restoration', () => {
  it('returns the D1 presentation fragment without localization placeholder tokens in any locale', async () => {
    for (const locale of supportedLocales) {
      const url = new URL('https://demo.wizardgang.ai/api/demos/d1');
      if (locale !== defaultLocale) url.searchParams.set('lang', locale);

      const response = await routeRequest(new Request(url), environment());
      expect(response.status, locale).toBe(200);
      const body = await response.text();

      expect(body, locale).not.toContain('@@WG_I18N_BLOCK_');
    }
  });
});
