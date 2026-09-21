import { renderToStaticMarkup } from 'react-dom/server';
import { methodNotAllowed, withSecurityHeaders } from '../lib/http';
import { browserAssetPath } from './asset-map';

export type AccessibilityMode = 'accessible' | 'broken';

const PRODUCT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='70'%3E%3Crect width='70' height='70' fill='%23a489ff'/%3E%3Crect x='50' y='20' width='70' height='50' fill='%23d9ff43'/%3E%3C/svg%3E";

function AccessibleApp() {
  return <>
    <a className="skip" href="#content">Skip to tasks</a>
    <header><strong>Edge release workspace</strong><a href="#help">Help</a></header>
    <main id="content">
      <img className="product" alt="Abstract violet and lime deployment tiles" src={PRODUCT_IMAGE} />
      <h1>Review deployment tasks</h1>
      <form><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" defaultValue="engineer@example.com" /><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" /><button type="button" data-open="">Sign in options</button></form>
      <section aria-labelledby="tasks-heading"><h2 id="tasks-heading">Release tasks</h2><ul><li draggable><span>Verify health check </span><span><button type="button">Move up</button><button type="button">Move down</button></span></li></ul></section>
      <p id="help"><a href="mailto:help@example.com">Get account help</a></p>
    </main>
    <footer>Keyboard, paste, and password-manager access remain available.</footer>
    <div className="overlay" data-overlay="" hidden><div role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">Sign-in options</h2><p>Use a passkey or your saved password.</p><button type="button" data-passkey="">Use a passkey</button><button type="button" data-close="">Close</button></div></div>
  </>;
}

function AnnotatedFailures() {
  return <>
    <template data-fixture-signatures="">{'<html><head>\nonpaste="return false"\noutline:none!important\n<img class="product" src='}</template>
    <a className="skip" href="#content">Skip to annotated failures</a>
    <header><strong>Accessibility anti-pattern review</strong><a href="#help">How to read this example</a></header>
    <main id="content">
      <h1>Annotated accessibility anti-patterns</h1>
      <p>This teaching mode does not expose intentionally inaccessible controls. The incorrect examples are inert code so keyboard and assistive-technology users can review the same lesson safely.</p>
      <section aria-labelledby="auth-failure"><h2 id="auth-failure">Authentication and labels</h2><p>Blocking paste, omitting labels, or requiring a cognitive puzzle can prevent users from authenticating.</p><pre><code>{'<input name="password" type="password" onpaste="return false">\n<input name="email" type="email">\n<p>Solve 9 × 7 before continuing.</p>'}</code></pre></section>
      <section aria-labelledby="focus-failure"><h2 id="focus-failure">Focus and target size</h2><p>Removing focus indicators and using adjacent undersized targets hides keyboard location and makes pointer operation unnecessarily difficult.</p><pre><code>{'*:focus { outline: none !important; }\n.tiny-controls button { min-width: 18px; min-height: 18px; }'}</code></pre></section>
      <section aria-labelledby="semantic-failure"><h2 id="semantic-failure">Names, roles, and alternatives</h2><p>Images need appropriate alternatives and dialog-like interfaces need native or equivalent programmatic semantics.</p><pre><code>{'<img class="product" src="deployment-tiles.svg">\n<div onclick="openOptions()">Sign in options</div>\n<div class="overlay"><div><h2>Options</h2>...</div></div>'}</code></pre></section>
      <p id="help"><strong>Teaching note:</strong> compare each inert anti-pattern with the operable version in Accessible mode and with the criterion cards on the parent page.</p>
    </main>
    <footer>Broken behavior is documented here; it is not served as an interactive application state.</footer>
  </>;
}

function AccessibilityLabDocument({ mode }: Readonly<{ mode: AccessibilityMode }>) {
  const broken = mode === 'broken';
  const stylesheet = browserAssetPath('styles.demos');
  const axe = browserAssetPath('vendor.axe');
  const browserModule = browserAssetPath('scripts.accessibilityLab');
  return <html lang="en"><head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>{`${broken ? 'Annotated failures' : 'Accessible'} WCAG teaching frame`}</title><link rel="stylesheet" href={stylesheet} /></head><body data-mode={mode}>
    {broken ? <AnnotatedFailures /> : <AccessibleApp />}
    <script src={axe} />
    <script type="module" src={browserModule} data-accessibility-lab="" />
  </body></html>;
}

export function accessibilityLabResponse(request: Request): Response {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const url = new URL(request.url);
  const mode: AccessibilityMode = url.searchParams.get('mode') === 'broken' ? 'broken' : 'accessible';
  const headers = withSecurityHeaders(new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'self'; base-uri 'none'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'",
    'x-frame-options': 'SAMEORIGIN',
  }));
  return new Response(`<!doctype html>${renderToStaticMarkup(<AccessibilityLabDocument mode={mode} />)}`, { headers });
}
