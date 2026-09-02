import type { Env } from '../types';
import { sourceUrl } from '../lib/github';
import { shell } from '../ui/page';

export function renderD1Demo(env: Env): Response {
  const implementationLinks = [
    { label: 'Page implementation', path: 'src/demos/d1-page.ts' },
    { label: 'Route definition', path: 'src/demos/d1.ts' },
    { label: 'Worker implementation', path: 'src/api/d1-lab.ts' },
    { label: 'Shared repository', path: 'src/lib/demo-users.ts' },
    { label: 'D1 schema', path: 'migrations/0008_interactive_demo.sql' },
    { label: 'Tests', path: 'tests/d1-lab.test.ts' },
    { label: 'CI workflow', path: '.github/workflows/ci.yml' },
  ];

  return shell(env, 'Cloudflare D1', `
<section class="page-header lab-page-header d1-page-header">
  <p class="eyebrow">Platform / D1</p>
  <h1>Cloudflare D1 Database</h1>
  <p class="lede">Create and modify relational data while inspecting the SQL executed against the live database.</p>
  <div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/demos/d1-page.ts')}">View source ↗</a></div>
</section>

<section class="d1-database-bar" aria-label="Database tables">
  <div class="d1-database-id"><span>Database</span><strong>demo-blob</strong></div>
  <div class="d1-table-tabs" role="tablist" aria-label="Tables in demo-blob">
    <button type="button" role="tab" aria-selected="true" aria-controls="d1-users-panel" id="d1-users-tab" data-table-tab="users">Users <span><strong data-count="users">—</strong> / 10</span></button>
    <button type="button" role="tab" aria-selected="false" aria-controls="d1-tasks-panel" id="d1-tasks-tab" tabindex="-1" data-table-tab="tasks">Tasks <span><strong data-count="tasks">—</strong> / 25</span></button>
  </div>
  <p class="d1-database-message" role="status" aria-live="polite" data-database-message></p>
</section>

<section class="lab-grid d1-console" aria-label="D1 database console">
  <div class="d1-table-stage">
    <section class="panel d1-table-panel" id="d1-users-panel" role="tabpanel" aria-labelledby="d1-users-tab" data-table-panel="users">
      <div class="d1-table-heading">
        <div><p class="eyebrow">Table / demo_users</p><h2>Users <span data-heading-count="users"></span></h2></div>
        <button class="button-primary" type="button" data-add="users">+ Add user</button>
      </div>
      <form class="lab-form d1-editor" data-form="users" hidden>
        <div class="d1-editor-heading"><strong data-editor-title="users">Add user</strong><span>Maximum 10 users</span></div>
        <input type="hidden" name="id">
        <label>Name<input name="name" maxlength="80" autocomplete="name" placeholder="Mary Jackson" required></label>
        <label>Email<input name="email" type="email" maxlength="254" autocomplete="email" placeholder="mary@example.test" required></label>
        <label>Role<select name="role"><option value="admin">Admin</option><option value="member" selected>Member</option><option value="viewer">Viewer</option></select></label>
        <p class="operation-status d1-form-status" role="status" aria-live="polite" data-form-status="users"></p>
        <div class="button-row"><button class="button-primary" type="submit">Create user</button><button type="button" data-cancel="users">Cancel</button></div>
      </form>
      <div class="table-wrap"><table><caption class="sr-only">Users in the demo_users table</caption><thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody data-rows="users"><tr><td colspan="4">Loading users…</td></tr></tbody></table></div>
    </section>

    <section class="panel d1-table-panel" id="d1-tasks-panel" role="tabpanel" aria-labelledby="d1-tasks-tab" data-table-panel="tasks" hidden>
      <div class="d1-table-heading">
        <div><p class="eyebrow">Table / demo_tasks</p><h2>Tasks <span data-heading-count="tasks"></span></h2></div>
        <button class="button-primary" type="button" data-add="tasks">+ Add task</button>
      </div>
      <p class="d1-table-hint"><code>demo_tasks.assignee_id</code> → <code>demo_users.id</code></p>
      <form class="lab-form d1-editor" data-form="tasks" hidden>
        <div class="d1-editor-heading"><strong data-editor-title="tasks">Add task</strong><span>Maximum 25 tasks</span></div>
        <input type="hidden" name="id">
        <label>Task title<input name="title" maxlength="120" placeholder="Review deployment evidence" required></label>
        <label>Assignee<select name="assigneeId"><option value="">Unassigned</option></select></label>
        <label>Status<select name="status"><option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option></select></label>
        <p class="operation-status d1-form-status" role="status" aria-live="polite" data-form-status="tasks"></p>
        <div class="button-row"><button class="button-primary" type="submit">Create task</button><button type="button" data-cancel="tasks">Cancel</button></div>
      </form>
      <div class="table-wrap"><table><caption class="sr-only">Tasks in the demo_tasks table</caption><thead><tr><th scope="col">Task</th><th scope="col">Assignee</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody data-rows="tasks"><tr><td colspan="4">Loading tasks…</td></tr></tbody></table></div>
    </section>
  </div>

  <aside class="d1-sidebar">
    <section class="panel d1-inspector" aria-labelledby="state-heading">
      <p class="eyebrow">Live database evidence</p><h2 id="state-heading">SQL Inspector</h2>
      <div class="d1-operation-summary">
        <span class="badge d1-sql-verb" data-inspector-verb>Waiting</span>
        <div><strong data-inspector-status>Choose a table</strong><span data-inspector-metrics>No query yet</span></div>
      </div>
      <div class="d1-sql-block">
        <span>Statement</span>
        <pre data-inspector-sql>Select a table or modify a row to inspect its parameterized SQL.</pre>
      </div>
      <div class="d1-parameter-block">
        <span>Parameters</span>
        <div class="d1-parameters" data-inspector-parameters><span>—</span></div>
      </div>
      <details class="d1-response-details"><summary>Response JSON</summary><pre data-state-output>No response yet.</pre></details>
      <div class="d1-inspector-footer"><span>D1</span><code>DEMO_DB</code><code>demo-blob</code></div>
    </section>
    <section class="panel d1-relationship" aria-labelledby="relationship-heading">
      <p class="eyebrow">Relationship</p><h2 id="relationship-heading">Tasks belong to users</h2>
      <p><code>demo_tasks.assignee_id</code><br><span aria-hidden="true">↓</span><br><code>demo_users.id</code></p>
      <p class="subtle">Deleting an assigned user keeps their tasks intact and marks them Unassigned.</p>
      <a class="text-link" href="/graphql">Query these users with GraphQL →</a>
    </section>
  </aside>
</section>

<details class="panel d1-implementation">
  <summary><span>Implementation details</span><span>Browser → Worker → D1</span></summary>
  <div class="d1-implementation-body">
    <div><p class="eyebrow">How it works</p><h2>One relational boundary</h2><p>The Worker validates every request, scopes it to this browser, and binds values before D1 executes the statement. GraphQL reads through the same repository.</p></div>
    <nav class="reference-links" aria-label="D1 implementation sources">${implementationLinks.map((link) => `<a href="${sourceUrl(env, link.path)}">${link.label}</a>`).join('')}</nav>
  </div>
</details>

<section class="panel d1-sandbox" aria-labelledby="sandbox-heading">
  <div><p class="eyebrow">Sandbox</p><h2 id="sandbox-heading">Changes stay in this browser</h2><p class="subtle">Reset restores three fictional users and four related tasks.</p></div>
  <button type="button" data-reset>Reset sample data</button>
</section>

<dialog class="d1-confirm-dialog" data-confirm-dialog aria-labelledby="d1-confirm-title" aria-describedby="d1-confirm-message">
  <p class="eyebrow">Confirm change</p>
  <h2 id="d1-confirm-title" data-confirm-title>Delete row?</h2>
  <p id="d1-confirm-message" data-confirm-message></p>
  <div class="button-row"><button type="button" data-confirm-cancel>Cancel</button><button class="button-primary" type="button" data-confirm-action>Continue</button></div>
</dialog>

<script>
(() => {
  const state = { active: 'users', users: [], tasks: [], pending: null };
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const errorMessages = {
    email_already_exists: 'That email already exists.',
    user_limit_reached: 'This sandbox has reached its 10-user limit.',
    task_limit_reached: 'This sandbox has reached its 25-task limit.',
    assignee_not_found: 'That assignee no longer exists. Choose another user.',
    user_not_found: 'That user no longer exists.',
    task_not_found: 'That task no longer exists.',
    invalid_name: 'Enter a name between 1 and 80 characters.',
    invalid_email: 'Enter a valid email address.',
    invalid_title: 'Enter a task title between 1 and 120 characters.',
    invalid_role: 'Choose a valid role.',
    invalid_status: 'Choose a valid status.',
    invalid_response: 'The database returned an unreadable response.',
  };
  const humanError = (code) => errorMessages[code] || 'The database operation failed. Try again.';
  const databaseMessage = document.querySelector('[data-database-message]');
  const inspector = {
    verb: document.querySelector('[data-inspector-verb]'),
    status: document.querySelector('[data-inspector-status]'),
    metrics: document.querySelector('[data-inspector-metrics]'),
    sql: document.querySelector('[data-inspector-sql]'),
    parameters: document.querySelector('[data-inspector-parameters]'),
    output: document.querySelector('[data-state-output]'),
  };
  const dialog = document.querySelector('[data-confirm-dialog]');

  const setDatabaseMessage = (message = '', tone = '') => {
    databaseMessage.textContent = message;
    databaseMessage.dataset.tone = tone;
    databaseMessage.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  };
  const setFormMessage = (resource, message = '', tone = '') => {
    const status = document.querySelector('[data-form-status="' + resource + '"]');
    status.textContent = message;
    status.dataset.tone = tone;
    status.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  };
  const operationVerb = (operation) => {
    if (operation.includes('.list') || operation === 'GET') return 'SELECT';
    if (operation.includes('.create') || operation === 'POST') return 'INSERT';
    if (operation.includes('.update') || operation === 'PATCH') return 'UPDATE';
    if (operation.includes('.delete') || operation === 'DELETE') return 'DELETE';
    if (operation.includes('.reset')) return 'RESET';
    return operation || 'ERROR';
  };
  const formatSql = (statement) => String(statement || 'Request rejected before D1 executed a statement.')
    .replace(/\\s+(FROM|WHERE|ORDER BY|LIMIT|VALUES|SET)\\s+/g, '\\n$1 ');
  const renderInspector = (payload, meta) => {
    const verb = operationVerb(payload.operation || meta.method);
    const duration = payload.durationMs ?? meta.roundTrip;
    const rows = payload.rowCount;
    inspector.verb.textContent = verb;
    inspector.verb.dataset.verb = verb.toLowerCase();
    inspector.status.textContent = meta.status + (meta.statusText ? ' ' + meta.statusText : '');
    inspector.metrics.textContent = Number(duration).toFixed(1) + ' ms' + (rows === undefined ? '' : ' · ' + rows + ' ' + (rows === 1 ? 'row' : 'rows'));
    inspector.sql.textContent = formatSql(payload.statement);
    inspector.parameters.innerHTML = Array.isArray(payload.parameters) && payload.parameters.length
      ? payload.parameters.map((parameter) => '<code>' + escape(parameter) + '</code>').join('')
      : '<span>None</span>';
    inspector.output.textContent = JSON.stringify(payload, null, 2);
  };
  const request = async (path, options = {}, inspect = true) => {
    if (inspect) {
      inspector.status.textContent = 'Running query…';
      inspector.metrics.textContent = 'Waiting for Worker';
    }
    const started = performance.now();
    let response;
    try {
      response = await fetch(path, options);
    } catch (networkError) {
      if (inspect) {
        inspector.verb.textContent = 'ERROR';
        inspector.verb.dataset.verb = 'error';
        inspector.status.textContent = 'Network unavailable';
        inspector.metrics.textContent = (performance.now() - started).toFixed(1) + ' ms';
        inspector.output.textContent = String(networkError);
      }
      throw new Error('The database could not be reached. Try again.');
    }
    const payload = await response.json().catch(() => ({ error: 'invalid_response' }));
    if (inspect) renderInspector(payload, { status: response.status, statusText: response.statusText, roundTrip: performance.now() - started, method: options.method || 'GET' });
    if (!response.ok) {
      const failure = new Error(humanError(payload.error));
      failure.code = payload.error;
      throw failure;
    }
    return payload;
  };
  const assigneeOptions = () => '<option value="">Unassigned</option>' + state.users.map((user) => '<option value="' + escape(user.id) + '">' + escape(user.name) + '</option>').join('');
  const statusLabel = (status) => ({ todo: 'TO DO', doing: 'IN PROGRESS', done: 'DONE' }[status] || status);
  const updateCounts = () => {
    ['users', 'tasks'].forEach((resource) => {
      document.querySelector('[data-count="' + resource + '"]').textContent = state[resource].length;
      document.querySelector('[data-heading-count="' + resource + '"]').textContent = state[resource].length + ' / ' + (resource === 'users' ? '10' : '25');
      document.querySelector('[data-add="' + resource + '"]').disabled = state[resource].length >= (resource === 'users' ? 10 : 25);
    });
  };
  const renderUsers = () => {
    document.querySelector('[data-rows="users"]').innerHTML = state.users.map((user) => '<tr><td><strong>' + escape(user.name) + '</strong></td><td><code>' + escape(user.email) + '</code></td><td><span class="badge d1-role" data-role="' + escape(user.role) + '">' + escape(user.role) + '</span></td><td><div class="d1-row-actions"><button type="button" data-edit-user="' + escape(user.id) + '" aria-label="Edit ' + escape(user.name) + '">Edit</button><button type="button" data-delete-user="' + escape(user.id) + '" aria-label="Delete ' + escape(user.name) + '">Delete</button></div></td></tr>').join('') || '<tr><td colspan="4" class="d1-empty-row">No users in this sandbox.</td></tr>';
    const select = document.querySelector('[data-form="tasks"] select[name="assigneeId"]');
    const selected = select.value;
    select.innerHTML = assigneeOptions();
    select.value = selected;
  };
  const renderTasks = () => {
    const names = new Map(state.users.map((user) => [user.id, user.name]));
    document.querySelector('[data-rows="tasks"]').innerHTML = state.tasks.map((task) => '<tr><td><strong>' + escape(task.title) + '</strong></td><td>' + escape(names.get(task.assigneeId) || 'Unassigned') + '</td><td><span class="badge d1-task-status" data-status="' + escape(task.status) + '">' + escape(statusLabel(task.status)) + '</span></td><td><div class="d1-row-actions"><button type="button" data-edit-task="' + escape(task.id) + '" aria-label="Edit ' + escape(task.title) + '">Edit</button><button type="button" data-delete-task="' + escape(task.id) + '" aria-label="Delete ' + escape(task.title) + '">Delete</button></div></td></tr>').join('') || '<tr><td colspan="4" class="d1-empty-row">No tasks in this sandbox.</td></tr>';
  };
  const load = async (resource, inspect = true) => {
    const payload = await request('/__api/d1/' + resource, {}, inspect);
    state[resource] = payload.result[resource];
    resource === 'users' ? renderUsers() : renderTasks();
    updateCounts();
    return payload;
  };
  const loadAll = async (inspectResource = '') => {
    await load('users', inspectResource === 'users');
    await load('tasks', inspectResource === 'tasks');
  };
  const showTable = (resource) => {
    state.active = resource;
    document.querySelectorAll('[data-table-tab]').forEach((tab) => {
      const selected = tab.dataset.tableTab === resource;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-table-panel]').forEach((panel) => { panel.hidden = panel.dataset.tablePanel !== resource; });
  };
  const closeForm = (resource) => {
    const form = document.querySelector('[data-form="' + resource + '"]');
    form.reset();
    form.elements.id.value = '';
    form.hidden = true;
    form.removeAttribute('aria-busy');
    form.querySelector('[type="submit"]').disabled = false;
    setFormMessage(resource);
  };
  const openForm = (resource, item) => {
    const form = document.querySelector('[data-form="' + resource + '"]');
    form.reset();
    form.elements.id.value = item?.id || '';
    if (item) for (const [key, value] of Object.entries(item)) if (form.elements[key]) form.elements[key].value = value ?? '';
    const editing = Boolean(item);
    document.querySelector('[data-editor-title="' + resource + '"]').textContent = (editing ? 'Edit ' : 'Add ') + resource.slice(0, -1);
    form.querySelector('[type="submit"]').textContent = (editing ? 'Update ' : 'Create ') + resource.slice(0, -1);
    form.hidden = false;
    setFormMessage(resource);
    form.elements[resource === 'users' ? 'name' : 'title'].focus();
  };
  const openDialog = (pending, title, message, actionLabel) => {
    state.pending = pending;
    document.querySelector('[data-confirm-title]').textContent = title;
    document.querySelector('[data-confirm-message]').textContent = message;
    document.querySelector('[data-confirm-action]').textContent = actionLabel;
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  };
  const closeDialog = () => {
    state.pending = null;
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  };

  document.querySelectorAll('[data-table-tab]').forEach((tab) => tab.addEventListener('click', async () => {
    const resource = tab.dataset.tableTab;
    showTable(resource);
    closeForm(resource === 'users' ? 'tasks' : 'users');
    setDatabaseMessage();
    try { await load(resource); } catch (error) { setDatabaseMessage(error.message, 'error'); }
  }));
  document.querySelector('[role="tablist"]').addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll('[data-table-tab]')];
    const current = tabs.indexOf(document.activeElement);
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(current + offset + tabs.length) % tabs.length];
    next.focus();
    next.click();
  });
  document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => openForm(button.dataset.add)));
  document.querySelectorAll('[data-cancel]').forEach((button) => button.addEventListener('click', () => closeForm(button.dataset.cancel)));
  document.querySelectorAll('[data-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const resource = form.dataset.form;
    const data = Object.fromEntries(new FormData(form));
    const id = data.id;
    delete data.id;
    form.setAttribute('aria-busy', 'true');
    form.querySelector('[type="submit"]').disabled = true;
    setFormMessage(resource, id ? 'Updating row…' : 'Creating row…');
    try {
      await request('/__api/d1/' + resource + (id ? '/' + encodeURIComponent(id) : ''), { method: id ? 'PATCH' : 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(data) });
      closeForm(resource);
      await loadAll();
      setDatabaseMessage((resource === 'users' ? 'User' : 'Task') + (id ? ' updated.' : ' created.'), 'success');
    } catch (error) {
      setFormMessage(resource, error.message, 'error');
    } finally {
      form.removeAttribute('aria-busy');
      form.querySelector('[type="submit"]').disabled = false;
    }
  }));
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const editResource = button.hasAttribute('data-edit-user') ? 'users' : button.hasAttribute('data-edit-task') ? 'tasks' : '';
    if (editResource) {
      const id = button.dataset[editResource === 'users' ? 'editUser' : 'editTask'];
      openForm(editResource, state[editResource].find((entry) => entry.id === id));
      return;
    }
    const deleteResource = button.hasAttribute('data-delete-user') ? 'users' : button.hasAttribute('data-delete-task') ? 'tasks' : '';
    if (deleteResource) {
      const id = button.dataset[deleteResource === 'users' ? 'deleteUser' : 'deleteTask'];
      const item = state[deleteResource].find((entry) => entry.id === id);
      if (!item) { setDatabaseMessage('That row no longer exists.', 'error'); return; }
      if (deleteResource === 'users') {
        const assigned = state.tasks.filter((task) => task.assigneeId === id).length;
        openDialog({ type: 'delete', resource: deleteResource, id }, 'Delete ' + item.name + '?', assigned + ' assigned ' + (assigned === 1 ? 'task will' : 'tasks will') + ' become Unassigned.', 'Delete user');
      } else {
        openDialog({ type: 'delete', resource: deleteResource, id }, 'Delete this task?', '“' + item.title + '” will be removed from this browser sandbox.', 'Delete task');
      }
    }
  });
  document.querySelector('[data-reset]').addEventListener('click', () => openDialog({ type: 'reset' }, 'Reset sample data?', 'Your changes will be replaced with three fictional users and four related tasks.', 'Reset data'));
  document.querySelector('[data-confirm-cancel]').addEventListener('click', closeDialog);
  dialog.addEventListener('cancel', () => { state.pending = null; });
  document.querySelector('[data-confirm-action]').addEventListener('click', async (event) => {
    const pending = state.pending;
    if (!pending) return;
    event.currentTarget.disabled = true;
    try {
      if (pending.type === 'reset') {
        await request('/__api/d1/reset', { method: 'POST' });
        await loadAll();
        setDatabaseMessage('Sample data restored.', 'success');
      } else {
        await request('/__api/d1/' + pending.resource + '/' + encodeURIComponent(pending.id), { method: 'DELETE' });
        closeForm(pending.resource);
        await loadAll();
        setDatabaseMessage((pending.resource === 'users' ? 'User' : 'Task') + ' deleted.', 'success');
      }
    } catch (error) {
      setDatabaseMessage(error.message, 'error');
    } finally {
      event.currentTarget.disabled = false;
      closeDialog();
    }
  });
  loadAll('users').catch((error) => setDatabaseMessage(error.message, 'error'));
})();
</script>`, { activeRoute: '/d1', cacheControl: 'no-store' });
}
