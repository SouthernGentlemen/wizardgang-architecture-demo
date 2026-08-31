export const styles = `
:root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; background: #f6f6f2; color: #111; }
a { color: inherit; }
header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
header { padding: 28px 0 18px; display: flex; justify-content: space-between; gap: 20px; align-items: baseline; border-bottom: 1px solid #c9c9c2; }
.brand { font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.subtle { color: #65655f; }
main { padding: 40px 0 64px; }
h1 { font-size: clamp(2.2rem, 7vw, 5rem); line-height: .92; margin: 0 0 18px; max-width: 850px; }
h2 { margin-top: 48px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.card { display: block; text-decoration: none; border: 1px solid #c9c9c2; padding: 18px; background: #fff; min-height: 150px; }
.card:hover, .card:focus-visible { outline: 3px solid #111; outline-offset: 2px; }
.eyebrow { text-transform: uppercase; letter-spacing: .12em; font-size: .72rem; font-weight: 800; }
.badge { display: inline-block; border: 1px solid currentColor; border-radius: 999px; padding: 3px 8px; font-size: .72rem; }
.meta { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0 24px; }
.panel { border: 1px solid #c9c9c2; background: #fff; padding: 20px; margin: 24px 0; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
button { font: inherit; font-weight: 700; padding: 10px 14px; border: 1px solid #111; background: #111; color: #fff; cursor: pointer; }
.filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; }
.filters label { display: grid; gap: 5px; font-weight: 700; }
input, select { font: inherit; padding: 9px 10px; border: 1px solid #777; background: #fff; color: #111; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th, td { text-align: left; vertical-align: top; padding: 10px; border-bottom: 1px solid #d8d8d0; }
th { white-space: nowrap; }
details pre { max-width: 520px; margin: 8px 0 0; }
button:focus-visible, a:focus-visible { outline: 3px solid #7a9400; outline-offset: 3px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #111; color: #fff; padding: 14px; min-height: 52px; }
footer { border-top: 1px solid #c9c9c2; padding: 22px 0 40px; color: #65655f; }
`;
