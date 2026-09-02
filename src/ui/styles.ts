export const styles = `
:root {
  color-scheme: dark;
  --ink: #08080b;
  --panel: #111116;
  --panel-2: #17171e;
  --paper: #f5f2e9;
  --muted: #b5b0bb;
  --quiet: #b5b0bb;
  --line: #6f6a75;
  --acid: #d9ff43;
  --violet: #a489ff;
  --cyan: #78e8ff;
  --focus: #78e8ff;
  --button-text: #090a05;
  --mono: ui-monospace, SFMono-Regular, Consolas, monospace;
  --shell-width: 1240px;
}
:root[data-theme="light"] {
  color-scheme: light;
  --ink: #f2eee3;
  --panel: #fffdf7;
  --panel-2: #e7e1d5;
  --paper: #17151b;
  --muted: #4b4750;
  --quiet: #4b4750;
  --line: #716b75;
  --acid: #435d00;
  --violet: #51328a;
  --cyan: #006276;
  --focus: #005fcc;
  --button-text: #fff;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
.sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
html { background: var(--ink); scroll-behavior: smooth; }
body {
  min-width: 280px;
  min-height: 100vh;
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
:where(a, button, summary) { -webkit-tap-highlight-color: transparent; }
:where(a, button, summary, input, select, textarea):focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
::selection { background: var(--acid); color: var(--button-text); }

header, main, footer, .bar { width: min(var(--shell-width), 100% - 40px); margin-inline: auto; }
header { position: relative; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.45rem 0; border-bottom: 1px solid var(--line); }
.brand { display: inline-flex; align-items: center; gap: .8rem; text-decoration: none; }
.brand-mark { flex: 0 0 auto; width: .65rem; height: .65rem; background: var(--acid); box-shadow: .5rem -.5rem 0 var(--violet); }
.brand-copy { display: grid; gap: .18rem; }
.brand-copy strong { font: 900 .82rem/1 var(--mono); letter-spacing: .16em; }
.brand-copy small { color: var(--muted); font: 750 .58rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; }
.nav { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: clamp(.8rem, 2vw, 1.35rem); }
.nav a, .nav button { display: inline-flex; align-items: center; min-height: 44px; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer; font: 800 .73rem/1 var(--mono); letter-spacing: .08em; text-decoration: none; text-transform: uppercase; }
.nav a:hover, .nav button:hover, .nav a[aria-current="page"] { color: var(--paper); }
.nav a[aria-current="page"] { box-shadow: inset 0 -2px 0 var(--acid); }
.nav a span { margin-inline-start: .18rem; color: var(--acid); }

/* Parked above the viewport, never off to the side: a large negative inline offset
   would extend the scrollable width and strand RTL pages on an empty canvas. */
.skip-link { position: absolute; inset-inline-start: 0; top: -100px; z-index: 20; padding: .7rem 1rem; background: var(--acid); color: var(--button-text); font-weight: 900; }
.skip-link:focus { top: 0; }

main { padding: clamp(3.5rem, 7vw, 6.5rem) 0 7rem; }
h1 { max-width: 18ch; margin: 0 0 1.2rem; font-size: clamp(3.25rem, 7.4vw, 7.4rem); line-height: .88; letter-spacing: -.065em; }
h1 span { color: var(--muted); }
h2 { margin: 0 0 .85rem; font-size: clamp(1.65rem, 3vw, 2.6rem); line-height: 1; letter-spacing: -.04em; }
h3 { margin: 0 0 .55rem; font-size: 1.28rem; line-height: 1.05; letter-spacing: -.02em; }
p { margin: 0 0 1rem; }
.lede { max-width: 62ch; color: var(--muted); font-size: clamp(1.05rem, 1.6vw, 1.25rem); }
.subtle { color: var(--muted); }
.eyebrow { margin: 0 0 1rem; color: var(--acid); font: 800 .72rem/1.4 var(--mono); letter-spacing: .18em; text-transform: uppercase; }
.page-header { max-width: 1060px; margin-bottom: clamp(3rem, 7vw, 5.5rem); }
.lab-page-header { max-width: 820px; margin-bottom: clamp(2rem, 4vw, 3.25rem); }
.lab-page-header h1 { max-width: 15ch; font-size: clamp(2.8rem, 5.6vw, 5.25rem); line-height: .94; letter-spacing: -.055em; }
.home-header { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(260px, .65fr); gap: clamp(2rem, 7vw, 7rem); align-items: end; max-width: none; margin-bottom: clamp(3rem, 7vw, 5rem); }
.home-header .eyebrow { grid-column: 1 / -1; margin-bottom: -1rem; }
.home-header h1 { max-width: 9ch; margin: 0; }
.home-lede { margin: 0 0 .4rem; }
.page-tools { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem 1.1rem; margin-top: 1.25rem; }
.text-link { color: var(--paper); font: 800 .72rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; text-decoration-thickness: 2px; }
.text-link:hover { color: var(--acid); }
.reference-details { position: relative; }
.reference-details > summary { min-height: 44px; display: inline-flex; align-items: center; list-style: none; color: var(--muted); font: 800 .72rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.reference-details > summary::-webkit-details-marker { display: none; }
.reference-details > summary::after { content: '+'; margin-left: .4rem; }
.reference-details[open] > summary::after { content: '−'; }
.reference-details[open] > summary { color: var(--paper); }
.reference-links { display: flex; flex-wrap: wrap; gap: .55rem 1rem; margin-top: .35rem; padding: .8rem 1rem; border: 1px solid var(--line); background: var(--panel); }
.reference-links a { color: var(--muted); font-size: .85rem; }
.reference-links a:hover { color: var(--paper); }
.status-strip { display: flex; gap: 1px; margin-bottom: clamp(4rem, 8vw, 7rem); overflow: hidden; border: 1px solid var(--line); background: var(--line); }
.status-strip a { position: relative; flex: 1; display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; min-height: 84px; padding: 1.2rem 1.4rem; background: var(--panel); text-decoration: none; }
.status-strip a::before { position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--acid); content: ""; }
.status-strip a:last-child::before { background: var(--violet); }
.status-strip a:hover { background: var(--panel-2); }
.status-strip span { color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.status-strip strong { font-size: 1.2rem; }
.section-head { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin: clamp(4.5rem, 8vw, 7rem) 0 1.3rem; padding-top: 1.3rem; border-top: 1px solid var(--line); }
.section-head h2 { margin: 0; }
.section-head > span { color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); gap: .75rem; }
.card { position: relative; display: flex; flex-direction: column; min-height: 230px; padding: 1.35rem; border: 1px solid var(--line); background: var(--panel); color: inherit; text-decoration: none; transition: background .16s ease, transform .16s ease; }
.card::after { position: absolute; inset: auto 1.35rem 1.15rem auto; color: var(--acid); content: "↗"; font: 900 .9rem/1 var(--mono); opacity: 0; transform: translate(-4px, 4px); transition: opacity .16s ease, transform .16s ease; }
a.card:hover, a.card:focus-visible { background: var(--panel-2); }
a.card:hover::after, a.card:focus-visible::after { opacity: 1; transform: translate(0, 0); }
a.card:hover h3 { color: var(--acid); }
.card .eyebrow { margin: 0 0 1.6rem; color: var(--muted); font-size: .66rem; letter-spacing: .14em; }
.card p { margin: 0 0 1.1rem; color: var(--muted); font-size: .9rem; }
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
.section-nav a, .link-row a { display: inline-flex; align-items: center; min-height: 40px; padding: .35rem .7rem; border: 1px solid transparent; color: var(--muted); font: 800 .7rem/1 var(--mono); letter-spacing: .04em; text-decoration: none; text-transform: uppercase; }
.section-nav a:hover, .section-nav a[aria-current="page"], .link-row a:hover { border-color: var(--line); color: var(--paper); background: var(--panel); }

.panel { margin: 1rem 0; padding: clamp(1.2rem, 3vw, 1.65rem); border: 1px solid var(--line); background: linear-gradient(145deg, rgb(164 137 255 / 4%), transparent 48%), var(--panel); }
.panel > :last-child { margin-bottom: 0; }
.panel ul, .panel ol { margin: 0 0 1rem; padding-left: 1.1rem; }
.panel li { margin-bottom: .4rem; color: var(--muted); }
.panel li strong { color: var(--paper); }

.button, button { display: inline-flex; align-items: center; min-height: 46px; padding: .6rem 1rem; border: 1px solid var(--line); border-radius: 0; background: var(--panel-2); color: var(--paper); cursor: pointer; font: 850 .88rem/1 inherit; font-family: inherit; text-decoration: none; transition: transform .16s, border-color .16s; }
.button:hover, button:hover { transform: translateY(-2px); border-color: var(--muted); }
.button:disabled, button:disabled { cursor: not-allowed; opacity: .48; transform: none; }
.button-primary, button[data-run-demo] { border-color: var(--acid); background: var(--acid); color: var(--button-text); }
.button-primary:hover, button[data-run-demo]:hover { border-color: var(--paper); }
@media (prefers-reduced-motion: reduce) { .button, button { transition: none; } .button:hover, button:hover { transform: none; } }

code { font-family: var(--mono); font-size: .92em; color: var(--violet); }
pre { margin: .85rem 0 0; padding: 1rem; min-height: 52px; max-height: 26rem; overflow: auto; border: 1px solid var(--line); border-radius: 0; background: var(--panel-2); color: var(--paper); font: .82rem/1.6 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; }

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

.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 0; }
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
.lab-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .7rem; margin: 1rem 0 1.25rem; padding: 1rem; border: 1px solid var(--line); border-radius: 0; background: var(--panel-2); }
.lab-form label { display: grid; gap: .35rem; }
.lab-form .button-row { grid-column: 1 / -1; }
.d1-page-header { margin-bottom: clamp(2.4rem, 5vw, 4rem); }
.d1-page-header h1 { max-width: 13ch; }
.d1-database-bar { display: flex; align-items: stretch; min-height: 70px; margin-bottom: 1rem; border: 1px solid var(--line); background: var(--panel); }
.d1-database-id { display: grid; align-content: center; gap: .25rem; min-width: 180px; padding: .8rem 1.1rem; border-right: 1px solid var(--line); }
.d1-database-id span { color: var(--muted); font: 800 .62rem/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.d1-database-id strong { font: 850 .92rem/1.2 var(--mono); }
.d1-table-tabs { display: flex; align-items: stretch; }
.d1-table-tabs button { display: grid; grid-template-columns: auto auto; align-content: center; gap: .35rem .55rem; min-width: 145px; border: 0; border-right: 1px solid var(--line); background: transparent; font-size: .86rem; }
.d1-table-tabs button:hover { background: var(--panel-2); transform: none; }
.d1-table-tabs button[aria-selected="true"] { background: var(--panel-2); box-shadow: inset 0 -3px 0 var(--acid); }
.d1-table-tabs button > span { color: var(--muted); font: 700 .68rem/1 var(--mono); }
.d1-table-tabs button > span strong { color: var(--paper); }
.d1-database-message { align-self: center; margin: 0 1rem 0 auto; color: var(--muted); font: 750 .74rem/1.35 var(--mono); text-align: right; }
.d1-database-message[data-tone="success"] { color: var(--acid); }
.d1-database-message[data-tone="error"] { color: #ff9d9d; }
:root[data-theme="light"] .d1-database-message[data-tone="error"] { color: #a11; }
.d1-console { margin-top: 0; }
.d1-table-panel, .d1-inspector { margin-top: 0; }
.d1-table-panel { min-height: 28rem; }
.d1-table-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; margin-bottom: 1.1rem; }
.d1-table-heading .eyebrow { margin-bottom: .45rem; }
.d1-table-heading h2 { margin: 0; }
.d1-table-heading h2 span { margin-left: .3rem; color: var(--muted); font: 750 .68rem/1 var(--mono); letter-spacing: .06em; }
.d1-table-hint { margin: -.45rem 0 1rem; color: var(--muted); font: 700 .76rem/1.5 var(--mono); }
.d1-editor { margin: 0 0 1.15rem; }
.d1-editor-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; grid-column: 1 / -1; }
.d1-editor-heading strong { font-size: 1.05rem; }
.d1-editor-heading span { color: var(--muted); font: 700 .68rem/1 var(--mono); text-transform: uppercase; }
.d1-form-status { grid-column: 1 / -1; min-height: 1.2rem; margin: 0; }
.d1-editor .button-row { margin: 0; }
.d1-table-panel table { min-width: 650px; }
.d1-table-panel th:last-child, .d1-table-panel td:last-child { width: 1%; }
.d1-table-panel td { vertical-align: middle; }
.d1-empty-row { padding: 1.5rem; color: var(--muted); text-align: center; }
.d1-row-actions { display: flex; justify-content: flex-end; gap: .35rem; white-space: nowrap; }
.d1-row-actions button { min-height: 34px; padding: .35rem .55rem; background: transparent; color: var(--muted); font: 750 .7rem/1 var(--mono); text-transform: uppercase; }
.d1-row-actions button:hover { color: var(--paper); transform: none; }
.d1-role, .d1-task-status { white-space: nowrap; }
.d1-role[data-role="admin"], .d1-task-status[data-status="done"] { border-color: var(--acid); color: var(--acid); }
.d1-task-status[data-status="doing"] { border-color: var(--violet); color: var(--violet); }
.d1-inspector { padding-bottom: 0; overflow: hidden; }
.d1-inspector h2 { margin-bottom: 1.1rem; }
.d1-operation-summary { display: flex; align-items: center; gap: .8rem; padding: .9rem; border: 1px solid var(--line); background: var(--panel-2); }
.d1-operation-summary > div { display: grid; gap: .22rem; min-width: 0; }
.d1-operation-summary > div strong { font: 850 .9rem/1.2 var(--mono); }
.d1-operation-summary > div span { color: var(--muted); font: 700 .7rem/1.2 var(--mono); }
.d1-sql-verb { flex: 0 0 auto; border-color: var(--cyan); color: var(--cyan); }
.d1-sql-verb[data-verb="insert"] { border-color: var(--acid); color: var(--acid); }
.d1-sql-verb[data-verb="update"] { border-color: var(--violet); color: var(--violet); }
.d1-sql-verb[data-verb="delete"], .d1-sql-verb[data-verb="reset"], .d1-sql-verb[data-verb="error"] { border-color: #ff9d9d; color: #ff9d9d; }
:root[data-theme="light"] .d1-sql-verb[data-verb="delete"], :root[data-theme="light"] .d1-sql-verb[data-verb="reset"], :root[data-theme="light"] .d1-sql-verb[data-verb="error"] { border-color: #a11; color: #a11; }
.d1-sql-block, .d1-parameter-block { margin-top: 1rem; }
.d1-sql-block > span, .d1-parameter-block > span { display: block; margin-bottom: .5rem; color: var(--muted); font: 800 .62rem/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.d1-sql-block pre { min-height: 8.5rem; max-height: 18rem; margin: 0; border-color: rgb(120 232 255 / 45%); color: var(--paper); }
.d1-parameters { display: flex; flex-wrap: wrap; gap: .4rem; min-height: 30px; }
.d1-parameters code, .d1-parameters span { display: inline-flex; align-items: center; min-height: 28px; padding: .3rem .45rem; border: 1px solid var(--line); color: var(--muted); font: 700 .65rem/1 var(--mono); }
.d1-response-details { margin-top: 1rem; border-top: 1px solid var(--line); }
.d1-response-details > summary { display: flex; align-items: center; min-height: 48px; list-style: none; color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.d1-response-details > summary::-webkit-details-marker { display: none; }
.d1-response-details > summary::after { margin-left: auto; content: '+'; }
.d1-response-details[open] > summary::after { content: '−'; }
.d1-response-details pre { max-height: 14rem; margin: 0 0 1rem; font-size: .7rem; }
.d1-inspector-footer { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem; margin: 0 calc(clamp(1.2rem, 3vw, 1.65rem) * -1); padding: .75rem clamp(1.2rem, 3vw, 1.65rem); border-top: 1px solid var(--line); color: var(--muted); font: 750 .65rem/1 var(--mono); }
.d1-inspector-footer span::after, .d1-inspector-footer code::after { margin-left: .5rem; color: var(--line); content: '·'; }
.d1-inspector-footer code:last-child::after { content: ''; }
.d1-relationship h2 { font-size: 1.5rem; }
.d1-relationship > p:nth-of-type(2) { padding: .85rem; border: 1px solid var(--line); background: var(--panel-2); font: 750 .72rem/1.5 var(--mono); text-align: center; }
.d1-relationship .text-link { display: inline-block; font-size: .66rem; line-height: 1.45; }
.d1-implementation { margin-top: 2rem; padding: 0; overflow: hidden; }
.d1-implementation > summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 64px; padding: 1rem clamp(1.2rem, 3vw, 1.65rem); list-style: none; font-weight: 850; }
.d1-implementation > summary::-webkit-details-marker { display: none; }
.d1-implementation > summary > span:last-child { color: var(--muted); font: 750 .68rem/1 var(--mono); }
.d1-implementation > summary > span:last-child::after { margin-left: .7rem; content: '+'; }
.d1-implementation[open] > summary > span:last-child::after { content: '−'; }
.d1-implementation-body { display: grid; grid-template-columns: minmax(240px, .8fr) minmax(0, 1.2fr); gap: 1rem; padding: 1.25rem clamp(1.2rem, 3vw, 1.65rem); border-top: 1px solid var(--line); }
.d1-implementation-body h2 { font-size: 1.6rem; }
.d1-implementation-body .reference-links { align-content: start; margin: 0; }
.d1-sandbox { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; margin-top: 1rem; }
.d1-sandbox .eyebrow { margin-bottom: .4rem; }
.d1-sandbox h2 { margin-bottom: .4rem; font-size: 1.45rem; }
.d1-sandbox p:last-child { margin: 0; }
.d1-sandbox button { flex: 0 0 auto; }
.d1-confirm-dialog { width: min(480px, calc(100% - 32px)); padding: clamp(1.2rem, 4vw, 1.7rem); border: 1px solid var(--line); border-radius: 0; background: var(--panel); color: var(--paper); box-shadow: 0 24px 80px rgb(0 0 0 / 55%); }
.d1-confirm-dialog::backdrop { background: rgb(0 0 0 / 72%); backdrop-filter: blur(3px); }
.d1-confirm-dialog .button-row { justify-content: flex-end; margin-bottom: 0; }
.locale-switcher { display: flex; flex-wrap: wrap; gap: .45rem; margin: 1rem 0; }
.locale-switcher button { min-height: 40px; padding: .45rem .7rem; font-size: .78rem; }
.locale-switcher button[aria-pressed="true"] { border-color: var(--acid); background: var(--acid); color: var(--button-text); }
.i18n-controls { margin-bottom: 1rem; }
.locale-app [data-inspect] { cursor: help; }
.locale-app [data-inspect]:hover { text-decoration: underline; text-decoration-color: var(--acid); text-underline-offset: .25em; }
.locale-app .button-primary { margin-top: 1.25rem; }
.accessibility-frame { height: min(70vh, 680px); min-height: 520px; overflow: hidden; border: 1px solid var(--line); border-radius: 0; background: #fff; }
.accessibility-frame iframe { width: 100%; height: 100%; border: 0; }
.scan-counts { grid-template-columns: repeat(4, minmax(70px, 1fr)); text-align: center; }
.scan-counts dt { grid-row: 1; }
.scan-counts dd { grid-row: 2; color: var(--acid); font-size: 1.8rem; font-weight: 900; }
.criterion-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); gap: .75rem; }
.criterion-card { padding: 1rem; border: 1px solid var(--line); border-radius: 0; background: var(--panel); }
.criterion-card .eyebrow { margin-bottom: .7rem; }
.criterion-card p { color: var(--muted); font-size: .88rem; }
.criterion-card strong { color: var(--paper); }
.button-row { display: flex; flex-wrap: wrap; gap: .6rem; margin: 1rem 0; }
.webhook-events { display: grid; gap: .65rem; margin-top: 1rem; }
.webhook-event { padding: 1rem; border: 1px solid var(--line); border-radius: 0; background: var(--panel-2); }
.webhook-event h3 { margin: 0; }
.webhook-event pre { max-height: 13rem; }
.pipeline { display: flex; align-items: stretch; gap: 1px; margin: 1rem 0; overflow-x: auto; border: 1px solid var(--line); border-radius: 0; background: var(--line); }
.pipeline span { position: relative; flex: 1 0 105px; display: grid; place-items: center; min-height: 62px; padding: .65rem; background: var(--panel); color: var(--muted); font: 800 .68rem/1.35 var(--mono); text-align: center; text-transform: uppercase; }
.live-git-control .filters { align-items: end; }
.live-git-control .filters label { flex: 1 1 150px; }
.live-git-control .filters input, .live-git-control .filters select { width: 100%; }
.live-git-control button:disabled { cursor: not-allowed; opacity: .55; transform: none; }
.live-pipeline span { flex-basis: 92px; }
.live-pipeline .stage-complete { background: rgb(183 255 62 / 13%); color: var(--acid); }
.live-pipeline .stage-current { background: rgb(164 137 255 / 17%); color: var(--paper); box-shadow: inset 0 -3px 0 var(--violet); }
.live-pipeline .stage-failed { background: rgb(255 95 95 / 12%); color: #ff9d9d; }
:root[data-theme="light"] .live-pipeline .stage-failed { color: #a11; }
.lifecycle-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 1px; margin: 1rem 0; background: var(--line); border: 1px solid var(--line); }
.lifecycle-facts article { min-width: 0; padding: .9rem; background: var(--panel-2); }
.lifecycle-facts span { display: block; margin-bottom: .55rem; color: var(--muted); font: 800 .65rem/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.lifecycle-facts strong, .lifecycle-facts a { overflow-wrap: anywhere; font: 800 .82rem/1.4 var(--mono); }
.workflow-feed { margin-top: 1rem; overflow: hidden; border: 1px solid var(--line); background: var(--panel-2); }
.workflow-feed-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--line); background: var(--panel); }
.workflow-feed-heading h3 { margin: 0; font-size: 1.15rem; }
.workflow-feed-heading .eyebrow { margin-bottom: .35rem; }
.workflow-feed-connection { display: grid; grid-template-columns: .65rem auto; align-items: center; column-gap: .5rem; color: var(--muted); font-family: var(--mono); text-align: right; }
.workflow-feed-connection > span { grid-row: 1 / span 2; width: .55rem; height: .55rem; border-radius: 50%; background: var(--muted); }
.workflow-feed-connection strong { color: var(--paper); font-size: .7rem; letter-spacing: .05em; }
.workflow-feed-connection small { font-size: .63rem; }
.workflow-feed-connection[data-feed-state="live"] > span { background: var(--acid); box-shadow: 0 0 0 4px rgb(183 255 62 / 12%); animation: git-feed-pulse 1s ease-in-out infinite; }
.workflow-feed-connection[data-feed-state="failed"] > span { background: #ff6b6b; }
.workflow-lane + .workflow-lane { border-top: 1px solid var(--line); }
.workflow-lane > header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 1rem; border-bottom: 1px solid var(--line); }
.workflow-lane > header .eyebrow { margin-bottom: .35rem; }
.workflow-lane > header h3 { margin: 0; font-size: 1rem; }
.check-summary { color: var(--muted); font: 700 .68rem/1.4 var(--mono); text-align: right; }
.workflow-job-list { display: grid; gap: .7rem; padding: .8rem; }
.workflow-empty { margin: 0; padding: 1.25rem; border: 1px dashed var(--line); color: var(--muted); font: .75rem/1.45 var(--mono); text-align: center; }
.workflow-job { min-width: 0; overflow: hidden; border: 1px solid var(--line); background: var(--panel); transition: border-color .2s ease, background-color .2s ease; }
.workflow-job-header { display: grid; grid-template-columns: 1.1rem minmax(0, 1fr) auto; align-items: center; gap: .65rem; min-height: 54px; padding: .7rem .8rem; }
.workflow-job h4 { margin: 0; color: var(--paper); font: 800 .82rem/1.35 var(--mono); overflow-wrap: anywhere; }
.workflow-job-meta { margin: .15rem 0 0; color: var(--muted); font: .65rem/1.3 var(--mono); text-transform: uppercase; }
.workflow-job-link { color: var(--muted); font: 800 .64rem/1 var(--mono); letter-spacing: .04em; text-decoration: none; text-transform: uppercase; }
.workflow-job-link:hover { color: var(--paper); }
.workflow-state-icon { display: inline-grid; place-items: center; width: 1rem; height: 1rem; color: var(--muted); font: 900 .85rem/1 var(--mono); }
.workflow-steps { margin: 0; padding: 0; border-top: 1px solid var(--line); list-style: none; }
.workflow-steps li { display: grid; grid-template-columns: 1.1rem minmax(0, 1fr) auto; align-items: center; gap: .65rem; min-height: 38px; margin: 0; padding: .5rem .8rem; color: var(--muted); font: .73rem/1.35 var(--mono); transition: background-color .2s ease, color .2s ease; }
.workflow-steps li + li { border-top: 1px solid rgb(255 255 255 / 5%); }
:root[data-theme="light"] .workflow-steps li + li { border-top-color: rgb(0 0 0 / 7%); }
.workflow-step-name { overflow-wrap: anywhere; }
.workflow-step-result { color: var(--muted); font-size: .61rem; letter-spacing: .04em; text-align: right; text-transform: uppercase; }
.workflow-step-empty { grid-template-columns: 1fr !important; color: var(--muted); font-style: italic !important; }
.workflow-job[data-state="success"] > .workflow-job-header > .workflow-state-icon,
.workflow-steps li[data-state="success"] > .workflow-state-icon { border-radius: 50%; background: var(--acid); color: var(--button-text); font-size: .62rem; }
.workflow-job[data-state="in_progress"] { border-color: rgb(164 137 255 / 55%); }
.workflow-job[data-state="in_progress"] > .workflow-job-header { background: rgb(164 137 255 / 8%); }
.workflow-job[data-state="in_progress"] > .workflow-job-header > .workflow-state-icon,
.workflow-steps li[data-state="in_progress"] > .workflow-state-icon { color: var(--violet); animation: git-feed-pulse .75s ease-in-out infinite; }
.workflow-steps li[data-state="in_progress"] { color: var(--paper); background: rgb(164 137 255 / 8%); }
.workflow-job[data-state="failure"], .workflow-job[data-state="cancelled"] { border-color: rgb(255 95 95 / 55%); }
.workflow-job[data-state="failure"] > .workflow-job-header > .workflow-state-icon,
.workflow-job[data-state="cancelled"] > .workflow-job-header > .workflow-state-icon,
.workflow-steps li[data-state="failure"] > .workflow-state-icon,
.workflow-steps li[data-state="cancelled"] > .workflow-state-icon { color: #ff7676; }
.workflow-job[data-state="skipped"], .workflow-steps li[data-state="skipped"] { opacity: .68; }
.workflow-job.state-updated, .workflow-steps li.state-updated { animation: git-feed-update .4s ease-out; }
@keyframes git-feed-pulse { 50% { opacity: .42; transform: scale(.82); } }
@keyframes git-feed-update { 0% { background-color: rgb(183 255 62 / 14%); } 100% { background-color: transparent; } }
.evidence-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: .75rem; margin: 1rem 0; }
@media (max-width: 600px) {
  .workflow-feed-heading, .workflow-lane > header { align-items: flex-start; }
  .workflow-feed-connection { max-width: 12rem; }
  .workflow-job-header { grid-template-columns: 1rem minmax(0, 1fr); }
  .workflow-job-link { grid-column: 2; justify-self: start; }
}
@media (max-width: 480px) { .evidence-grid { grid-template-columns: minmax(0, 1fr); } }
.evidence-card { min-width: 0; padding: 1.15rem; border: 1px solid var(--line); border-radius: 0; background: var(--panel); }
.evidence-card h2 { font-size: 1.25rem; }
.evidence-row { padding: .7rem 0; border-top: 1px solid var(--line); }
.evidence-row:first-child { border-top: 0; }
.evidence-row p { margin: .25rem 0 0; font-size: .78rem; overflow-wrap: anywhere; }
.technical-state pre { max-height: 22rem; }
.graphql-frame { height: min(72vh, 760px); min-height: 540px; overflow: hidden; border: 1px solid var(--line); border-radius: 0; background: #fff; }
.graphql-frame iframe { width: 100%; height: 100%; border: 0; }
.r2-lab { grid-template-columns: minmax(0, 1.7fr) minmax(280px, .78fr); }
.r2-workspace { margin-top: 0; padding: 0; overflow: hidden; }
.r2-workspace-heading { display: flex; align-items: start; justify-content: space-between; gap: 1.25rem; padding: clamp(1.25rem, 3vw, 1.75rem); border-bottom: 1px solid var(--line); }
.r2-workspace-heading h2 { margin: 0; }
.r2-workspace-heading .eyebrow { margin-bottom: .45rem; }
.sandbox-usage { flex: 0 0 auto; margin-top: .15rem; color: var(--muted); font: 800 .72rem/1.4 var(--mono); letter-spacing: .04em; text-align: right; }
.r2-upload-block { padding: clamp(1.25rem, 3vw, 1.75rem); }
.drop-zone { position: relative; display: grid; place-items: center; align-content: center; gap: .3rem; min-height: 190px; margin-bottom: .85rem; padding: 1.5rem; border: 2px dashed var(--line); border-radius: 0; color: var(--muted); font: 500 .92rem/1.5 inherit; letter-spacing: 0; text-align: center; text-transform: none; cursor: pointer; transition: border-color .16s, background-color .16s; }
.drop-zone:hover, .drop-zone[data-drag="true"] { border-color: var(--acid); background: var(--panel-2); }
.drop-zone:focus-within { outline: 3px solid var(--focus); outline-offset: 3px; }
.r2-file-input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.drop-zone-icon { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; margin-bottom: .35rem; border: 1px solid var(--line); color: var(--acid); font: 900 1.25rem/1 var(--mono); }
.drop-zone-title { color: var(--paper); font-size: 1.12rem; }
.browse-file { color: var(--acid); font-weight: 850; text-decoration: underline; text-underline-offset: .25em; }
.drop-limit { margin-top: .3rem; font: 750 .67rem/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.file-selection { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .85rem; padding: .8rem .9rem; border: 1px solid var(--line); background: var(--panel-2); }
.file-selection > div { display: grid; min-width: 0; gap: .18rem; }
.file-selection strong, .file-selection span { overflow-wrap: anywhere; }
.file-selection span { color: var(--muted); font-size: .8rem; }
.icon-button { justify-content: center; flex: 0 0 46px; width: 46px; padding: 0; font: 900 1.1rem/1 var(--mono); }
.upload-actions { display: flex; align-items: center; gap: 1rem; }
.operation-status { margin: 0; color: var(--muted); font-size: .86rem; }
.operation-status[data-tone="success"], .operation-status[data-tone="ready"] { color: var(--acid); }
.operation-status[data-tone="error"] { color: #ff9d9d; }
:root[data-theme="light"] .operation-status[data-tone="error"] { color: #a11; }
.r2-files-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.1rem clamp(1.25rem, 3vw, 1.75rem); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.r2-files-heading .eyebrow { margin-bottom: .35rem; }
.r2-files-heading h3 { margin: 0; }
.file-count-actions { display: flex; align-items: center; gap: .5rem; }
.file-list { display: grid; gap: 1px; background: var(--line); overflow: hidden; }
.file-list-empty { margin: 0; padding: 1.5rem; background: var(--panel-2); color: var(--muted); }
.file-row { display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; padding: 1rem clamp(1.25rem, 3vw, 1.75rem); background: var(--panel-2); }
.file-row[data-selected="true"] { background: rgb(164 137 255 / 10%); box-shadow: inset 3px 0 0 var(--violet); }
.file-summary { display: grid; gap: .18rem; min-width: 0; }
.file-name-line { display: flex; align-items: center; flex-wrap: wrap; gap: .55rem; }
.file-name-line strong { overflow-wrap: anywhere; }
.file-facts { color: var(--muted); font-size: .8rem; }
.ownership-badge { display: inline-flex; padding: .24rem .42rem; border: 1px solid var(--line); color: var(--muted); font: 800 .6rem/1 var(--mono); letter-spacing: .09em; text-transform: uppercase; }
.ownership-badge[data-owner="yours"] { border-color: var(--acid); color: var(--acid); }
.file-details { margin-top: .15rem; }
.file-details > summary { display: inline-flex; align-items: center; min-height: 30px; color: var(--muted); font: 750 .68rem/1 var(--mono); letter-spacing: .05em; list-style: none; text-transform: uppercase; }
.file-details > summary::-webkit-details-marker { display: none; }
.file-details > summary::after { content: '+'; margin-left: .4rem; }
.file-details[open] > summary::after { content: '−'; }
.file-details dl { grid-template-columns: 90px minmax(0, 1fr); gap: .3rem .75rem; margin-top: .45rem; font-size: .76rem; }
.file-details code, .file-details dd { overflow-wrap: anywhere; }
.file-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: .45rem; }
.file-actions .button, .file-actions button { min-height: 40px; padding: .5rem .72rem; font-size: .78rem; }
.danger-text-button { border-color: transparent; background: transparent; color: #ff9d9d; }
.danger-text-button:hover { border-color: #ff9d9d; }
.danger-button { border-color: #ff9d9d; color: #ffb2b2; }
:root[data-theme="light"] .danger-text-button, :root[data-theme="light"] .danger-button { color: #8e1111; }
.delete-confirm, .reset-confirm { display: flex; align-items: center; flex-wrap: wrap; gap: .45rem; }
.delete-confirm span, .reset-confirm span { color: #ffb2b2; font: 750 .72rem/1.3 var(--mono); }
:root[data-theme="light"] .delete-confirm span, :root[data-theme="light"] .reset-confirm span { color: #8e1111; }
.r2-inline-preview { padding: clamp(1.25rem, 3vw, 1.75rem); background: var(--panel); }
.inline-preview-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.inline-preview-heading .eyebrow { margin-bottom: .4rem; }
.inline-preview-heading h3 { margin: 0; }
.file-preview { height: min(50vh, 440px); min-height: 300px; overflow: hidden; border: 1px solid var(--line); background: #fff; }
.file-preview iframe { width: 100%; height: 100%; border: 0; }
.sandbox-reset { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem 1rem; padding: 1rem clamp(1.25rem, 3vw, 1.75rem); border-top: 1px solid var(--line); }
.sandbox-reset > div:first-child { display: grid; }
.sandbox-reset > div:first-child span { color: var(--muted); font-size: .78rem; }
.r2-sidebar .panel:first-child { margin-top: 0; }
.live-request-card h2, .how-it-works h2 { font-size: clamp(1.45rem, 2.5vw, 2rem); }
.request-state { padding: .3rem .45rem; border: 1px solid var(--line); color: var(--muted); font: 800 .62rem/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.request-state[data-state="running"] { border-color: var(--violet); color: var(--violet); }
.request-state[data-state="complete"] { border-color: var(--acid); color: var(--acid); }
.request-state[data-state="failed"] { border-color: #ff9d9d; color: #ff9d9d; }
.live-request-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin: 1.1rem 0 0; border: 1px solid var(--line); background: var(--line); }
.live-request-summary > div { display: grid; gap: .45rem; min-width: 0; padding: .8rem .65rem; background: var(--panel-2); }
.live-request-summary span { color: var(--muted); font: 750 .58rem/1 var(--mono); letter-spacing: .07em; text-transform: uppercase; }
.live-request-summary strong { overflow-wrap: anywhere; font: 900 .87rem/1.2 var(--mono); }
.request-metrics { margin: 0; padding: .8rem 0; border-bottom: 1px solid var(--line); color: var(--muted); font: 750 .75rem/1.4 var(--mono); }
.r2-response-details > summary, .r2-technical-details > summary { display: flex; align-items: center; min-height: 44px; list-style: none; color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.r2-response-details > summary::-webkit-details-marker, .r2-technical-details > summary::-webkit-details-marker { display: none; }
.r2-response-details > summary::after, .r2-technical-details > summary::after { content: '+'; margin-left: auto; }
.r2-response-details[open] > summary::after, .r2-technical-details[open] > summary::after { content: '−'; }
.r2-response-details pre { max-height: 16rem; margin: 0 0 .7rem; font-size: .72rem; }
.r2-technical-details { border-top: 1px solid var(--line); }
.r2-technical-details dl { grid-template-columns: 70px minmax(0, 1fr); gap: .35rem .7rem; padding: 0 0 .4rem; font-size: .78rem; }
.r2-technical-details code { overflow-wrap: anywhere; }
.storage-flow { margin: 1.15rem 0; padding: 1rem .8rem; border: 1px solid var(--line); background: var(--panel-2); }
.storage-flow > div { display: grid; grid-template-columns: auto 1fr auto 1fr auto; align-items: center; gap: .4rem; }
.storage-flow span { padding: .45rem .5rem; border: 1px solid var(--line); font: 800 .64rem/1 var(--mono); text-align: center; text-transform: uppercase; }
.storage-flow i { color: var(--acid); font: 900 1rem/1 var(--mono); text-align: center; }
.storage-flow .flow-branch { grid-template-columns: 1fr auto; width: 64%; margin: .55rem 0 0 auto; }
.storage-flow .flow-branch span { color: var(--violet); }
.storage-roles { grid-template-columns: 70px minmax(0, 1fr); gap: .45rem .75rem; font-size: .84rem; }
.storage-roles dt { color: var(--paper); }
.storage-roles dd { color: var(--muted); }
.r2-implementation { margin-top: 1.75rem; }
.r2-implementation > p { max-width: 72ch; margin: .75rem 0; color: var(--muted); }
.r2-implementation .reference-details { border-top: 1px solid var(--line); }

.identity-page-header { margin-bottom: clamp(2.2rem, 5vw, 4rem); }
.identity-page-header h1 { max-width: 12ch; }
.identity-notice { margin: 0 0 1rem; padding: .9rem 1rem; border: 1px solid var(--line); border-left: 4px solid var(--violet); background: var(--panel); color: var(--paper); }
.identity-notice[data-tone="success"] { border-left-color: var(--acid); }
.identity-notice[data-tone="error"] { border-left-color: #ff9d9d; }
:root[data-theme="light"] .identity-notice[data-tone="error"] { border-left-color: #a11; }
.identity-section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; margin: 0 0 1rem; }
.identity-section-heading .eyebrow { margin-bottom: .45rem; }
.identity-section-heading h2 { margin: 0; }
.identity-section-heading > p { max-width: 36ch; margin: 0; color: var(--muted); font-size: .88rem; text-align: right; }
.identity-secondary-heading { margin-top: clamp(2.4rem, 5vw, 4rem); padding-top: 1.2rem; border-top: 1px solid var(--line); }
.identity-provider { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 1.25rem; min-height: 220px; padding: clamp(1.2rem, 3vw, 1.7rem); border: 1px solid var(--line); background: linear-gradient(140deg, rgb(120 232 255 / 3%), transparent 42%), var(--panel); }
.identity-enterprise { min-height: 250px; border-top: 3px solid var(--acid); background: radial-gradient(circle at 10% 10%, rgb(217 255 67 / 8%), transparent 19rem), var(--panel); }
.identity-provider-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.identity-provider-grid .identity-provider { grid-template-columns: auto minmax(0, 1fr); align-content: start; }
.identity-provider-grid .identity-provider-actions { grid-column: 2; justify-self: start; }
.identity-provider-mark { display: grid; place-items: center; width: 3.1rem; height: 3.1rem; border: 1px solid var(--line); background: var(--panel-2); color: var(--paper); font: 900 .82rem/1 var(--mono); }
.microsoft-mark { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; padding: .45rem; }
.microsoft-mark span:nth-child(1) { background: #f35325; }
.microsoft-mark span:nth-child(2) { background: #81bc06; }
.microsoft-mark span:nth-child(3) { background: #05a6f0; }
.microsoft-mark span:nth-child(4) { background: #ffba08; }
.google-mark { color: var(--cyan); font-size: 1.25rem; }
.github-mark { color: var(--paper); }
.identity-provider-copy { align-self: center; }
.identity-provider-copy h3 { margin-bottom: .7rem; font-size: clamp(1.5rem, 3vw, 2.2rem); }
.identity-provider-copy > p:not(.identity-provider-kind) { max-width: 56ch; color: var(--muted); }
.identity-provider-kind { margin: 0 0 .45rem; color: var(--acid); font: 800 .65rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; }
.identity-provider-meta { display: flex; flex-wrap: wrap; gap: .4rem; }
.identity-provider-meta span { display: inline-flex; align-items: center; min-height: 27px; padding: .3rem .45rem; border: 1px solid var(--line); color: var(--muted); font: 750 .62rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.identity-provider-meta [data-configured="true"] { border-color: var(--acid); color: var(--acid); }
.identity-provider-meta [data-configured="false"] { border-color: var(--violet); color: var(--violet); }
.identity-provider-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: .85rem; }
.identity-provider-actions .text-link { font-size: .66rem; }
.identity-result { margin: clamp(3rem, 7vw, 6rem) 0; scroll-margin-top: 1rem; }
.identity-authenticated-heading { display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; padding: 1.3rem; border: 1px solid var(--line); border-bottom: 0; background: radial-gradient(circle at 0 0, rgb(217 255 67 / 9%), transparent 24rem), var(--panel); }
.identity-authenticated-heading .eyebrow { margin-bottom: .5rem; }
.identity-authenticated-heading h2 { margin-bottom: .35rem; }
.identity-authenticated-heading p { margin: 0; color: var(--muted); }
.identity-authenticated-state { display: grid; justify-items: end; gap: .5rem; }
.identity-authenticated-state strong { color: var(--acid); font: 800 .68rem/1.4 var(--mono); letter-spacing: .06em; text-align: right; }
.identity-authenticated-state button { min-height: 34px; padding: .35rem .65rem; background: transparent; color: var(--muted); font-size: .72rem; }
.identity-tabs { display: flex; overflow-x: auto; border: 1px solid var(--line); background: var(--line); gap: 1px; }
.identity-tabs button { flex: 1 0 auto; justify-content: center; min-height: 52px; border: 0; background: var(--panel-2); color: var(--muted); font: 800 .7rem/1 var(--mono); letter-spacing: .05em; text-transform: uppercase; }
.identity-tabs button:hover { transform: none; background: var(--panel); color: var(--paper); }
.identity-tabs button[aria-selected="true"] { background: var(--panel); color: var(--paper); box-shadow: inset 0 -3px 0 var(--acid); }
.identity-inspector-panel { min-height: 380px; margin: 0; border-top: 0; }
.identity-inspector-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.identity-inspector-heading .eyebrow { margin-bottom: .45rem; }
.identity-inspector-heading h3 { margin: 0; font-size: 1.6rem; }
.identity-validation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1px; margin-bottom: 1rem; border: 1px solid var(--line); background: var(--line); }
.identity-validation-grid > div { display: grid; gap: .3rem; min-height: 90px; padding: .8rem; background: var(--panel-2); }
.identity-validation-grid strong { color: var(--acid); font: 800 .72rem/1.2 var(--mono); text-transform: uppercase; }
.identity-validation-grid span { color: var(--muted); font-size: .76rem; }
.identity-validation-grid [data-status="not_applicable"] strong { color: var(--muted); }
.identity-inspector-panel > pre { min-height: 210px; }
.identity-policy-subject { display: grid; gap: .25rem; padding: 1rem; border: 1px solid var(--line); background: var(--panel-2); }
.identity-policy-subject span { color: var(--muted); font: 750 .72rem/1.4 var(--mono); text-transform: uppercase; }
.identity-policy-actions { display: flex; flex-wrap: wrap; gap: .55rem; margin: 1rem 0; }
.identity-decision { padding: 1rem; border-left: 4px solid var(--acid); background: var(--panel-2); }
.identity-decision[data-decision="deny"] { border-left-color: #ff9d9d; }
:root[data-theme="light"] .identity-decision[data-decision="deny"] { border-left-color: #a11; }
.identity-decision strong { display: block; margin-bottom: .5rem; color: var(--acid); font: 900 2rem/1 var(--mono); }
.identity-decision[data-decision="deny"] strong { color: #ff9d9d; }
:root[data-theme="light"] .identity-decision[data-decision="deny"] strong { color: #a11; }
.identity-decision p { color: var(--muted); }
.identity-decision small { color: var(--muted); font-family: var(--mono); }
.identity-protocol-steps { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 1px; padding: 0; overflow-x: auto; border: 1px solid var(--line); background: var(--line); counter-reset: protocol-step; list-style: none; }
.identity-protocol-steps li { min-height: 120px; padding: .85rem; background: var(--panel-2); color: var(--muted); font-size: .78rem; counter-increment: protocol-step; }
.identity-protocol-steps li::before { display: block; margin-bottom: 1rem; color: var(--acid); content: "0" counter(protocol-step); font: 900 .7rem/1 var(--mono); }
.identity-inspector-panel details { margin-top: 1rem; }
.identity-inspector-panel details > summary { min-height: 44px; color: var(--muted); font: 800 .7rem/1 var(--mono); text-transform: uppercase; }
.identity-architecture { margin: clamp(4rem, 8vw, 7rem) 0; }
.identity-architecture-map { display: flex; align-items: stretch; min-width: 0; overflow-x: auto; border: 1px solid var(--line); background: var(--panel); }
.identity-source-stack { display: grid; flex: 1.25 0 230px; gap: 1px; background: var(--line); }
.identity-source-stack > span { display: flex; justify-content: space-between; gap: 1rem; padding: .65rem .8rem; background: var(--panel-2); font-weight: 800; }
.identity-source-stack small { color: var(--muted); font: 750 .62rem/1.4 var(--mono); text-transform: uppercase; }
.identity-architecture-map > strong { display: grid; place-items: center; flex: 1 0 130px; padding: 1rem; color: var(--paper); font: 850 .75rem/1.5 var(--mono); text-align: center; text-transform: uppercase; }
.identity-arrow { display: grid; place-items: center; flex: 0 0 28px; color: var(--acid); font: 900 1rem/1 var(--mono); }
.identity-federation { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 2rem; margin: 0 0 1rem; border-left: 4px solid var(--violet); }
.identity-federation p:not(.eyebrow) { max-width: 68ch; color: var(--muted); }
.identity-implementation { margin-top: 1rem; padding: 0; overflow: hidden; }
.identity-implementation > summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 64px; padding: 1rem clamp(1.2rem, 3vw, 1.65rem); list-style: none; font-weight: 850; }
.identity-implementation > summary::-webkit-details-marker { display: none; }
.identity-implementation > summary span:last-child { color: var(--muted); font: 750 .68rem/1.4 var(--mono); text-align: right; }
.identity-implementation > summary span:last-child::after { margin-left: .7rem; content: '+'; }
.identity-implementation[open] > summary span:last-child::after { content: '−'; }
.identity-implementation-body { display: grid; grid-template-columns: minmax(240px, .9fr) minmax(0, 1.1fr); gap: 1rem; padding: 1.25rem clamp(1.2rem, 3vw, 1.65rem); border-top: 1px solid var(--line); }
.identity-implementation-body h2 { font-size: 1.6rem; }
.identity-implementation-body .reference-links { align-content: start; margin: 0; }

.info-card, .action-card { padding: 1.35rem; border: 1px solid var(--line); border-radius: 0; background: linear-gradient(145deg, rgb(120 232 255 / 3%), transparent 48%), var(--panel); }
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
.swagger-operation { overflow: hidden; border: 1px solid var(--line); border-radius: 0; background: var(--panel); scroll-margin-top: 1rem; }
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
.schema-browser { margin-top: 1.5rem; overflow: hidden; border: 1px solid var(--line); border-radius: 0; background: var(--panel); }
.schema-browser > summary { display: flex; align-items: center; justify-content: space-between; min-height: 62px; padding: .9rem 1.2rem; list-style: none; font-weight: 800; }
.schema-browser > summary::-webkit-details-marker { display: none; }
.schema-browser > summary > span:last-child::after { content: '  +'; color: var(--muted); }
.schema-browser[open] > summary > span:last-child::after { content: '  −'; }
.schema-grid { display: grid; gap: .75rem; padding: 1rem; border-top: 1px solid var(--line); }
.schema-card { padding: 1.1rem; border: 1px solid var(--line); border-radius: 0; scroll-margin-top: 1rem; }
.schema-card h3 { color: var(--violet); }
.swagger-schema-table { min-width: 580px; }
.schema-source { min-height: 0; }

.api-page-header { max-width: 920px; margin-bottom: 2rem; }
.api-page-header h1, .graphql-page-header h1, .webhook-page-header h1 { max-width: 12ch; }
.api-hero-badges { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: 1.3rem; }
.api-base { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.2rem; border: 1px solid var(--line); background: var(--panel); }
.api-base .eyebrow { margin-bottom: .35rem; }
.api-base h2 { margin: 0; font-size: clamp(1rem, 2vw, 1.35rem); letter-spacing: -.02em; }
.api-base h2 code { color: var(--paper); overflow-wrap: anywhere; }
.api-sandbox { margin: 1rem 0; padding: clamp(1.15rem, 3vw, 1.6rem); border: 1px solid var(--line); background: linear-gradient(135deg, rgb(217 255 67 / 5%), transparent 52%), var(--panel); }
.api-sandbox-heading, .api-operation-heading, .api-contract-heading, .api-response-heading, .api-subheading, .graphql-workspace-heading, .webhook-section-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }
.api-sandbox-heading .eyebrow, .api-operation-heading .eyebrow, .api-contract-heading .eyebrow, .api-response-heading .eyebrow, .graphql-workspace-heading .eyebrow, .webhook-section-heading .eyebrow { margin-bottom: .4rem; }
.api-sandbox-heading h2, .api-contract-heading h2, .api-response-heading h3, .api-subheading h3, .graphql-workspace-heading h2, .webhook-section-heading h2 { margin: 0; }
.api-sandbox > p { max-width: 74ch; color: var(--muted); }
.api-sandbox-actions { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; }
.api-sandbox-actions > span { margin-left: auto; color: var(--muted); font: 800 .7rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.api-token { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; padding: .85rem 1rem; border: 1px solid var(--line); background: var(--panel-2); }
.api-token > div { display: grid; gap: .25rem; min-width: 0; }
.api-token span, .api-token small { color: var(--muted); font: 750 .68rem/1.35 var(--mono); letter-spacing: .05em; text-transform: uppercase; }
.api-token code { overflow: hidden; color: var(--paper); text-overflow: ellipsis; white-space: nowrap; }
.api-explorer { display: grid; grid-template-columns: minmax(250px, 330px) minmax(0, 1fr); gap: 1rem; margin: clamp(2.5rem, 6vw, 5rem) 0; align-items: start; }
.api-endpoint-nav { position: sticky; top: 1rem; border: 1px solid var(--line); background: var(--panel); }
.api-endpoint-nav > div:first-child { padding: 1.15rem; border-bottom: 1px solid var(--line); }
.api-endpoint-nav .eyebrow { margin-bottom: .4rem; }
.api-endpoint-nav h2 { margin: 0; font-size: 1.6rem; }
.api-endpoint-nav [role="tablist"] { display: grid; }
.api-endpoint-nav button { display: grid; grid-template-columns: 4.8rem minmax(0, 1fr); align-items: center; gap: .65rem; min-height: 64px; padding: .65rem .8rem; border: 0; border-bottom: 1px solid var(--line); background: transparent; text-align: left; transform: none; }
.api-endpoint-nav button:last-child { border-bottom: 0; }
.api-endpoint-nav button:hover { background: var(--panel-2); }
.api-endpoint-nav button[aria-selected="true"] { background: var(--panel-2); box-shadow: inset 3px 0 0 var(--acid); }
.api-endpoint-nav button code { color: var(--paper); font-size: .78rem; overflow-wrap: anywhere; }
.api-operation { padding: clamp(1.15rem, 3vw, 1.65rem); border: 1px solid var(--line); background: var(--panel); }
.api-operation-heading h2 { display: flex; align-items: center; flex-wrap: wrap; gap: .65rem; margin: 0; font-size: clamp(1.25rem, 2.5vw, 1.8rem); }
.api-operation-heading h2 code { color: var(--paper); overflow-wrap: anywhere; }
.api-operation-summary { margin-top: 1rem; font-size: 1rem; }
.api-request-controls, .api-code, .api-response { margin-top: 1.35rem; padding-top: 1.2rem; border-top: 1px solid var(--line); }
.api-request-controls > h3 { font-size: 1rem; }
.api-request-controls .swagger-inputs { margin-bottom: 1rem; }
.api-subheading { align-items: center; margin-bottom: .65rem; }
.api-subheading button { min-height: 38px; padding: .4rem .65rem; font-size: .72rem; }
.api-tabs { display: flex; overflow-x: auto; border: 1px solid var(--line); border-bottom: 0; }
.api-tabs button { flex: 0 0 auto; min-height: 44px; padding: .5rem .8rem; border: 0; border-right: 1px solid var(--line); background: transparent; color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; transform: none; }
.api-tabs button[aria-selected="true"] { background: var(--panel-2); color: var(--paper); box-shadow: inset 0 -2px 0 var(--acid); }
.api-code pre, .api-response pre { min-height: 11rem; max-height: 26rem; margin: 0; }
.api-response-heading { align-items: end; margin-bottom: .75rem; }
.api-response-heading p:last-child { margin: 0; color: var(--muted); font: 750 .7rem/1.4 var(--mono); text-align: right; }
.api-response-message { display: flex; align-items: center; flex-wrap: wrap; gap: .45rem 1rem; margin-bottom: .75rem; padding: .8rem 1rem; border-left: 3px solid var(--violet); background: var(--panel-2); }
.api-response-message span { color: var(--muted); }
.api-response-message a { margin-left: auto; font-weight: 800; }
.api-response [data-request-log] { display: inline-flex; margin-top: .85rem; }
.api-contract { margin: clamp(2.5rem, 6vw, 5rem) 0; padding: clamp(1.2rem, 3vw, 1.65rem); border: 1px solid var(--line); background: var(--panel); }
.api-contract dl { margin-top: 1.25rem; }
.api-contract .schema-browser { margin-bottom: 0; }
.api-contract .schema-card { padding: 0; }
.api-contract .schema-card > summary { min-height: 52px; padding: .7rem .85rem; }
.api-contract .schema-card pre { margin: 0; border-width: 1px 0 0; }
.related-interfaces { margin-top: clamp(3rem, 7vw, 6rem); padding-top: 1rem; border-top: 1px solid var(--line); }
.related-interfaces .eyebrow { margin-bottom: .45rem; }

.graphql-page-header, .webhook-page-header { max-width: 980px; margin-bottom: 2.5rem; }
.graphql-workspace { margin-top: 1rem; }
.graphql-workspace-heading { align-items: end; margin-bottom: 1rem; }
.graphql-workspace-heading > p { max-width: 48ch; margin: 0; color: var(--muted); text-align: right; }
.graphql-frame { height: min(74vh, 820px); min-height: 600px; }
.graphql-control-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; border: 1px solid var(--line); background: var(--line); }
.graphql-control-grid article { display: grid; gap: .4rem; min-height: 120px; padding: 1.1rem; background: var(--panel); }
.graphql-control-grid strong { color: var(--acid); font: 900 clamp(1.35rem, 3vw, 2rem)/1 var(--mono); }
.graphql-control-grid span { align-self: end; color: var(--muted); font: 800 .68rem/1.3 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.graphql-shared { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; margin-top: 2rem; }
.graphql-shared h2 { margin-bottom: .45rem; }
.graphql-shared p:last-child { margin: 0; color: var(--muted); }
.graphql-shared .button { flex: 0 0 auto; }

.webhook-connection { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; padding: clamp(1.2rem, 3vw, 1.65rem); border: 1px solid var(--line); background: var(--panel); }
.webhook-connection > div .eyebrow { margin-bottom: .4rem; }
.webhook-connection h2 { margin: 0; }
.webhook-connection dl { grid-column: 1 / -1; padding-top: 1rem; border-top: 1px solid var(--line); }
.webhook-tags { display: flex; flex-wrap: wrap; gap: .35rem; }
.webhook-tags span, .webhook-event-checks span { padding: .28rem .48rem; border: 1px solid var(--line); color: var(--muted); font: 750 .66rem/1 var(--mono); }
.webhook-test { margin-top: 1rem; }
.webhook-section-heading > div { max-width: 760px; }
.webhook-section-heading > div > p:last-child { color: var(--muted); }
.webhook-pipeline { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 1px; margin: 1.5rem 0 0 !important; padding: 0 !important; overflow-x: auto; border: 1px solid var(--line); background: var(--line); list-style: none; }
.webhook-pipeline li { position: relative; display: grid; align-content: space-between; gap: 1rem; min-height: 125px; margin: 0; padding: .85rem; background: var(--panel-2); }
.webhook-pipeline li:not(:last-child)::after { position: absolute; z-index: 1; right: -.45rem; top: 50%; width: .8rem; height: .8rem; border-top: 1px solid var(--acid); border-right: 1px solid var(--acid); background: var(--panel-2); content: ''; transform: translateY(-50%) rotate(45deg); }
.webhook-pipeline span { color: var(--acid); font: 900 .7rem/1 var(--mono); }
.webhook-pipeline strong { color: var(--paper); font-size: .82rem; }
.webhook-deliveries { margin-top: clamp(3rem, 7vw, 5rem); }
.webhook-events { margin-top: 1rem; }
.webhook-event { padding: 1.2rem; }
.webhook-event-checks { display: flex; flex-wrap: wrap; gap: .35rem; margin: .8rem 0; }
.webhook-event-checks span { border-color: var(--acid); color: var(--acid); }
.webhook-event details summary { min-height: 44px; color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .07em; text-transform: uppercase; }
.webhook-empty { display: grid; gap: .35rem; padding: 2rem; border: 1px dashed var(--line); color: var(--muted); text-align: center; }
.webhook-empty strong { color: var(--paper); }

.resource-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--line); border-radius: 0; background: var(--line); }
.resource-list a { display: grid; gap: .25rem; min-height: 72px; padding: .9rem 1rem; background: var(--panel); text-decoration: none; }
.resource-list a:hover { background: var(--panel-2); }
.resource-list strong { font-size: .95rem; }
.resource-list code { color: var(--muted); font-size: .75rem; overflow-wrap: anywhere; }
.machine-links { margin-top: 2rem; }
.machine-links h2 { margin-bottom: .5rem; font-size: 1.25rem; }
.link-row, .button-row { display: flex; flex-wrap: wrap; gap: .45rem; }
.button-row { margin-top: 1rem; }

.mcp-page-header { max-width: 1120px; margin-bottom: 2.5rem; }
.mcp-page-header h1 { max-width: 12ch; }
.mcp-badges { display: flex; flex-wrap: wrap; gap: .45rem; margin: 1.35rem 0; }
.mcp-endpoint { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .7rem; max-width: 930px; padding: .7rem; border: 1px solid var(--line); background: var(--panel); }
.mcp-endpoint > span { padding-left: .3rem; color: var(--muted); font: 800 .65rem/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.mcp-endpoint code { min-width: 0; overflow-wrap: anywhere; color: var(--paper); }
.mcp-endpoint button { min-height: 40px; padding: .5rem .7rem; font-size: .76rem; }
.mcp-section { scroll-margin-top: 1rem; }
.mcp-connect { padding: 0; overflow: hidden; }
.mcp-tabs { display: flex; overflow-x: auto; border-bottom: 1px solid var(--line); }
.mcp-tabs button { flex: 1 0 auto; justify-content: center; min-height: 56px; border: 0; border-right: 1px solid var(--line); background: transparent; color: var(--muted); font: 800 .72rem/1 var(--mono); letter-spacing: .07em; text-transform: uppercase; }
.mcp-tabs button:last-child { border-right: 0; }
.mcp-tabs button:hover { background: var(--panel-2); color: var(--paper); transform: none; }
.mcp-tabs button[aria-selected="true"] { background: var(--panel-2); color: var(--paper); box-shadow: inset 0 -3px 0 var(--acid); }
.mcp-tab-panel { min-height: 340px; padding: clamp(1.25rem, 3vw, 2rem); }
.mcp-tab-panel .eyebrow span { color: var(--muted); letter-spacing: .08em; }
.mcp-tab-panel h3 { font-size: clamp(1.45rem, 2.5vw, 2.1rem); }
.mcp-tab-panel blockquote { margin: 1rem 0; padding: 1rem 1.15rem; border-left: 3px solid var(--violet); background: var(--panel-2); font-size: 1rem; }
.mcp-command { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: .55rem; margin: 1rem 0 1.35rem; }
.mcp-command pre { min-height: 60px; max-height: 20rem; margin: 0; color: var(--paper); }
.mcp-command button { min-height: 52px; }
.mcp-command-tall pre { max-height: 31rem; }
.mcp-copy-status { min-height: 1.3rem; margin: 0; padding: 0 clamp(1.25rem, 3vw, 2rem) 1rem; color: var(--acid); font: 750 .72rem/1.4 var(--mono); }
.mcp-tool-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.mcp-tool-card { margin: 0; }
.mcp-tool-card > div:first-child { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.mcp-tool-card > div:first-child > code { color: var(--paper); font-size: 1.15rem; font-weight: 850; }
.mcp-tool-card > p { min-height: 3.2rem; color: var(--muted); }
.mcp-tool-card dl { grid-template-columns: 70px minmax(0, 1fr); }
.mcp-tool-card pre { min-height: 0; max-height: 11rem; margin: 0 0 .7rem; font-size: .72rem; }
.mcp-activity { margin: 0; overflow: hidden; }
.mcp-activity-state { display: flex; align-items: center; gap: .65rem; margin: calc(clamp(1.2rem, 3vw, 1.65rem) * -1) calc(clamp(1.2rem, 3vw, 1.65rem) * -1) 1.4rem; padding: .9rem clamp(1.2rem, 3vw, 1.65rem); border-bottom: 1px solid var(--line); background: var(--panel-2); }
.mcp-activity-state strong { color: var(--acid); font: 900 .72rem/1 var(--mono); letter-spacing: .12em; }
.mcp-activity-state > span:last-child { margin-left: auto; color: var(--muted); font: 700 .7rem/1.3 var(--mono); }
.mcp-pulse { width: .55rem; height: .55rem; border-radius: 50%; background: var(--acid); box-shadow: 0 0 0 .28rem rgb(217 255 67 / 10%); }
.mcp-activity-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; border: 1px solid var(--line); background: var(--line); }
.mcp-activity-grid > div { min-width: 0; padding: .9rem; background: var(--panel-2); }
.mcp-activity-grid dt { margin-bottom: .45rem; }
.mcp-activity-grid dd { overflow-wrap: anywhere; font: 800 .82rem/1.35 var(--mono); }
.mcp-evidence-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin: 1rem 0; }
.mcp-evidence-grid details { border: 1px solid var(--line); }
.mcp-evidence-grid summary { display: flex; align-items: center; min-height: 46px; padding: .65rem .8rem; list-style: none; color: var(--muted); font: 800 .66rem/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.mcp-evidence-grid summary::-webkit-details-marker { display: none; }
.mcp-evidence-grid summary::after { margin-left: auto; content: '+'; }
.mcp-evidence-grid details[open] summary::after { content: '−'; }
.mcp-evidence-grid pre { min-height: 8rem; margin: 0; border: 0; border-top: 1px solid var(--line); font-size: .72rem; }
.mcp-architecture { margin: 0; }
.mcp-flow { display: grid; grid-template-columns: repeat(11, auto); align-items: center; gap: .5rem; margin-bottom: 1.5rem; padding: 1rem; overflow-x: auto; border: 1px solid var(--line); background: var(--panel-2); }
.mcp-flow strong { padding: .65rem .7rem; border: 1px solid var(--line); font: 800 .68rem/1.25 var(--mono); text-align: center; white-space: nowrap; }
.mcp-flow span { color: var(--acid); font: 900 1rem/1 var(--mono); }
.mcp-architecture h3 { font-size: clamp(1.4rem, 2.7vw, 2.2rem); }
.mcp-architecture p { max-width: 76ch; color: var(--muted); }
.mcp-pager { justify-content: space-between; margin-top: 2.5rem; }

footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .9rem; padding: 1.6rem 0 2.6rem; border-top: 1px solid var(--line); color: var(--muted); font: .7rem/1.6 var(--mono); letter-spacing: .04em; text-transform: uppercase; }
footer a { color: var(--paper); }

@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
@media (max-width: 900px) {
  .home-header { grid-template-columns: 1fr; }
  .home-header .eyebrow { grid-column: auto; margin-bottom: 0; }
  .home-header h1 { max-width: 11ch; }
  .home-lede { max-width: 42rem; }
  .identity-provider-grid { grid-template-columns: 1fr; }
  .identity-architecture-map > strong { flex-basis: 115px; }
  .mcp-activity-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .api-explorer { grid-template-columns: 1fr; }
  .api-endpoint-nav { position: static; }
  .api-endpoint-nav [role="tablist"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .api-endpoint-nav button { border-right: 1px solid var(--line); }
  .graphql-control-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  header { align-items: flex-start; flex-wrap: wrap; }
  .nav { flex: 0 0 100%; justify-content: flex-start; padding-top: .75rem; border-top: 1px solid var(--line); }
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
  header, main, footer, .bar { width: min(100% - 24px, var(--shell-width)); }
  header { align-items: flex-start; flex-direction: column; gap: .6rem; }
  .nav { justify-content: flex-start; }
  main { padding: 4rem 0 5rem; }
  h1 { font-size: clamp(3.1rem, 15vw, 5.4rem); }
  dl { grid-template-columns: 1fr; gap: .2rem 0; }
  dd { margin-bottom: .7rem; }
  .section-head { flex-direction: column; gap: .3rem; }
  .status-strip { flex-direction: column; }
  .swagger-operation > summary { grid-template-columns: 1fr auto; gap: .55rem; }
  .swagger-operation > summary .swagger-route { grid-column: 1 / -1; }
  .info-grid, .action-grid { grid-template-columns: 1fr; }
  .lab-grid { grid-template-columns: 1fr; }
  .lab-grid aside { position: static; }
  .d1-table-panel { min-height: 0; }
  .d1-table-heading, .d1-editor-heading, .d1-sandbox { align-items: stretch; flex-direction: column; }
  .d1-table-heading .button-primary, .d1-sandbox > button { justify-content: center; width: 100%; }
  .d1-implementation > summary { align-items: flex-start; flex-direction: column; }
  .d1-implementation-body { grid-template-columns: 1fr; }
  .graphql-frame { min-height: 620px; }
  .api-base, .api-token, .api-sandbox-heading, .api-operation-heading, .api-contract-heading, .api-response-heading, .graphql-workspace-heading, .graphql-shared, .webhook-section-heading { align-items: flex-start; flex-direction: column; }
  .api-base button, .api-token button, .graphql-shared .button, .webhook-section-heading > button { justify-content: center; width: 100%; }
  .api-sandbox-actions { align-items: stretch; flex-direction: column; }
  .api-sandbox-actions > span { margin: .35rem 0 0; }
  .api-endpoint-nav [role="tablist"] { grid-template-columns: 1fr; }
  .api-endpoint-nav button { border-right: 0; }
  .api-operation-heading h2 { align-items: flex-start; flex-direction: column; }
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
  .identity-implementation > summary { align-items: flex-start; flex-direction: column; }
  .identity-implementation > summary span:last-child { text-align: left; }
  .identity-implementation-body { grid-template-columns: 1fr; }
  .mcp-endpoint { grid-template-columns: 1fr; }
  .mcp-endpoint > span { padding-left: 0; }
  .mcp-command { grid-template-columns: 1fr; }
  .mcp-command button { justify-content: center; }
  .mcp-tool-grid, .mcp-evidence-grid, .mcp-activity-grid { grid-template-columns: 1fr; }
  .mcp-tool-card > p { min-height: 0; }
  .mcp-activity-state { align-items: flex-start; flex-wrap: wrap; }
  .mcp-activity-state > span:last-child { flex: 1 0 100%; margin-left: 1.2rem; }
  footer { flex-direction: column; }
}
`;
