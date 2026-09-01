import type { Env } from '../types';
import { HttpError } from './http';

export type DemoRole = 'admin' | 'member' | 'viewer';
export type DemoTaskStatus = 'todo' | 'doing' | 'done';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  assignee_id: string | null;
  title: string;
  status: DemoTaskStatus;
  created_at: string;
  updated_at: string;
}

interface CountRow { total: number }

export const D1_STATEMENTS = {
  usersList: 'SELECT id, name, email, role, created_at, updated_at FROM demo_users WHERE session_id = ? ORDER BY updated_at DESC LIMIT 10',
  usersCreate: 'INSERT INTO demo_users (id, session_id, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  usersUpdate: 'UPDATE demo_users SET name = ?, email = ?, role = ?, updated_at = ? WHERE session_id = ? AND id = ?',
  usersDelete: 'DELETE FROM demo_users WHERE session_id = ? AND id = ?',
  tasksList: 'SELECT id, assignee_id, title, status, created_at, updated_at FROM demo_tasks WHERE session_id = ? ORDER BY updated_at DESC LIMIT 25',
  tasksCreate: 'INSERT INTO demo_tasks (id, session_id, assignee_id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  tasksUpdate: 'UPDATE demo_tasks SET assignee_id = ?, title = ?, status = ?, updated_at = ? WHERE session_id = ? AND id = ?',
  tasksDelete: 'DELETE FROM demo_tasks WHERE session_id = ? AND id = ?',
} as const;

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  createdAt: string;
  updatedAt: string;
}

export interface DemoTask {
  id: string;
  assigneeId: string | null;
  title: string;
  status: DemoTaskStatus;
  createdAt: string;
  updatedAt: string;
}

function user(row: UserRow): DemoUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.created_at, updatedAt: row.updated_at };
}

function task(row: TaskRow): DemoTask {
  return { id: row.id, assigneeId: row.assignee_id, title: row.title, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

function text(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') throw new HttpError(400, `invalid_${field}`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) throw new HttpError(400, `invalid_${field}`);
  return normalized;
}

function email(value: unknown): string {
  const normalized = text(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new HttpError(400, 'invalid_email');
  return normalized;
}

function role(value: unknown): DemoRole {
  if (value === 'admin' || value === 'member' || value === 'viewer') return value;
  throw new HttpError(400, 'invalid_role');
}

function status(value: unknown): DemoTaskStatus {
  if (value === 'todo' || value === 'doing' || value === 'done') return value;
  throw new HttpError(400, 'invalid_status');
}

function optionalId(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/.test(value)) throw new HttpError(400, 'invalid_assignee_id');
  return value;
}

function exactFields(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'invalid_body');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowed.includes(key))) throw new HttpError(400, 'unknown_field');
  return record;
}

export function parseUserInput(value: unknown): { name: string; email: string; role: DemoRole } {
  const body = exactFields(value, ['name', 'email', 'role']);
  return { name: text(body.name, 'name', 80), email: email(body.email), role: role(body.role) };
}

export function parseTaskInput(value: unknown): { assigneeId: string | null; title: string; status: DemoTaskStatus } {
  const body = exactFields(value, ['assigneeId', 'title', 'status']);
  return { assigneeId: optionalId(body.assigneeId), title: text(body.title, 'title', 120), status: status(body.status) };
}

export function validDemoId(value: string): string {
  if (!/^[0-9a-f-]{36}$/.test(value)) throw new HttpError(400, 'invalid_id');
  return value;
}

async function count(env: Env, table: 'demo_users' | 'demo_tasks', sessionId: string): Promise<number> {
  const result = await env.DEMO_DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE session_id = ?`).bind(sessionId).all<CountRow>();
  return Number(result.results[0]?.total || 0);
}

async function assigneeExists(env: Env, sessionId: string, id: string | null): Promise<boolean> {
  if (!id) return true;
  const result = await env.DEMO_DB.prepare('SELECT COUNT(*) AS total FROM demo_users WHERE session_id = ? AND id = ?')
    .bind(sessionId, id).all<CountRow>();
  return Number(result.results[0]?.total || 0) === 1;
}

async function seed(env: Env, sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  const users = [
    { id: crypto.randomUUID(), name: 'Ada Lovelace', email: 'ada@example.test', role: 'admin' as const },
    { id: crypto.randomUUID(), name: 'Grace Hopper', email: 'grace@example.test', role: 'member' as const },
    { id: crypto.randomUUID(), name: 'Katherine Johnson', email: 'katherine@example.test', role: 'viewer' as const },
  ];
  for (const item of users) {
    await env.DEMO_DB.prepare(D1_STATEMENTS.usersCreate)
      .bind(item.id, sessionId, item.name, item.email, item.role, now, now).run();
  }
  const tasks = [
    [users[0].id, 'Review architecture evidence', 'doing'],
    [users[1].id, 'Verify the D1 migration', 'done'],
    [users[2].id, 'Inspect keyboard behavior', 'todo'],
    [null, 'Prepare the next release', 'todo'],
  ] as const;
  for (const [assigneeId, title, taskStatus] of tasks) {
    await env.DEMO_DB.prepare(D1_STATEMENTS.tasksCreate)
      .bind(crypto.randomUUID(), sessionId, assigneeId, title, taskStatus, now, now).run();
  }
}

export async function ensureDemoSeed(env: Env, sessionId: string): Promise<void> {
  if (await count(env, 'demo_users', sessionId) === 0) await seed(env, sessionId);
}

export async function listDemoUsers(env: Env, sessionId: string): Promise<DemoUser[]> {
  await ensureDemoSeed(env, sessionId);
  const result = await env.DEMO_DB.prepare(D1_STATEMENTS.usersList).bind(sessionId).all<UserRow>();
  return result.results.map(user);
}

export async function getDemoUser(env: Env, sessionId: string, id: string): Promise<DemoUser | null> {
  const result = await env.DEMO_DB.prepare(
    'SELECT id, name, email, role, created_at, updated_at FROM demo_users WHERE session_id = ? AND id = ? LIMIT 1',
  ).bind(sessionId, id).all<UserRow>();
  return result.results[0] ? user(result.results[0]) : null;
}

export async function createDemoUser(env: Env, sessionId: string, input: unknown): Promise<DemoUser> {
  await ensureDemoSeed(env, sessionId);
  if (await count(env, 'demo_users', sessionId) >= 10) throw new HttpError(409, 'user_limit_reached');
  const parsed = parseUserInput(input);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await env.DEMO_DB.prepare(D1_STATEMENTS.usersCreate)
      .bind(id, sessionId, parsed.name, parsed.email, parsed.role, now, now).run();
  } catch { throw new HttpError(409, 'email_already_exists'); }
  return (await getDemoUser(env, sessionId, id))!;
}

export async function updateDemoUser(env: Env, sessionId: string, id: string, input: unknown): Promise<DemoUser> {
  const existing = await getDemoUser(env, sessionId, validDemoId(id));
  if (!existing) throw new HttpError(404, 'user_not_found');
  const parsed = parseUserInput(input);
  try {
    await env.DEMO_DB.prepare(D1_STATEMENTS.usersUpdate)
      .bind(parsed.name, parsed.email, parsed.role, new Date().toISOString(), sessionId, id).run();
  } catch { throw new HttpError(409, 'email_already_exists'); }
  return (await getDemoUser(env, sessionId, id))!;
}

export async function deleteDemoUser(env: Env, sessionId: string, id: string): Promise<void> {
  if (!(await getDemoUser(env, sessionId, validDemoId(id)))) throw new HttpError(404, 'user_not_found');
  await env.DEMO_DB.prepare('UPDATE demo_tasks SET assignee_id = NULL, updated_at = ? WHERE session_id = ? AND assignee_id = ?')
    .bind(new Date().toISOString(), sessionId, id).run();
  await env.DEMO_DB.prepare(D1_STATEMENTS.usersDelete).bind(sessionId, id).run();
}

export async function listDemoTasks(env: Env, sessionId: string): Promise<DemoTask[]> {
  await ensureDemoSeed(env, sessionId);
  const result = await env.DEMO_DB.prepare(D1_STATEMENTS.tasksList).bind(sessionId).all<TaskRow>();
  return result.results.map(task);
}

export async function getDemoTask(env: Env, sessionId: string, id: string): Promise<DemoTask | null> {
  const result = await env.DEMO_DB.prepare(
    'SELECT id, assignee_id, title, status, created_at, updated_at FROM demo_tasks WHERE session_id = ? AND id = ? LIMIT 1',
  ).bind(sessionId, id).all<TaskRow>();
  return result.results[0] ? task(result.results[0]) : null;
}

export async function createDemoTask(env: Env, sessionId: string, input: unknown): Promise<DemoTask> {
  await ensureDemoSeed(env, sessionId);
  if (await count(env, 'demo_tasks', sessionId) >= 25) throw new HttpError(409, 'task_limit_reached');
  const parsed = parseTaskInput(input);
  if (!(await assigneeExists(env, sessionId, parsed.assigneeId))) throw new HttpError(400, 'assignee_not_found');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DEMO_DB.prepare(D1_STATEMENTS.tasksCreate)
    .bind(id, sessionId, parsed.assigneeId, parsed.title, parsed.status, now, now).run();
  return (await getDemoTask(env, sessionId, id))!;
}

export async function updateDemoTask(env: Env, sessionId: string, id: string, input: unknown): Promise<DemoTask> {
  if (!(await getDemoTask(env, sessionId, validDemoId(id)))) throw new HttpError(404, 'task_not_found');
  const parsed = parseTaskInput(input);
  if (!(await assigneeExists(env, sessionId, parsed.assigneeId))) throw new HttpError(400, 'assignee_not_found');
  await env.DEMO_DB.prepare(D1_STATEMENTS.tasksUpdate)
    .bind(parsed.assigneeId, parsed.title, parsed.status, new Date().toISOString(), sessionId, id).run();
  return (await getDemoTask(env, sessionId, id))!;
}

export async function deleteDemoTask(env: Env, sessionId: string, id: string): Promise<void> {
  if (!(await getDemoTask(env, sessionId, validDemoId(id)))) throw new HttpError(404, 'task_not_found');
  await env.DEMO_DB.prepare(D1_STATEMENTS.tasksDelete).bind(sessionId, id).run();
}

export async function resetDemoUsersAndTasks(env: Env, sessionId: string): Promise<{ users: number; tasks: number }> {
  await env.DEMO_DB.prepare('DELETE FROM demo_tasks WHERE session_id = ?').bind(sessionId).run();
  await env.DEMO_DB.prepare('DELETE FROM demo_users WHERE session_id = ?').bind(sessionId).run();
  await env.DEMO_DB.prepare("DELETE FROM demo_state WHERE session_id = ? AND state_key IN ('d1', 'graphql')").bind(sessionId).run();
  await seed(env, sessionId);
  return { users: 3, tasks: 4 };
}

