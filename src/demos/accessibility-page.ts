import type { Env } from '../types';
import { escapeHtml } from '../lib/html';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

export function renderAccessibilityDemo(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const submitted = url.searchParams.has('name');
  const name = (url.searchParams.get('name') || '').trim().slice(0, 80);
  const error = submitted && name.length < 2 ? 'Enter at least two characters.' : '';
  return shell(env, 'WCAG 2.2 engineering', `
  <a class="skip-link" href="#accessibility-demo">Skip to interactive demonstration</a>
  <section class="page-header"><div class="eyebrow">Standards / /accessibility</div><h1>Accessibility is behavior.</h1><p class="lede">Semantic structure, keyboard-visible controls, understandable validation, responsive reflow, and native disclosure.</p><div class="page-tools"><span class="badge">WCAG 2.2 aligned — uncertified</span>${referenceDetails([
    { label: 'Route source', href: sourceUrl(env, 'src/demos/accessibility.ts') },
    { label: 'Page source', href: sourceUrl(env, 'src/demos/accessibility-page.ts') },
    { label: 'Accessibility checklist', href: sourceUrl(env, 'docs/ACCESSIBILITY.md') },
    { label: 'Interface tests', href: sourceUrl(env, 'tests/interface.test.ts') },
  ])}</div></section>
  <section class="panel" id="accessibility-demo" aria-labelledby="interaction-heading"><h2 id="interaction-heading">Keyboard and form demonstration</h2>
    <form method="get" novalidate><label for="name"><strong>Display name</strong></label><p id="name-help" class="subtle">Enter at least two characters. No value is stored.</p><input id="name" name="name" value="${escapeHtml(name)}" aria-describedby="name-help${error ? ' name-error' : ''}"${error ? ' aria-invalid="true"' : ''} required minlength="2">${error ? `<p id="name-error" class="error"><strong>Error:</strong> ${escapeHtml(error)}</p>` : ''}<p><button type="submit">Validate name</button></p></form>
    ${submitted && !error ? `<p role="status" tabindex="-1"><strong>Success:</strong> Hello, ${escapeHtml(name)}. This server-rendered status does not depend on color alone.</p>` : ''}
    <details><summary>Inspect the native disclosure</summary><p>The browser supplies keyboard and assistive-technology behavior for this native <code>details</code> element.</p></details>
  </section>`, { cacheControl: 'no-store' });
}
