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

header, main, footer, .bar { width: min(1240px, 100% - 40px); margin-inline: auto; }
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

main { padding: clamp(2.5rem, 6vw, 4.5rem) 0 5rem; }
h1 { max-width: 20ch; margin: 0 0 1.1rem; font-size: clamp(2.6rem, 7vw, 5.6rem); line-height: .88; letter-spacing: -.055em; }
h2 { margin: 0 0 1rem; font-size: clamp(1.5rem, 3vw, 2.1rem); line-height: 1; letter-spacing: -.03em; }
h3 { margin: 0 0 .55rem; font-size: 1.28rem; line-height: 1.05; letter-spacing: -.02em; }
p { margin: 0 0 1rem; }
.lede { max-width: 62ch; color: var(--muted); font-size: clamp(1rem, 1.5vw, 1.15rem); }
.subtle { color: var(--muted); }
.eyebrow { margin: 0 0 1rem; color: var(--acid); font: 800 .72rem/1.4 var(--mono); letter-spacing: .18em; text-transform: uppercase; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin: 3.5rem 0 1.1rem; padding-top: 1.1rem; border-top: 1px solid var(--line); }
.section-head h2 { margin: 0; }
.section-head > span { color: var(--muted); font: 800 .68rem/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(255px, 1fr)); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
.card { display: flex; flex-direction: column; padding: 1.35rem; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--panel); color: inherit; text-decoration: none; }
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

.panel { margin: 1rem 0; padding: clamp(1.2rem, 3vw, 1.8rem); border: 1px solid var(--line); background: var(--panel); }
.panel > :last-child { margin-bottom: 0; }
.panel ul, .panel ol { margin: 0 0 1rem; padding-left: 1.1rem; }
.panel li { margin-bottom: .4rem; color: var(--muted); }
.panel li strong { color: var(--paper); }

.button, button { display: inline-flex; align-items: center; min-height: 46px; padding: .6rem 1rem; border: 1px solid var(--line); background: var(--panel-2); color: var(--paper); cursor: pointer; font: 850 .88rem/1 inherit; font-family: inherit; text-decoration: none; transition: transform .16s, border-color .16s; }
.button:hover, button:hover { transform: translateY(-2px); border-color: var(--muted); }
.button-primary, button[data-run-demo] { border-color: var(--acid); background: var(--acid); color: var(--button-text); }
.button-primary:hover, button[data-run-demo]:hover { border-color: var(--paper); }
@media (prefers-reduced-motion: reduce) { .button, button { transition: none; } .button:hover, button:hover { transform: none; } }

code { font-family: var(--mono); font-size: .92em; color: var(--violet); }
pre { margin: .85rem 0 0; padding: 1rem; min-height: 52px; max-height: 26rem; overflow: auto; border: 1px solid var(--line); background: var(--panel-2); color: var(--paper); font: .82rem/1.6 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; }

dl { display: grid; grid-template-columns: minmax(140px, 1fr) 2fr; gap: .6rem 1.4rem; margin: 0; }
dt { color: var(--muted); font: 800 .7rem/1.5 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
dd { margin: 0; }

.filters { display: flex; flex-wrap: wrap; align-items: end; gap: .7rem; }
.filters label, .field { display: grid; gap: .35rem; }
label, legend, .field > span { color: var(--muted); font: 800 .68rem/1.2 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
input, select, textarea { min-height: 46px; padding: .55rem .7rem; border: 1px solid var(--line); border-radius: 0; background: var(--panel-2); color: var(--paper); font: 400 .95rem/1.4 inherit; font-family: inherit; }
textarea { min-height: 6rem; }
input::placeholder, textarea::placeholder { color: var(--muted); }
.error { border-left: 3px solid #ff9d9d; padding-left: .7rem; }
:root[data-theme="light"] .error { border-left-color: #a11; }

.table-wrap { overflow-x: auto; border: 1px solid var(--line); }
table { width: 100%; border-collapse: collapse; font-size: .86rem; }
th, td { padding: .65rem .8rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
th { color: var(--muted); font: 800 .66rem/1.3 var(--mono); letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
tbody tr:last-child td { border-bottom: 0; }
td code { font-size: .8rem; }
details pre { max-width: 520px; }
summary { cursor: pointer; }

footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .9rem; padding: 1.6rem 0 2.6rem; border-top: 1px solid var(--line); color: var(--muted); font: .7rem/1.6 var(--mono); text-transform: uppercase; }
footer a { color: var(--paper); }

@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
@media (max-width: 620px) {
  header, main, footer, .bar { width: min(100% - 24px, 1240px); }
  header { align-items: flex-start; flex-direction: column; gap: .6rem; }
  .nav { justify-content: flex-start; }
  h1 { font-size: clamp(2.3rem, 12vw, 3.4rem); }
  dl { grid-template-columns: 1fr; gap: .2rem 0; }
  dd { margin-bottom: .7rem; }
  .section-head { flex-direction: column; gap: .3rem; }
}
`;
