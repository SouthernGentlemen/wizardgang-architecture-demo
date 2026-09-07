import { describe, expect, it } from 'vitest';
import {
  reportingCollectionResponse,
  reportingIndexResponse,
  reportingRecordResponse,
} from '../src/api/reporting';
import { applicationRouteRegistry } from '../src/routing/application-routes';
import { matchRoute } from '../src/routing/registry';
import type { Env } from '../src/types';

const env = {} as Env;

function route(method: string, path: string) {
  return matchRoute(applicationRouteRegistry, method, path);
}

describe('canonical reporting API routes', () => {
  it('registers one collection index, collection resource, and record resource', () => {
    expect(route('GET', '/api/reporting')).toMatchObject({ status: 'matched', route: { id: 'reporting.index' } });
    expect(route('GET', '/api/reporting/risks')).toMatchObject({ status: 'matched', route: { id: 'reporting.collection' } });
    expect(route('GET', '/api/reporting/risks/RISK-001')).toMatchObject({ status: 'matched', route: { id: 'reporting.record' } });
    expect(route('PATCH', '/api/reporting/issues/158')).toMatchObject({ status: 'matched', route: { id: 'reporting.record' } });
    expect(route('POST', '/api/reporting/issues/158')).toMatchObject({
      status: 'method-not-allowed',
      allowedMethods: ['GET', 'PATCH', 'OPTIONS'],
    });
  });

  it('publishes only disclosure-safe collections to anonymous callers', async () => {
    const response = await reportingIndexResponse(new Request('https://demo.example/api/reporting'), env);
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('etag')).toBeTruthy();
    expect(response.headers.get('cache-control')).toContain('public');
    const body = await response.json() as { collections: Array<{ id: string }> };
    const ids = body.collections.map((collection) => collection.id);
    expect(ids).toContain('risks');
    expect(ids).toContain('issues');
    expect(ids).not.toContain('github.code-scanning-alerts');
    expect(ids).not.toContain('github.secret-scanning-alerts');
    expect(ids).not.toContain('github.dependabot-alerts');
    expect(ids).not.toContain('github.repository-security-advisories');
  });

  it('preserves structured filtering, cursor metadata, CORS, ETags, and cache policy', async () => {
    const response = await reportingCollectionResponse(
      new Request('https://demo.example/api/reporting/risks?limit=1'),
      env,
      'risks',
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('etag')).toBeTruthy();
    expect(response.headers.get('x-assurance-schema-version')).toBe('1');
    expect(response.headers.get('cache-control')).toContain('public');
    const body = await response.json() as {
      dataset: string;
      records: unknown[];
      query: { pagination?: { limit: number; nextCursor: string | null } };
    };
    expect(body.dataset).toBe('risks');
    expect(body.records.length).toBeLessThanOrEqual(1);
    expect(body.query.pagination?.limit).toBe(1);
  });

  it('supports canonical CORS preflight without granting write authority', async () => {
    const preflight = await reportingRecordResponse(
      new Request('https://demo.example/api/reporting/issues/158', { method: 'OPTIONS' }),
      env,
      'issues',
      '158',
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-methods')).toContain('PATCH');

    const write = await reportingRecordResponse(
      new Request('https://demo.example/api/reporting/issues/158', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ repository: 'owner/repo', revision: '1', fields: { title: 'updated' } }),
      }),
      env,
      'issues',
      '158',
    );
    expect(write.status).toBe(401);
  });

  it('returns the canonical API error contract for an unknown collection', async () => {
    const response = await reportingCollectionResponse(
      new Request('https://demo.example/api/reporting/not-registered'),
      env,
      'not-registered',
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: 'reporting_collection_not_found' });
  });
});
