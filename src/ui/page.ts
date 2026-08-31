import type { DemoDefinition, Env } from '../types';
import { escapeHtml } from '../lib/html';
import { repoUrl, sourceUrl } from '../lib/github';
import { styles } from './styles';
import { withSecurityHeaders } from '../lib/http';

export function shell(env: Env, title: string, body: string, options: { cacheControl?: string } = {}): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · WizardGang Architecture Demo</title>
  <style>${styles}</style>
</head>
<body>
<header>
  <a class="brand" href="/">WizardGang / Architecture Demo</a>
  <a href="${escapeHtml(repoUrl(env))}">Public repository</a>
</header>
<main>${body}</main>
<footer>WG-ARCH-001 companion · WCAG 2.2 / ISO/IEC 27001 / ISO/IEC 42001 references are alignment targets, not certification claims.</footer>
</body>
</html>`;
  const headers = withSecurityHeaders(new Headers({ 'content-type': 'text/html; charset=utf-8' }));
  if (options.cacheControl) headers.set('cache-control', options.cacheControl);
  return new Response(html, { headers });
}

export function renderIndex(env: Env, demos: DemoDefinition[]): Response {
  const groups = [...new Set(demos.map((demo) => demo.group))];
  const body = `
<section>
  <div class="eyebrow">WG-ARCH-001 / executable companion</div>
  <h1>Architecture you can inspect.</h1>
  <p class="subtle">Every architecture concept has a stable route, a dedicated source module, and a direct link to the public code that implements it.</p>
</section>
${groups.map((group) => `
<section>
  <h2>${escapeHtml(group)}</h2>
  <div class="grid">
    ${demos.filter((d) => d.group === group).map((demo) => `
      <a class="card" href="${escapeHtml(demo.route)}">
        <div class="eyebrow">${escapeHtml(demo.route)}</div>
        <h3>${escapeHtml(demo.title)}</h3>
        <p>${escapeHtml(demo.summary)}</p>
        <span class="badge">${escapeHtml(demo.status)}</span>
      </a>`).join('')}
  </div>
</section>`).join('')}`;
  return shell(env, 'Architecture', body);
}

export function renderDemo(env: Env, demo: DemoDefinition): Response {
  const action = demo.action ?? { label: 'Run baseline demo', method: 'POST' as const, path: '/__api/demo/run', body: { demoId: demo.id } };
  const operationsNav = demo.group === 'Operations' ? `
<section class="panel" aria-labelledby="operations-heading">
  <h2 id="operations-heading">Operations surface</h2>
  <div class="meta">
    <a href="/dashboard">Dashboard</a>
    <a href="/dashboard/uptime">Uptime</a>
    <a href="/dashboard/health">Health</a>
    <a href="/dashboard/docs">Docs</a>
    <a href="/dashboard/logs">Logs</a>
    <a href="/dashboard/billing">Billing & usage</a>
    <a href="/health">Health JSON</a>
    <a href="/version">Version JSON</a>
    <a href="${escapeHtml(sourceUrl(env, 'docs/OPERATIONS.md'))}">Operations design</a>
  </div>
  <p class="subtle">Operations routes stay reachable during intentional demo-offline windows. Billing data is synthetic and public-safe by design.</p>
</section>` : '';
  const body = `
<section>
  <div class="eyebrow">${escapeHtml(demo.group)} / ${escapeHtml(demo.route)}</div>
  <h1>${escapeHtml(demo.title)}</h1>
  <p>${escapeHtml(demo.summary)}</p>
  <div class="meta">
    <span class="badge">${escapeHtml(demo.status)}</span>
    <a href="${escapeHtml(sourceUrl(env, demo.sourcePath))}">View route source</a>
    <a href="${escapeHtml(sourceUrl(env, 'src/router.ts'))}">View router</a>
    <a href="${escapeHtml(sourceUrl(env, 'migrations/0001_demo_blob.sql'))}">View shared D1 schema</a>
    <a href="${escapeHtml(sourceUrl(env, 'docs/ROUTES.md'))}">View route map</a>
    ${(demo.supportingSources ?? []).map((source) => `<a href="${escapeHtml(sourceUrl(env, source.path))}">${escapeHtml(source.label)}</a>`).join('')}
    ${(demo.repositoryLinks ?? []).map((link) => `<a href="${escapeHtml(`${repoUrl(env)}${link.path}`)}">${escapeHtml(link.label)}</a>`).join('')}
  </div>
</section>
${operationsNav}
${demo.interfaces?.length ? `<section class="panel" aria-labelledby="interfaces-heading"><h2 id="interfaces-heading">Live interfaces</h2><ul>${demo.interfaces.map((item) => `<li><code>${escapeHtml(item.method)} ${escapeHtml(item.path)}</code> — ${escapeHtml(item.description)}</li>`).join('')}</ul></section>` : ''}
<section class="panel" aria-labelledby="proves-heading">
  <h2 id="proves-heading">This route proves</h2>
  <ul>${demo.proves.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
</section>
<section class="panel" aria-labelledby="run-heading">
  <h2 id="run-heading">Run or inspect the capability</h2>
  <p>This action calls the live Worker interface listed above. Meaningful demo actions emit safe audit or operational evidence to <code>demo-blob</code>.</p>
  <button type="button" data-run-demo>${escapeHtml(action.label)}</button>
  <pre aria-live="polite" data-demo-output>Ready.</pre>
</section>
<script>
(() => {
  const button = document.querySelector('[data-run-demo]');
  const output = document.querySelector('[data-demo-output]');
  button?.addEventListener('click', async () => {
    output.textContent = 'Running…';
    try {
      const response = await fetch(${JSON.stringify(action.path)}, {
        method: ${JSON.stringify(action.method)},
        ${action.body === undefined ? '' : `headers: { 'content-type': 'application/json' }, body: JSON.stringify(${JSON.stringify(action.body)})`}
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json') ? await response.json() : await response.text();
      output.textContent = JSON.stringify(result, null, 2);
    } catch (error) {
      output.textContent = String(error);
    }
  });
})();
</script>`;
  return shell(env, demo.title, body);
}

export function renderNotFound(env: Env): Response {
  const response = shell(env, 'Not found', '<h1>404</h1><p>That demo route does not exist.</p><p><a href="/">Return to architecture map</a></p>');
  return new Response(response.body, { status: 404, headers: response.headers });
}
