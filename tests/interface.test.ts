import { describe, expect, it } from 'vitest';
import { renderAccessibilityDemo } from '../src/demos/accessibility-page';
import { renderI18nDemo } from '../src/demos/i18n-page';
import { styles } from '../src/ui/styles';
import { accessibilityLabResponse } from '../src/ui/accessibility-lab';
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
    expect(html).toContain('<code data-direction>rtl</code>');
  });

  it('falls back to English for unsupported locale input', async () => {
    const html = await (await renderI18nDemo(new Request('https://demo.example/i18n?locale=xx'), env)).text();
    expect(html).toContain('<html lang="en" dir="ltr">');
  });

  it('ships six synchronized instant-switch resources and an inspector', async () => {
    const html = await (await renderI18nDemo(new Request('https://demo.example/i18n?locale=ja&count=7'), env)).text();
    expect(html).toContain('<html lang="ja" dir="ltr">');
    expect(html).toContain('data-locale="fr"');
    expect(html).toContain('data-locale="de"');
    expect(html).toContain('data-locale="ja" aria-pressed="true"');
    expect(html).toContain('Translation inspector');
    expect(html).toContain('history.replaceState');
    expect(html).toContain('items_other');
  });
});

describe('accessible interaction surface', () => {
  it('keeps parent controls accessible and isolates opt-in broken content', async () => {
    const html = await renderAccessibilityDemo(new Request('https://demo.example/accessibility'), env).text();
    expect(html).toContain('class="skip-link"');
    expect(html).toContain('sandbox="allow-scripts allow-forms"');
    expect(html).toContain('data-a11y-mode="accessible" aria-pressed="true"');
    expect(html).toContain('data-broken-warning hidden');
    expect(html.match(/class="criterion-card"/g)).toHaveLength(12);
    expect(html).toContain('axe-core / partial coverage');
  });

  it('ships deterministic accessible and broken frame variants with local axe execution', async () => {
    const accessible = await accessibilityLabResponse(new Request('https://demo.example/__api/accessibility/lab?mode=accessible')).text();
    expect(accessible).toContain('<html lang="en">');
    expect(accessible).toContain('<label for="email">');
    expect(accessible).toContain('role="dialog" aria-modal="true"');
    expect(accessible).toContain("axe.run(document");
    expect(accessible).toContain("type:'wg-accessibility-report'");

    const broken = await accessibilityLabResponse(new Request('https://demo.example/__api/accessibility/lab?mode=broken')).text();
    expect(broken).toContain('<html><head>');
    expect(broken).toContain('onpaste="return false"');
    expect(broken).toContain('outline:none!important');
    expect(broken).toContain('<img class="product" src=');
  });
});

describe('right-to-left layout safety', () => {
  it('never parks off-screen affordances on the inline axis', () => {
    // A large negative left/right offset extends the document's scrollable width.
    // Under dir="rtl" the scroll origin sits at the opposite edge, so the reader
    // lands on that empty canvas and the page looks blank. Hide vertically instead.
    expect(styles).not.toMatch(/\b(left|right)\s*:\s*-\d{3,}px/);
  });

  it('defines both themes from the same token set', () => {
    expect(styles).toContain(':root[data-theme="light"]');
    for (const token of ['--ink', '--paper', '--acid', '--violet', '--line', '--focus']) {
      expect(styles.match(new RegExp(`${token}:`, 'g'))?.length, token).toBeGreaterThanOrEqual(2);
    }
  });
});
