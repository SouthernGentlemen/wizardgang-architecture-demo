import { describe, expect, it } from 'vitest';
import { accessibilityContent } from '../src/demos/accessibility-page';
import { complianceContent } from '../src/demos/compliance-page';
import { d1Content } from '../src/demos/d1-page';
import { i18nContent } from '../src/demos/i18n-page';
import { r2Content } from '../src/demos/r2-page';
import {
  bindLocalization,
  localeNormalizationRedirect,
  resolveLocalization,
} from '../src/i18n/runtime';
import { routeUrl } from '../src/routing/application-routes';
import { navigationStyles } from '../src/ui/navigation-styles';
import { renderPage } from '../src/ui/page';
import { runtimeStyles } from '../src/ui/runtime-styles';
import { styles } from '../src/ui/styles';
import { accessibilityLabResponse } from '../src/ui/accessibility-lab';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

function localized(url: string, headers: HeadersInit = {}): { request: Request; env: Env } {
  const request = new Request(url, { headers });
  return { request, env: bindLocalization(env, resolveLocalization(request)) };
}

describe('D1 database console', () => {
  it('leads with table navigation and progressively discloses relational CRUD controls', async () => {
    const html = await renderPage(env, { ...d1Content(env), routeId: 'platform.d1' }).text();
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('<a href="/platform">Platform</a>');
    expect(html).toContain('<li aria-current="page">D1</li>');
    expect(html).toContain('Cloudflare D1 Database');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('Users <span><strong data-count="users">—</strong> / 10');
    expect(html).toContain('Tasks <span><strong data-count="tasks">—</strong> / 25');
    expect(html).toContain('data-form="users" hidden');
    expect(html).toContain('data-form="tasks" hidden');
    expect(html).toContain('SQL Inspector');
    expect(html).not.toContain('Tasks belong to users');
    expect(html).not.toContain('Query these users with GraphQL');
    expect(html).not.toContain('Parameters');
    expect(html).not.toContain('sessionId');
    expect(html).not.toContain('DEMO_DB');
    expect(html).not.toContain('d1-inspector-footer');
    expect(html).not.toContain('Implementation details');
    expect(html).not.toContain('Platform / /d1');
    expect(html).not.toContain('laboratory');
    expect(html).not.toContain('data-refresh');
  });

  it('surfaces API failures and confirms relational and reset behavior', async () => {
    const html = await renderPage(env, d1Content(env)).text();
    expect(html).toContain("email_already_exists: 'That email already exists.'");
    expect(html).toContain("user_limit_reached: 'This sandbox has reached its 10-user limit.'");
    expect(html).toContain("task_limit_reached: 'This sandbox has reached its 25-task limit.'");
    expect(html).toContain("' become Unassigned.'");
    expect(html).toContain('data-confirm-dialog');
    expect(html).toContain('Reset sample data?');
    expect(html).toContain('const confirmButton = event.currentTarget;');
    expect(html).not.toContain('event.currentTarget.disabled');
    expect(html).not.toContain('catch (_) {}');
  });
});

describe('R2 storage workspace', () => {
  it('leads with the sandbox workflow and progressively discloses technical evidence', async () => {
    const html = await renderPage(env, { ...r2Content(env), routeId: 'platform.r2' }).text();
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('<a href="/platform">Platform</a>');
    expect(html).toContain('<li aria-current="page">R2</li>');
    expect(html).toContain('Cloudflare R2 Storage');
    expect(html).toContain('Your R2 sandbox');
    expect(html).toContain('Drop a file here');
    expect(html).toContain('data-upload-button disabled');
    expect(html).toContain('data-operation-status');
    expect(html).toContain('View response JSON');
    expect(html).not.toContain('Storage details');
    expect(html).not.toContain('DEMO_R2');
    expect(html).not.toContain('wizardgang-demo-r2');
    expect(html).not.toContain('2 visible');
    expect(html).not.toContain('How this works');
    expect(html).not.toContain('One request, two stores');
    expect(html).not.toContain('data-count');
    expect(html).toContain('data-download-id');
    expect(html).toContain('file-preview-text');
    expect(html).toContain('file-preview-image');
    expect(html).not.toContain('Implementation details');
    expect(html).not.toContain('Platform / /r2');
    expect(html).not.toContain('Latest R2 operation');
  });

  it('validates uploads and uses inline confirmation with surfaced operation errors', async () => {
    const html = await renderPage(env, r2Content(env)).text();
    expect(html).toContain("state.selectedFile.size > MAX_FILE_BYTES");
    expect(html).toContain('File exceeds the 5 MiB limit.');
    expect(html).toContain('data-confirm-delete');
    expect(html).toContain('data-confirm-reset');
    expect(html).toContain('Upload failed — try again.');
    expect(html).not.toContain("confirm('Delete this R2 object?')");
    expect(html).not.toContain('catch (_) {}');
  });
});

describe('internationalized interface', () => {
  it('renders Arabic from the shared application context with matching lang and RTL direction', async () => {
    const context = localized('https://demo.example/interfaces/i18n?lang=ar&count=3');
    const response = renderPage(context.env, i18nContent(context.request, context.env));
    const html = await response.text();
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('التدويل في الواجهة');
    expect(html).toContain('src/i18n/locales/ar.json');
    expect(html).toContain('<code data-direction>rtl</code>');
    expect(html).toContain('src/i18n/runtime.ts');
    expect(html).toContain('انتقل إلى المحتوى الرئيسي');
  });

  it('falls back to English and normalizes unsupported locale input without losing other state', () => {
    const request = new Request('https://demo.example/interfaces/i18n?lang=xx&count=7');
    expect(resolveLocalization(request).locale).toBe('en');
    expect(localeNormalizationRedirect(request)).toBe('https://demo.example/interfaces/i18n?count=7');
  });

  it('keeps six synchronized resources while language changes use ordinary server navigation', async () => {
    const context = localized('https://demo.example/interfaces/i18n?lang=ja&count=7');
    const html = await renderPage(context.env, i18nContent(context.request, context.env)).text();
    expect(html).toContain('<html lang="ja" dir="ltr">');
    expect(html).toContain('href="/interfaces/i18n?count=7&amp;lang=fr"');
    expect(html).toContain('href="/interfaces/i18n?count=7&amp;lang=de"');
    expect(html).toContain('aria-current="page">日本語</a>');
    expect(html).toContain('グローバルコンテキスト検査');
    expect(html).toContain('items_other');
    expect(html).not.toContain('history.replaceState');
  });
});

describe('global localization and accessibility runtime', () => {
  it('makes the ordinary application shell English and accessible by default', async () => {
    const html = await renderPage(env, { ...d1Content(env), routeId: 'platform.d1' }).text();
    expect(html).toContain('<html lang="en" dir="ltr">');
    expect(html).toContain('<a class="skip-link" href="#main">Skip to main content</a>');
    expect(html).toContain('<main class="site-main" id="main">');
    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain('class="language-selector"');
    expect(html).toContain('id="global-language" name="lang"');
    expect(html).toContain('data-theme-toggle aria-label="Switch to Light theme" aria-pressed="true">Theme: Dark</button>');
    expect(html).toContain('aria-current="page" data-route-current');
  });

  it('localizes shell-owned strings and preserves unrelated state on an ordinary RTL page', async () => {
    const context = localized('https://demo.example/platform/d1?lang=ar&filter=recent');
    const html = await renderPage(context.env, { ...d1Content(context.env), routeId: 'platform.d1' }).text();
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('aria-label="التنقل الرئيسي"');
    expect(html).toContain('>المنصة</a>');
    expect(html).toContain('انتقل إلى المحتوى الرئيسي');
    expect(html).toContain('name="filter" value="recent"');
    expect(html).toContain('<option value="ar" selected>العربية</option>');
    expect(html).toContain('data-theme-toggle aria-label="التبديل إلى السمة فاتح" aria-pressed="true">السمة: داكن</button>');
    expect(html).toContain('href="/platform?lang=ar"');
  });

  it('uses explicit query, persisted preference, then configured default with clean default URLs', () => {
    const explicit = resolveLocalization(new Request('https://demo.example/operations?lang=ar'));
    expect(explicit.locale).toBe('ar');
    const complianceRoute = routeUrl('assurance.compliance');
    expect(explicit.href(`${complianceRoute}?framework=wcag-2.2`)).toBe(`${complianceRoute}?framework=wcag-2.2&lang=ar`);

    const persisted = resolveLocalization(new Request('https://demo.example/operations', {
      headers: { cookie: 'other=value; wg-lang=ja' },
    }));
    expect(persisted.locale).toBe('ja');

    const defaultRequest = new Request('https://demo.example/operations?lang=en&window=24h');
    expect(resolveLocalization(defaultRequest).locale).toBe('en');
    expect(localeNormalizationRedirect(defaultRequest)).toBe('https://demo.example/operations?window=24h');
  });

  it('ships reduced-motion, forced-colors, and logical-direction shared CSS', () => {
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(runtimeStyles).toContain('@media (forced-colors: active)');
    expect(runtimeStyles).toContain('scroll-behavior: auto !important');
    expect(navigationStyles).toContain('padding-inline-start');
    expect(navigationStyles).toContain('border-inline-start');
    expect(navigationStyles).not.toContain('padding-left');
    expect(navigationStyles).not.toContain('border-left');
  });
});

describe('accessible interaction surface', () => {
  it('keeps parent controls accessible and isolates opt-in broken content', async () => {
    const html = await renderPage(env, accessibilityContent(new Request('https://demo.example/accessibility'), env)).text();
    expect(html).toContain('class="skip-link"');
    expect(html).toContain('sandbox="allow-scripts allow-forms"');
    expect(html).toContain('data-a11y-mode="accessible" aria-pressed="true"');
    expect(html).toContain('data-broken-warning hidden');
    expect(html.match(/class="criterion-card"/g)).toHaveLength(12);
    expect(html).toContain('axe-core / partial coverage');
    expect(html).toContain('WCAG 2.2 engineering evidence — no conformance claim');
  });

  it('ships deterministic accessible and broken frame variants with local axe execution', async () => {
    const accessible = await accessibilityLabResponse(new Request('https://demo.example/api/labs/accessibility?mode=accessible')).text();
    expect(accessible).toContain('<html lang="en">');
    expect(accessible).toContain('<label for="email">');
    expect(accessible).toContain('role="dialog" aria-modal="true"');
    expect(accessible).toContain("axe.run(document");
    expect(accessible).toContain("type:'wg-accessibility-report'");

    const broken = await accessibilityLabResponse(new Request('https://demo.example/api/labs/accessibility?mode=broken')).text();
    expect(broken).toContain('<html><head>');
    expect(broken).toContain('onpaste="return false"');
    expect(broken).toContain('outline:none!important');
    expect(broken).toContain('<img class="product" src=');
  });
});

describe('compliance assurance index', () => {
  it('renders the canonical registry with accessible filters, stable anchors, and descriptive evidence links', async () => {
    const html = await renderPage(env, complianceContent(new Request('https://demo.example/assurance/compliance'), env)).text();
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('aria-labelledby="framework-heading"');
    expect(html).toContain('aria-labelledby="attention-heading"');
    expect(html).toContain('Choose a framework to inspect');
    expect(html.match(/class="assurance-posture-card"/g)?.length).toBeGreaterThanOrEqual(3);
    for (const framework of ['iso-27001', 'iso-42001', 'wcag-2.2']) {
      expect(html).toContain(`href="/assurance/compliance?framework=${framework}"`);
    }
    expect(html).not.toContain('<table');
    expect(html).not.toContain('Compliance records');
    expect(html).not.toMatch(/>\s*(?:COMPLIANT|CERTIFIED)\s*</i);
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
