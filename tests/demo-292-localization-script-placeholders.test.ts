import { describe, expect, it } from 'vitest';
import { localizePresentation } from '../src/i18n/presentation';
import {
  defaultLocale,
  resolveLocalization,
  supportedLocales,
  type SupportedLocale,
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

function localization(locale: SupportedLocale) {
  const url = new URL('https://demo.wizardgang.ai/demos');
  if (locale !== defaultLocale) url.searchParams.set('lang', locale);
  return resolveLocalization(new Request(url));
}

describe('DEMO-292 localization script placeholder restoration', () => {
  it('keeps technical literals inside scripts protected without leaking placeholders in any locale', () => {
    const technicalLiterals = [
      '<code>ada@example.test</code>',
      '<pre>SELECT * FROM demo_users</pre>',
      '<samp>ok</samp>',
      '<kbd>Enter</kbd>',
      '<bdi>SEC-RISK-001</bdi>',
    ];
    const source = `<p>Request failed</p><script>const fragments = ${JSON.stringify(technicalLiterals)};</script><code>outside technical content</code>`;

    for (const locale of supportedLocales) {
      const localized = localizePresentation(
        'Request failed',
        'Waiting for response…',
        source,
        localization(locale),
      );

      expect(localized.body, locale).not.toContain('@@WG_I18N_BLOCK_');
      for (const literal of technicalLiterals) expect(localized.body, `${locale} ${literal}`).toContain(literal);
      expect(localized.body, locale).toContain('<code>outside technical content</code>');
    }
  });

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
