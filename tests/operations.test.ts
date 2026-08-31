import { describe, expect, it } from 'vitest';
import { billingScenarioResponse } from '../src/api/billing';
import { workerComputeResponse } from '../src/api/runtime';
import { renderBilling, renderDashboard, renderDocs, renderHealth, renderUptime } from '../src/demos/operations-pages';
import type { D1PreparedStatement, Env } from '../src/types';

interface Usage { id: number; service_key: string; metric_key: string; quantity: number; unit: string; estimated_cost_usd: number; budget_limit_usd: number; captured_at: string }

class OperationsStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: OperationsD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.includes('INSERT INTO usage_snapshots')) this.db.usage.unshift({ id: this.db.nextId++, service_key: String(this.values[0]), metric_key: String(this.values[1]), quantity: Number(this.values[2]), unit: String(this.values[3]), estimated_cost_usd: Number(this.values[4]), budget_limit_usd: Number(this.values[5]), captured_at: String(this.values[6]) });
    return { meta: { last_row_id: this.db.nextId++ } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-08-31T00:00:00.000Z', updated_by: 'test' }] as T[] };
    if (this.sql.includes('FROM usage_snapshots')) return { results: this.db.usage.slice(0, Number(this.values.at(-1) || 20)) as T[] };
    if (this.sql.includes('FROM service_health_checks')) return { results: this.db.health as T[] };
    if (this.sql.includes('FROM application_logs')) return { results: [] as T[] };
    return { results: [] as T[] };
  }
}

class OperationsD1 {
  nextId = 10;
  usage: Usage[] = [];
  health = [
    { id: 3, service_key: 'public-demo', status: 'operational', response_ms: 4, detail_json: '{"intentionalOffline":false}', checked_at: '2026-08-31T03:00:00.000Z' },
    { id: 2, service_key: 'public-demo', status: 'down', response_ms: 4, detail_json: '{"intentionalOffline":true}', checked_at: '2026-08-31T02:00:00.000Z' },
    { id: 1, service_key: 'public-demo', status: 'degraded', response_ms: 4, detail_json: '{"intentionalOffline":false}', checked_at: '2026-08-31T01:00:00.000Z' },
  ];
  prepare(sql: string) { return new OperationsStatement(this, sql); }
}

function env(): Env {
  return {
    DEMO_DB: new OperationsD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
  };
}

describe('operations proof surface', () => {
  it('renders dashboard, health, docs, uptime classification, and billing from live state', async () => {
    const environment = env();
    expect(await (await renderDashboard(environment)).text()).toContain('Current operational state');
    expect(await (await renderHealth(environment)).text()).toContain('Runtime and dependency health');
    expect(await renderDocs(environment).text()).toContain('Swagger JSON');
    const uptime = await (await renderUptime(environment)).text();
    expect(uptime).toContain('planned/manual offline');
    expect(uptime).toContain('Unexpected degraded/down</dt><dd>1');
    expect(await (await renderBilling(environment)).text()).toContain('Synthetic billing');
  });

  it('moves controlled usage through degraded state and pauses only optional compute', async () => {
    const environment = env();
    const changed = await billingScenarioResponse(new Request('https://demo.example/__api/operations/billing', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: 'degraded' }),
    }), environment);
    expect(await changed.json()).toMatchObject({ synthetic: true, state: 'degraded', optionalWorkerCompute: 'paused' });

    const compute = await workerComputeResponse(new Request('https://demo.example/__api/workers/compute', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'sum', values: [1, 2] }),
    }), environment);
    expect(compute.status).toBe(429);
    expect(await compute.json()).toMatchObject({ error: 'synthetic_budget_degraded' });
  });
});
