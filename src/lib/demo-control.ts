import type { Env } from '../types';
import { recordDemoEvent } from './audit';
import { recordApplicationLog } from './logs';

export interface DemoControl {
  state: 'online' | 'offline';
  publicMessage: string;
  updatedAt: string;
  updatedBy: string | null;
}

const DEFAULT_CONTROL: DemoControl = {
  state: 'offline',
  publicMessage: 'Demo control state is temporarily unavailable.',
  updatedAt: new Date(0).toISOString(),
  updatedBy: null
};

export async function getDemoControl(env: Env): Promise<DemoControl> {
  try {
    const result = await env.DEMO_DB.prepare(
      'SELECT state, public_message, updated_at, updated_by FROM demo_control WHERE id = 1'
    ).all<{ state: 'online' | 'offline'; public_message: string; updated_at: string; updated_by: string | null }>();
    const row = result.results[0];
    if (!row) return DEFAULT_CONTROL;
    return {
      state: row.state,
      publicMessage: row.public_message,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by
    };
  } catch {
    // Fail closed: a D1 outage must not accidentally bypass an intentional offline state.
    return DEFAULT_CONTROL;
  }
}

export async function setDemoControl(
  env: Env,
  state: 'online' | 'offline',
  publicMessage: string,
  updatedBy: string
): Promise<DemoControl> {
  const updatedAt = new Date().toISOString();
  await env.DEMO_DB.prepare(`
    INSERT INTO demo_control (id, state, public_message, updated_at, updated_by)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      state = excluded.state,
      public_message = excluded.public_message,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  `).bind(state, publicMessage, updatedAt, updatedBy).run();

  await recordDemoEvent(env, 'admin', 'demo_state_changed', {
    state,
    message: publicMessage,
    updatedBy,
    updatedAt
  });

  await recordApplicationLog(env, {
    level: state === 'offline' ? 'warn' : 'info',
    source: 'admin',
    eventKey: 'demo_state_changed',
    message: `Demo state changed to ${state}.`,
    route: '/admin',
    detail: { state, publicMessage, updatedBy, updatedAt }
  });

  return { state, publicMessage, updatedAt, updatedBy };
}
