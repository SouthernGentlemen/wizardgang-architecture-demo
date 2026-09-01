export const styles = `
:root {
  color-scheme: dark;
  --ink: #08080b;
  --panel: #111116;
  --panel-2: #17171e;
  --paper: #f5f2e9;
  --muted: #b5b0bb;
  --line: #6f6a75;
  --acid: #d9ff43;
  --violet: #a489ff;
  --cyan: #78e8ff;
  --focus: #78e8ff;
  --button-text: #090a05;
  --mono: ui-monospace, SFMono-Regular, Consolas, monospace;
}
:root[data-theme="light"] {
  color-scheme: light;
  --ink: #f2eee3;
  --panel: #fffdf7;
  --panel-2: #e7e1d5;
  --paper: #17151b;
  --muted: #4b4750;
  --line: #716b75;
  --acid: #435d00;
  --violet: #51328a;
  --cyan: #006276;
  --focus: #005fcc;
  --button-text: #fff;
}
* { box-sizing: border-box; }
.sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
html { background: var(--ink); }
body {
  min-width: 280px;
  margin: 0;
  background:
    radial-gradient(circle at 88% 0, rgb(164 137 255 / 9%), transparent 32rem),
    radial-gradient(circle at 0 45%, rgb(217 255 67 / 3%), transparent 34rem),
    var(--ink);
  color: var(--paper);
  font: 16px/1.58 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
:root[data-theme="light"] body {
  background:
    radial-gradient(circle at 88% 0, rgb(81 50 138 / 8%), transparent 32rem),
    radial-gradient(circle at 0 45%, rgb(67 93 0 / 5%), transparent 34rem),
    var(--ink);
}
a { color: inherit; text-underline-offset: .3em; }
:where(a, button, summary, input, select, textarea):focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }

header, main, footer, .bar { width: min(1120px, 100% - 40px); margin-inline: auto; }
header { display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; padding: 1.45rem 0; border-bottom: 1px solid var(--line); }
.brand { display: inline-flex; align-items: center; gap: .7rem; font: 900 .9rem/1 var(--mono); letter-spacing: .16em; text-transform: uppercase; text-decoration: none; }
.brand-mark { flex: 0 0 auto; width: .65rem; height: .65rem; background: var(--acid); box-shadow: .5rem -.5rem 0 var(--violet); }
.nav { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: clamp(.85rem, 2.4vw, 1.4rem); }
.nav a, .nav button { display: inline-flex; align-items: center; min-height: 44px; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer; font: 800 .73rem/1 var(--mono); letter-spacing: .08em; text-decoration: none; text-transform: uppercase; }
.nav a:hover, .nav button:hover, .nav a[aria-current="page"] { color: var(--paper); }

/* Parked above the viewport, never off to the side: a large negative inline offset
   would extend the scrollable width and strand RTL pages on an empty canvas. */
.skip-link { position: absolute; inset-inline-start: 0; top: -100px; z-index: 20; padding: .7rem 1rem; background: var(--acid); color: var(--button-text); font-weight: 900; }
.skip-link:focus { top: 0; }

main { padding: clamp(2.5rem, 5vw, 3.75rem) 0 5rem; }
h1 { max-width: 22ch; margin: 0 0 1rem; font-size: clamp(2.35rem, 4.5vw, 3.6rem); line-height: .96; letter-spacing: -.04em; }
h2 { margin: 0 0 .85rem; font-size: clamp(1.4rem, 2.5vw, 1.9rem); line-height: 1.05; letter-spacing: -.025em; }
h3 { margin: 0 0 .55rem; font-size: 1.28rem; line-height: 1.05; letter-spacing: -.02em; }
p { margin: 0 0 1rem; }
.lede { max-width: 62ch; color: var(--muted); font-size: clamp(1rem, 1.5vw, 1.15rem); }
.subtle { color: var(--muted); }
.eyebrow { margin: 0 0 1rem; color: var(--acid); font: 800 .72rem/1.4 var(--mono); letter-spacing: .18em; text-transform: uppercase; }
.page-header { max-width: 850px; margin-bottom: 2rem; }
.home-header { margin-bottom: 1.5rem; }
.page-tools { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem 1.1rem; margin-top: 1.25rem; }
.text-link { color: var(--paper); font: 800 .72rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; text-decoration-thickness: 2px; }
.text-link:hover { color: var(--acid); }
.reference-details { position: relative; }
.reference-details > summary { min-height: 44px; display: inline-flex; align-items: center; list-style: none; color: var(--muted); font: 800 .72rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.reference-details > summary::-webkit-details-marker { display: none; }
.reference-details > summary::after { content: '+'; margin-left: .4rem; }
.reference-details[open] > summary::after { content: '−'; }
.reference-details[open] > summary { color: var(--paper); }
.reference-links { display: flex; flex-wrap: wrap; gap: .55rem 1rem; margin-top: .35rem; padding: .8rem 1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); }
.reference-links a { color: var(--muted); font-size: .85rem; }
.reference-links a:hover { color: var(--paper); }
.status-strip { display: flex; gap: 1px; margin-bottom: 3rem; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; background: var(--line); }
.status-strip a { flex: 1; display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; min-height: 72px; padding: 1rem 1.2rem; background: var(--panel); text-decoration: none; }
.status-strip a:hover { background: var(--panel-2); }
.status-strip span { color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.status-strip strong { font-size: 1.2rem; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin: 3rem 0 1rem; padding-top: 1rem; border-top: 1px solid var(--line); }
.section-head h2 { margin: 0; }
.section-head > span { color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); gap: .75rem; }
.card { display: flex; flex-direction: column; padding: 1.25rem; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); color: inherit; text-decoration: none; }
a.card:hover, a.card:focus-visible { background: var(--panel-2); }
a.card:hover h3 { color: var(--acid); }
.card .eyebrow { margin: 0 0 1.6rem; color: var(--muted); font-size: .66rem; letter-spacing: .14em; }
.card p { margin: 0 0 1.1rem; color: var(--muted); font-size: .92rem; }
.card .badge { margin-top: auto; }
.card h2.eyebrow { margin: 0 0 1.4rem; font-size: .66rem; }
.stat, .card p.stat { margin: 0 0 .7rem; color: var(--paper); font-size: clamp(1.5rem, 3vw, 2rem); line-height: 1; letter-spacing: -.03em; }
.card p.stat-ok, .stat-ok { color: var(--acid); }
.card p.stat-warn, .stat-warn { color: var(--violet); }
.card p.stat-down, .stat-down { color: #ff9d9d; }
:root[data-theme="light"] .card p.stat-down, :root[data-theme="light"] .stat-down { color: #a11; }

.badge { display: inline-flex; align-items: center; align-self: flex-start; padding: .3rem .5rem; border: 1px solid var(--line); color: var(--muted); font: 700 .64rem/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.badge-ok { border-color: var(--acid); color: var(--acid); }
.badge-warn { border-color: var(--violet); color: var(--violet); }
.badge-down { border-color: #ff9d9d; color: #ff9d9d; }
:root[data-theme="light"] .badge-down { border-color: #a11; color: #a11; }

.meta { display: flex; flex-wrap: wrap; align-items: center; gap: .55rem 1.1rem; margin: 0 0 1.6rem; }
.meta a { font: 800 .72rem/1 var(--mono); letter-spacing: .04em; text-transform: uppercase; text-decoration-thickness: 2px; }
.meta a:hover { color: var(--acid); }
.section-nav { display: flex; flex-wrap: wrap; gap: .4rem .65rem; margin: 0 0 1.25rem; }
.section-nav a, .link-row a { display: inline-flex; align-items: center; min-height: 40px; padding: .35rem .7rem; border: 1px solid transparent; border-radius: 999px; color: var(--muted); font: 800 .7rem/1 var(--mono); letter-spacing: .04em; text-decoration: none; text-transform: uppercase; }
.section-nav a:hover, .section-nav a[aria-current="page"], .link-row a:hover { border-color: var(--line); color: var(--paper); background: var(--panel); }

.panel { margin: 1rem 0; padding: clamp(1.2rem, 3vw, 1.65rem); border: 1px solid var(--line); border-radius: 14px; background: var(--panel); }
.panel > :last-child { margin-bottom: 0; }
.panel ul, .panel ol { margin: 0 0 1rem; padding-left: 1.1rem; }
.panel li { margin-bottom: .4rem; color: var(--muted); }
.panel li strong { color: var(--paper); }

.button, button { display: inline-flex; align-items: center; min-height: 46px; padding: .6rem 1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); color: var(--paper); cursor: pointer; font: 850 .88rem/1 inherit; font-family: inherit; text-decoration: none; transition: transform .16s, border-color .16s; }
.button:hover, button:hover { transform: translateY(-2px); border-color: var(--muted); }
.button-primary, button[data-run-demo] { border-color: var(--acid); background: var(--acid); color: var(--button-text); }
.button-primary:hover, button[data-run-demo]:hover { border-color: var(--paper); }
@media (prefers-reduced-motion: reduce) { .button, button { transition: none; } .button:hover, button:hover { transform: none; } }

code { font-family: var(--mono); font-size: .92em; color: var(--violet); }
pre { margin: .85rem 0 0; padding: 1rem; min-height: 52px; max-height: 26rem; overflow: auto; border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); color: var(--paper); font: .82rem/1.6 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; }

dl { display: grid; grid-template-columns: minmax(140px, 1fr) 2fr; gap: .6rem 1.4rem; margin: 0; }
dt { color: var(--muted); font: 800 .7rem/1.5 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
dd { margin: 0; }

.filters { display: flex; flex-wrap: wrap; align-items: end; gap: .7rem; }
.page-header .filters { margin-top: 1.25rem; }
.filters label, .field { display: grid; gap: .35rem; }
label, legend, .field > span { color: var(--muted); font: 800 .68rem/1.2 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
input, select, textarea { min-height: 46px; padding: .55rem .7rem; border: 1px solid var(--line); border-radius: 0; background: var(--panel-2); color: var(--paper); font: 400 .95rem/1.4 inherit; font-family: inherit; }
textarea { min-height: 6rem; }
input::placeholder, textarea::placeholder { color: var(--muted); }
.error { border-left: 3px solid #ff9d9d; padding-left: .7rem; }
:root[data-theme="light"] .error { border-left-color: #a11; }

.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 10px; }
table { width: 100%; border-collapse: collapse; font-size: .86rem; }
th, td { padding: .65rem .8rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
th { color: var(--muted); font: 800 .66rem/1.3 var(--mono); letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
tbody tr:last-child td { border-bottom: 0; }
td code { font-size: .8rem; }
summary { cursor: pointer; }

.info-grid, .action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: .75rem; margin: 1rem 0; }
.lab-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, .85fr); gap: 1rem; align-items: start; }
.lab-grid aside { position: sticky; top: 1rem; }
.lab-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }
.lab-heading .eyebrow { margin-bottom: .45rem; }
.lab-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .7rem; margin: 1rem 0 1.25rem; padding: 1rem; border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); }
.lab-form label { display: grid; gap: .35rem; }
.lab-form .button-row { grid-column: 1 / -1; }
.locale-switcher { display: flex; flex-wrap: wrap; gap: .45rem; margin: 1rem 0; }
.locale-switcher button { min-height: 40px; padding: .45rem .7rem; font-size: .78rem; }
.locale-switcher button[aria-pressed="true"] { border-color: var(--acid); background: var(--acid); color: var(--button-text); }
.i18n-controls { margin-bottom: 1rem; }
.locale-app [data-inspect] { cursor: help; }
.locale-app [data-inspect]:hover { text-decoration: underline; text-decoration-color: var(--acid); text-underline-offset: .25em; }
.locale-app .button-primary { margin-top: 1.25rem; }
.technical-state pre { max-height: 22rem; }
.graphql-frame { height: min(72vh, 760px); min-height: 540px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.graphql-frame iframe { width: 100%; height: 100%; border: 0; }
.drop-zone { display: grid; place-items: center; min-height: 150px; margin-bottom: 1rem; padding: 1rem; border: 2px dashed var(--line); border-radius: 10px; text-align: center; }
.drop-zone[data-drag="true"] { border-color: var(--acid); background: var(--panel-2); }
.drop-zone input { width: min(100%, 30rem); margin-top: .75rem; }
.file-list { display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.file-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 1rem; background: var(--panel-2); }
.file-row > div:first-child { display: grid; gap: .15rem; min-width: 0; }
.file-row code, .file-row span { color: var(--muted); font-size: .78rem; overflow-wrap: anywhere; }
.file-preview { height: 480px; overflow: hidden; border: 1px solid var(--line); background: #fff; }
.file-preview iframe { width: 100%; height: 100%; border: 0; }
.info-card, .action-card { padding: 1.25rem; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); }
.info-card h2, .action-card h2 { font-size: 1.3rem; }
.info-card p, .action-card p { color: var(--muted); }
.info-card ul { margin: .8rem 0 0; padding-left: 1.1rem; color: var(--muted); font-size: .9rem; }
.request-line { display: flex; align-items: center; gap: .6rem; margin: 1rem 0; }
.request-line code { overflow-wrap: anywhere; }
.request-example { margin: 0 0 1rem; }
.request-example summary { min-height: 44px; display: flex; align-items: center; list-style: none; color: var(--muted); font: 800 .7rem/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.request-example summary::-webkit-details-marker { display: none; }
.request-example summary::after, .console-write > summary::after, .implementation-notes summary::after { content: '+'; margin-left: auto; padding-left: .75rem; color: var(--muted); }
.request-example[open] summary::after, .console-write[open] > summary::after, .implementation-notes[open] summary::after { content: '−'; }
.request-example pre { max-width: none; }
.action-output { margin-top: 1rem; }
.console-write { margin-top: 1.5rem; padding-top: .5rem; border-top: 1px solid var(--line); }
.console-write > summary { min-height: 48px; display: flex; align-items: center; list-style: none; font-weight: 800; }
.console-write > summary::-webkit-details-marker { display: none; }
.console-write[open] > summary { margin-bottom: .75rem; }
.implementation-notes { margin-top: 1.25rem; padding: .9rem 1.1rem; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.implementation-notes summary { min-height: 44px; display: flex; align-items: center; list-style: none; color: var(--muted); font: 800 .72rem/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.implementation-notes summary::-webkit-details-marker { display: none; }
.implementation-notes ul { margin: .7rem 0 .3rem; color: var(--muted); }

.api-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin: 2.75rem 0 1rem; padding-top: 1rem; border-top: 1px solid var(--line); }
.api-heading .eyebrow { margin-bottom: .45rem; }
.api-heading h2 { margin: 0; }
.swagger-operation-list { display: grid; gap: .65rem; }
.swagger-operation { overflow: hidden; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); scroll-margin-top: 1rem; }
.swagger-operation > summary { display: grid; grid-template-columns: minmax(250px, auto) 1fr auto; align-items: center; gap: 1rem; min-height: 76px; padding: 1rem 1.2rem; list-style: none; }
.swagger-operation > summary::-webkit-details-marker { display: none; }
.swagger-operation > summary::after { content: '+'; color: var(--muted); font: 700 1.35rem/1 var(--mono); }
.swagger-operation[open] > summary { background: var(--panel-2); }
.swagger-operation[open] > summary::after { content: '−'; }
.swagger-operation > summary strong { font-size: .98rem; }
.swagger-operation-body { padding: 1.25rem; border-top: 1px solid var(--line); }
.swagger-route { display: flex; align-items: center; gap: .65rem; }
.swagger-route code { overflow-wrap: anywhere; color: var(--paper); font-size: 1rem; }
.http-method { display: inline-flex; justify-content: center; min-width: 4.4rem; padding: .34rem .45rem; border: 1px solid currentColor; color: var(--cyan); font: 900 .68rem/1 var(--mono); letter-spacing: .1em; text-decoration: none; }
.http-post { color: var(--acid); }
.http-put, .http-patch { color: var(--violet); }
.http-delete { color: #ff9d9d; }
:root[data-theme="light"] .http-delete { color: #a11; }
.contract-block { margin: 1.25rem 0; }
.contract-block h4 { margin: 0 0 .65rem; color: var(--muted); font: 850 .72rem/1.5 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.contract-block > .subtle { margin-bottom: .6rem; }
.swagger-operation form { margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--line); }
.swagger-operation fieldset { margin: 0 0 1rem; padding: 1rem; border: 1px solid var(--line); }
.swagger-operation legend { padding: 0 .45rem; }
.swagger-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .85rem; }
.swagger-inputs label { display: grid; align-content: start; gap: .35rem; }
.swagger-inputs .swagger-body { grid-column: 1 / -1; }
.parameter-meta { color: var(--muted); font-weight: 500; letter-spacing: 0; text-transform: none; }
.input-help { color: var(--muted); font: 400 .78rem/1.4 inherit; letter-spacing: 0; text-transform: none; }
.swagger-result { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: .75rem; margin-top: 1rem; }
.schema-browser { margin-top: 1.5rem; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); }
.schema-browser > summary { display: flex; align-items: center; justify-content: space-between; min-height: 62px; padding: .9rem 1.2rem; list-style: none; font-weight: 800; }
.schema-browser > summary::-webkit-details-marker { display: none; }
.schema-browser > summary > span:last-child::after { content: '  +'; color: var(--muted); }
.schema-browser[open] > summary > span:last-child::after { content: '  −'; }
.schema-grid { display: grid; gap: .75rem; padding: 1rem; border-top: 1px solid var(--line); }
.schema-card { padding: 1.1rem; border: 1px solid var(--line); border-radius: 10px; scroll-margin-top: 1rem; }
.schema-card h3 { color: var(--violet); }
.swagger-schema-table { min-width: 580px; }
.schema-source { min-height: 0; }

.resource-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--line); border-radius: 14px; background: var(--line); }
.resource-list a { display: grid; gap: .25rem; min-height: 72px; padding: .9rem 1rem; background: var(--panel); text-decoration: none; }
.resource-list a:hover { background: var(--panel-2); }
.resource-list strong { font-size: .95rem; }
.resource-list code { color: var(--muted); font-size: .75rem; overflow-wrap: anywhere; }
.machine-links { margin-top: 2rem; }
.machine-links h2 { margin-bottom: .5rem; font-size: 1.25rem; }
.link-row, .button-row { display: flex; flex-wrap: wrap; gap: .45rem; }
.button-row { margin-top: 1rem; }

footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .9rem; padding: 1.6rem 0 2.6rem; border-top: 1px solid var(--line); color: var(--muted); font: .7rem/1.6 var(--mono); text-transform: uppercase; }
footer a { color: var(--paper); }

@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
@media (max-width: 620px) {
  header, main, footer, .bar { width: min(100% - 24px, 1120px); }
  header { align-items: flex-start; flex-direction: column; gap: .6rem; }
  .nav { justify-content: flex-start; }
  h1 { font-size: clamp(2.25rem, 10.5vw, 2.8rem); }
  dl { grid-template-columns: 1fr; gap: .2rem 0; }
  dd { margin-bottom: .7rem; }
  .section-head { flex-direction: column; gap: .3rem; }
  .status-strip { flex-direction: column; }
  .swagger-operation > summary { grid-template-columns: 1fr auto; gap: .55rem; }
  .swagger-operation > summary .swagger-route { grid-column: 1 / -1; }
  .info-grid, .action-grid { grid-template-columns: 1fr; }
  .lab-grid { grid-template-columns: 1fr; }
  .lab-grid aside { position: static; }
  .graphql-frame { min-height: 620px; }
  .file-row { align-items: flex-start; flex-direction: column; }
}
`;
