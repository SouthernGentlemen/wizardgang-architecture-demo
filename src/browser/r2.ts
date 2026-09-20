interface R2File {
  id: string;
  key: string;
  displayName: string;
  contentType: string;
  sizeBytes: number;
  updatedAt: string;
  ownership: string;
  canDelete: boolean;
  canPreview: boolean;
}

interface R2Payload {
  operation?: string;
  objectCount?: number;
  bytes?: number;
  error?: string;
  result?: {
    files?: R2File[];
    file?: R2File | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CodedError extends Error {
  code?: string;
}

interface ResponseState {
  ok: boolean;
  status: number;
}

function parseConfig(root: HTMLElement): Readonly<{
  locale?: string;
  messages?: Readonly<Record<string, string>>;
}> {
  try {
    return JSON.parse(root.dataset.config ?? '{}') as Readonly<{
      locale?: string;
      messages?: Readonly<Record<string, string>>;
    }>;
  } catch {
    return {};
  }
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`R2 presentation is missing ${selector}`);
  return element;
}

function element<K extends keyof HTMLElementTagNameMap>(tagName: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export async function mount(root: HTMLElement): Promise<void> {
  const config = parseConfig(root);
  const messages = config.messages ?? {};
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const locale = config.locale || 'en';
  const lifecycle = new AbortController();
  const timeoutIds = new Set<number>();
  root.addEventListener('demo:deactivate', () => {
    lifecycle.abort();
    timeoutIds.forEach((id) => window.clearTimeout(id));
    timeoutIds.clear();
  }, { once: true });

  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
  const MAX_OBJECTS = 10;
  const state: {
    files: R2File[];
    selectedFile: File | null;
    previewId: string | null;
    confirmDeleteId: string | null;
    ready: boolean;
    loading: boolean;
  } = { files: [], selectedFile: null, previewId: null, confirmDeleteId: null, ready: false, loading: false };
  const filesSlot = required<HTMLElement>(root, '[data-files]');
  const fileInput = required<HTMLInputElement>(root, '[data-file-input]');
  const uploadButton = required<HTMLButtonElement>(root, '[data-upload-button]');
  const refreshButton = required<HTMLButtonElement>(root, '[data-refresh]');
  const resetButton = required<HTMLButtonElement>(root, '[data-r2-reset]');
  const output = required<HTMLElement>(root, '[data-r2-output]');
  const status = required<HTMLElement>(root, '[data-operation-status]');
  const size = (bytes: number) => bytes < 1024
    ? `${bytes} B`
    : bytes < 1_048_576
      ? `${(bytes / 1024).toFixed(1)} KiB`
      : `${(bytes / 1_048_576).toFixed(1)} MiB`;
  const operationLabel = (operation: string | undefined, fallback: string) => operation?.endsWith('.list')
    ? 'LIST'
    : operation?.endsWith('.put')
      ? 'PUT'
      : operation?.endsWith('.delete')
        ? 'DELETE'
        : operation?.endsWith('.reset')
          ? 'RESET'
          : fallback;
  const typeLabel = (type: string, name: string) => {
    const labels: Readonly<Record<string, string>> = {
      'text/plain': message('text', 'Text'),
      'application/pdf': 'PDF',
      'image/png': 'PNG',
      'image/jpeg': 'JPEG',
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'image/svg+xml': 'SVG',
      'text/html': 'HTML',
      'application/octet-stream': message('binary', 'Binary'),
    };
    if (labels[type]) return labels[type];
    const extension = name.split('.').at(-1);
    return extension && extension !== name
      ? extension.toUpperCase()
      : (String(type || message('file', 'File')).split('/').at(-1) || message('file', 'File'));
  };
  const friendlyError = (error: CodedError, fallback: string) => ({
    file_too_large: message('fileTooLarge', 'File exceeds the 5 MiB limit.'),
    file_required: message('fileRequired', 'Choose a file before uploading.'),
    object_limit_reached: message('objectLimit', 'This sandbox already has 10 uploads.'),
    byte_limit_reached: message('byteLimit', 'This file would exceed the 20 MiB sandbox limit.'),
    file_not_found: message('fileMissing', 'That file is no longer available.'),
    r2_not_configured: message('r2Unavailable', 'R2 is temporarily unavailable.'),
  }[error.code ?? ''] ?? fallback);
  const errorValue = (error: unknown): CodedError => error instanceof Error ? error as CodedError : new Error(String(error));
  const setStatus = (value: string, tone = '') => {
    status.textContent = value;
    if (tone) status.dataset.tone = tone;
    else delete status.dataset.tone;
  };
  const ownFiles = () => state.files.filter((file) => file.canDelete);
  const selectionError = () => {
    if (!state.selectedFile) return message('fileRequired', 'Choose a file before uploading.');
    if (state.selectedFile.size <= 0) return message('fileEmpty', 'Choose a file that is not empty.');
    if (state.selectedFile.size > MAX_FILE_BYTES) return message('fileTooLarge', 'File exceeds the 5 MiB limit.');
    if (ownFiles().length >= MAX_OBJECTS) return message('objectLimit', 'This sandbox already has 10 uploads.');
    if (ownFiles().reduce((sum, file) => sum + file.sizeBytes, 0) + state.selectedFile.size > MAX_TOTAL_BYTES) {
      return message('byteLimit', 'This file would exceed the 20 MiB sandbox limit.');
    }
    return '';
  };
  const updateSelection = (announce = false) => {
    const selection = required<HTMLElement>(root, '[data-file-selection]');
    if (!state.selectedFile) {
      selection.hidden = true;
      uploadButton.disabled = true;
      if (announce) setStatus(message('selectFile', 'Select one file to begin.'));
      return;
    }
    selection.hidden = false;
    required<HTMLElement>(root, '[data-selected-name]').textContent = state.selectedFile.name;
    required<HTMLElement>(root, '[data-selected-meta]').textContent = `${typeLabel(state.selectedFile.type, state.selectedFile.name)} · ${size(state.selectedFile.size)}`;
    const validationError = selectionError();
    uploadButton.disabled = Boolean(validationError) || !state.ready || state.loading;
    if (announce) {
      setStatus(
        validationError || `${state.selectedFile.name} ${message('readyToUpload', 'is ready to upload.')}`,
        validationError ? 'error' : 'ready',
      );
    }
  };
  const showUploadEvidence = (uploaded: R2File, visible: boolean) => {
    const evidence = required<HTMLOListElement>(root, '[data-upload-evidence]');
    const stages = [
      [message('browserUploaded', 'Browser uploaded file'), uploaded.displayName],
      [message('workerAccepted', 'Worker accepted size'), size(uploaded.sizeBytes)],
      [message('r2Stored', 'R2 object stored under key'), uploaded.key],
      [message('metadataReturned', 'Metadata returned'), `${uploaded.contentType} · ${new Date(uploaded.updatedAt).toLocaleString(locale)}`],
      [message('appearedInInventory', 'File appeared in visitor inventory'), visible ? message('inventoryConfirmed', 'Confirmed in current list') : message('inventoryPending', 'Inventory refresh pending')],
    ];
    evidence.replaceChildren();
    stages.forEach(([label, detail], index) => {
      const item = element('li');
      const number = element('span', String(index + 1));
      const content = element('div');
      content.append(element('strong', label), element('small', detail));
      item.append(number, content);
      evidence.append(item);
    });
    evidence.hidden = false;
  };
  const showLiveResult = (payload: R2Payload, response: ResponseState, duration: number, fallback: string) => {
    const liveState = required<HTMLElement>(root, '[data-live-state]');
    liveState.textContent = response.ok ? message('complete', 'Complete') : message('failed', 'Failed');
    liveState.dataset.state = response.ok ? 'complete' : 'failed';
    required<HTMLElement>(root, '[data-request-method]').textContent = operationLabel(payload.operation, fallback);
    required<HTMLElement>(root, '[data-request-status]').textContent = `${response.status} ${response.ok ? message('ok', 'OK') : message('error', 'ERROR')}`;
    required<HTMLElement>(root, '[data-request-duration]').textContent = `${duration.toFixed(0)} ms`;
    const count = payload.objectCount;
    required<HTMLElement>(root, '[data-request-metrics]').textContent = `${count ?? '—'} ${count === 1 ? message('object', 'object') : message('objects', 'objects')} · ${typeof payload.bytes === 'number' ? size(payload.bytes) : '—'}`;
    output.textContent = JSON.stringify(payload, null, 2);
  };
  const call = async (path: string, options: RequestInit = {}, label = 'GET', track = true): Promise<R2Payload> => {
    const started = performance.now();
    if (track) {
      const liveState = required<HTMLElement>(root, '[data-live-state]');
      liveState.textContent = message('running', 'Running');
      liveState.dataset.state = 'running';
      required<HTMLElement>(root, '[data-request-method]').textContent = label;
      required<HTMLElement>(root, '[data-request-status]').textContent = '…';
      required<HTMLElement>(root, '[data-request-duration]').textContent = '…';
      required<HTMLElement>(root, '[data-request-metrics]').textContent = message('requestInFlight', 'Request in flight…');
    }
    try {
      const response = await fetch(path, { ...options, signal: lifecycle.signal });
      const payload = await response.json().catch(() => ({ error: 'non_json_response' })) as R2Payload;
      if (track) showLiveResult(payload, response, performance.now() - started, label);
      if (!response.ok) {
        const requestError = new Error(payload.error || message('requestFailed', 'Request failed')) as CodedError;
        requestError.code = payload.error;
        throw requestError;
      }
      return payload;
    } catch (error) {
      const requestError = errorValue(error);
      if (track && !requestError.code && !lifecycle.signal.aborted) {
        const liveState = required<HTMLElement>(root, '[data-live-state]');
        liveState.textContent = message('failed', 'Failed');
        liveState.dataset.state = 'failed';
        required<HTMLElement>(root, '[data-request-status]').textContent = message('networkError', 'Network error');
        required<HTMLElement>(root, '[data-request-duration]').textContent = `${(performance.now() - started).toFixed(0)} ms`;
        required<HTMLElement>(root, '[data-request-metrics]').textContent = message('unreadableResponse', 'The request did not reach a readable response.');
        output.textContent = JSON.stringify({ error: 'network_error', message: String(requestError) }, null, 2);
      }
      throw requestError;
    }
  };
  const deleteButton = (file: R2File) => {
    const button = element('button', message('delete', 'Delete'), 'danger-text-button');
    button.type = 'button';
    button.dataset.deleteId = file.id;
    return button;
  };
  const previewSection = (file: R2File) => {
    const previewHeadingId = `${root.dataset.demoSection || 'r2'}-selected-preview-heading`;
    const section = element('section', '', 'r2-inline-preview');
    section.setAttribute('aria-labelledby', previewHeadingId);
    const heading = element('div', '', 'inline-preview-heading');
    const copy = element('div');
    copy.append(element('p', message('selectedFile', 'Selected file'), 'eyebrow'));
    const title = element('h3', file.displayName);
    title.id = previewHeadingId;
    title.tabIndex = -1;
    copy.append(title);
    const actions = element('div', '', 'file-actions');
    if (file.canDelete) actions.append(deleteButton(file));
    const close = element('button', message('close', 'Close'));
    close.type = 'button';
    close.dataset.closePreview = '';
    actions.append(close);
    heading.append(copy, actions);
    section.append(heading);

    const source = `/api/labs/r2-files/${encodeURIComponent(file.id)}`;
    if (file.contentType === 'text/plain') {
      const preview = element('pre', message('loadingTextPreview', 'Loading text preview…'), 'file-preview file-preview-text');
      preview.dataset.previewText = '';
      section.append(preview);
    } else if (file.contentType === 'image/svg+xml') {
      const preview = document.createElement('img');
      preview.className = 'file-preview file-preview-image';
      preview.alt = `${message('previewOf', 'Preview of')} ${file.displayName}`;
      preview.src = source;
      section.append(preview);
    } else {
      const preview = element('div', '', 'file-preview');
      const frame = document.createElement('iframe');
      frame.title = `${message('previewOf', 'Preview of')} ${file.displayName}`;
      frame.src = source;
      preview.append(frame);
      section.append(preview);
    }
    return section;
  };
  const fileRow = (file: R2File) => {
    const selected = state.previewId === file.id;
    const deleting = state.confirmDeleteId === file.id;
    const owner = file.canDelete ? message('yours', 'Yours') : message('demo', 'Demo');
    const row = element('article', '', 'file-row');
    if (selected) row.dataset.selected = 'true';
    const summary = element('div', '', 'file-summary');
    const nameLine = element('div', '', 'file-name-line');
    nameLine.append(element('strong', file.displayName));
    const ownerBadge = element('span', owner, 'ownership-badge');
    ownerBadge.dataset.owner = file.canDelete ? 'yours' : 'demo';
    nameLine.append(ownerBadge);
    summary.append(nameLine, element('span', `${typeLabel(file.contentType, file.displayName)} · ${size(file.sizeBytes)}`, 'file-facts'));
    const details = element('details', '', 'file-details');
    details.append(element('summary', message('details', 'Details')));
    const list = element('dl');
    const entries = [
      [message('internalKey', 'Internal key'), file.key, true],
      [message('mimeType', 'MIME type'), file.contentType, false],
      [message('ownership', 'Ownership'), file.ownership, false],
      [message('updated', 'Updated'), new Date(file.updatedAt).toLocaleString(locale), false],
    ] as const;
    for (const [label, value, code] of entries) {
      list.append(element('dt', label));
      const description = element('dd');
      if (code) description.append(element('code', value));
      else description.textContent = value;
      list.append(description);
    }
    details.append(list);
    summary.append(details);
    const actions = element('div', '', 'file-actions');
    if (file.canPreview) {
      const preview = element('button', selected ? message('viewing', 'Viewing') : message('preview', 'Preview'));
      preview.type = 'button';
      preview.dataset.previewId = file.id;
      preview.setAttribute('aria-pressed', String(selected));
      actions.append(preview);
    }
    const download = element('a', message('download', 'Download'), 'button');
    download.dataset.downloadId = file.id;
    download.href = `/api/labs/r2-files/${encodeURIComponent(file.id)}?download=1`;
    actions.append(download);
    if (file.canDelete) {
      if (deleting) {
        const confirmation = element('div', '', 'delete-confirm');
        confirmation.setAttribute('role', 'group');
        confirmation.setAttribute('aria-label', `${message('confirmDeletion', 'Confirm deletion of')} ${file.displayName}`);
        confirmation.append(element('span', message('deleteQuestion', 'Delete?')));
        const confirm = element('button', message('confirm', 'Confirm'), 'danger-button');
        confirm.type = 'button';
        confirm.dataset.confirmDelete = file.id;
        const cancel = element('button', message('cancel', 'Cancel'));
        cancel.type = 'button';
        cancel.dataset.cancelDelete = '';
        confirmation.append(confirm, cancel);
        actions.append(confirmation);
      } else {
        actions.append(deleteButton(file));
      }
    }
    row.append(summary, actions);
    return [row, ...(selected ? [previewSection(file)] : [])];
  };
  const render = () => {
    const own = ownFiles();
    const ownBytes = own.reduce((sum, file) => sum + file.sizeBytes, 0);
    required<HTMLElement>(root, '[data-sandbox-usage]').textContent = `${own.length} / ${MAX_OBJECTS} ${message('upload', 'uploads')} · ${size(ownBytes)} / 20 MiB`;
    if (state.previewId && !state.files.some((file) => file.id === state.previewId)) state.previewId = null;
    if (state.confirmDeleteId && !state.files.some((file) => file.id === state.confirmDeleteId)) state.confirmDeleteId = null;
    filesSlot.replaceChildren();
    if (!state.files.length) filesSlot.append(element('p', message('noFiles', 'No files are visible yet.'), 'file-list-empty'));
    else for (const file of state.files) filesSlot.append(...fileRow(file));
    refreshButton.disabled = state.loading;
    resetButton.disabled = state.loading || own.length === 0;
    updateSelection(false);
  };
  const load = async (track = true) => {
    state.loading = true;
    render();
    try {
      const payload = await call('/api/labs/r2-files', {}, 'LIST', track);
      state.files = payload.result?.files ?? [];
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
  const loadTextPreview = async (file: R2File) => {
    const preview = root.querySelector<HTMLElement>('[data-preview-text]');
    if (!preview || state.previewId !== file.id) return;
    try {
      const response = await fetch(`/api/labs/r2-files/${encodeURIComponent(file.id)}`, { signal: lifecycle.signal });
      if (!response.ok) throw new Error(message('previewUnavailable', 'Preview unavailable.'));
      preview.textContent = await response.text();
    } catch {
      if (!lifecycle.signal.aborted) preview.textContent = message('previewUnavailable', 'Preview unavailable.');
    }
  };
  const downloadFile = async (file: R2File) => {
    const started = performance.now();
    let response: Response | undefined;
    setStatus(`${message('downloading', 'Downloading')} ${file.displayName}…`);
    try {
      response = await fetch(`/api/labs/r2-files/${encodeURIComponent(file.id)}?download=1`, { signal: lifecycle.signal });
      const payload: R2Payload = {
        operation: 'r2.files.download',
        objectCount: response.ok ? 1 : 0,
        bytes: response.ok ? file.sizeBytes : 0,
        result: response.ok ? { file: file.displayName } : { error: 'download_failed' },
      };
      showLiveResult(payload, response, performance.now() - started, 'GET');
      if (!response.ok) throw new Error(message('downloadFailed', 'Download failed — try again.'));
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = file.displayName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      const timeoutId = window.setTimeout(() => {
        timeoutIds.delete(timeoutId);
        URL.revokeObjectURL(objectUrl);
      }, 1000);
      timeoutIds.add(timeoutId);
      setStatus(`${file.displayName} ${message('downloaded', 'downloaded.')}`, 'success');
    } catch (error) {
      if (lifecycle.signal.aborted) return;
      if (!response) showLiveResult({ operation: 'r2.files.download', objectCount: 0, bytes: 0, result: { error: 'network_error' } }, { ok: false, status: 0 }, performance.now() - started, 'GET');
      setStatus(friendlyError(errorValue(error), message('downloadFailed', 'Download failed — try again.')), 'error');
    }
  };

  required<HTMLFormElement>(root, '[data-upload-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const validationError = selectionError();
    if (validationError) {
      setStatus(validationError, 'error');
      return;
    }
    const file = state.selectedFile;
    if (!file) return;
    const body = new FormData();
    body.append('file', file, file.name);
    state.loading = true;
    render();
    uploadButton.textContent = message('uploadingButton', 'Uploading…');
    setStatus(`${message('uploading', 'Uploading')} ${file.name}…`);
    void (async () => {
      try {
        const payload = await call('/api/labs/r2-files', { method: 'POST', body }, 'PUT');
        const uploaded = payload.result?.file;
        if (!uploaded || typeof uploaded === 'string') throw new Error(message('requestFailed', 'Request failed'));
        state.selectedFile = null;
        fileInput.value = '';
        await load(false);
        showUploadEvidence(uploaded, state.files.some((item) => item.id === uploaded.id));
        setStatus(`${file.name} ${message('uploaded', 'uploaded successfully.')}`, 'success');
      } catch (error) {
        if (!lifecycle.signal.aborted) setStatus(friendlyError(errorValue(error), message('uploadFailed', 'Upload failed — try again.')), 'error');
      } finally {
        state.loading = false;
        uploadButton.textContent = message('uploadFile', 'Upload file');
        render();
      }
    })();
  }, { signal: lifecycle.signal });

  const zone = required<HTMLElement>(root, '[data-drop-zone]');
  fileInput.addEventListener('change', () => {
    state.selectedFile = fileInput.files?.[0] ?? null;
    updateSelection(true);
  }, { signal: lifecycle.signal });
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.dataset.drag = 'true';
  }, { signal: lifecycle.signal });
  zone.addEventListener('dragleave', () => delete zone.dataset.drag, { signal: lifecycle.signal });
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    delete zone.dataset.drag;
    state.selectedFile = event.dataTransfer?.files[0] ?? null;
    updateSelection(true);
  }, { signal: lifecycle.signal });

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>('a[data-download-id]');
    if (link && root.contains(link)) {
      event.preventDefault();
      const file = state.files.find((item) => item.id === link.dataset.downloadId);
      if (file) void downloadFile(file);
      return;
    }
    const button = target.closest<HTMLButtonElement>('button');
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-clear-selection')) {
      clearSelection();
      return;
    }
    if (button.hasAttribute('data-refresh')) {
      setStatus(message('refreshing', 'Refreshing files…'));
      void load(true)
        .then(() => setStatus(message('filesRefreshed', 'Files refreshed.'), 'success'))
        .catch((error: unknown) => {
          if (!lifecycle.signal.aborted) setStatus(friendlyError(errorValue(error), message('refreshFailed', 'Unable to refresh files — try again.')), 'error');
        });
      return;
    }
    if (button.dataset.previewId) {
      state.previewId = state.previewId === button.dataset.previewId ? null : button.dataset.previewId;
      state.confirmDeleteId = null;
      render();
      if (state.previewId) root.querySelector<HTMLElement>(`#${root.dataset.demoSection || 'r2'}-selected-preview-heading`)?.focus({ preventScroll: true });
      const file = state.files.find((item) => item.id === state.previewId);
      if (file?.contentType === 'text/plain') void loadTextPreview(file);
      return;
    }
    if (button.hasAttribute('data-close-preview')) {
      state.previewId = null;
      render();
      return;
    }
    if (button.dataset.deleteId) {
      state.confirmDeleteId = button.dataset.deleteId;
      render();
      root.querySelector<HTMLButtonElement>('[data-confirm-delete]')?.focus();
      return;
    }
    if (button.hasAttribute('data-cancel-delete')) {
      state.confirmDeleteId = null;
      render();
      return;
    }
    if (button.dataset.confirmDelete) {
      const file = state.files.find((item) => item.id === button.dataset.confirmDelete);
      if (!file) {
        setStatus(message('fileMissing', 'That file is no longer available.'), 'error');
        return;
      }
      button.disabled = true;
      setStatus(`${message('deleting', 'Deleting')} ${file.displayName}…`);
      void (async () => {
        try {
          await call(`/api/labs/r2-files/${encodeURIComponent(file.id)}`, { method: 'DELETE' }, 'DELETE');
          if (state.previewId === file.id) state.previewId = null;
          state.confirmDeleteId = null;
          await load(false);
          setStatus(`${file.displayName} ${message('deleted', 'deleted.')}`, 'success');
        } catch (error) {
          if (!lifecycle.signal.aborted) {
            setStatus(friendlyError(errorValue(error), message('deleteFailed', 'Delete failed — try again.')), 'error');
            button.disabled = false;
          }
        }
      })();
      return;
    }
    if (button.hasAttribute('data-r2-reset')) {
      resetButton.hidden = true;
      required<HTMLElement>(root, '[data-reset-confirm]').hidden = false;
      required<HTMLButtonElement>(root, '[data-confirm-reset]').focus();
      return;
    }
    if (button.hasAttribute('data-cancel-reset')) {
      required<HTMLElement>(root, '[data-reset-confirm]').hidden = true;
      resetButton.hidden = false;
      resetButton.focus();
      return;
    }
    if (button.hasAttribute('data-confirm-reset')) {
      button.disabled = true;
      setStatus(message('resetting', 'Resetting your sandbox…'));
      void (async () => {
        try {
          await call('/api/labs/r2-reset', { method: 'POST' }, 'RESET');
          state.previewId = null;
          state.confirmDeleteId = null;
          await load(false);
          required<HTMLElement>(root, '[data-reset-confirm]').hidden = true;
          resetButton.hidden = false;
          button.disabled = false;
          setStatus(message('uploadsRemoved', 'Your uploads were removed.'), 'success');
        } catch (error) {
          if (!lifecycle.signal.aborted) {
            setStatus(friendlyError(errorValue(error), message('resetFailed', 'Reset failed — try again.')), 'error');
            button.disabled = false;
          }
        }
      })();
    }
  }, { signal: lifecycle.signal });

  try {
    await load(true);
    setStatus(message('sandboxReady', 'Sandbox ready.'), 'ready');
  } catch (error) {
    if (!lifecycle.signal.aborted) {
      state.ready = false;
      render();
      setStatus(friendlyError(errorValue(error), message('loadFailed', 'Unable to load files — try again.')), 'error');
    }
  }
}
