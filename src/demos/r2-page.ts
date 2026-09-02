import type { Env } from '../types';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

export function renderR2Demo(env: Env): Response {
  return shell(env, 'Cloudflare R2', `
<section class="page-header lab-page-header">
  <p class="eyebrow">Platform / R2</p>
  <h1>Cloudflare R2 Storage</h1>
  <p class="lede">Upload a file and inspect how its bytes and metadata move through the live stack.</p>
  <div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/demos/r2.ts')}">View source <span aria-hidden="true">↗</span></a></div>
</section>

<section class="lab-grid r2-lab" aria-label="R2 storage demonstration">
  <section class="panel r2-workspace" aria-labelledby="sandbox-heading">
    <div class="r2-workspace-heading">
      <div><p class="eyebrow">Live storage workspace</p><h2 id="sandbox-heading">Your R2 sandbox</h2></div>
      <strong class="sandbox-usage" data-sandbox-usage>Loading usage…</strong>
    </div>

    <div class="r2-upload-block">
      <form data-upload-form novalidate>
        <label class="drop-zone" data-drop-zone>
          <input class="r2-file-input" name="file" type="file" data-file-input>
          <span class="drop-zone-icon" aria-hidden="true">↑</span>
          <strong class="drop-zone-title">Drop a file here</strong>
          <span>or <span class="browse-file">Browse files</span></span>
          <span class="drop-limit">5 MiB maximum</span>
        </label>
        <div class="file-selection" data-file-selection hidden>
          <div><strong data-selected-name>No file selected</strong><span data-selected-meta></span></div>
          <button class="icon-button" type="button" data-clear-selection aria-label="Clear selected file">×</button>
        </div>
        <div class="upload-actions">
          <button class="button-primary" type="submit" data-upload-button disabled>Upload file</button>
          <p class="operation-status" role="status" aria-live="polite" data-operation-status>Select one file to begin.</p>
        </div>
      </form>
    </div>

    <div class="r2-files-heading">
      <div><p class="eyebrow">Objects in this session</p><h3>Files</h3></div>
      <div class="file-count-actions"><span class="badge" data-count>Loading</span><button class="icon-button" type="button" data-refresh aria-label="Refresh files" title="Refresh files">↻</button></div>
    </div>
    <div class="file-list" data-files><p class="file-list-empty">Loading R2 objects…</p></div>

    <div class="sandbox-reset">
      <div><strong>Finished exploring?</strong><span>Shared demo files stay in place.</span></div>
      <button class="danger-text-button" type="button" data-r2-reset disabled>Reset sandbox</button>
      <div class="reset-confirm" data-reset-confirm hidden>
        <span>Delete all of your uploads?</span>
        <button class="danger-button" type="button" data-confirm-reset>Confirm reset</button>
        <button type="button" data-cancel-reset>Cancel</button>
      </div>
    </div>
  </section>

  <aside class="r2-sidebar">
    <section class="panel live-request-card" aria-labelledby="request-heading">
      <div class="lab-heading"><div><p class="eyebrow">Live request</p><h2 id="request-heading">Latest operation</h2></div><span class="request-state" data-live-state>Waiting</span></div>
      <div class="live-request-summary">
        <div><span>Method</span><strong data-request-method>—</strong></div>
        <div><span>Status</span><strong data-request-status>—</strong></div>
        <div><span>Round trip</span><strong data-request-duration>—</strong></div>
      </div>
      <p class="request-metrics" data-request-metrics>Choose an action to inspect the live result.</p>
      <details class="r2-response-details"><summary>View response JSON</summary><pre data-r2-output>No request yet.</pre></details>
      <details class="r2-technical-details"><summary>Storage details</summary><dl><dt>Binding</dt><dd><code>DEMO_R2</code></dd><dt>Bucket</dt><dd><code>wizardgang-demo-r2</code></dd></dl></details>
    </section>

    <section class="panel how-it-works" aria-labelledby="flow-heading">
      <p class="eyebrow">How this works</p><h2 id="flow-heading">One request, two stores</h2>
      <div class="storage-flow" role="img" aria-label="The browser sends a request to the Worker. The Worker stores object bytes in R2 and bounded metadata in D1.">
        <div><span>Browser</span><i aria-hidden="true">→</i><span>Worker</span><i aria-hidden="true">→</i><span>R2</span></div>
        <div class="flow-branch"><i aria-hidden="true">↘</i><span>D1 metadata</span></div>
      </div>
      <dl class="storage-roles"><dt>R2</dt><dd>Object bytes</dd><dt>D1</dt><dd>Bounded metadata</dd><dt>Worker</dt><dd>Authorization + ownership</dd></dl>
    </section>
  </aside>
</section>

<details class="implementation-notes r2-implementation">
  <summary>Implementation details</summary>
  <p>The Worker derives every object key from the signed visitor session. If metadata persistence fails after an upload, it removes the R2 object to keep both stores consistent.</p>
  ${referenceDetails([
    { label: 'Page implementation', href: sourceUrl(env, 'src/demos/r2-page.ts') },
    { label: 'Worker implementation', href: sourceUrl(env, 'src/api/r2.ts') },
    { label: 'R2 storage boundary', href: sourceUrl(env, 'src/storage/r2.ts') },
    { label: 'Metadata schema', href: sourceUrl(env, 'migrations/0008_interactive_demo.sql') },
    { label: 'Tests', href: sourceUrl(env, 'tests/r2-lab.test.ts') },
    { label: 'CI workflow', href: sourceUrl(env, '.github/workflows/ci.yml') },
  ], 'Source evidence')}
</details>

<script>
(() => {
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
  const MAX_OBJECTS = 10;
  const state = { files: [], selectedFile: null, previewId: null, confirmDeleteId: null, ready: false, loading: false };
  const q = (selector) => document.querySelector(selector);
  const filesSlot = q('[data-files]');
  const fileInput = q('[data-file-input]');
  const uploadButton = q('[data-upload-button]');
  const refreshButton = q('[data-refresh]');
  const resetButton = q('[data-r2-reset]');
  const output = q('[data-r2-output]');
  const status = q('[data-operation-status]');
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const size = (bytes) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KiB' : (bytes / 1048576).toFixed(1) + ' MiB';
  const operationLabel = (operation, fallback) => operation?.endsWith('.list') ? 'LIST' : operation?.endsWith('.put') ? 'PUT' : operation?.endsWith('.delete') ? 'DELETE' : operation?.endsWith('.reset') ? 'RESET' : fallback;
  const typeLabel = (type, name) => {
    const labels = {'text/plain':'Text','application/pdf':'PDF','image/png':'PNG','image/jpeg':'JPEG','image/gif':'GIF','image/webp':'WebP','image/svg+xml':'SVG','text/html':'HTML','application/octet-stream':'Binary'};
    if (labels[type]) return labels[type];
    const extension = String(name || '').split('.').at(-1);
    return extension && extension !== name ? extension.toUpperCase() : (String(type || 'File').split('/').at(-1) || 'File');
  };
  const friendlyError = (error, fallback) => ({
    file_too_large: 'File exceeds the 5 MiB limit.',
    file_required: 'Choose a file before uploading.',
    object_limit_reached: 'This sandbox already has 10 uploads.',
    byte_limit_reached: 'This file would exceed the 20 MiB sandbox limit.',
    file_not_found: 'That file is no longer available.',
    r2_not_configured: 'R2 is temporarily unavailable.',
  }[error?.code] || fallback);
  const setStatus = (message, tone = '') => {
    status.textContent = message;
    if (tone) status.dataset.tone = tone; else delete status.dataset.tone;
  };
  const ownFiles = () => state.files.filter((file) => file.canDelete);
  const selectionError = () => {
    if (!state.selectedFile) return 'Choose a file before uploading.';
    if (state.selectedFile.size <= 0) return 'Choose a file that is not empty.';
    if (state.selectedFile.size > MAX_FILE_BYTES) return 'File exceeds the 5 MiB limit.';
    if (ownFiles().length >= MAX_OBJECTS) return 'This sandbox already has 10 uploads.';
    if (ownFiles().reduce((sum, file) => sum + file.sizeBytes, 0) + state.selectedFile.size > MAX_TOTAL_BYTES) return 'This file would exceed the 20 MiB sandbox limit.';
    return '';
  };
  const updateSelection = (announce = false) => {
    const selection = q('[data-file-selection]');
    if (!state.selectedFile) {
      selection.hidden = true;
      uploadButton.disabled = true;
      if (announce) setStatus('Select one file to begin.');
      return;
    }
    selection.hidden = false;
    q('[data-selected-name]').textContent = state.selectedFile.name;
    q('[data-selected-meta]').textContent = typeLabel(state.selectedFile.type, state.selectedFile.name) + ' · ' + size(state.selectedFile.size);
    const error = selectionError();
    uploadButton.disabled = Boolean(error) || !state.ready || state.loading;
    if (announce) setStatus(error || state.selectedFile.name + ' is ready to upload.', error ? 'error' : 'ready');
  };
  const showLiveResult = (payload, response, duration, fallback) => {
    q('[data-live-state]').textContent = response.ok ? 'Complete' : 'Failed';
    q('[data-live-state]').dataset.state = response.ok ? 'complete' : 'failed';
    q('[data-request-method]').textContent = operationLabel(payload.operation, fallback);
    q('[data-request-status]').textContent = response.status + (response.ok ? ' OK' : ' ERROR');
    q('[data-request-duration]').textContent = duration.toFixed(0) + ' ms';
    q('[data-request-metrics]').textContent = (payload.objectCount ?? '—') + ' object' + (payload.objectCount === 1 ? '' : 's') + ' · ' + (typeof payload.bytes === 'number' ? size(payload.bytes) : '—');
    output.textContent = JSON.stringify(payload, null, 2);
  };
  const call = async (path, options = {}, label = 'GET', track = true) => {
    const started = performance.now();
    if (track) {
      q('[data-live-state]').textContent = 'Running';
      q('[data-live-state]').dataset.state = 'running';
      q('[data-request-method]').textContent = label;
      q('[data-request-status]').textContent = '…';
      q('[data-request-duration]').textContent = '…';
      q('[data-request-metrics]').textContent = 'Request in flight…';
    }
    try {
      const response = await fetch(path, options);
      const payload = await response.json().catch(() => ({error:'non_json_response'}));
      if (track) showLiveResult(payload, response, performance.now() - started, label);
      if (!response.ok) {
        const error = new Error(payload.error || 'Request failed');
        error.code = payload.error;
        throw error;
      }
      return payload;
    } catch (error) {
      if (track && !error.code) {
        q('[data-live-state]').textContent = 'Failed';
        q('[data-live-state]').dataset.state = 'failed';
        q('[data-request-status]').textContent = 'Network error';
        q('[data-request-duration]').textContent = (performance.now() - started).toFixed(0) + ' ms';
        q('[data-request-metrics]').textContent = 'The request did not reach a readable response.';
        output.textContent = JSON.stringify({error:'network_error', message:String(error)}, null, 2);
      }
      throw error;
    }
  };
  const previewMarkup = (file) => '<section class="r2-inline-preview" aria-labelledby="selected-preview-heading"><div class="inline-preview-heading"><div><p class="eyebrow">Selected file</p><h3 id="selected-preview-heading" tabindex="-1">' + escape(file.displayName) + '</h3></div><div class="file-actions"><a class="button" href="/__api/r2/files/' + encodeURIComponent(file.id) + '?download=1">Download</a><button type="button" data-close-preview>Close</button></div></div><div class="file-preview"><iframe title="Preview of ' + escape(file.displayName) + '" src="/__api/r2/files/' + encodeURIComponent(file.id) + '"></iframe></div></section>';
  const fileMarkup = (file) => {
    const selected = state.previewId === file.id;
    const deleting = state.confirmDeleteId === file.id;
    const owner = file.canDelete ? 'Yours' : 'Demo';
    const preview = file.canPreview ? '<button type="button" data-preview-id="' + escape(file.id) + '" aria-pressed="' + String(selected) + '">' + (selected ? 'Viewing' : 'Preview') + '</button>' : '';
    const deleteAction = file.canDelete ? (deleting ? '<div class="delete-confirm" role="group" aria-label="Confirm deletion of ' + escape(file.displayName) + '"><span>Delete?</span><button class="danger-button" type="button" data-confirm-delete="' + escape(file.id) + '">Confirm</button><button type="button" data-cancel-delete>Cancel</button></div>' : '<button class="danger-text-button" type="button" data-delete-id="' + escape(file.id) + '">Delete</button>') : '';
    const row = '<article class="file-row"' + (selected ? ' data-selected="true"' : '') + '><div class="file-summary"><div class="file-name-line"><strong>' + escape(file.displayName) + '</strong><span class="ownership-badge" data-owner="' + owner.toLowerCase() + '">' + owner + '</span></div><span class="file-facts">' + escape(typeLabel(file.contentType, file.displayName)) + ' · ' + size(file.sizeBytes) + '</span><details class="file-details"><summary>Details</summary><dl><dt>Internal key</dt><dd><code>' + escape(file.key) + '</code></dd><dt>MIME type</dt><dd>' + escape(file.contentType) + '</dd><dt>Ownership</dt><dd>' + escape(file.ownership) + '</dd><dt>Updated</dt><dd>' + escape(new Date(file.updatedAt).toLocaleString()) + '</dd></dl></details></div><div class="file-actions">' + preview + '<a class="button" href="/__api/r2/files/' + encodeURIComponent(file.id) + '?download=1">Download</a>' + deleteAction + '</div></article>';
    return row + (selected ? previewMarkup(file) : '');
  };
  const render = () => {
    const own = ownFiles();
    const ownBytes = own.reduce((sum, file) => sum + file.sizeBytes, 0);
    q('[data-sandbox-usage]').textContent = own.length + ' / ' + MAX_OBJECTS + ' uploads · ' + size(ownBytes) + ' / 20 MiB';
    q('[data-count]').textContent = state.files.length + ' visible';
    if (state.previewId && !state.files.some((file) => file.id === state.previewId)) state.previewId = null;
    if (state.confirmDeleteId && !state.files.some((file) => file.id === state.confirmDeleteId)) state.confirmDeleteId = null;
    filesSlot.innerHTML = state.files.map(fileMarkup).join('') || '<p class="file-list-empty">No files are visible yet.</p>';
    refreshButton.disabled = state.loading;
    resetButton.disabled = state.loading || own.length === 0;
    updateSelection(false);
  };
  const load = async (track = true) => {
    state.loading = true;
    render();
    try {
      const payload = await call('/__api/r2/files', {}, 'LIST', track);
      state.files = payload.result.files;
      state.ready = true;
    } finally {
      state.loading = false;
      render();
    }
  };
  const clearSelection = () => {
    state.selectedFile = null;
    fileInput.value = '';
    updateSelection(true);
  };

  q('[data-upload-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorMessage = selectionError();
    if (errorMessage) { setStatus(errorMessage, 'error'); return; }
    const file = state.selectedFile;
    const body = new FormData();
    body.append('file', file, file.name);
    state.loading = true;
    render();
    uploadButton.textContent = 'Uploading…';
    setStatus('Uploading ' + file.name + '…');
    try {
      await call('/__api/r2/files', {method:'POST', body}, 'PUT');
      state.selectedFile = null;
      fileInput.value = '';
      await load(false);
      setStatus(file.name + ' uploaded successfully.', 'success');
    } catch (error) {
      setStatus(friendlyError(error, 'Upload failed — try again.'), 'error');
    } finally {
      state.loading = false;
      uploadButton.textContent = 'Upload file';
      render();
    }
  });

  const zone = q('[data-drop-zone]');
  fileInput.addEventListener('change', () => { state.selectedFile = fileInput.files[0] || null; updateSelection(true); });
  zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.dataset.drag = 'true'; });
  zone.addEventListener('dragleave', () => delete zone.dataset.drag);
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    delete zone.dataset.drag;
    state.selectedFile = event.dataTransfer.files[0] || null;
    updateSelection(true);
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-clear-selection')) { clearSelection(); return; }
    if (button.hasAttribute('data-refresh')) {
      setStatus('Refreshing files…');
      try { await load(true); setStatus('Files refreshed.', 'success'); }
      catch (error) { setStatus(friendlyError(error, 'Unable to refresh files — try again.'), 'error'); }
      return;
    }
    if (button.dataset.previewId) {
      state.previewId = state.previewId === button.dataset.previewId ? null : button.dataset.previewId;
      state.confirmDeleteId = null;
      render();
      if (state.previewId) q('#selected-preview-heading')?.focus({preventScroll:true});
      return;
    }
    if (button.hasAttribute('data-close-preview')) { state.previewId = null; render(); return; }
    if (button.dataset.deleteId) {
      state.confirmDeleteId = button.dataset.deleteId;
      render();
      q('[data-confirm-delete]')?.focus();
      return;
    }
    if (button.hasAttribute('data-cancel-delete')) { state.confirmDeleteId = null; render(); return; }
    if (button.dataset.confirmDelete) {
      const file = state.files.find((item) => item.id === button.dataset.confirmDelete);
      if (!file) { setStatus('That file is no longer available.', 'error'); return; }
      button.disabled = true;
      setStatus('Deleting ' + file.displayName + '…');
      try {
        await call('/__api/r2/files/' + encodeURIComponent(file.id), {method:'DELETE'}, 'DELETE');
        if (state.previewId === file.id) state.previewId = null;
        state.confirmDeleteId = null;
        await load(false);
        setStatus(file.displayName + ' deleted.', 'success');
      } catch (error) {
        setStatus(friendlyError(error, 'Delete failed — try again.'), 'error');
        button.disabled = false;
      }
      return;
    }
    if (button.hasAttribute('data-r2-reset')) {
      resetButton.hidden = true;
      q('[data-reset-confirm]').hidden = false;
      q('[data-confirm-reset]').focus();
      return;
    }
    if (button.hasAttribute('data-cancel-reset')) {
      q('[data-reset-confirm]').hidden = true;
      resetButton.hidden = false;
      resetButton.focus();
      return;
    }
    if (button.hasAttribute('data-confirm-reset')) {
      button.disabled = true;
      setStatus('Resetting your sandbox…');
      try {
        await call('/__api/r2/reset', {method:'POST'}, 'RESET');
        state.previewId = null;
        state.confirmDeleteId = null;
        await load(false);
        q('[data-reset-confirm]').hidden = true;
        resetButton.hidden = false;
        button.disabled = false;
        setStatus('Your uploads were removed.', 'success');
      } catch (error) {
        setStatus(friendlyError(error, 'Reset failed — try again.'), 'error');
        button.disabled = false;
      }
    }
  });

  load(true).then(() => setStatus('Sandbox ready.', 'ready')).catch((error) => {
    state.ready = false;
    render();
    setStatus(friendlyError(error, 'Unable to load files — try again.'), 'error');
  });
})();
</script>`, { activeRoute: '/r2', cacheControl: 'no-store' });
}
