import { describe, expect, it } from 'vitest';
import { renderAccessibilityDemo } from '../src/demos/accessibility-page';
import { renderI18nDemo } from '../src/demos/i18n-page';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('internationalized interface', () => {
  it('renders Arabic with a matching lang, RTL direction, resources, and locale formats', async () => {
    const response = await renderI18nDemo(new Request('https://demo.example/i18n?locale=ar&count=3'), env);
    const html = await response.text();
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('التدويل في الواجهة');
    expect(html).toContain('src/i18n/locales/ar.json');
    expect(html).toContain('<code>rtl</code>');
  });

  it('falls back to English for unsupported locale input', async () => {
    const html = await (await renderI18nDemo(new Request('https://demo.example/i18n?locale=xx'), env)).text();
    expect(html).toContain('<html lang="en" dir="ltr">');
  });
});

describe('accessible interaction surface', () => {
  it('associates validation help and error text with the labeled control', async () => {
    const html = await renderAccessibilityDemo(new Request('https://demo.example/accessibility?name=A'), env).text();
    expect(html).toContain('class="skip-link"');
    expect(html).toContain('<label for="name">');
    expect(html).toContain('aria-describedby="name-help name-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('<strong>Error:</strong>');
  });

  it('uses an explicit status role for a successful submission', async () => {
    const html = await renderAccessibilityDemo(new Request('https://demo.example/accessibility?name=Ada'), env).text();
    expect(html).toContain('role="status"');
    expect(html).toContain('Hello, Ada');
  });
});
