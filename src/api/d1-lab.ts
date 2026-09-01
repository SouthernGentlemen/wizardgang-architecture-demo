import type { Env } from '../types';
import { requireSameOrigin } from '../lib/admin-auth';
import { ensureDemoSession, withDemoSession, type DemoSession } from '../lib/demo-session';
import {
  D1_STATEMENTS,
  createDemoTask,
  createDemoUser,
  deleteDemoTask,
  deleteDemoUser,
  listDemoTasks,
  listDemoUsers,
  resetDemoUsersAndTasks,
  updateDemoTask,
  updateDemoUser,
  validDemoId,
} from '../lib/demo-users';
import { errorResponse, json, methodNotAllowed, readJson } from '../lib/http';
import { recordDemoEvent } from '../lib/audit';

type Resource = 'users' | 'tasks' | 'reset';

function envelope(
  operation: string,
  status: number,
  startedAt: number,
  statement: string,
  parameters: string[],
  rowCount: number,
  result: unknown,
): Response {
  return json({
    requestId: crypto.randomUUID(),
    operation,
    resource: 'DEMO_DB / demo-blob',
    status,
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    rowCount,
    statement,
    parameters,
    result,
  }, { status, headers: { 'cache-control': 'no-store' } });
}

function attach(response: Response, session: DemoSession | undefined): Response {
  return session ? withDemoSession(response, session) : response;
}

export async function d1LabResponse(request: Request, env: Env, resource: Resource, rawId?: string): Promise<Response> {
  let session: DemoSession | undefined;
  const startedAt = performance.now();
  try {
    if (request.method !== 'GET') {
      const originFailure = requireSameOrigin(request);
      if (originFailure) return originFailure;
    }
    session = await ensureDemoSession(request, env);
    const id = rawId ? validDemoId(decodeURIComponent(rawId)) : undefined;

    if (resource === 'reset') {
      if (request.method !== 'POST') return attach(methodNotAllowed(['POST']), session);
      const result = await resetDemoUsersAndTasks(env, session.id);
      await recordDemoEvent(env, 'd1', 'visitor_sandbox_reset', { scope: 'users_tasks' });
      return attach(envelope('d1.reset', 200, startedAt, 'DELETE scoped rows; INSERT deterministic seed', ['sessionId'], 7, result), session);
    }

    if (resource === 'users') {
      if (!id && request.method === 'GET') {
        const users = await listDemoUsers(env, session.id);
        return attach(envelope('d1.users.list', 200, startedAt, D1_STATEMENTS.usersList, ['sessionId'], users.length, { users }), session);
      }
      if (!id && request.method === 'POST') {
        const created = await createDemoUser(env, session.id, await readJson<unknown>(request));
        return attach(envelope('d1.users.create', 201, startedAt, D1_STATEMENTS.usersCreate, ['id', 'sessionId', 'name', 'email', 'role', 'createdAt', 'updatedAt'], 1, { user: created }), session);
      }
      if (id && request.method === 'PATCH') {
        const updated = await updateDemoUser(env, session.id, id, await readJson<unknown>(request));
        return attach(envelope('d1.users.update', 200, startedAt, D1_STATEMENTS.usersUpdate, ['name', 'email', 'role', 'updatedAt', 'sessionId', 'id'], 1, { user: updated }), session);
      }
      if (id && request.method === 'DELETE') {
        await deleteDemoUser(env, session.id, id);
        return attach(envelope('d1.users.delete', 200, startedAt, D1_STATEMENTS.usersDelete, ['sessionId', 'id'], 1, { deleted: true, id }), session);
      }
      return attach(methodNotAllowed(id ? ['PATCH', 'DELETE'] : ['GET', 'POST']), session);
    }

    if (!id && request.method === 'GET') {
      const tasks = await listDemoTasks(env, session.id);
      return attach(envelope('d1.tasks.list', 200, startedAt, D1_STATEMENTS.tasksList, ['sessionId'], tasks.length, { tasks }), session);
    }
    if (!id && request.method === 'POST') {
      const created = await createDemoTask(env, session.id, await readJson<unknown>(request));
      return attach(envelope('d1.tasks.create', 201, startedAt, D1_STATEMENTS.tasksCreate, ['id', 'sessionId', 'assigneeId', 'title', 'status', 'createdAt', 'updatedAt'], 1, { task: created }), session);
    }
    if (id && request.method === 'PATCH') {
      const updated = await updateDemoTask(env, session.id, id, await readJson<unknown>(request));
      return attach(envelope('d1.tasks.update', 200, startedAt, D1_STATEMENTS.tasksUpdate, ['assigneeId', 'title', 'status', 'updatedAt', 'sessionId', 'id'], 1, { task: updated }), session);
    }
    if (id && request.method === 'DELETE') {
      await deleteDemoTask(env, session.id, id);
      return attach(envelope('d1.tasks.delete', 200, startedAt, D1_STATEMENTS.tasksDelete, ['sessionId', 'id'], 1, { deleted: true, id }), session);
    }
    return attach(methodNotAllowed(id ? ['PATCH', 'DELETE'] : ['GET', 'POST']), session);
  } catch (error) {
    return attach(errorResponse(error), session);
  }
}

