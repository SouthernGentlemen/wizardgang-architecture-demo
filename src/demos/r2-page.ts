import type { Env } from '../types';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

export function renderR2Demo(env: Env): Response {
  return shell(env, 'Cloudflare R2', `
<section class="page-header">
  <p class="eyebrow">Platform / /r2</p><h1>R2 file manager</h1>
  <p class="lede">Upload a real object, inspect R2 and D1 metadata, preview or download it, delete it, and reset only this browser's objects.</p>
  <div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/demos/r2.ts')}">Route source</a>${referenceDetails([
    { label: 'Page implementation', href: sourceUrl(env, 'src/demos/r2-page.ts') },
    { label: 'Worker implementation', href: sourceUrl(env, 'src/api/r2.ts') },
    { label: 'R2 storage boundary', href: sourceUrl(env, 'src/storage/r2.ts') },
    { label: 'Metadata schema', href: sourceUrl(env, 'migrations/0008_interactive_demo.sql') },
    { label: 'Tests', href: sourceUrl(env, 'tests/r2-lab.test.ts') },
    { label: 'CI workflow', href: sourceUrl(env, '.github/workflows/ci.yml') },
  ], 'Source evidence')}</div>
</section>

<section class="lab-grid" aria-label="R2 demonstration">
  <div>
    <section class="panel" aria-labelledby="upload-heading">
      <p class="eyebrow">Demo / put object</p><h2 id="upload-heading">Upload</h2>
      <form data-upload-form><label class="drop-zone" data-drop-zone>Drop one file here or choose a file<input name="file" type="file" required></label><div class="button-row"><button class="button-primary" type="submit">Upload to R2</button><button type="button" data-refresh>Refresh objects</button></div></form>
      <p class="subtle">Maximum 5 MiB per object, 10 objects and 20 MiB per visitor sandbox. SVG and HTML are download-only.</p>
    </section>
    <section class="panel" aria-labelledby="objects-heading">
      <div class="lab-heading"><div><p class="eyebrow">Objects / visible scope</p><h2 id="objects-heading">Files</h2></div><span class="badge" data-count>Loading</span></div>
      <div class="file-list" data-files><p>Loading R2 objects…</p></div>
    </section>
    <section class="panel" aria-labelledby="preview-heading" data-preview-panel hidden>
      <div class="lab-heading"><div><p class="eyebrow">Preview / same origin</p><h2 id="preview-heading" data-preview-title>Preview</h2></div><a class="button" data-download>Download</a></div>
      <div class="file-preview"><iframe title="Selected R2 object preview" data-preview></iframe></div>
    </section>
  </div>
  <aside>
    <section class="panel technical-state"><p class="eyebrow">Live technical state</p><h2>Latest R2 operation</h2><dl data-file-meta><dt>Binding</dt><dd><code>DEMO_R2</code></dd><dt>Bucket</dt><dd><code>wizardgang-demo-r2</code></dd><dt>Status</dt><dd>Waiting</dd></dl><pre aria-live="polite" data-r2-output>Choose an action to inspect its measured Worker and object metadata.</pre></section>
    <section class="panel"><p class="eyebrow">Architecture</p><h2>Bytes and metadata stay separate</h2><p>R2 owns file bytes. D1 stores only bounded metadata and the visitor ownership reference used for listing and cleanup. The Worker derives every key and compensates if metadata persistence fails.</p></section>
    <section class="panel"><p class="eyebrow">Reset</p><h2>Remove my uploads</h2><p>Shared seed objects stay intact. Reset enumerates and deletes only explicit keys inside this signed visitor prefix.</p><button type="button" data-r2-reset>Reset R2 demo</button><p role="status" class="subtle" data-r2-reset-status></p></section>
  </aside>
</section>

<script>
(() => {
  const state = { files: [] };
  const filesSlot = document.querySelector('[data-files]'); const output = document.querySelector('[data-r2-output]'); const meta = document.querySelector('[data-file-meta]');
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const size = (bytes) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KiB' : (bytes / 1048576).toFixed(1) + ' MiB';
  const call = async (path, options = {}) => { output.textContent = 'Running…'; const started = performance.now(); const response = await fetch(path, options); const payload = await response.json().catch(() => ({error:'non_json_response'})); meta.innerHTML = '<dt>Binding</dt><dd><code>DEMO_R2</code></dd><dt>Bucket</dt><dd><code>wizardgang-demo-r2</code></dd><dt>Operation</dt><dd><code>' + escape(payload.operation || options.method || 'GET') + '</code></dd><dt>Status</dt><dd>' + response.status + '</dd><dt>Round trip</dt><dd>' + (performance.now() - started).toFixed(1) + ' ms</dd><dt>Objects</dt><dd>' + escape(payload.objectCount ?? '—') + '</dd><dt>Bytes</dt><dd>' + escape(payload.bytes ?? '—') + '</dd>'; output.textContent = JSON.stringify(payload, null, 2); if (!response.ok) throw new Error(payload.error || 'Request failed'); return payload; };
  const render = () => { document.querySelector('[data-count]').textContent = state.files.length + ' objects'; filesSlot.innerHTML = state.files.map((file) => '<article class="file-row"><div><strong>' + escape(file.displayName) + '</strong><code>' + escape(file.key) + '</code><span>' + escape(file.contentType) + ' · ' + size(file.sizeBytes) + ' · ' + escape(file.ownership) + '</span></div><div class="button-row">' + (file.canPreview ? '<button type="button" data-preview-id="' + escape(file.id) + '">Preview</button>' : '') + '<a class="button" href="/__api/r2/files/' + encodeURIComponent(file.id) + '?download=1">Download</a>' + (file.canDelete ? '<button type="button" data-delete-id="' + escape(file.id) + '">Delete</button>' : '') + '</div></article>').join('') || '<p>No objects.</p>'; };
  const load = async () => { const payload = await call('/__api/r2/files'); state.files = payload.result.files; render(); };
  document.querySelector('[data-upload-form]').addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; try { await call('/__api/r2/files', {method:'POST', body:new FormData(form)}); form.reset(); await load(); } catch (_) {} });
  const zone = document.querySelector('[data-drop-zone]'); zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.dataset.drag = 'true'; }); zone.addEventListener('dragleave', () => delete zone.dataset.drag); zone.addEventListener('drop', (event) => { event.preventDefault(); delete zone.dataset.drag; const input = zone.querySelector('input'); if (event.dataTransfer.files.length) { input.files = event.dataTransfer.files; input.focus(); } });
  document.addEventListener('click', async (event) => { const button = event.target.closest('button'); if (!button) return; if (button.hasAttribute('data-refresh')) load().catch(() => {}); if (button.dataset.previewId) { const file = state.files.find((item) => item.id === button.dataset.previewId); const panel = document.querySelector('[data-preview-panel]'); panel.hidden = false; document.querySelector('[data-preview-title]').textContent = file.displayName; document.querySelector('[data-preview]').src = '/__api/r2/files/' + encodeURIComponent(file.id); document.querySelector('[data-download]').href = '/__api/r2/files/' + encodeURIComponent(file.id) + '?download=1'; panel.scrollIntoView({block:'nearest'}); } if (button.dataset.deleteId && confirm('Delete this R2 object?')) { try { await call('/__api/r2/files/' + encodeURIComponent(button.dataset.deleteId), {method:'DELETE'}); await load(); } catch (_) {} } });
  document.querySelector('[data-r2-reset]').addEventListener('click', async () => { const status = document.querySelector('[data-r2-reset-status]'); status.textContent = 'Resetting…'; try { await call('/__api/r2/reset', {method:'POST'}); await load(); status.textContent = 'Your uploads were removed.'; } catch (_) { status.textContent = 'Reset failed.'; } });
  load().catch(() => {});
})();
</script>`, { activeRoute: '/r2', cacheControl: 'no-store' });
}

