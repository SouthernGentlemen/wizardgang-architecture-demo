export const runtimeStyles = `
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
  min-height: 36px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--paper);
  font: 750 .7rem/1 var(--mono);
}
.language-selector select { max-width: 9rem; padding: .35rem .45rem; }
.language-selector button { padding: .35rem .55rem; cursor: pointer; }
.language-selector button:hover { border-color: var(--paper); }

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
  .language-selector label { display: inline-flex; align-items: center; min-height: 36px; }
  .language-selector select { flex: 1 1 8rem; max-width: none; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto !important; }
}

@media (forced-colors: active) {
  :where(a, button, summary, input, select, textarea):focus-visible {
    outline: 3px solid Highlight !important;
    outline-offset: 3px;
  }
  .brand-mark,
  .status-strip a::before,
  .secondary-navigation a[data-route-current]::after {
    forced-color-adjust: none;
  }
  .language-selector select,
  .language-selector button,
  .related-navigation a,
  .card,
  .panel {
    border-color: CanvasText;
  }
}
`;
