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
  flex: 0 0 auto;
  align-items: center;
  min-height: 44px;
}
.language-selector select,
.language-selector button {
  min-height: 44px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--paper);
  font: 750 .7rem/1 var(--mono);
}
.language-selector select { max-width: 6rem; padding: .35rem .4rem; }
.language-selector button { margin-inline-start: .3rem; padding: .35rem .55rem; cursor: pointer; }
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
html[dir='rtl'] .nav { direction: rtl; }

@media (max-width: 620px) {
  .language-selector select { max-width: 4.75rem; padding-inline: .25rem; }
}

@media (max-width: 340px) {
  .site-header, .site-main, .site-footer { width: min(100% - 16px, var(--shell-width)); }
  .site-header { gap: .08rem; }
  .brand { min-inline-size: 44px; min-block-size: 44px; justify-content: center; gap: 0; }
  .brand-copy { display: none; }
  .nav { flex: 0 1 auto; gap: .1rem; }
  .nav a, .nav button { flex: 0 0 auto; min-inline-size: 44px; justify-content: center; font-size: .54rem; letter-spacing: 0; }
  .header-utilities { gap: .05rem; }
  .header-utilities > a { min-inline-size: 44px; justify-content: center; font-size: .54rem; }
  .header-utilities > button { font-size: .54rem; }
  .language-selector select { inline-size: 3rem; max-width: 3rem; padding-inline: .15rem; font-size: .6rem; }
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
  .brand-mark {
    forced-color-adjust: none;
  }
  .language-selector select,
  .language-selector button,
  .card,
  .panel,
  .status-pill,
  .assurance-pill,
  .search-pill {
    border-color: CanvasText;
  }
}
`;
