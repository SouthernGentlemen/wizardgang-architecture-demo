import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { aiEvaluationResponse, securityControlsResponse, traceabilityResponse } from '../src/api/governance';
import {
  findPublishedAssuranceRecord,
  listPublishedAssuranceRecords,
} from '../src/assurance/publication';
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

type GovernanceControl = {
  area: string;
  implementation: string;
  evidence: string | null;
};

function canonicalIso27001Claims() {
  const complianceIds = new Set(
    listPublishedAssuranceRecords('compliance')
      .filter((record) => record.framework === 'iso-27001')
      .map((record) => record.id),
  );
  return listPublishedAssuranceRecords('claims')
    .filter((claim) => claim.relationships.compliance.some((recordId) => complianceIds.has(recordId)));
}

function firstPublishedEvidence(evidenceIds: string[]) {
  for (const evidenceId of evidenceIds) {
    const evidence = findPublishedAssuranceRecord('evidence', evidenceId);
    if (evidence) return evidence;
  }
  return undefined;
}

describe('governance evidence', () => {
  it('reports missing deployment identity rather than inventing evidence', async () => {
    const response = await traceabilityResponse(new Request('https://demo.example/__api/evidence/traceability'), env({ DEPLOYED_VERSION: 'development' }));
    expect(await response.json()).toMatchObject({ releaseEvidence: { status: 'not-supplied', commit: null }, recentApplicationAuditEvents: [{ event_type: 'demo_state_changed' }] });
  });

  it('uses the shared exact deployment identity for traceability', async () => {
    const deployedSha = '0123456789abcdef0123456789abcdef01234567';
    const response = await traceabilityResponse(
      new Request('https://demo.example/__api/evidence/traceability'),
      env({ DEPLOYED_VERSION: 'v0.14.0', DEPLOYED_SHA: deployedSha, GITHUB_BRANCH: 'moving-branch' }),
    );
    expect(await response.json()).toMatchObject({
      releaseEvidence: {
        status: 'traceable',
        version: 'v0.14.0',
        commit: deployedSha,
        source: `https://github.com/SouthernGentlemen/wizardgang-architecture-demo/commit/${deployedSha}`,
      },
    });
  });

  it('derives the ISO/IEC 27001 control projection from published canonical claim relationships', async () => {
    const body = await securityControlsResponse(
      new Request('https://demo.example/__api/governance/security-controls'),
      env({ DEPLOYED_SHA: '0123456789abcdef0123456789abcdef01234567' }),
    ).json() as { alignment: string; controls: GovernanceControl[]; limitations: string[] };
    const expectedClaims = canonicalIso27001Claims();

    expect(body.alignment).toBe('ISO/IEC 27001 aligned — uncertified');
    expect(body.controls.map((control) => ({ area: control.area, implementation: control.implementation }))).toEqual(
      expectedClaims.map((claim) => ({
        area: claim.area.replaceAll('-', ' '),
        implementation: claim.statement,
      })),
    );
    expect(body.limitations.join(' ')).toContain('No certification');
  });

  it('resolves canonical repository evidence at the exact deployed SHA, never the configured branch', async () => {
    const deployedSha = 'fedcba9876543210fedcba9876543210fedcba98';
    const repository = 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo';
    const request = new Request('https://demo.example/__api/governance/security-controls');
    const body = await securityControlsResponse(request, env({
      DEPLOYED_SHA: deployedSha,
      GITHUB_BRANCH: 'moving-branch',
    })).json() as { controls: GovernanceControl[] };

    for (const claim of canonicalIso27001Claims()) {
      const control = body.controls.find((candidate) => candidate.implementation === claim.statement);
      expect(control).toBeDefined();
      const evidence = firstPublishedEvidence(claim.relationships.evidence);
      expect(evidence).toBeDefined();
      if (evidence?.locator.repositoryPath) {
        expect(control?.evidence).toBe(`${repository}/blob/${deployedSha}/${evidence.locator.repositoryPath}`);
      } else if (evidence?.locator.route) {
        expect(control?.evidence).toBe(new URL(evidence.locator.route, request.url).toString());
      }
    }

    expect(JSON.stringify(body.controls)).not.toContain('/blob/moving-branch/');
    expect(JSON.stringify(body.controls)).not.toContain('/blob/main/');
  });

  it('does not fabricate a moving-branch URL when deployment identity is absent', async () => {
    const body = await securityControlsResponse(
      new Request('https://demo.example/__api/governance/security-controls'),
      env({ GITHUB_BRANCH: 'moving-branch', DEPLOYED_SHA: undefined }),
    ).json() as { controls: GovernanceControl[] };
    const releaseBoundClaim = canonicalIso27001Claims().find((claim) => {
      const evidence = firstPublishedEvidence(claim.relationships.evidence);
      return evidence?.freshnessPolicy === 'release-bound' && Boolean(evidence.locator.repositoryPath);
    });
    expect(releaseBoundClaim).toBeDefined();
    expect(body.controls.find((control) => control.implementation === releaseBoundClaim?.statement)?.evidence).toBeNull();
  });

  it('keeps governance serialization free of independent control maps and branch-based evidence URL builders', () => {
    const source = readFileSync('src/api/governance.ts', 'utf8');
    expect(source).not.toContain('env.GITHUB_BRANCH');
    expect(source).not.toContain('/blob/');
    expect(source).not.toContain("source('src/lib/authorization.ts')");
    expect(source).not.toContain("source('.github/workflows/ci.yml')");
    expect(source).not.toContain("source('docs/RELEASE.md')");
    expect(source).not.toContain("source('src/lib/logs.ts')");
    expect(source).not.toContain("source('SECURITY.md')");
    expect(source).not.toContain("source('docs/OPERATIONS.md')");
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
