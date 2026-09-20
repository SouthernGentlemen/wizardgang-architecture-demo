import type { LocalizationContext } from '../i18n/runtime';
import { localizationForEnv } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { createReactDemoSection } from '../ui/react-demo-section';

function d1BrowserMessages(localization: LocalizationContext): Readonly<Record<string, string>> {
  const exact = (english: string) => localization.exact(english);
  return Object.freeze({
    emailAlreadyExists: exact('That email already exists.'),
    userLimitReached: exact('This sandbox has reached its 10-user limit.'),
    taskLimitReached: exact('This sandbox has reached its 25-task limit.'),
    assigneeNotFound: exact('That assignee no longer exists. Choose another user.'),
    userNotFound: exact('That user no longer exists.'),
    taskNotFound: exact('That task no longer exists.'),
    invalidName: exact('Enter a name between 1 and 80 characters.'),
    invalidEmail: exact('Enter a valid email address.'),
    invalidTitle: exact('Enter a task title between 1 and 120 characters.'),
    invalidRole: exact('Choose a valid role.'),
    invalidStatus: exact('Choose a valid status.'),
    invalidResponse: exact('The database returned an unreadable response.'),
    databaseFailed: exact('The database operation failed. Try again.'),
    databaseUnavailable: exact('The database could not be reached. Try again.'),
    requestRejected: exact('Request rejected before D1 executed a statement.'),
    runningQuery: exact('Running query…'),
    waitingForWorker: exact('Waiting for Worker'),
    networkUnavailable: exact('Network unavailable'),
    unassigned: exact('Unassigned'),
    toDo: exact('TO DO'),
    inProgress: exact('IN PROGRESS'),
    done: exact('DONE'),
    edit: exact('Edit'),
    delete: exact('Delete'),
    noUsers: exact('No users in this sandbox.'),
    noTasks: exact('No tasks in this sandbox.'),
    add: exact('Add'),
    update: exact('Update'),
    create: exact('Create'),
    user: exact('user'),
    task: exact('task'),
    updating: exact('Updating row…'),
    creating: exact('Creating row…'),
    userUpdated: exact('User updated.'),
    userCreated: exact('User created.'),
    taskUpdated: exact('Task updated.'),
    taskCreated: exact('Task created.'),
    rowMissing: exact('That row no longer exists.'),
    deleteTaskTitle: exact('Delete this task?'),
    deleteUser: exact('Delete user'),
    deleteTask: exact('Delete task'),
    resetTitle: exact('Reset sample data?'),
    resetMessage: exact('Your changes will be replaced with three fictional users and four related tasks.'),
    resetAction: exact('Reset data'),
    sampleRestored: exact('Sample data restored.'),
    userDeleted: exact('User deleted.'),
    taskDeleted: exact('Task deleted.'),
    row: exact('row'),
    rows: exact('rows'),
    assignedTaskWill: exact('assigned task will become Unassigned.'),
    assignedTasksWill: exact('assigned tasks will become Unassigned.'),
    relatedTaskBecame: exact('related task became Unassigned.'),
    relatedTasksBecame: exact('related tasks became Unassigned.'),
    deleteTaskMessagePrefix: exact('will be removed from this visitor sandbox.'),
  });
}

function D1Presentation({ localization }: Readonly<{ localization: LocalizationContext }>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const usersTab = scope.id('d1-users-tab');
  const usersPanel = scope.id('d1-users-panel');
  const tasksTab = scope.id('d1-tasks-tab');
  const tasksPanel = scope.id('d1-tasks-panel');
  const stateHeading = scope.id('state-heading');
  const sandboxHeading = scope.id('sandbox-heading');
  const confirmTitle = scope.id('d1-confirm-title');
  const confirmMessage = scope.id('d1-confirm-message');

  return <>
    <section className="page-header lab-page-header">
      <DemoHeading level={1}>{exact('Cloudflare D1 Database')}</DemoHeading>
      <p className="lede">{exact('Create and modify relational data while inspecting the SQL executed against the live database.')}</p>
    </section>

    <section className="d1-database-bar" aria-label={exact('Database tables')}>
      <div className="d1-database-id"><span>{exact('Database')}</span><strong>demo-blob</strong></div>
      <div className="d1-table-tabs" role="tablist" aria-label={exact('Tables in demo-blob')}>
        <button type="button" role="tab" aria-selected="true" aria-controls={usersPanel} id={usersTab} data-table-tab="users">
          {exact('Users')} <span><strong data-count="users">—</strong> / 10</span>
        </button>
        <button type="button" role="tab" aria-selected="false" aria-controls={tasksPanel} id={tasksTab} tabIndex={-1} data-table-tab="tasks">
          {exact('Tasks')} <span><strong data-count="tasks">—</strong> / 25</span>
        </button>
      </div>
      <p className="d1-database-message" role="status" aria-live="polite" data-database-message="" />
    </section>

    <section className="lab-grid d1-console" aria-label={exact('D1 database console')}>
      <div className="d1-table-stage">
        <section className="panel d1-table-panel" id={usersPanel} role="tabpanel" aria-labelledby={usersTab} data-table-panel="users">
          <div className="d1-table-heading">
            <div><p className="eyebrow">{exact('Table / demo_users')}</p><DemoHeading level={2}>{exact('Users')} <span data-heading-count="users" /></DemoHeading></div>
            <button className="button-primary" type="button" data-add="users">{exact('+ Add user')}</button>
          </div>
          <form className="lab-form d1-editor" data-form="users" hidden>
            <div className="d1-editor-heading"><strong data-editor-title="users">{exact('Add user')}</strong><span>{exact('Maximum 10 users')}</span></div>{' '}
            <input type="hidden" name="id" />
            <label>{exact('Name')}<input name="name" maxLength={80} autoComplete="name" placeholder={exact('Mary Jackson')} required /></label>{' '}
            <label>{exact('Email')}<input name="email" type="email" maxLength={254} autoComplete="email" placeholder="mary@example.test" required /></label>{' '}
            <label>{exact('Role')}<select name="role" defaultValue="member"><option value="admin">{exact('Admin')}</option><option value="member">{exact('Member')}</option><option value="viewer">{exact('Viewer')}</option></select></label>{' '}
            <p className="operation-status d1-form-status" role="status" aria-live="polite" data-form-status="users" />
            <div className="button-row"><button className="button-primary" type="submit">{exact('Create user')}</button><button type="button" data-cancel="users">{exact('Cancel')}</button></div>
          </form>
          <div className="table-wrap" tabIndex={0} aria-label={exact('Users table')}>
            <table><caption className="sr-only">{exact('Users in the demo_users table')}</caption><thead><tr><th scope="col">{exact('Name')}</th><th scope="col">{exact('Email')}</th><th scope="col">{exact('Role')}</th><th scope="col"><span className="sr-only">{exact('Actions')}</span></th></tr></thead><tbody data-rows="users"><tr><td colSpan={4}>{exact('Loading users…')}</td></tr></tbody></table>
          </div>
        </section>

        <section className="panel d1-table-panel" id={tasksPanel} role="tabpanel" aria-labelledby={tasksTab} data-table-panel="tasks" hidden>
          <div className="d1-table-heading">
            <div><p className="eyebrow">{exact('Table / demo_tasks')}</p><DemoHeading level={2}>{exact('Tasks')} <span data-heading-count="tasks" /></DemoHeading></div>
            <button className="button-primary" type="button" data-add="tasks">{exact('+ Add task')}</button>
          </div>
          <p className="d1-table-hint"><code>demo_tasks.assignee_id</code> → <code>demo_users.id</code></p>
          <form className="lab-form d1-editor" data-form="tasks" hidden>
            <div className="d1-editor-heading"><strong data-editor-title="tasks">{exact('Add task')}</strong><span>{exact('Maximum 25 tasks')}</span></div>{' '}
            <input type="hidden" name="id" />
            <label>{exact('Task title')}<input name="title" maxLength={120} placeholder={exact('Review deployment evidence')} required /></label>{' '}
            <label>{exact('Assignee')}<select name="assigneeId" defaultValue=""><option value="">{exact('Unassigned')}</option></select></label>{' '}
            <label>{exact('Status')}<select name="status" defaultValue="todo"><option value="todo">{exact('To do')}</option><option value="doing">{exact('In progress')}</option><option value="done">{exact('Done')}</option></select></label>{' '}
            <p className="operation-status d1-form-status" role="status" aria-live="polite" data-form-status="tasks" />
            <div className="button-row"><button className="button-primary" type="submit">{exact('Create task')}</button><button type="button" data-cancel="tasks">{exact('Cancel')}</button></div>
          </form>
          <div className="table-wrap" tabIndex={0} aria-label={exact('Tasks table')}>
            <table><caption className="sr-only">{exact('Tasks in the demo_tasks table')}</caption><thead><tr><th scope="col">{exact('Task')}</th><th scope="col">{exact('Assignee')}</th><th scope="col">{exact('Status')}</th><th scope="col"><span className="sr-only">{exact('Actions')}</span></th></tr></thead><tbody data-rows="tasks"><tr><td colSpan={4}>{exact('Loading tasks…')}</td></tr></tbody></table>
          </div>
        </section>
      </div>

      <aside className="d1-sidebar">
        <section className="panel d1-inspector" aria-labelledby={stateHeading}>
          <p className="eyebrow">{exact('Live database evidence')}</p><DemoHeading level={2} id={stateHeading}>{exact('SQL Inspector')}</DemoHeading>{' '}
          <div className="d1-operation-summary">
            <span className="badge d1-sql-verb" data-inspector-verb="">{exact('Waiting')}</span>{' '}
            <div><strong data-inspector-status="">{exact('Choose a table')}</strong><span data-inspector-metrics="">{exact('No query yet')}</span></div>
          </div>{' '}
          <div className="d1-sql-block">
            <span>{exact('Statement')}</span>{' '}
            <pre data-inspector-sql="">{exact('Select a table or modify a row to inspect its parameterized SQL.')}</pre>
          </div>{' '}
          <details className="d1-response-details"><summary>{exact('Response JSON')}</summary><pre data-state-output="">{exact('No response yet.')}</pre></details>
        </section>
      </aside>
    </section>

    <section className="panel d1-sandbox" aria-labelledby={sandboxHeading}>
      <div><p className="eyebrow">{exact('Sandbox')}</p><DemoHeading level={2} id={sandboxHeading}>{exact('Your isolated D1 sandbox')}</DemoHeading><p className="subtle">{exact('These rows are persisted server-side in D1 and isolated to this visitor sandbox. Reset restores three fictional users and four related tasks.')}</p></div>
      <button type="button" data-reset="">{exact('Reset sample data')}</button>
    </section>

    <dialog className="d1-confirm-dialog" data-confirm-dialog="" aria-labelledby={confirmTitle} aria-describedby={confirmMessage}>
      <p className="eyebrow">{exact('Confirm change')}</p>
      <DemoHeading level={2} id={confirmTitle} data-confirm-title="">{exact('Delete row?')}</DemoHeading>
      <p id={confirmMessage} data-confirm-message="" />
      <div className="button-row"><button type="button" data-confirm-cancel="">{exact('Cancel')}</button><button className="button-primary" type="button" data-confirm-action="">{exact('Continue')}</button></div>
    </dialog>
  </>;
}

export function d1Section(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  const presentationPath = `${routeUrl('demos.index')}#d1`;
  const browserModule = routeUrl('operations.assets', { asset: browserAssetName('scripts.d1') });
  return createReactDemoSection(env, {
    key: 'd1',
    title: 'Cloudflare D1',
    defaultPresentationPath: presentationPath,
    browserModule,
    browserMessages: d1BrowserMessages(localization),
    children: <D1Presentation localization={localization} />,
  }, options);
}
