import { describe, expect, it } from 'vitest';
import { renderAccessibilityDemo } from '../src/demos/accessibility-page';
import { renderD1Demo } from '../src/demos/d1-page';
import { renderI18nDemo } from '../src/demos/i18n-page';
import { renderR2Demo } from '../src/demos/r2-page';
import { styles } from '../src/ui/styles';
import { accessibilityLabResponse } from '../src/ui/accessibility-lab';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
} as Env;

describe('D1 database console', () => {
  it('leads with table navigation and progressively discloses relational CRUD controls', async () => {
    const html = await renderD1Demo(env).text();
    expect(html).toContain('Platform / D1');
    expect(html).toContain('Cloudflare D1 Database');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('Users <span><strong data-count="users">—</strong> / 10');
    expect(html).toContain('Tasks <span><strong data-count="tasks">—</strong> / 25');
    expect(html).toContain('data-form="users" hidden');
    expect(html).toContain('data-form="tasks" hidden');
    expect(html).toContain('demo_tasks.assignee_id');
    expect(html).toContain('SQL Inspector');
    expect(html).toContain('Implementation details');
    expect(html).not.toContain('Platform / /d1');
    expect(html).not.toContain('laboratory');
    expect(html).not.toContain('data-refresh');
  });

  it('surfaces API failures and confirms relational and reset behavior', async () => {
    const html = await renderD1Demo(env).text();
    expect(html).toContain("email_already_exists: 'That email already exists.'");
    expect(html).toContain("user_limit_reached: 'This sandbox has reached its 10-user limit.'");
    expect(html).toContain("task_limit_reached: 'This sandbox has reached its 25-task limit.'");
    expect(html).toContain("' become Unassigned.'");
    expect(html).toContain('data-confirm-dialog');
    expect(html).toContain('Reset sample data?');
    expect(html).not.toContain('catch (_) {}');
  });
});

describe('R2 storage workspace', () => {
  it('leads with the sandbox workflow and progressively discloses technical evidence', async () => {
    const html = await renderR2Demo(env).text();
    expect(html).toContain('Platform / R2');
    expect(html).toContain('Cloudflare R2 Storage');
    expect(html).toContain('Your R2 sandbox');
    expect(html).toContain('Drop a file here');
    expect(html).toContain('data-upload-button disabled');
    expect(html).toContain('data-operation-status');
    expect(html).toContain('View response JSON');
    expect(html).toContain('Implementation details');
    expect(html).not.toContain('Platform / /r2');
    expect(html).not.toContain('Latest R2 operation');
  });

  it('validates uploads and uses inline confirmation with surfaced operation errors', async () => {
    const html = await renderR2Demo(env).text();
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
