import { describe, expect, it } from 'vitest';
import { matchAssuranceRoute } from '../src/assurance/routes';
import { routeRequest } from '../src/router';
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

describe('assurance route intersections', () => {
  it('keeps exact collection routes distinct from record routes', () => {
    expect(matchAssuranceRoute('/v1/assurance/compliance')).toMatchObject({ owner: 'compliance', kind: 'api-collection' });
    expect(matchAssuranceRoute('/v1/assurance/compliance/WCAG-4.1.2')).toMatchObject({ owner: 'compliance', kind: 'api-record', recordId: 'WCAG-4.1.2' });
    expect(matchAssuranceRoute('/v1/assurance/risks/SEC-RISK-001')).toBeNull();
  });

  it('does not let longer or malformed paths fall through to a collection handler', () => {
    expect(matchAssuranceRoute('/v1/assurance/compliance/WCAG-4.1.2/extra')).toBeNull();
    expect(matchAssuranceRoute('/v1/assurance/risks/extra')).toBeNull();
    expect(matchAssuranceRoute('/v1/assurance/unknown')).toBeNull();
  });

  it('routes current collection and detail requests through the worker router', async () => {
    const collection = await routeRequest(new Request('https://demo.wizardgang.ai/v1/assurance/risks?limit=1'), env);
    expect(collection.status).toBe(200);
    const collectionBody = await collection.json() as { dataset: string; records: Array<{ id: string }> };
    expect(collectionBody.dataset).toBe('risks');
    expect(collectionBody.records).toHaveLength(1);

    const detail = await routeRequest(new Request('https://demo.wizardgang.ai/v1/assurance/compliance/WCAG-4.1.2'), env);
    expect(detail.status).toBe(200);
    const detailBody = await detail.json() as { dataset: string; records: Array<{ id: string }> };
    expect(detailBody.dataset).toBe('compliance');
    expect(detailBody.records.map((record) => record.id)).toEqual(['WCAG-4.1.2']);
  });
});
