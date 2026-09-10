export const runtimeStyles = `
:root {
  --violet: #a98fff;
}
:root[data-theme="light"] {
  --cyan: #005a6d;
}

html {
  scroll-padding-block-start: 5rem;
}

.language-selector {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  min-height: 44px;
}
.language-selector label {
  color: var(--muted);
  font: 800 .65rem/1 var(--mono);
  letter-spacing: .06em;
  text-transform: uppercase;
}
.language-selector select,
.language-selector button {
  min-height: 44px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--paper);
  font: 750 .7rem/1 var(--mono);
}
.language-selector select { max-width: 9rem; padding: .35rem .45rem; }
.language-selector button { padding: .35rem .55rem; cursor: pointer; }
.language-selector button:hover { border-color: var(--paper); }

:where(button, input:not([type="checkbox"]):not([type="radio"]), select, textarea, summary, [role="button"], [role="tab"], a.button, .button) {
  min-block-size: 44px !important;
}
:where(button, [role="button"], [role="tab"], a.button, .button) {
  min-inline-size: 44px;
}
:where(label:has(input[type="checkbox"]), label:has(input[type="radio"])) {
  display: inline-flex;
  align-items: center;
  min-block-size: 44px;
}
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 3px solid var(--focus, #ffd84d);
  outline-offset: 3px;
  scroll-margin-block: 5rem;
}

.site-main { min-inline-size: 0; }
.site-main :where(p, li, dd) { max-inline-size: 80ch; }
:where(.table-wrap, .compliance-table-wrap, .openapi-model) {
  max-inline-size: 100%;
  overflow-x: auto;
}
:where(pre, code, samp, kbd, bdi, [data-canonical-source]) {
  direction: ltr;
  unicode-bidi: isolate;
  overflow-wrap: anywhere;
}
:where(svg, img, video, canvas) { max-inline-size: 100%; }
[data-canonical-source] { text-align: start; }

html[dir='rtl'] .brand-mark { box-shadow: -.5rem -.5rem 0 var(--violet); }
html[dir='rtl'] .breadcrumb ol,
html[dir='rtl'] .secondary-navigation-list,
html[dir='rtl'] .related-navigation-list,
html[dir='rtl'] .nav { direction: rtl; }

@media (max-width: 760px) {
  .language-selector { flex: 1 1 100%; justify-content: flex-start; }
}

@media (max-width: 620px) {
  .language-selector { align-items: stretch; flex-wrap: wrap; }
  .language-selector label { display: inline-flex; align-items: center; min-height: 44px; }
  .language-selector select { flex: 1 1 8rem; max-width: none; }
}

@media (max-width: 420px) {
  .site-main { padding-inline: 1rem; }
  :where(.page-header, .panel, .evidence-card, .policy-card, .record-card) { min-inline-size: 0; }
  :where(.table-wrap, .compliance-table-wrap, .openapi-model) { inline-size: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto !important; }
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}

@media (forced-colors: active) {
  :where(a, button, summary, input, select, textarea):focus-visible {
    outline: 3px solid Highlight !important;
    outline-offset: 3px;
  }
  .brand-mark,
  .secondary-navigation a[data-route-current]::after {
    forced-color-adjust: none;
  }
  .language-selector select,
  .language-selector button,
  .related-navigation a,
  .card,
  .panel,
  .status-pill,
  .assurance-pill,
  .search-pill {
    border-color: CanvasText;
  }
}
`;
