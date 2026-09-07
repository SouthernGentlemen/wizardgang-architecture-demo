import { describe, expect, it } from 'vitest';
import { routeRequest } from '../src/router';
import { reportingRouteRegistry } from '../src/routing/reporting-routes';
import { matchRoute } from '../src/routing/registry';
import type { Env } from '../src/types';

const env = {
  GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
  GITHUB_BRANCH: 'main',
  DEMO_DB: {
    prepare: () => ({
      all: async () => ({
        results: [{
          state: 'online',
          public_message: 'Demo online.',
          updated_at: '2026-09-04T00:00:00.000Z',
          updated_by: 'test',
        }],
      }),
    }),
  },
} as unknown as Env;

describe('reporting route intersections', () => {
  it('keeps collection and record routes distinct in the generic reporting matcher', () => {
    expect(matchRoute(reportingRouteRegistry, 'GET', '/api/reporting/compliance')).toMatchObject({
      status: 'matched', route: { id: 'reporting.collection' }, params: { collection: 'compliance' },
    });
    expect(matchRoute(reportingRouteRegistry, 'GET', '/api/reporting/compliance/WCAG-4.1.2')).toMatchObject({
      status: 'matched', route: { id: 'reporting.record' }, params: { collection: 'compliance', recordId: 'WCAG-4.1.2' },
    });
  });

  it('matches structurally valid generic routes while the handler rejects unknown collections', async () => {
    expect(matchRoute(reportingRouteRegistry, 'GET', '/api/reporting/compliance/WCAG-4.1.2/extra')).toEqual({ status: 'not-found', statusCode: 404 });
    expect(matchRoute(reportingRouteRegistry, 'GET', '/api/reporting/unknown')).toMatchObject({ status: 'matched', route: { id: 'reporting.collection' } });
    const unknown = await routeRequest(new Request('https://demo.wizardgang.ai/api/reporting/unknown'), env);
    expect(unknown.status).toBe(404);
  });

  it('routes current collection and detail requests through the worker router', async () => {
    const collection = await routeRequest(new Request('https://demo.wizardgang.ai/api/reporting/risks?limit=1'), env);
    expect(collection.status).toBe(200);
    const collectionBody = await collection.json() as { dataset: string; records: Array<{ id: string }> };
    expect(collectionBody.dataset).toBe('risks');
    expect(collectionBody.records).toHaveLength(1);

    const detail = await routeRequest(new Request('https://demo.wizardgang.ai/api/reporting/compliance/WCAG-4.1.2'), env);
    expect(detail.status).toBe(200);
    const detailBody = await detail.json() as { dataset: string; records: Array<{ id: string }> };
    expect(detailBody.dataset).toBe('compliance');
    expect(detailBody.records.map((record) => record.id)).toEqual(['WCAG-4.1.2']);
  });
});
