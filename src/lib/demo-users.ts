import type { Env } from '../types';
import { HttpError } from './http';
import { COLLECTIONS, TTL_SECONDS, demoRecords } from './storage';

export type DemoRole = 'admin' | 'member' | 'viewer';
export type DemoTaskStatus = 'todo' | 'doing' | 'done';

// The lab shows the storage call behind each operation. Rows live in the shared records table, one collection per
// resource, owned by the visitor's sandbox session and expiring with it.
export const D1_STATEMENTS = {
  usersList: "records.list('lab-users', { owner: sessionId }) -> newest 10 by updatedAt",
  usersCreate: "records.put('lab-users', id, user, { owner: sessionId, ttlSeconds: 86400 })",
  usersUpdate: "records.put('lab-users', id, user, { owner: sessionId, ttlSeconds: 86400 })",
  usersDelete: "records.delete('lab-users', id) after an owner check",
  tasksList: "records.list('lab-tasks', { owner: sessionId }) -> newest 25 by updatedAt",
  tasksCreate: "records.put('lab-tasks', id, task, { owner: sessionId, ttlSeconds: 86400 })",
  tasksUpdate: "records.put('lab-tasks', id, task, { owner: sessionId, ttlSeconds: 86400 })",
  tasksDelete: "records.delete('lab-tasks', id) after an owner check",
} as const;

const MAX_USERS = 10;
const MAX_TASKS = 25;

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

async function sandboxRows<T extends { updatedAt: string }>(env: Env, collection: string, sessionId: string): Promise<T[]> {
  const rows = await demoRecords(env).list<T>(collection, { owner: sessionId, limit: 100 });
  return rows.map((row) => row.body).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

async function sandboxRow<T>(env: Env, collection: string, sessionId: string, id: string): Promise<T | null> {
  const row = await demoRecords(env).get<T>(collection, id);
  return row && row.owner === sessionId ? row.body : null;
}

async function saveRow<T extends { id: string }>(env: Env, collection: string, sessionId: string, row: T): Promise<void> {
  await demoRecords(env).put(collection, row.id, row, { owner: sessionId, ttlSeconds: TTL_SECONDS.sandbox });
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

async function assigneeExists(env: Env, sessionId: string, id: string | null): Promise<boolean> {
  return !id || Boolean(await getDemoUser(env, sessionId, id));
}

async function emailTaken(env: Env, sessionId: string, address: string, exceptId?: string): Promise<boolean> {
  const users = await sandboxRows<DemoUser>(env, COLLECTIONS.labUsers, sessionId);
  return users.some((candidate) => candidate.email === address && candidate.id !== exceptId);
}

async function seed(env: Env, sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  const users: DemoUser[] = [
    { id: crypto.randomUUID(), name: 'Ada Lovelace', email: 'ada@example.test', role: 'admin', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Grace Hopper', email: 'grace@example.test', role: 'member', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Katherine Johnson', email: 'katherine@example.test', role: 'viewer', createdAt: now, updatedAt: now },
  ];
  for (const item of users) await saveRow(env, COLLECTIONS.labUsers, sessionId, item);
  const tasks = [
    [users[0].id, 'Review architecture evidence', 'doing'],
    [users[1].id, 'Verify the shared records table', 'done'],
    [users[2].id, 'Inspect keyboard behavior', 'todo'],
    [null, 'Prepare the next release', 'todo'],
  ] as const;
  for (const [assigneeId, title, taskStatus] of tasks) {
    const item: DemoTask = { id: crypto.randomUUID(), assigneeId, title, status: taskStatus, createdAt: now, updatedAt: now };
    await saveRow(env, COLLECTIONS.labTasks, sessionId, item);
  }
}

export async function ensureDemoSeed(env: Env, sessionId: string): Promise<void> {
  const existing = await demoRecords(env).list(COLLECTIONS.labUsers, { owner: sessionId, limit: 1 });
  if (existing.length === 0) await seed(env, sessionId);
}

export async function listDemoUsers(env: Env, sessionId: string): Promise<DemoUser[]> {
  await ensureDemoSeed(env, sessionId);
  return (await sandboxRows<DemoUser>(env, COLLECTIONS.labUsers, sessionId)).slice(0, MAX_USERS);
}

export async function getDemoUser(env: Env, sessionId: string, id: string): Promise<DemoUser | null> {
  return sandboxRow<DemoUser>(env, COLLECTIONS.labUsers, sessionId, id);
}

export async function createDemoUser(env: Env, sessionId: string, input: unknown): Promise<DemoUser> {
  await ensureDemoSeed(env, sessionId);
  if ((await sandboxRows<DemoUser>(env, COLLECTIONS.labUsers, sessionId)).length >= MAX_USERS) throw new HttpError(409, 'user_limit_reached');
  const parsed = parseUserInput(input);
  if (await emailTaken(env, sessionId, parsed.email)) throw new HttpError(409, 'email_already_exists');
  const now = new Date().toISOString();
  const created: DemoUser = { id: crypto.randomUUID(), ...parsed, createdAt: now, updatedAt: now };
  await saveRow(env, COLLECTIONS.labUsers, sessionId, created);
  return created;
}

export async function updateDemoUser(env: Env, sessionId: string, id: string, input: unknown): Promise<DemoUser> {
  const existing = await getDemoUser(env, sessionId, validDemoId(id));
  if (!existing) throw new HttpError(404, 'user_not_found');
  const parsed = parseUserInput(input);
  if (await emailTaken(env, sessionId, parsed.email, id)) throw new HttpError(409, 'email_already_exists');
  const updated: DemoUser = { ...existing, ...parsed, updatedAt: new Date().toISOString() };
  await saveRow(env, COLLECTIONS.labUsers, sessionId, updated);
  return updated;
}

export async function deleteDemoUser(env: Env, sessionId: string, id: string): Promise<void> {
  if (!(await getDemoUser(env, sessionId, validDemoId(id)))) throw new HttpError(404, 'user_not_found');
  const now = new Date().toISOString();
  for (const item of await sandboxRows<DemoTask>(env, COLLECTIONS.labTasks, sessionId)) {
    if (item.assigneeId === id) await saveRow(env, COLLECTIONS.labTasks, sessionId, { ...item, assigneeId: null, updatedAt: now });
  }
  await demoRecords(env).delete(COLLECTIONS.labUsers, id);
}

export async function listDemoTasks(env: Env, sessionId: string): Promise<DemoTask[]> {
  await ensureDemoSeed(env, sessionId);
  return (await sandboxRows<DemoTask>(env, COLLECTIONS.labTasks, sessionId)).slice(0, MAX_TASKS);
}

export async function getDemoTask(env: Env, sessionId: string, id: string): Promise<DemoTask | null> {
  return sandboxRow<DemoTask>(env, COLLECTIONS.labTasks, sessionId, id);
}

export async function createDemoTask(env: Env, sessionId: string, input: unknown): Promise<DemoTask> {
  await ensureDemoSeed(env, sessionId);
  if ((await sandboxRows<DemoTask>(env, COLLECTIONS.labTasks, sessionId)).length >= MAX_TASKS) throw new HttpError(409, 'task_limit_reached');
  const parsed = parseTaskInput(input);
  if (!(await assigneeExists(env, sessionId, parsed.assigneeId))) throw new HttpError(400, 'assignee_not_found');
  const now = new Date().toISOString();
  const created: DemoTask = { id: crypto.randomUUID(), ...parsed, createdAt: now, updatedAt: now };
  await saveRow(env, COLLECTIONS.labTasks, sessionId, created);
  return created;
}

export async function updateDemoTask(env: Env, sessionId: string, id: string, input: unknown): Promise<DemoTask> {
  const existing = await getDemoTask(env, sessionId, validDemoId(id));
  if (!existing) throw new HttpError(404, 'task_not_found');
  const parsed = parseTaskInput(input);
  if (!(await assigneeExists(env, sessionId, parsed.assigneeId))) throw new HttpError(400, 'assignee_not_found');
  const updated: DemoTask = { ...existing, ...parsed, updatedAt: new Date().toISOString() };
  await saveRow(env, COLLECTIONS.labTasks, sessionId, updated);
  return updated;
}

export async function deleteDemoTask(env: Env, sessionId: string, id: string): Promise<void> {
  if (!(await getDemoTask(env, sessionId, validDemoId(id)))) throw new HttpError(404, 'task_not_found');
  await demoRecords(env).delete(COLLECTIONS.labTasks, id);
}

export async function resetDemoUsersAndTasks(env: Env, sessionId: string): Promise<{ users: number; tasks: number }> {
  const store = demoRecords(env);
  for (const collection of [COLLECTIONS.labTasks, COLLECTIONS.labUsers]) {
    for (const row of await store.list(collection, { owner: sessionId, limit: 100 })) await store.delete(collection, row.id);
  }
  await seed(env, sessionId);
  return { users: 3, tasks: 4 };
}
