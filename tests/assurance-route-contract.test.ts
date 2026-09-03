import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assuranceAnchor,
  assuranceRecordUrls,
  assuranceRecordUrlsById,
  listAssuranceRecords,
} from '../src/assurance/service';
import { assuranceRegistry, type AssuranceDataset } from '../src/assurance/model';
import {
  assuranceCollectionApiRoute,
  assuranceHtmlRoute,
  assuranceRegistryApiRoute,
  assuranceRouteAliases,
  assuranceRouteDeclarations,
  assuranceRoutesForDataset,
  matchAssuranceRoute,
} from '../src/assurance/routes';
import { validateAssuranceRouteContract } from '../src/assurance/route-contract.js';
import { routeRequest } from '../src/router';
import type { D1PreparedStatement, Env } from '../src/types';

let demoState: 'online' | 'offline' = 'online';

class AssuranceRouteStatement implements D1PreparedStatement {
  constructor(private readonly sql: string) {}
  bind() { return this; }
  async run() { return { meta: {} }; }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: demoState, public_message: 'Route contract test.', updated_at: '2026-09-03T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.includes('FROM crawler_control')) {
      return { results: [{ state: 'disabled', updated_at: '2026-09-03T00:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    return { results: [] as T[] };
  }
}

const environment: Env = {
  DEMO_DB: { prepare: (sql: string) => new AssuranceRouteStatement(sql) },
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_ADMIN_USER: 'operator',
  DEMO_ADMIN_PASSWORD: 'test-admin-password',
  BILLING_DEMO_MONTHLY_BUDGET_USD: '10',
};

function request(path: string, accept = 'text/html,application/json'): Promise<Response> {
  return routeRequest(new Request(`https://demo.wizardgang.ai${path}`, { headers: { accept } }), environment);
}

function percentEncodeFirstCharacter(value: string): string {
  const first = value.codePointAt(0);
  if (first === undefined) return value;
  return `%${first.toString(16).toUpperCase().padStart(2, '0')}${value.slice(1)}`;
}

describe('canonical assurance route ownership', () => {
  it('owns registry, HTML, collection, exact-record, and shared incident/exercise routes from one contract', () => {
    expect(assuranceRegistryApiRoute()).toBe('/v1/assurance');
    expect(assuranceHtmlRoute('evidence')).toBe('/evidence');
    expect(assuranceCollectionApiRoute('evidence')).toBe('/v1/assurance/evidence');
    expect(assuranceRoutesForDataset('exercises')).toEqual(assuranceRoutesForDataset('incidents'));
    expect(assuranceRecordUrls('risks', 'RISK-SYNTHETIC')).toEqual({ html: '/governance/risks#RISK-SYNTHETIC' });
    expect(() => assuranceRecordUrls('claims', 'CLAIM-SYNTHETIC')).toThrow(/no canonical assurance route owner/i);
    expect(assuranceRecordUrlsById(listAssuranceRecords('claims')[0].id)).toEqual({});
  });

  it('preserves the shared anchor encoder and percent-encodes exact-record URLs', () => {
    const syntheticId = 'ISO 27001/A.5:1';
    expect(assuranceAnchor(syntheticId)).toBe(encodeURIComponent(syntheticId));
    expect(assuranceRecordUrls('compliance', syntheticId)).toEqual({
      html: `/compliance#${encodeURIComponent(syntheticId)}`,
      api: `/v1/assurance/compliance/${encodeURIComponent(syntheticId)}`,
    });
  });

  it('derives the released traceability alias from evidence ownership', () => {
    expect(assuranceRouteAliases()).toContainEqual({
      owner: 'evidence',
      path: '/traceability',
      target: '/evidence#traceability',
    });
    expect(matchAssuranceRoute('/traceability')).toEqual({
      owner: 'evidence',
      kind: 'alias',
      target: '/evidence#traceability',
    });
  });

  it('rejects invalid ownership, collisions, and malformed exact-record declarations', () => {
    const unknownOwner = structuredClone(assuranceRegistry) as any;
    unknownOwner.datasets.find((dataset: any) => dataset.kind === 'exercises').routeOwner = 'missing-owner';
    expect(validateAssuranceRouteContract(unknownOwner).join('\n')).toMatch(/unknown routeOwner missing-owner/);

    const duplicateOwnership = structuredClone(assuranceRegistry) as any;
    duplicateOwnership.datasets.find((dataset: any) => dataset.kind === 'exercises').routes = { api: '/v1/assurance/exercises' };
    expect(validateAssuranceRouteContract(duplicateOwnership).join('\n')).toMatch(/cannot declare both routes and routeOwner/);

    const collision = structuredClone(assuranceRegistry) as any;
    collision.datasets.find((dataset: any) => dataset.kind === 'evidence').routes.aliases.push({ path: '/compliance' });
    expect(validateAssuranceRouteContract(collision).join('\n')).toMatch(/collides/);

    const malformedExact = structuredClone(assuranceRegistry) as any;
    malformedExact.datasets.find((dataset: any) => dataset.kind === 'compliance').routes.apiRecord = '/v1/assurance/compliance/{id}/{id}';
    expect(validateAssuranceRouteContract(malformedExact).join('\n')).toMatch(/exactly one \{id\}/);
  });
});

describe('assurance router and rendered URL agreement', () => {
  it('resolves every canonical assurance collection and HTML declaration through the actual router', async () => {
    demoState = 'online';
    for (const declaration of assuranceRouteDeclarations()) {
      if (declaration.routes.api) {
        const response = await request(declaration.routes.api, 'application/json');
        expect(response.status, `${declaration.owner} collection API`).toBe(200);
      }
      if (declaration.routes.html) {
        const response = await request(declaration.routes.html, 'text/html');
        expect(response.status, `${declaration.owner} HTML route`).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/html');
      }
    }
  });

  it('resolves an encoded released exact-record ID and rejects malformed encoding', async () => {
    demoState = 'online';
    const record = listAssuranceRecords('compliance')[0];
    const encodedPath = `${assuranceCollectionApiRoute('compliance')}/${percentEncodeFirstCharacter(record.id)}`;
    const response = await request(encodedPath, 'application/json');
    expect(response.status).toBe(200);
    expect((await response.json() as { record: { id: string } }).record.id).toBe(record.id);

    const invalid = await request(`${assuranceCollectionApiRoute('compliance')}/%E0%A4%A`, 'application/json');
    expect(invalid.status).toBe(400);
    expect((await invalid.json() as { error: string }).error).toBe('invalid_compliance_record_id');
  });

  it('renders canonical record anchors and page/API links from the route contract', async () => {
    demoState = 'online';
    const routedDatasets: AssuranceDataset[] = ['evidence', 'compliance', 'risks', 'incidents', 'exercises', 'advisories'];
    const renderedByRoute = new Map<string, string>();

    for (const dataset of routedDatasets) {
      const routes = assuranceRoutesForDataset(dataset);
      if (!routes?.html) continue;
      let html = renderedByRoute.get(routes.html);
      if (html === undefined) {
        const response = await request(routes.html, 'text/html');
        expect(response.status).toBe(200);
        html = await response.text();
        renderedByRoute.set(routes.html, html);
      }
      for (const record of listAssuranceRecords(dataset)) {
        expect(html, `${dataset}:${record.id} anchor`).toContain(`id="${assuranceAnchor(record.id)}"`);
      }
    }

    const complianceRecord = listAssuranceRecords('compliance')[0];
    const complianceHtml = renderedByRoute.get(assuranceHtmlRoute('compliance')) ?? '';
    expect(complianceHtml).toContain(`href="${assuranceCollectionApiRoute('compliance')}"`);
    expect(complianceHtml).toContain(`href="${assuranceRecordUrls('compliance', complianceRecord.id).api}"`);

    const evidenceHtml = renderedByRoute.get(assuranceHtmlRoute('evidence')) ?? '';
    expect(evidenceHtml).toContain(`href="${assuranceRegistryApiRoute()}"`);
    expect(evidenceHtml).toContain(`href="${assuranceCollectionApiRoute('evidence')}"`);
  });

  it('keeps manifest assurance APIs in agreement with canonical declarations', () => {
    const manifest = JSON.parse(readFileSync('docs/route-manifest.json', 'utf8')) as Array<{ route: string }>;
    const manifestRoutes = new Set(manifest.map((entry) => entry.route));
    for (const declaration of assuranceRouteDeclarations()) {
      if (declaration.routes.html) expect(manifestRoutes.has(declaration.routes.html), `${declaration.owner} HTML manifest`).toBe(true);
      if (declaration.routes.api) expect(manifestRoutes.has(declaration.routes.api), `${declaration.owner} API manifest`).toBe(true);
      if (declaration.routes.apiRecord) {
        expect(manifestRoutes.has(declaration.routes.apiRecord.replace('{id}', '{recordId}')), `${declaration.owner} exact API manifest`).toBe(true);
      }
    }
    for (const alias of assuranceRouteAliases()) expect(manifestRoutes.has(alias.path), `${alias.path} remains a redirect, not canonical manifest`).toBe(false);
  });

  it('preserves alias and offline behavior', async () => {
    demoState = 'online';
    const alias = await request('/traceability', 'text/html');
    expect(alias.status).toBe(301);
    expect(alias.headers.get('location')).toBe('https://demo.wizardgang.ai/evidence#traceability');

    demoState = 'offline';
    const api = await request(assuranceCollectionApiRoute('risks'), 'application/json');
    expect(api.status).toBe(503);
    expect(api.headers.get('retry-after')).toBe('60');

    const html = await request(assuranceHtmlRoute('risks'), 'text/html');
    expect(html.status).toBe(302);
    expect(html.headers.get('location')).toContain('/offline?from=%2Fgovernance%2Frisks');

    const offlineAlias = await request('/traceability', 'text/html');
    expect(offlineAlias.status).toBe(302);
    expect(offlineAlias.headers.get('location')).toContain('/offline?from=%2Ftraceability');

    const security = await request(assuranceHtmlRoute('advisories'), 'text/html');
    expect(security.status).toBe(200);
    demoState = 'online';
  });
});
