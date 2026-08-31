import type { Env } from '../types';

export type BudgetState = 'normal' | 'warning' | 'degraded';

export interface UsageSnapshot {
  id: number;
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

export async function recentUsage(env: Env, limit = 20): Promise<UsageSnapshot[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const result = await env.DEMO_DB.prepare(
    `SELECT id, service_key, metric_key, quantity, unit, estimated_cost_usd, budget_limit_usd, captured_at
     FROM usage_snapshots WHERE service_key = 'architecture-demo' ORDER BY id DESC LIMIT ?`,
  ).bind(safeLimit).all<UsageSnapshot>();
  return result.results;
}

export async function currentBudgetState(env: Env): Promise<{ state: BudgetState; snapshot: UsageSnapshot | null; percent: number }> {
  const snapshot = (await recentUsage(env, 1))[0] ?? null;
  if (!snapshot) return { state: 'normal', snapshot: null, percent: 0 };
  const budget = snapshot.budget_limit_usd ?? Number(env.BILLING_DEMO_MONTHLY_BUDGET_USD || '10');
  return { state: budgetState(snapshot.estimated_cost_usd, budget), snapshot, percent: budget > 0 ? (snapshot.estimated_cost_usd / budget) * 100 : 100 };
}
