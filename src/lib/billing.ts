import type { Env } from '../types';
import { COLLECTIONS, TTL_SECONDS, demoRecords } from './storage';

export type BudgetState = 'normal' | 'warning' | 'degraded';

export interface UsageSnapshot {
  service_key: string;
  metric_key: string;
  quantity: number;
  unit: string;
  estimated_cost_usd: number;
  budget_limit_usd: number | null;
  captured_at: string;
}

export function budgetState(cost: number, budget: number): BudgetState {
  const percent = budget > 0 ? (cost / budget) * 100 : 100;
  return percent >= 90 ? 'degraded' : percent >= 70 ? 'warning' : 'normal';
}

const USAGE_ID = 'architecture-demo';

/** The latest synthetic usage snapshot, one record that each billing scenario replaces. */
export async function latestUsage(env: Env): Promise<UsageSnapshot | null> {
  return (await demoRecords(env).get<UsageSnapshot>(COLLECTIONS.usage, USAGE_ID))?.body ?? null;
}

export async function saveUsage(env: Env, snapshot: UsageSnapshot): Promise<void> {
  await demoRecords(env).put(COLLECTIONS.usage, USAGE_ID, snapshot, { ttlSeconds: TTL_SECONDS.usage });
}

export async function currentBudgetState(env: Env): Promise<{ state: BudgetState; snapshot: UsageSnapshot | null; percent: number }> {
  const snapshot = await latestUsage(env);
  if (!snapshot) return { state: 'normal', snapshot: null, percent: 0 };
  const budget = snapshot.budget_limit_usd ?? Number(env.BILLING_DEMO_MONTHLY_BUDGET_USD || '10');
  return { state: budgetState(snapshot.estimated_cost_usd, budget), snapshot, percent: budget > 0 ? (snapshot.estimated_cost_usd / budget) * 100 : 100 };
}
