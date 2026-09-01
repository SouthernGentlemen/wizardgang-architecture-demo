import type { Env } from '../types';
import { sourceUrl } from '../lib/github';
import { referenceDetails, shell } from '../ui/page';

export function renderD1Demo(env: Env): Response {
  return shell(env, 'Cloudflare D1', `
<section class="page-header">
  <p class="eyebrow">Platform / /d1</p>
  <h1>D1 Users / Tasks laboratory</h1>
  <p class="lede">Create, read, update, delete, and reset isolated relational data. Every action exposes the parameterized SQL template and measured Worker result.</p>
  <div class="page-tools"><a class="text-link" href="${sourceUrl(env, 'src/demos/d1.ts')}">Route source</a>${referenceDetails([
    { label: 'Page implementation', href: sourceUrl(env, 'src/demos/d1-page.ts') },
    { label: 'Worker implementation', href: sourceUrl(env, 'src/api/d1-lab.ts') },
    { label: 'Shared repository', href: sourceUrl(env, 'src/lib/demo-users.ts') },
    { label: 'D1 schema', href: sourceUrl(env, 'migrations/0008_interactive_demo.sql') },
    { label: 'Tests', href: sourceUrl(env, 'tests/d1-lab.test.ts') },
    { label: 'CI workflow', href: sourceUrl(env, '.github/workflows/ci.yml') },
  ], 'Source evidence')}</div>
</section>

<section class="lab-grid" aria-label="D1 demonstration">
  <div>
    <section class="panel" aria-labelledby="users-heading">
      <div class="lab-heading"><div><p class="eyebrow">Table / demo_users</p><h2 id="users-heading">Users</h2></div><button type="button" data-refresh="users">Refresh</button></div>
      <form class="lab-form" data-form="users">
        <input type="hidden" name="id">
        <label>Name<input name="name" maxlength="80" value="Dorothy Vaughan" required></label>
        <label>Email<input name="email" type="email" maxlength="254" value="dorothy@example.test" required></label>
        <label>Role<select name="role"><option value="admin">Admin</option><option value="member" selected>Member</option><option value="viewer">Viewer</option></select></label>
        <div class="button-row"><button class="button-primary" type="submit">Create user</button><button type="button" data-cancel="users" hidden>Cancel edit</button></div>
      </form>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody data-rows="users"><tr><td colspan="4">Loading…</td></tr></tbody></table></div>
    </section>

    <section class="panel" aria-labelledby="tasks-heading">
      <div class="lab-heading"><div><p class="eyebrow">Table / demo_tasks</p><h2 id="tasks-heading">Tasks</h2></div><button type="button" data-refresh="tasks">Refresh</button></div>
      <form class="lab-form" data-form="tasks">
        <input type="hidden" name="id">
        <label>Title<input name="title" maxlength="120" value="Review deployment evidence" required></label>
        <label>Assignee<select name="assigneeId"><option value="">Unassigned</option></select></label>
        <label>Status<select name="status"><option value="todo">To do</option><option value="doing">Doing</option><option value="done">Done</option></select></label>
        <div class="button-row"><button class="button-primary" type="submit">Create task</button><button type="button" data-cancel="tasks" hidden>Cancel edit</button></div>
      </form>
      <div class="table-wrap"><table><thead><tr><th>Task</th><th>Assignee</th><th>Status</th><th>Actions</th></tr></thead><tbody data-rows="tasks"><tr><td colspan="4">Loading…</td></tr></tbody></table></div>
    </section>
  </div>

  <aside>
    <section class="panel technical-state" aria-labelledby="state-heading">
      <p class="eyebrow">Live technical state</p><h2 id="state-heading">Latest D1 operation</h2>
      <dl data-state-summary><dt>Binding</dt><dd><code>DEMO_DB</code></dd><dt>Database</dt><dd><code>demo-blob</code></dd><dt>Status</dt><dd>Waiting</dd></dl>
      <pre aria-live="polite" data-state-output>Choose an action to inspect its parameterized SQL and result.</pre>
    </section>
    <section class="panel"><p class="eyebrow">Architecture</p><h2>One persistence boundary</h2><p>D1 owns structured visitor sandbox rows. The Worker validates input, derives the signed session scope, binds parameters, and returns public-safe evidence. GraphQL uses the same repository rather than a second database.</p><p><a href="/api#graphql">Query the same users with GraphQL</a></p></section>
    <section class="panel"><p class="eyebrow">Reset</p><h2>Start over</h2><p>Reset deletes only this browser sandbox and restores three fictional users and four tasks.</p><button type="button" data-reset>Reset D1 demo</button><p class="subtle" role="status" data-reset-status></p></section>
  </aside>
</section>

<script>
(() => {
  const state = { users: [], tasks: [] };
  const output = document.querySelector('[data-state-output]');
  const summary = document.querySelector('[data-state-summary]');
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const request = async (path, options = {}) => {
    output.textContent = 'Running…';
    const started = performance.now();
    const response = await fetch(path, options);
    const payload = await response.json().catch(() => ({ error: 'invalid_response' }));
    const operation = payload.operation || options.method || 'GET';
    summary.innerHTML = '<dt>Binding</dt><dd><code>DEMO_DB</code></dd><dt>Database</dt><dd><code>demo-blob</code></dd><dt>Operation</dt><dd><code>' + escape(operation) + '</code></dd><dt>Status</dt><dd>' + response.status + '</dd><dt>Round trip</dt><dd>' + (performance.now() - started).toFixed(1) + ' ms</dd><dt>Rows</dt><dd>' + escape(payload.rowCount ?? '—') + '</dd>';
    output.textContent = JSON.stringify(payload, null, 2);
    if (!response.ok) throw new Error(payload.error || 'Request failed');
    return payload;
  };
  const options = () => '<option value="">Unassigned</option>' + state.users.map((user) => '<option value="' + escape(user.id) + '">' + escape(user.name) + '</option>').join('');
  const renderUsers = () => {
    document.querySelector('[data-rows="users"]').innerHTML = state.users.map((user) => '<tr><td>' + escape(user.name) + '</td><td><code>' + escape(user.email) + '</code></td><td>' + escape(user.role) + '</td><td><div class="button-row"><button type="button" data-edit-user="' + escape(user.id) + '">Edit</button><button type="button" data-delete-user="' + escape(user.id) + '">Delete</button></div></td></tr>').join('') || '<tr><td colspan="4">No users.</td></tr>';
    const select = document.querySelector('[data-form="tasks"] select[name="assigneeId"]');
    const selected = select.value; select.innerHTML = options(); select.value = selected;
  };
  const renderTasks = () => {
    const names = new Map(state.users.map((user) => [user.id, user.name]));
    document.querySelector('[data-rows="tasks"]').innerHTML = state.tasks.map((task) => '<tr><td>' + escape(task.title) + '</td><td>' + escape(names.get(task.assigneeId) || 'Unassigned') + '</td><td>' + escape(task.status) + '</td><td><div class="button-row"><button type="button" data-edit-task="' + escape(task.id) + '">Edit</button><button type="button" data-delete-task="' + escape(task.id) + '">Delete</button></div></td></tr>').join('') || '<tr><td colspan="4">No tasks.</td></tr>';
  };
  const load = async (resource) => {
    const payload = await request('/__api/d1/' + resource);
    state[resource] = payload.result[resource];
    resource === 'users' ? renderUsers() : renderTasks();
  };
  const loadAll = async () => { await load('users'); await load('tasks'); };
  const resetForm = (resource) => {
    const form = document.querySelector('[data-form="' + resource + '"]'); form.reset(); form.elements.id.value = '';
    form.querySelector('[type="submit"]').textContent = resource === 'users' ? 'Create user' : 'Create task';
    document.querySelector('[data-cancel="' + resource + '"]').hidden = true;
  };
  document.querySelectorAll('[data-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault(); const resource = form.dataset.form; const data = Object.fromEntries(new FormData(form)); const id = data.id; delete data.id;
    try { await request('/__api/d1/' + resource + (id ? '/' + encodeURIComponent(id) : ''), { method: id ? 'PATCH' : 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(data) }); resetForm(resource); await loadAll(); } catch (_) {}
  }));
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('button'); if (!button) return;
    const editResource = button.hasAttribute('data-edit-user') ? 'users' : button.hasAttribute('data-edit-task') ? 'tasks' : '';
    if (editResource) { const id = button.dataset[editResource === 'users' ? 'editUser' : 'editTask']; const item = state[editResource].find((entry) => entry.id === id); const form = document.querySelector('[data-form="' + editResource + '"]'); for (const [key,value] of Object.entries(item)) if (form.elements[key]) form.elements[key].value = value ?? ''; form.querySelector('[type="submit"]').textContent = editResource === 'users' ? 'Update user' : 'Update task'; document.querySelector('[data-cancel="' + editResource + '"]').hidden = false; form.elements[editResource === 'users' ? 'name' : 'title'].focus(); return; }
    const deleteResource = button.hasAttribute('data-delete-user') ? 'users' : button.hasAttribute('data-delete-task') ? 'tasks' : '';
    if (deleteResource) { const id = button.dataset[deleteResource === 'users' ? 'deleteUser' : 'deleteTask']; if (confirm('Delete this ' + deleteResource.slice(0,-1) + '?')) { try { await request('/__api/d1/' + deleteResource + '/' + encodeURIComponent(id), {method:'DELETE'}); await loadAll(); } catch (_) {} } return; }
    if (button.dataset.cancel) resetForm(button.dataset.cancel);
    if (button.dataset.refresh) load(button.dataset.refresh).catch(() => {});
  });
  document.querySelector('[data-reset]').addEventListener('click', async () => { const status = document.querySelector('[data-reset-status]'); status.textContent = 'Resetting…'; try { await request('/__api/d1/reset', {method:'POST'}); await loadAll(); status.textContent = 'Sandbox restored.'; } catch (_) { status.textContent = 'Reset failed.'; } });
  loadAll().catch(() => {});
})();
</script>`, { activeRoute: '/d1', cacheControl: 'no-store' });
}
