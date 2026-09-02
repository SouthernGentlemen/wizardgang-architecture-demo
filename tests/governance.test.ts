import { describe, expect, it } from 'vitest';
import { aiEvaluationResponse, securityControlsResponse, traceabilityResponse } from '../src/api/governance';
import type { D1PreparedStatement, Env } from '../src/types';

class GovernanceStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() { return { meta: { last_row_id: 42 } }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_records')) return { results: [{ id: 1, namespace: this.values[0], record_key: 'example', value_json: '{"safe":true}' }] as T[] };
    if (this.sql.includes('FROM demo_events')) return { results: [{ id: 5, demo_id: 'admin', event_type: 'demo_state_changed', payload_json: '{}', created_at: '2026-08-31T00:00:00.000Z' }] as T[] };
    return { results: [] as T[] };
  }
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    DEMO_DB: { prepare: (sql: string) => new GovernanceStatement(sql) },
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
    ...overrides,
  };
}

describe('governance evidence', () => {
  it('reports missing deployment identity rather than inventing evidence', async () => {
    const response = await traceabilityResponse(new Request('https://demo.example/__api/evidence/traceability'), env({ DEPLOYED_VERSION: 'development' }));
    expect(await response.json()).toMatchObject({ releaseEvidence: { status: 'not-supplied', commit: null }, recentApplicationAuditEvents: [{ event_type: 'demo_state_changed' }] });
  });

  it('maps ISO/IEC 27001 alignment to direct public implementation evidence without certification', async () => {
    const body = await securityControlsResponse(new Request('https://demo.example/__api/governance/security-controls'), env()).json() as { alignment: string; controls: unknown[]; limitations: string[] };
    expect(body.alignment).toBe('ISO/IEC 27001 aligned — uncertified');
    expect(body.controls.length).toBeGreaterThanOrEqual(6);
    expect(body.limitations.join(' ')).toContain('No certification');
  });

  it('executes and audits approved, unknown, and invalid-scope MCP evaluation cases', async () => {
    const response = await aiEvaluationResponse(new Request('https://demo.example/__api/governance/ai-evaluation', { method: 'POST' }), env());
    const body = await response.json() as { passed: boolean; results: Array<{ actual: string; httpStatus: number; passed: boolean }>; alignment: string };
    expect(response.status).toBe(200);
    expect(body.passed).toBe(true);
    expect(body.results.map((result) => result.actual)).toEqual(['tool result', 'JSON-RPC -32601', 'tool error']);
    expect(body.results.map((result) => result.httpStatus)).toEqual([200, 200, 200]);
    expect(body.alignment).toContain('uncertified');
  });
});
