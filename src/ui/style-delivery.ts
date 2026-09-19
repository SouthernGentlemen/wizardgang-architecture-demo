import { runtimeStyles } from './runtime-styles';
import { styles } from './styles';

const DEMO_CORE_START = '\n.info-grid, .action-grid';
const FOOTER_START = '\n.site-footer {';
const RESPONSIVE_START = '\n@media (prefers-reduced-motion: reduce)';
const REST_DEMO_START = '\n/* REST documentation';
const FINAL_SHELL_MEDIA_START = '\n@media (max-width: 700px)';

function markerIndex(marker: string, after = 0): number {
  const index = styles.indexOf(marker, after);
  if (index === -1) throw new Error(`Unable to partition stylesheet at ${marker}`);
  return index;
}

const demoCoreStart = markerIndex(DEMO_CORE_START);
const footerStart = markerIndex(FOOTER_START, demoCoreStart);
const responsiveStart = markerIndex(RESPONSIVE_START, footerStart);
const restDemoStart = markerIndex(REST_DEMO_START, responsiveStart);
const finalShellMediaStart = markerIndex(FINAL_SHELL_MEDIA_START, restDemoStart);

const sharedPrefix = styles.slice(0, demoCoreStart);
const demoCore = styles.slice(demoCoreStart, footerStart);
const sharedFooter = styles.slice(footerStart, responsiveStart);
const restDemo = styles.slice(restDemoStart, finalShellMediaStart);
const finalShellMedia = styles.slice(finalShellMediaStart);

/*
 * The historical responsive tail mixed shell/home rules with executable-demo
 * rules. Project each group into its own delivery surface so /demos cannot
 * override the shared shell after the cached stylesheet has loaded.
 */
const sharedResponsiveStyles = `
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
@media (max-width: 900px) {
  .home-header { grid-template-columns: minmax(0, 1fr); }
  .home-header > * { min-width: 0; }
  .home-header .eyebrow { grid-column: auto; margin-bottom: 0; }
  .home-header h1 { max-width: 11ch; }
  .home-lede { max-width: 42rem; }
  .architecture-strip { grid-template-columns: 1fr 1fr; margin-top: -1.5rem; }
  .architecture-strip > i { display: none; }
}
@media (max-width: 760px) {
  .site-header { gap: .45rem; padding-block: .75rem; }
  .brand { gap: .55rem; }
  .brand-copy strong { font-size: .72rem; letter-spacing: .1em; }
  .nav { justify-content: center; gap: .5rem; }
  .nav a, .nav button { font-size: .66rem; letter-spacing: .04em; }
  .header-utilities > a, .header-utilities > button { font-size: .65rem; }
}
@media (max-width: 620px) {
  .site-header, .site-main, .site-footer { width: min(100% - 24px, var(--shell-width)); }
  .site-header { gap: .3rem; }
  .brand { gap: .4rem; }
  .brand-mark { width: .55rem; height: .55rem; box-shadow: .4rem -.4rem 0 var(--violet); }
  .brand-copy strong { font-size: .64rem; letter-spacing: .06em; }
  .nav { gap: .3rem; }
  .nav a, .nav button { font-size: .58rem; letter-spacing: .02em; }
  .header-utilities { gap: .16rem; }
  .header-utilities > a, .header-utilities > button { font-size: .58rem; }
  .site-main { padding: 4rem 0 5rem; }
  h1 { font-size: clamp(3.1rem, 15vw, 5.4rem); }
  :where(p, li, dd, a) { overflow-wrap: anywhere; }
  dl { grid-template-columns: 1fr; gap: .2rem 0; }
  dl > * { min-width: 0; }
  dd { margin-bottom: .7rem; }
  .section-head { flex-direction: column; gap: .3rem; }
}
`;

const demoResponsiveStyles = `
@media (max-width: 900px) {
  .identity-provider-grid { grid-template-columns: 1fr; }
  .graphql-control-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .d1-database-bar { flex-wrap: wrap; }
  .d1-database-id { flex: 1 0 100%; border-right: 0; border-bottom: 1px solid var(--line); }
  .d1-table-tabs { flex: 1 1 auto; }
  .d1-table-tabs button { flex: 1 1 145px; }
  .d1-database-message { flex: 1 0 100%; min-height: 0; margin: 0; padding: 0 1rem; text-align: left; }
  .d1-database-message:not(:empty) { padding-block: .75rem; border-top: 1px solid var(--line); }
  .identity-provider { grid-template-columns: auto minmax(0, 1fr); }
  .identity-provider > .identity-provider-actions { grid-column: 2; justify-self: start; }
  .identity-federation { grid-template-columns: 1fr; }
  .identity-federation .identity-provider-actions { justify-content: flex-start; }
}
@media (max-width: 620px) {
  .info-grid, .action-grid { grid-template-columns: 1fr; }
  .lab-grid { grid-template-columns: 1fr; }
  .lab-grid aside { position: static; }
  .d1-table-panel { min-height: 0; }
  .d1-table-heading, .d1-editor-heading, .d1-sandbox { align-items: stretch; flex-direction: column; }
  .d1-table-heading .button-primary, .d1-sandbox > button { justify-content: center; width: 100%; }
  .api-base, .api-token, .api-sandbox-heading, .api-operation-heading, .api-contract-heading, .api-response-heading, .graphql-workspace-heading, .graphql-shared, .webhook-section-heading { align-items: flex-start; flex-direction: column; }
  .api-base button, .api-token button, .graphql-shared .button, .webhook-section-heading > button { justify-content: center; width: 100%; }
  .api-response-heading p:last-child, .graphql-workspace-heading > p { text-align: left; }
  .graphql-control-grid { grid-template-columns: 1fr 1fr; }
  .webhook-connection { grid-template-columns: 1fr; }
  .webhook-connection dl { grid-column: auto; }
  .r2-workspace-heading, .r2-files-heading, .inline-preview-heading { align-items: flex-start; flex-direction: column; }
  .sandbox-usage { text-align: left; }
  .upload-actions { align-items: stretch; flex-direction: column; }
  .upload-actions .button-primary { justify-content: center; width: 100%; }
  .file-row { align-items: flex-start; flex-direction: column; }
  .file-actions { justify-content: flex-start; width: 100%; }
  .live-request-summary { grid-template-columns: 1fr; }
  .identity-section-heading, .identity-authenticated-heading { align-items: flex-start; flex-direction: column; }
  .identity-section-heading > p { text-align: left; }
  .identity-provider, .identity-provider-grid .identity-provider { grid-template-columns: 1fr; }
  .identity-provider > .identity-provider-actions, .identity-provider-grid .identity-provider-actions { grid-column: 1; }
  .identity-provider-actions { justify-content: flex-start; }
  .identity-provider-actions .button { justify-content: center; width: 100%; }
  .identity-authenticated-state { justify-items: start; }
  .identity-authenticated-state strong { text-align: left; }
}
`;

export const shellStyles = `${sharedPrefix}${sharedFooter}${sharedResponsiveStyles}${finalShellMedia}${runtimeStyles}`;
export const demoStyles = `${demoCore}${demoResponsiveStyles}${restDemo}`;

/* Above-fold shell paint only. The full shared sheet remains authoritative. */
export const criticalStyles = `
:root{color-scheme:dark;--ink:#08080b;--panel:#111116;--panel-2:#17171e;--paper:#f5f2e9;--muted:#b5b0bb;--line:#6f6a75;--acid:#d9ff43;--violet:#a489ff;--focus:#78e8ff;--button-text:#090a05;--mono:ui-monospace,SFMono-Regular,Consolas,monospace;--shell-width:1240px}
:root[data-theme="light"]{color-scheme:light;--ink:#f2eee3;--panel:#fffdf7;--panel-2:#e7e1d5;--paper:#17151b;--muted:#4b4750;--line:#716b75;--acid:#435d00;--violet:#51328a;--focus:#005fcc;--button-text:#fff}
*{box-sizing:border-box}html{background:var(--ink)}body{min-width:280px;min-height:100vh;margin:0;background:var(--ink);color:var(--paper);font:16px/1.58 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.site-header,.site-main,.site-footer{width:min(var(--shell-width),100% - 40px);margin-inline:auto}.site-header{position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;flex-wrap:nowrap;gap:clamp(.35rem,1.4vw,1rem);padding:1rem 0;border-bottom:1px solid var(--line)}.brand{display:inline-flex;align-items:center;gap:.8rem;text-decoration:none}.brand-mark{flex:0 0 auto;width:.65rem;height:.65rem;background:var(--acid);box-shadow:.5rem -.5rem 0 var(--violet)}.brand-copy strong{font:900 .82rem/1 var(--mono);letter-spacing:.16em}.nav{display:flex;flex:1 1 auto;min-width:0;align-items:center;flex-wrap:nowrap;justify-content:center;gap:clamp(.45rem,1.3vw,1rem)}.nav a{display:inline-flex;align-items:center;min-height:44px;color:var(--muted);font:800 .73rem/1 var(--mono);letter-spacing:.08em;text-decoration:none;text-transform:uppercase}.header-utilities{display:flex;flex:0 0 auto;align-items:center;justify-content:flex-end;gap:clamp(.2rem,.8vw,.55rem);color:var(--muted);font-size:.72rem;white-space:nowrap}.header-utilities>a,.header-utilities>button{min-height:44px}.language-selector{display:inline-flex;align-items:center;min-height:44px}.language-selector select{min-height:44px;max-width:6rem;border:1px solid var(--line);background:var(--panel);color:var(--paper)}.site-main{padding:clamp(3.5rem,7vw,6.5rem) 0 7rem}h1{max-width:18ch;margin:0 0 1.2rem;font-size:clamp(3.25rem,7.4vw,7.4rem);line-height:.88;letter-spacing:-.065em}.lede{max-width:62ch;color:var(--muted);font-size:clamp(1.05rem,1.6vw,1.25rem)}.page-header{max-width:1060px;margin-bottom:clamp(3rem,7vw,5.5rem)}
@media(max-width:760px){.site-header{gap:.45rem;padding-block:.75rem}.brand{gap:.55rem}.brand-copy strong{font-size:.72rem;letter-spacing:.1em}.nav{gap:.5rem}.nav a{font-size:.66rem;letter-spacing:.04em}.header-utilities>a,.header-utilities>button{font-size:.65rem}}
@media(max-width:620px){.site-header,.site-main,.site-footer{width:min(100% - 24px,var(--shell-width))}.site-header{gap:.3rem}.brand{gap:.4rem}.brand-mark{width:.55rem;height:.55rem;box-shadow:.4rem -.4rem 0 var(--violet)}.brand-copy strong{font-size:.64rem;letter-spacing:.06em}.nav{gap:.3rem}.nav a{font-size:.58rem;letter-spacing:.02em}.header-utilities{gap:.16rem}.header-utilities>a,.header-utilities>button{font-size:.58rem}.site-main{padding:4rem 0 5rem}h1{font-size:clamp(3.1rem,15vw,5.4rem)}}
@media(max-width:340px){.site-header,.site-main,.site-footer{width:min(100% - 16px,var(--shell-width))}.site-header{gap:.08rem}.brand{min-width:44px;min-height:44px;justify-content:center;gap:0}.brand-copy{display:none}.nav{flex:0 1 auto;gap:.1rem}.nav a{flex:0 0 auto;min-width:44px;justify-content:center;font-size:.54rem;letter-spacing:0}.header-utilities{gap:.05rem}.header-utilities>a{min-width:44px;justify-content:center;font-size:.54rem}.header-utilities>button{min-width:44px;font-size:.54rem}.language-selector select{width:3rem;max-width:3rem;padding-inline:.15rem;font-size:.6rem}}
`;

function contentHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export const shellStylesheetHash = contentHash(shellStyles);
export const shellStylesheetAsset = `shell.${shellStylesheetHash}.css`;
