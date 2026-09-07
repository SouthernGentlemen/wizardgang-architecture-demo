import type { Env } from '../types';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

const behaviors = [
  ['Keyboard navigation', 'Native controls in logical order', 'Click-only control and disrupted order', '2.1.1, 2.4.3'],
  ['Focus visibility', 'Three-pixel visible token outline', 'Focus outline removed', '2.4.7, 2.4.13'],
  ['Focus not obscured', 'Content clears persistent footer', 'Sticky footer hides content', '2.4.11'],
  ['Modal behavior', 'Labeled dialog, focus trap, Escape, return', 'Unlabeled overlay and escaping focus', 'APG dialog, 2.4.3'],
  ['Image alternative', 'Useful bounded alternative text', 'Missing alt attribute', '1.1.1'],
  ['Landmarks and labels', 'Semantic regions and explicit labels', 'Generic containers and unlabeled input', '1.3.1, 3.3.2'],
  ['Target size', 'Controls meet the 24 CSS-pixel minimum', 'Adjacent undersized controls', '2.5.8'],
  ['Contrast', 'AA-oriented foreground/background tokens', 'Known failing low-contrast pair', '1.4.3, 1.4.11'],
  ['Redundant entry', 'Previously supplied email is populated', 'Email must be retyped', '3.3.7'],
  ['Accessible authentication', 'Paste, password manager, and passkey remain available', 'Paste blocked and cognitive puzzle required', '3.3.8; AAA 3.3.9 guidance'],
  ['Dragging', 'Move buttons accompany drag', 'Drag is the only mechanism', '2.5.7'],
  ['Consistent help', 'Help remains in its expected location', 'Help disappears', '3.2.6'],
] as const;

export function renderAccessibilityDemo(request: Request, env: Env): Response {
  const initialMode = new URL(request.url).searchParams.get('mode') === 'broken' ? 'broken' : 'accessible';
  const cards = behaviors.map(([name, accessible, broken, criterion]) => `<article class="criterion-card"><p class="eyebrow">${criterion}</p><h3>${name}</h3><p><strong>Accessible:</strong> ${accessible}</p><p><strong>Broken:</strong> ${broken}</p></article>`).join('');
  return shell(env, 'WCAG 2.2 engineering', `
  <a class="skip-link" href="#accessibility-demo">Skip to interactive demonstration</a>
  <section class="page-header"><div class="eyebrow">Interfaces / Accessibility</div><h1>Accessibility is behavior.</h1><p class="lede">Compare an accessible interaction with deterministic teaching failures, then inspect partial automated evidence and the manual verification matrix.</p><div class="page-tools"><span class="badge">WCAG 2.2 AA demonstration — uncertified</span>${referenceDetails([
    { label: 'Route source', href: sourceUrl(env, 'src/demos/accessibility.ts') },
    { label: 'Lab source', href: sourceUrl(env, 'src/ui/accessibility-lab.ts') },
    { label: 'Manual verification matrix', href: sourceUrl(env, 'docs/ACCESSIBILITY.md') },
    { label: 'Interface tests', href: sourceUrl(env, 'tests/interface.test.ts') },
  ])}</div></section>
  <section class="panel" id="accessibility-demo" aria-labelledby="interaction-heading">
    <div class="lab-heading"><div><p class="eyebrow">Isolated comparison frame</p><h2 id="interaction-heading">Accessible / broken laboratory</h2></div><button type="button" data-a11y-reset>Reset</button></div>
    <p>The surrounding controls always remain accessible. Broken mode is opt-in and contained in a script-and-form-only sandbox.</p>
    <div class="locale-switcher" role="group" aria-label="Demonstration mode"><button type="button" data-a11y-mode="accessible" aria-pressed="${initialMode === 'accessible'}">Accessible</button><button type="button" data-a11y-mode="broken" aria-pressed="${initialMode === 'broken'}">Broken</button></div>
    <p class="error" data-broken-warning${initialMode === 'broken' ? '' : ' hidden'}><strong>Teaching warning:</strong> Broken mode intentionally introduces accessibility failures. Its scan is not a conformance result.</p>
    <div class="accessibility-frame"><iframe title="WCAG accessible and broken behavior comparison" sandbox="allow-scripts allow-forms" srcdoc="<!doctype html><html lang='en'><title>Loading accessibility lab</title><body><p>Loading laboratory…</p></body></html>" data-a11y-frame></iframe></div>
  </section>
  <section class="panel" aria-labelledby="scan-heading"><div class="lab-heading"><div><p class="eyebrow">axe-core / partial coverage</p><h2 id="scan-heading">Automated findings</h2></div><span class="badge" data-scan-state>Loading</span></div>
    <p>Automated checks cover only a subset of accessibility requirements. The checked-in manual matrix remains required.</p>
    <dl class="scan-counts"><dt>Critical</dt><dd data-impact="critical">0</dd><dt>Serious</dt><dd data-impact="serious">0</dd><dt>Moderate</dt><dd data-impact="moderate">0</dd><dt>Minor</dt><dd data-impact="minor">0</dd></dl>
    <p class="subtle" data-scan-meta aria-live="polite">Waiting for the isolated frame.</p><ul data-scan-rules><li>No findings reported yet.</li></ul>
  </section>
  <section aria-labelledby="criteria-heading"><div class="section-head"><h2 id="criteria-heading">Twelve visible behavior comparisons</h2><span>WCAG 2.2 + APG</span></div><div class="criterion-grid">${cards}</div></section>
  <script>
  (()=>{
    const frame=document.querySelector('[data-a11y-frame]');
    const state=document.querySelector('[data-scan-state]');
    const meta=document.querySelector('[data-scan-meta]');
    const rules=document.querySelector('[data-scan-rules]');
    const warning=document.querySelector('[data-broken-warning]');
    let mode=${JSON.stringify(initialMode)};
    const validReport=(data)=>data&&data.type==='wg-accessibility-report'&&data.version===1&&(data.mode==='accessible'||data.mode==='broken')&&Array.isArray(data.rules)&&data.rules.every((rule)=>rule&&typeof rule.id==='string'&&typeof rule.help==='string');
    const load=async(next)=>{
      mode=next;
      state.textContent='Scanning';
      meta.textContent='Loading '+mode+' mode…';
      warning.hidden=mode!=='broken';
      document.querySelectorAll('[data-a11y-mode]').forEach((button)=>button.setAttribute('aria-pressed',String(button.dataset.a11yMode===mode)));
      const url=new URL(location.href);url.searchParams.set('mode',mode);history.replaceState(null,'',url);
      try{const response=await fetch('/__api/accessibility/lab?mode='+mode);if(!response.ok)throw new Error('frame unavailable');frame.srcdoc=await response.text()}catch(error){state.textContent='Unavailable';meta.textContent='Automated scan unavailable.'}
    };
    window.addEventListener('message',(event)=>{
      if(event.source!==frame.contentWindow||!validReport(event.data)||event.data.mode!==mode)return;
      const counts={critical:0,serious:0,moderate:0,minor:0};
      event.data.rules.forEach((rule)=>{if(Object.hasOwn(counts,rule.impact))counts[rule.impact]+=1});
      Object.entries(counts).forEach(([impact,count])=>{document.querySelector('[data-impact="'+impact+'"]').textContent=String(count)});
      rules.innerHTML='';
      if(event.data.rules.length===0){const item=document.createElement('li');item.textContent='No axe violations reported in this frame.';rules.append(item)}
      else event.data.rules.forEach((rule)=>{const item=document.createElement('li');const code=document.createElement('code');code.textContent=rule.id;item.append(code,document.createTextNode(' — '+rule.help));rules.append(item)});
      state.textContent=mode==='accessible'?'Accessible scan':'Teaching scan';
      meta.textContent='Scanned '+mode+' mode in '+event.data.durationMs+' ms. Partial automated coverage; manual verification still required.';
    });
    document.querySelectorAll('[data-a11y-mode]').forEach((button)=>button.addEventListener('click',()=>load(button.dataset.a11yMode)));
    document.querySelector('[data-a11y-reset]').addEventListener('click',()=>{load('accessible');document.querySelector('[data-a11y-mode="accessible"]').focus()});
    load(mode);
  })();
  </script>`, { cacheControl: 'no-store', activeRoute: '/interfaces' });
}
