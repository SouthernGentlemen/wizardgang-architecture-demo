import { describe, expect, it } from 'vitest';
import { listAssuranceRecords } from '../src/assurance/service';
import { assuranceRegistry } from '../src/assurance/model';
import {
  matchAssuranceRoute as matchAssuranceRouteContract,
  validateAssuranceRouteContract,
  validateAssuranceRouteHandlerSupport,
} from '../src/assurance/route-contract.js';
import { assuranceCollectionApiRoute } from '../src/assurance/routes';
import { ASSURANCE_ROUTE_HANDLER_SUPPORT, routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

class AssuranceRouteIntersectionStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: {} }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Route intersection test.', updated_at: '2026-09-04T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-04T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new AssuranceRouteIntersectionStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_ADMIN_USER: 'operator',
  DEMO_ADMIN_PASSWORD: 'test-admin-password',
  BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
};

function request(path: string): Promise<Response> {
  return routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept: 'application/json' } }), environment);
}

function dataset(registry: any, kind: string): any {
  return registry.datasets.find((candidate: any) => candidate.kind === kind);
}

describe('assurance route intersection ownership', () => {
  it('gives exact nested collections precedence over parent record templates independent of declaration order', () => {
    const fixture = structuredClone(assuranceRegistry) as any;
    dataset(fixture, 'risks').routes.api = '/v1/assurance/compliance/risks';

    expect(validateAssuranceRouteContract(fixture)).toEqual([]);
    expect(matchAssuranceRouteContract(fixture, '/v1/assurance/compliance/risks')).toEqual({
      owner: 'risks',
      kind: 'api-collection',
    });
  });

  it('applies the same static precedence to aliases that intersect record templates', () => {
    const fixture = structuredClone(assuranceRegistry) as any;
    dataset(fixture, 'evidence').routes.aliases.push({ path: '/v1/assurance/compliance/legacy', fragment: 'traceability' });

    expect(validateAssuranceRouteContract(fixture)).toEqual([]);
    expect(matchAssuranceRouteContract(fixture, '/v1/assurance/compliance/legacy')).toEqual({
      owner: 'evidence',
      kind: 'alias',
      target: '/evidence#traceability',
    });
  });

  it('matches one raw encoded record segment and never absorbs a path boundary', () => {
    expect(matchAssuranceRouteContract(assuranceRegistry, '/v1/assurance/compliance/A%2FB')).toEqual({
      owner: 'compliance',
      kind: 'api-record',
      recordId: 'A%2FB',
    });
    expect(matchAssuranceRouteContract(assuranceRegistry, '/v1/assurance/compliance/A%2FB/child')).toBeNull();
  });

  it('rejects intersecting record templates and embedded placeholders', () => {
    const intersecting = structuredClone(assuranceRegistry) as any;
    dataset(intersecting, 'risks').routes.api = '/v1/assurance';
    dataset(intersecting, 'risks').routes.apiRecord = '/v1/assurance/{id}/bar';
    expect(validateAssuranceRouteContract(intersecting).join('\n')).toMatch(/routes\.apiRecord intersects .*routes\.apiRecord/);

    const embedded = structuredClone(assuranceRegistry) as any;
    dataset(embedded, 'compliance').routes.apiRecord = '/v1/assurance/compliance/record-{id}';
    expect(validateAssuranceRouteContract(embedded).join('\n')).toMatch(/exactly one \{id\} path-segment placeholder/);
  });

  it('rejects declared exact-record routes when the owning runtime handler does not support them', () => {
    const fixture = structuredClone(assuranceRegistry) as any;
    dataset(fixture, 'risks').routes.apiRecord = '/v1/assurance/risks/{id}';

    expect(validateAssuranceRouteContract(fixture)).toEqual([]);
    expect(validateAssuranceRouteHandlerSupport(fixture, ASSURANCE_ROUTE_HANDLER_SUPPORT).join('\n')).toMatch(
      /risks declares routes\.apiRecord without an exact-record API handler/,
    );
  });
});

describe('actual assurance router ownership', () => {
  it('returns the owning collection projection rather than merely a successful response', async () => {
    const risks = await request(assuranceCollectionApiRoute('risks'));
    expect(risks.status).toBe(200);
    expect((await risks.json() as { dataset: string }).dataset).toBe('risks');

    const compliance = await request(assuranceCollectionApiRoute('compliance'));
    expect(compliance.status).toBe(200);
    expect((await compliance.json() as { dataset: string }).dataset).toBe('compliance');
  });

  it('preserves exact-record ownership, encoded IDs, and path boundaries in runtime dispatch', async () => {
    const record = listAssuranceRecords('compliance')[0];
    const encodedId = encodeURIComponent(record.id);
    const exact = await request(`${assuranceCollectionApiRoute('compliance')}/${encodedId}`);
    expect(exact.status).toBe(200);
    const body = await exact.json() as { dataset: string; record: { id: string } };
    expect(body.dataset).toBe('compliance');
    expect(body.record.id).toBe(record.id);

    const extraSegment = await request(`${assuranceCollectionApiRoute('compliance')}/${encodedId}/child`);
    expect(extraSegment.status).toBe(404);
  });
});
