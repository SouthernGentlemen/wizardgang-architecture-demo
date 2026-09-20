type Resource = 'users' | 'tasks';

interface D1User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface D1Task {
  id: string;
  assigneeId: string | null;
  title: string;
  status: string;
}

interface D1Payload {
  operation?: string;
  durationMs?: number;
  rowCount?: number;
  statement?: string;
  error?: string;
  result?: {
    users?: D1User[];
    tasks?: D1Task[];
  };
  [key: string]: unknown;
}

interface PendingChange {
  type: 'delete' | 'reset';
  resource?: Resource;
  id?: string;
  assigned?: number;
}

interface CodedError extends Error {
  code?: string;
}

function parseMessages(root: HTMLElement): Readonly<Record<string, string>> {
  try {
    const config = JSON.parse(root.dataset.config ?? '{}') as { messages?: Readonly<Record<string, string>> };
    return config.messages ?? {};
  } catch {
    return {};
  }
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`D1 presentation is missing ${selector}`);
  return element;
}

function textCell(text: string): HTMLTableCellElement {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

export async function mount(root: HTMLElement): Promise<void> {
  const messages = parseMessages(root);
  const message = (key: string, fallback: string) => messages[key] ?? fallback;
  const lifecycle = new AbortController();
  root.addEventListener('demo:deactivate', () => lifecycle.abort(), { once: true });

  const state: {
    active: Resource;
    users: D1User[];
    tasks: D1Task[];
    pending: PendingChange | null;
  } = { active: 'users', users: [], tasks: [], pending: null };
  const errorMessages: Readonly<Record<string, string>> = {
    email_already_exists: message('emailAlreadyExists', 'That email already exists.'),
    user_limit_reached: message('userLimitReached', 'This sandbox has reached its 10-user limit.'),
    task_limit_reached: message('taskLimitReached', 'This sandbox has reached its 25-task limit.'),
    assignee_not_found: message('assigneeNotFound', 'That assignee no longer exists. Choose another user.'),
    user_not_found: message('userNotFound', 'That user no longer exists.'),
    task_not_found: message('taskNotFound', 'That task no longer exists.'),
    invalid_name: message('invalidName', 'Enter a name between 1 and 80 characters.'),
    invalid_email: message('invalidEmail', 'Enter a valid email address.'),
    invalid_title: message('invalidTitle', 'Enter a task title between 1 and 120 characters.'),
    invalid_role: message('invalidRole', 'Choose a valid role.'),
    invalid_status: message('invalidStatus', 'Choose a valid status.'),
    invalid_response: message('invalidResponse', 'The database returned an unreadable response.'),
  };
  const humanError = (code: string | undefined) => code
    ? errorMessages[code] ?? message('databaseFailed', 'The database operation failed. Try again.')
    : message('databaseFailed', 'The database operation failed. Try again.');
  const databaseMessage = required<HTMLElement>(root, '[data-database-message]');
  const inspector = {
    verb: required<HTMLElement>(root, '[data-inspector-verb]'),
    status: required<HTMLElement>(root, '[data-inspector-status]'),
    metrics: required<HTMLElement>(root, '[data-inspector-metrics]'),
    sql: required<HTMLElement>(root, '[data-inspector-sql]'),
    output: required<HTMLElement>(root, '[data-state-output]'),
  };
  const dialog = required<HTMLDialogElement>(root, '[data-confirm-dialog]');

  const setDatabaseMessage = (value = '', tone = '') => {
    databaseMessage.textContent = value;
    databaseMessage.dataset.tone = tone;
    databaseMessage.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  };
  const setFormMessage = (resource: Resource, value = '', tone = '') => {
    const status = required<HTMLElement>(root, `[data-form-status="${resource}"]`);
    status.textContent = value;
    status.dataset.tone = tone;
    status.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  };
  const operationVerb = (operation: string) => {
    if (operation.includes('.list') || operation === 'GET') return 'SELECT';
    if (operation.includes('.create') || operation === 'POST') return 'INSERT';
    if (operation.includes('.update') || operation === 'PATCH') return 'UPDATE';
    if (operation.includes('.delete') || operation === 'DELETE') return 'DELETE';
    if (operation.includes('.reset')) return 'RESET';
    return operation || 'ERROR';
  };
  const formatSql = (statement: string | undefined) => String(statement || message('requestRejected', 'Request rejected before D1 executed a statement.'))
    .replace(/\s+(FROM|WHERE|ORDER BY|LIMIT|VALUES|SET)\s+/g, '\n$1 ');
  const renderInspector = (payload: D1Payload, meta: { status: number; statusText: string; roundTrip: number; method: string }) => {
    const verb = operationVerb(payload.operation || meta.method);
    const duration = payload.durationMs ?? meta.roundTrip;
    const rows = payload.rowCount;
    inspector.verb.textContent = verb;
    inspector.verb.dataset.verb = verb.toLowerCase();
    inspector.status.textContent = `${meta.status}${meta.statusText ? ` ${meta.statusText}` : ''}`;
    inspector.metrics.textContent = `${Number(duration).toFixed(1)} ms${rows === undefined ? '' : ` · ${rows} ${rows === 1 ? message('row', 'row') : message('rows', 'rows')}`}`;
    inspector.sql.textContent = formatSql(payload.statement);
    inspector.output.textContent = JSON.stringify(payload, null, 2);
  };
  const request = async (path: string, options: RequestInit = {}, inspect = true): Promise<D1Payload> => {
    if (inspect) {
      inspector.status.textContent = message('runningQuery', 'Running query…');
      inspector.metrics.textContent = message('waitingForWorker', 'Waiting for Worker');
    }
    const started = performance.now();
    let response: Response;
    try {
      response = await fetch(path, { ...options, signal: lifecycle.signal });
    } catch (networkError) {
      if (inspect && !lifecycle.signal.aborted) {
        inspector.verb.textContent = 'ERROR';
        inspector.verb.dataset.verb = 'error';
        inspector.status.textContent = message('networkUnavailable', 'Network unavailable');
        inspector.metrics.textContent = `${(performance.now() - started).toFixed(1)} ms`;
        inspector.output.textContent = String(networkError);
      }
      throw new Error(message('databaseUnavailable', 'The database could not be reached. Try again.'));
    }
    const payload = await response.json().catch(() => ({ error: 'invalid_response' })) as D1Payload;
    if (inspect) renderInspector(payload, {
      status: response.status,
      statusText: response.statusText,
      roundTrip: performance.now() - started,
      method: options.method ?? 'GET',
    });
    if (!response.ok) {
      const failure = new Error(humanError(payload.error)) as CodedError;
      failure.code = payload.error;
      throw failure;
    }
    return payload;
  };
  const statusLabel = (status: string) => ({
    todo: message('toDo', 'TO DO'),
    doing: message('inProgress', 'IN PROGRESS'),
    done: message('done', 'DONE'),
  }[status] ?? status);
  const updateCounts = () => {
    for (const resource of ['users', 'tasks'] as const) {
      required<HTMLElement>(root, `[data-count="${resource}"]`).textContent = String(state[resource].length);
      required<HTMLElement>(root, `[data-heading-count="${resource}"]`).textContent = `${state[resource].length} / ${resource === 'users' ? 10 : 25}`;
      required<HTMLButtonElement>(root, `[data-add="${resource}"]`).disabled = state[resource].length >= (resource === 'users' ? 10 : 25);
    }
  };
  const actionButton = (action: 'edit' | 'delete', resource: 'user' | 'task', id: string, label: string) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset[`${action}${resource[0].toUpperCase()}${resource.slice(1)}`] = id;
    const actionLabel = message(action, action === 'edit' ? 'Edit' : 'Delete');
    button.setAttribute('aria-label', `${actionLabel} ${label}`);
    button.textContent = actionLabel;
    return button;
  };
  const renderUsers = () => {
    const rows = required<HTMLTableSectionElement>(root, '[data-rows="users"]');
    rows.replaceChildren();
    if (!state.users.length) {
      const row = document.createElement('tr');
      const cell = textCell(message('noUsers', 'No users in this sandbox.'));
      cell.colSpan = 4;
      cell.className = 'd1-empty-row';
      row.append(cell);
      rows.append(row);
    }
    for (const user of state.users) {
      const row = document.createElement('tr');
      const name = textCell('');
      const strong = document.createElement('strong');
      strong.textContent = user.name;
      name.append(strong);
      const email = textCell('');
      const code = document.createElement('code');
      code.textContent = user.email;
      email.append(code);
      const role = textCell('');
      const badge = document.createElement('span');
      badge.className = 'badge d1-role';
      badge.dataset.role = user.role;
      badge.textContent = user.role;
      role.append(badge);
      const actionsCell = textCell('');
      const actions = document.createElement('div');
      actions.className = 'd1-row-actions';
      actions.append(actionButton('edit', 'user', user.id, user.name), actionButton('delete', 'user', user.id, user.name));
      actionsCell.append(actions);
      row.append(name, email, role, actionsCell);
      rows.append(row);
    }

    const select = required<HTMLSelectElement>(root, '[data-form="tasks"] select[name="assigneeId"]');
    const selected = select.value;
    select.replaceChildren();
    const unassigned = document.createElement('option');
    unassigned.value = '';
    unassigned.textContent = message('unassigned', 'Unassigned');
    select.append(unassigned);
    for (const user of state.users) {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.name;
      select.append(option);
    }
    select.value = selected;
  };
  const renderTasks = () => {
    const names = new Map(state.users.map((user) => [user.id, user.name]));
    const rows = required<HTMLTableSectionElement>(root, '[data-rows="tasks"]');
    rows.replaceChildren();
    if (!state.tasks.length) {
      const row = document.createElement('tr');
      const cell = textCell(message('noTasks', 'No tasks in this sandbox.'));
      cell.colSpan = 4;
      cell.className = 'd1-empty-row';
      row.append(cell);
      rows.append(row);
    }
    for (const task of state.tasks) {
      const row = document.createElement('tr');
      const title = textCell('');
      const strong = document.createElement('strong');
      strong.textContent = task.title;
      title.append(strong);
      const assignee = textCell(names.get(task.assigneeId ?? '') ?? message('unassigned', 'Unassigned'));
      const status = textCell('');
      const badge = document.createElement('span');
      badge.className = 'badge d1-task-status';
      badge.dataset.status = task.status;
      badge.textContent = statusLabel(task.status);
      status.append(badge);
      const actionsCell = textCell('');
      const actions = document.createElement('div');
      actions.className = 'd1-row-actions';
      actions.append(actionButton('edit', 'task', task.id, task.title), actionButton('delete', 'task', task.id, task.title));
      actionsCell.append(actions);
      row.append(title, assignee, status, actionsCell);
      rows.append(row);
    }
  };
  const load = async (resource: Resource, inspect = true) => {
    const payload = await request(`/api/labs/d1-${resource}`, {}, inspect);
    if (resource === 'users') {
      state.users = payload.result?.users ?? [];
      renderUsers();
    } else {
      state.tasks = payload.result?.tasks ?? [];
      renderTasks();
    }
    updateCounts();
    return payload;
  };
  const loadAll = async (inspectResource: Resource | '' = '') => {
    await load('users', inspectResource === 'users');
    await load('tasks', inspectResource === 'tasks');
  };
  const showTable = (resource: Resource) => {
    state.active = resource;
    root.querySelectorAll<HTMLElement>('[data-table-tab]').forEach((tab) => {
      const selected = tab.dataset.tableTab === resource;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll<HTMLElement>('[data-table-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.tablePanel !== resource;
    });
  };
  const formFor = (resource: Resource) => required<HTMLFormElement>(root, `[data-form="${resource}"]`);
  const formControl = (form: HTMLFormElement, name: string) => {
    const control = form.elements.namedItem(name);
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) {
      throw new Error(`D1 form is missing ${name}`);
    }
    return control;
  };
  const closeForm = (resource: Resource) => {
    const form = formFor(resource);
    form.reset();
    formControl(form, 'id').value = '';
    form.hidden = true;
    form.removeAttribute('aria-busy');
    required<HTMLButtonElement>(form, '[type="submit"]').disabled = false;
    setFormMessage(resource);
  };
  const openForm = (resource: Resource, item?: D1User | D1Task) => {
    const form = formFor(resource);
    form.reset();
    formControl(form, 'id').value = item?.id ?? '';
    if (item) {
      for (const [key, value] of Object.entries(item)) {
        const control = form.elements.namedItem(key);
        if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) control.value = value ?? '';
      }
    }
    const editing = Boolean(item);
    const singular = resource === 'users' ? message('user', 'user') : message('task', 'task');
    required<HTMLElement>(root, `[data-editor-title="${resource}"]`).textContent = `${editing ? message('edit', 'Edit') : message('add', 'Add')} ${singular}`;
    required<HTMLButtonElement>(form, '[type="submit"]').textContent = `${editing ? message('update', 'Update') : message('create', 'Create')} ${singular}`;
    form.hidden = false;
    setFormMessage(resource);
    formControl(form, resource === 'users' ? 'name' : 'title').focus();
  };
  const openDialog = (pending: PendingChange, title: string, value: string, actionLabel: string) => {
    state.pending = pending;
    required<HTMLElement>(root, '[data-confirm-title]').textContent = title;
    required<HTMLElement>(root, '[data-confirm-message]').textContent = value;
    required<HTMLButtonElement>(root, '[data-confirm-action]').textContent = actionLabel;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };
  const closeDialog = () => {
    state.pending = null;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  root.querySelectorAll<HTMLButtonElement>('[data-table-tab]').forEach((tab) => tab.addEventListener('click', () => {
    const resource = tab.dataset.tableTab as Resource;
    showTable(resource);
    closeForm(resource === 'users' ? 'tasks' : 'users');
    setDatabaseMessage();
    void load(resource).catch((error: unknown) => {
      if (!lifecycle.signal.aborted) setDatabaseMessage(error instanceof Error ? error.message : String(error), 'error');
    });
  }, { signal: lifecycle.signal }));
  required<HTMLElement>(root, '[role="tablist"]').addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-table-tab]')];
    const current = tabs.indexOf(root.ownerDocument.activeElement as HTMLButtonElement);
    const right = root.ownerDocument.documentElement.dir === 'rtl' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
    const next = tabs[(current + (right ? 1 : -1) + tabs.length) % tabs.length];
    next?.focus();
    next?.click();
  }, { signal: lifecycle.signal });
  root.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((button) => button.addEventListener('click', () => openForm(button.dataset.add as Resource), { signal: lifecycle.signal }));
  root.querySelectorAll<HTMLButtonElement>('[data-cancel]').forEach((button) => button.addEventListener('click', () => closeForm(button.dataset.cancel as Resource), { signal: lifecycle.signal }));
  root.querySelectorAll<HTMLFormElement>('[data-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const resource = form.dataset.form as Resource;
    const data = Object.fromEntries(new FormData(form));
    const id = String(data.id ?? '');
    delete data.id;
    form.setAttribute('aria-busy', 'true');
    required<HTMLButtonElement>(form, '[type="submit"]').disabled = true;
    setFormMessage(resource, id ? message('updating', 'Updating row…') : message('creating', 'Creating row…'));
    void (async () => {
      try {
        await request(`/api/labs/d1-${resource}${id ? `/${encodeURIComponent(id)}` : ''}`, {
          method: id ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(data),
        });
        closeForm(resource);
        await loadAll();
        const resultMessage = resource === 'users'
          ? (id ? message('userUpdated', 'User updated.') : message('userCreated', 'User created.'))
          : (id ? message('taskUpdated', 'Task updated.') : message('taskCreated', 'Task created.'));
        setDatabaseMessage(resultMessage, 'success');
      } catch (error) {
        if (!lifecycle.signal.aborted) setFormMessage(resource, error instanceof Error ? error.message : String(error), 'error');
      } finally {
        form.removeAttribute('aria-busy');
        required<HTMLButtonElement>(form, '[type="submit"]').disabled = false;
      }
    })();
  }, { signal: lifecycle.signal }));
  root.addEventListener('click', (event) => {
    const target = event.target;
    const button = target instanceof Element ? target.closest<HTMLButtonElement>('button') : null;
    if (!button || !root.contains(button)) return;
    const editResource: Resource | '' = button.hasAttribute('data-edit-user') ? 'users' : button.hasAttribute('data-edit-task') ? 'tasks' : '';
    if (editResource) {
      const id = editResource === 'users' ? button.dataset.editUser : button.dataset.editTask;
      openForm(editResource, state[editResource].find((entry) => entry.id === id));
      return;
    }
    const deleteResource: Resource | '' = button.hasAttribute('data-delete-user') ? 'users' : button.hasAttribute('data-delete-task') ? 'tasks' : '';
    if (!deleteResource) return;
    const id = deleteResource === 'users' ? button.dataset.deleteUser : button.dataset.deleteTask;
    const item = state[deleteResource].find((entry) => entry.id === id);
    if (!item || !id) {
      setDatabaseMessage(message('rowMissing', 'That row no longer exists.'), 'error');
      return;
    }
    if (deleteResource === 'users') {
      const user = item as D1User;
      const assigned = state.tasks.filter((task) => task.assigneeId === id).length;
      openDialog(
        { type: 'delete', resource: deleteResource, id, assigned },
        `${message('delete', 'Delete')} ${user.name}?`,
        `${assigned} ${assigned === 1 ? message('assignedTaskWill', 'assigned task will become Unassigned.') : message('assignedTasksWill', 'assigned tasks will become Unassigned.')}`,
        message('deleteUser', 'Delete user'),
      );
    } else {
      const task = item as D1Task;
      openDialog(
        { type: 'delete', resource: deleteResource, id },
        message('deleteTaskTitle', 'Delete this task?'),
        `“${task.title}” ${message('deleteTaskMessagePrefix', 'will be removed from this visitor sandbox.')}`,
        message('deleteTask', 'Delete task'),
      );
    }
  }, { signal: lifecycle.signal });
  required<HTMLButtonElement>(root, '[data-reset]').addEventListener('click', () => openDialog(
    { type: 'reset' },
    message('resetTitle', 'Reset sample data?'),
    message('resetMessage', 'Your changes will be replaced with three fictional users and four related tasks.'),
    message('resetAction', 'Reset data'),
  ), { signal: lifecycle.signal });
  required<HTMLButtonElement>(root, '[data-confirm-cancel]').addEventListener('click', closeDialog, { signal: lifecycle.signal });
  dialog.addEventListener('cancel', () => { state.pending = null; }, { signal: lifecycle.signal });
  required<HTMLButtonElement>(root, '[data-confirm-action]').addEventListener('click', (event) => {
    const pending = state.pending;
    if (!pending) return;
    const confirmButton = event.currentTarget as HTMLButtonElement;
    confirmButton.disabled = true;
    void (async () => {
      try {
        if (pending.type === 'reset') {
          await request('/api/labs/d1-reset', { method: 'POST' });
          await loadAll();
          setDatabaseMessage(message('sampleRestored', 'Sample data restored.'), 'success');
        } else if (pending.resource && pending.id) {
          await request(`/api/labs/d1-${pending.resource}/${encodeURIComponent(pending.id)}`, { method: 'DELETE' });
          closeForm(pending.resource);
          await loadAll();
          const deleted = pending.resource === 'users'
            ? `${message('userDeleted', 'User deleted.')} ${pending.assigned ?? 0} ${(pending.assigned ?? 0) === 1 ? message('relatedTaskBecame', 'related task became Unassigned.') : message('relatedTasksBecame', 'related tasks became Unassigned.')}`
            : message('taskDeleted', 'Task deleted.');
          setDatabaseMessage(deleted, 'success');
        }
      } catch (error) {
        if (!lifecycle.signal.aborted) setDatabaseMessage(error instanceof Error ? error.message : String(error), 'error');
      } finally {
        confirmButton.disabled = false;
        closeDialog();
      }
    })();
  }, { signal: lifecycle.signal });

  try {
    await loadAll('users');
  } catch (error) {
    if (!lifecycle.signal.aborted) setDatabaseMessage(error instanceof Error ? error.message : String(error), 'error');
  }
}
