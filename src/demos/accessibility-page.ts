import type { Env } from '../types';
import { sourceUrl } from '../lib/github';
import { escapeHtml } from '../lib/html';
import { routeUrl } from '../routing/application-routes';
import { referenceDetails, pageContent, type PageContent } from '../ui/page';

interface BehaviorComparison {
  criterion: string;
  name: string;
  working: string;
  failure: string;
  fixture: string;
  verification: string;
}

const behaviors: readonly BehaviorComparison[] = [
  { criterion: '2.1.1 · 2.4.3', name: 'Keyboard navigation', working: 'Use Tab and Shift+Tab through native controls in a logical order.', failure: 'A pointer-only control excludes keyboard operation.', fixture: '<div onclick="submitRelease()">Submit</div>', verification: 'Keyboard walkthrough plus semantic-control inspection.' },
  { criterion: '2.4.7 · 2.4.13', name: 'Focus visibility', working: 'Every control displays the shared three-pixel focus indicator.', failure: 'Removing the outline hides the current keyboard position.', fixture: '*:focus { outline: none !important; }', verification: 'Manual keyboard check; CSS inspection supports but cannot replace it.' },
  { criterion: '2.4.11', name: 'Focus not obscured', working: 'Focused content remains clear of the persistent footer.', failure: 'A fixed overlay can cover the focused control.', fixture: 'footer { position: fixed; bottom: 0; }\n/* no content clearance */', verification: 'Manual focus traversal at representative viewport sizes.' },
  { criterion: 'APG dialog · 2.4.3', name: 'Modal behavior', working: 'Open Sign in options, use Tab and Escape, and confirm focus returns.', failure: 'An unlabeled overlay has no modal semantics or focus management.', fixture: '<div class="overlay"><h2>Options</h2>...</div>', verification: 'Keyboard interaction plus role, name, and aria-modal inspection.' },
  { criterion: '1.1.1', name: 'Image alternative', working: 'The deployment illustration has a concise bounded alternative.', failure: 'Omitting alt leaves the image without a programmatic alternative.', fixture: '<img src="deployment-tiles.svg">', verification: 'DOM inspection plus judgment that the alternative fits the context.' },
  { criterion: '1.3.1 · 3.3.2', name: 'Landmarks and labels', working: 'Regions are semantic and every input has an associated label.', failure: 'Generic containers and placeholder-only inputs lose structure.', fixture: '<div class="main"><input placeholder="Email"></div>', verification: 'Automated name/role checks plus screen-reader structure review.' },
  { criterion: '2.5.5 · 2.5.8', name: 'Target size', working: 'Interactive targets meet the shared 44 by 44 CSS-pixel baseline.', failure: 'Adjacent undersized buttons are difficult to operate accurately.', fixture: '.tiny button { width: 18px; height: 18px; }', verification: 'Computed-size inspection at desktop and mobile widths.' },
  { criterion: '1.4.3 · 1.4.6 · 1.4.11', name: 'Contrast', working: 'Text and non-text states use the tested light and dark palette.', failure: 'A low-contrast foreground can make instructions unreadable.', fixture: '.hint { color: #aaa; background: #fff; }', verification: 'Contrast calculation plus manual inspection of non-text states.' },
  { criterion: '3.3.7', name: 'Redundant entry', working: 'The previously supplied email remains populated.', failure: 'Requiring the same information again creates avoidable work.', fixture: '<input name="email" value=""> <!-- repeated step -->', verification: 'Complete the flow and confirm previously entered data persists.' },
  { criterion: '3.3.8 · 3.3.9', name: 'Accessible authentication', working: 'Paste, password managers, saved passwords, and passkeys remain available.', failure: 'Paste blocking or a cognitive puzzle can prevent authentication.', fixture: '<input type="password" onpaste="return false">\n<p>Solve 9 × 7 to continue.</p>', verification: 'Manual paste/password-manager check; automation cannot prove usability.' },
  { criterion: '2.5.7', name: 'Dragging alternatives', working: 'Move up and Move down buttons accompany the draggable task.', failure: 'A drag-only interaction has no single-pointer alternative.', fixture: '<li draggable="true">Verify health check</li>', verification: 'Operate the equivalent action without a dragging gesture.' },
  { criterion: '3.2.6', name: 'Consistent help', working: 'Account help remains in the same predictable location.', failure: 'Removing or moving help between steps makes it harder to find.', fixture: '<!-- help link omitted from this step -->', verification: 'Manual comparison across the representative workflow.' },
] as const;

function comparisonRows(): string {
  return behaviors.map((behavior) => `<tr>
    <th scope="row"><span>${escapeHtml(behavior.criterion)}</span><strong>${escapeHtml(behavior.name)}</strong></th>
    <td>${escapeHtml(behavior.working)}</td>
    <td><p>${escapeHtml(behavior.failure)}</p><pre><code>${escapeHtml(behavior.fixture)}</code></pre></td>
    <td>${escapeHtml(behavior.verification)}</td>
  </tr>`).join('');
}

export function accessibilityContent(_request: Request, env: Env): PageContent {
  const accessibilityUrl = `${routeUrl('demos.index')}#accessibility`;
  return pageContent(env, 'WCAG 2.2 engineering', `
  <section class="page-header"><h1>Accessibility is behavior.</h1><p class="lede">Operate the accessible example, then compare each behavior with an inert failure fixture and an honest verification boundary.</p><div class="page-tools"><span class="badge">WCAG 2.2 engineering evidence — no conformance claim · AAA engineering target</span>${referenceDetails([
    { label: 'Route source', href: sourceUrl(env, 'src/demos/accessibility.ts') },
    { label: 'Lab source', href: sourceUrl(env, 'src/ui/accessibility-lab.ts') },
    { label: 'Global shell source', href: sourceUrl(env, 'src/ui/page.ts') },
    { label: 'Manual verification matrix', href: sourceUrl(env, 'docs/ACCESSIBILITY.md') },
    { label: 'Interface tests', href: sourceUrl(env, 'tests/interface.test.ts') },
  ])}</div></section>
  <section class="panel" id="accessibility-demo" aria-labelledby="interaction-heading">
    <div class="lab-heading"><div><p class="eyebrow">Accessible behavior</p><h2 id="interaction-heading">Operate the working interaction</h2></div><span class="badge">Safe live example</span></div>
    <p>Use the keyboard, open the sign-in dialog, inspect the labeled fields, and try the non-drag task controls. Intentionally inaccessible controls are never exposed as an interactive application state.</p>
    <div class="accessibility-frame"><iframe title="Accessible release workflow demonstration" sandbox="allow-scripts allow-forms" srcdoc="<!doctype html><html lang='en'><title>Loading accessibility lab</title><body><p>Loading accessible behavior…</p></body></html>" data-a11y-frame></iframe></div>
  </section>
  <section class="panel" aria-labelledby="scan-heading"><div class="lab-heading"><div><p class="eyebrow">axe-core / partial coverage</p><h2 id="scan-heading">Automated check of accessible behavior</h2></div><span class="badge" data-scan-state>Waiting</span></div>
    <p>axe checks only the live accessible interaction above. The failure fixtures below are inert teaching material and are not represented as passing automated tests.</p>
    <dl class="scan-counts"><dt>Critical</dt><dd data-impact="critical">0</dd><dt>Serious</dt><dd data-impact="serious">0</dd><dt>Moderate</dt><dd data-impact="moderate">0</dd><dt>Minor</dt><dd data-impact="minor">0</dd></dl>
    <p class="subtle" data-scan-meta aria-live="polite">Waiting for the isolated accessible frame.</p><ul data-scan-rules><li>No scan result yet.</li></ul>
  </section>
  <section aria-labelledby="criteria-heading"><div class="section-head"><h2 id="criteria-heading">Failure analysis</h2><span>12 criteria · WCAG 2.2 + APG</span></div><p class="lede">Each fixture is escaped code, not a live broken control. Verification combines automation with the manual checks that automation cannot perform.</p><div class="table-wrap criterion-matrix-wrap" tabindex="0" aria-label="Accessibility behavior and failure analysis"><table class="criterion-matrix"><thead><tr><th scope="col">Criterion</th><th scope="col">Working behavior</th><th scope="col">Failure fixture</th><th scope="col">How we verify it</th></tr></thead><tbody>${comparisonRows()}</tbody></table></div></section>
  <script>
  (()=>{
    const frame=document.querySelector('[data-a11y-frame]');
    const state=document.querySelector('[data-scan-state]');
    const meta=document.querySelector('[data-scan-meta]');
    const rules=document.querySelector('[data-scan-rules]');
    const validReport=(data)=>data&&data.type==='wg-accessibility-report'&&data.version===1&&data.mode==='accessible'&&Array.isArray(data.rules)&&data.rules.every((rule)=>rule&&typeof rule.id==='string'&&typeof rule.help==='string');
    window.addEventListener('message',(event)=>{
      if(event.source!==frame.contentWindow||!validReport(event.data))return;
      const counts={critical:0,serious:0,moderate:0,minor:0};
      event.data.rules.forEach((rule)=>{if(Object.hasOwn(counts,rule.impact))counts[rule.impact]+=1});
      Object.entries(counts).forEach(([impact,count])=>{document.querySelector('[data-impact="'+impact+'"]').textContent=String(count)});
      rules.innerHTML='';
      if(event.data.rules.length===0){const item=document.createElement('li');item.textContent='No axe violations were reported in the live accessible behavior. The inert failure fixtures were not scanned.';rules.append(item)}
      else event.data.rules.forEach((rule)=>{const item=document.createElement('li');const code=document.createElement('code');code.textContent=rule.id;item.append(code,document.createTextNode(' — '+rule.help));rules.append(item)});
      state.textContent=event.data.rules.length?'Review findings':'No automated findings';
      meta.textContent='Scanned the accessible behavior in '+event.data.durationMs+' ms. Partial automated coverage; manual verification remains required.';
    });
    const load=async()=>{
      state.textContent='Scanning';
      meta.textContent='Loading the accessible behavior…';
      try{const response=await fetch('/api/labs/accessibility?mode=accessible');if(!response.ok)throw new Error('frame unavailable');frame.srcdoc=await response.text()}catch{state.textContent='Unavailable';meta.textContent='The accessible behavior and automated scan are unavailable.'}
    };
    load();
  })();
  </script>`, { cacheControl: 'no-store', canonicalPath: accessibilityUrl });
}
