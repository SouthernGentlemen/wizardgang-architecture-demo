import { describe, expect, it } from 'vitest';
import {
  REPORTING_CURSOR_VERSION,
  REPORTING_PAGE_SIZE_MAX,
  REPORTING_PAGE_SIZE_MIN,
  createReportingPagination,
  decodeReportingCursor,
  encodeReportingCursor,
  normalizeReportingFilters,
  validateReportingPageSize,
  type ReportingCursorContext,
} from '../src/reporting/pagination';

const secret = 'DEMO-176-reporting-cursor-secret';
const context: ReportingCursorContext = {
  schemaVersion: 1,
  collection: 'github-native',
  source: 'github.issues',
  filters: {
    repository: ' SouthernGentlemen/wizardgang-architecture-demo ',
    labels: ['security', 'corrective-action', 'security'],
    open: true,
  },
  ordering: [
    { field: ' updatedAt ', direction: 'desc' },
    { field: 'id', direction: 'desc' },
  ],
};
const continuation = {
  position: { page: 2, offset: 100, lastIdentity: 'issue:41' },
  provider: { provider: 'github' as const, data: { page: 2, cursor: 'provider-private-continuation' } },
};

function expectCursorFailure(promise: Promise<unknown>, code: string, detail?: string) {
  return expect(promise).rejects.toMatchObject({ code, ...(detail ? { detail } : {}) });
}

function tamper(cursor: string): string {
  const [prefix, envelope] = cursor.split('.');
  const index = Math.floor(envelope.length / 2);
  const replacement = envelope[index] === 'A' ? 'B' : 'A';
  return `${prefix}.${envelope.slice(0, index)}${replacement}${envelope.slice(index + 1)}`;
}

describe('unified reporting pagination contract', () => {
  it('defines one allowed page-size range', () => {
    expect(REPORTING_PAGE_SIZE_MIN).toBe(1);
    expect(REPORTING_PAGE_SIZE_MAX).toBe(100);
    expect(validateReportingPageSize(1)).toBe(1);
    expect(validateReportingPageSize(100)).toBe(100);
    for (const invalid of [0, 101, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => validateReportingPageSize(invalid)).toThrow(RangeError);
    }
  });

  it('uses the same limit, returned, total, nextCursor, and completeness semantics for complete results', () => {
    const pagination = createReportingPagination({
      limit: 25,
      returned: 12,
      total: 12,
      nextCursor: null,
      completeness: 'complete',
      partialReason: null,
    });
    expect(pagination).toEqual({
      limit: 25,
      returned: 12,
      total: 12,
      nextCursor: null,
      completeness: 'complete',
      partialReason: null,
    });
    expect(pagination).not.toHaveProperty('cursor');
    expect(pagination).not.toHaveProperty('providerCursor');
    expect(pagination).not.toHaveProperty('providerNextCursor');
    expect(pagination).not.toHaveProperty('pageToken');
  });

  it('defines provider export safety bounds as explicit partial results using only the common nextCursor', () => {
    const pagination = createReportingPagination({
      limit: 100,
      returned: 5000,
      total: 5000,
      nextCursor: 'rpc1.opaque',
      completeness: 'partial',
      partialReason: 'provider-export-bound',
    });
    expect(pagination.completeness).toBe('partial');
    expect(pagination.partialReason).toBe('provider-export-bound');
    expect(pagination.nextCursor).toBe('rpc1.opaque');
    expect(Object.keys(pagination)).toEqual(['limit', 'returned', 'total', 'nextCursor', 'completeness', 'partialReason']);
  });

  it('rejects inconsistent pagination state', () => {
    expect(() => createReportingPagination({
      limit: 10, returned: 11, total: 10, nextCursor: null, completeness: 'complete', partialReason: null,
    })).toThrow(RangeError);
    expect(() => createReportingPagination({
      limit: 10, returned: 1, total: 1, nextCursor: 'rpc1.opaque', completeness: 'complete', partialReason: null,
    })).toThrow(TypeError);
    expect(() => createReportingPagination({
      limit: 10, returned: 1, total: 1, nextCursor: null, completeness: 'partial', partialReason: null,
    })).toThrow(TypeError);
  });
});

describe('opaque reporting cursor codec', () => {
  it('normalizes filter sets and preserves ordering precedence', () => {
    expect(normalizeReportingFilters({ labels: ['z', 'a', 'z'], repository: ' owner/repo ' })).toEqual({
      labels: ['a', 'z'],
      repository: 'owner/repo',
    });
  });

  it('round-trips version, query binding, continuation position, and provider continuation data', async () => {
    const cursor = await encodeReportingCursor(context, continuation, secret);
    expect(cursor.startsWith(`rpc${REPORTING_CURSOR_VERSION}.`)).toBe(true);
    expect(cursor).not.toContain('provider-private-continuation');
    const envelope = cursor.split('.')[1];
    const binary = atob(envelope.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - envelope.length % 4) % 4));
    expect(binary).not.toContain('provider-private-continuation');

    const decoded = await decodeReportingCursor(cursor, {
      ...context,
      filters: {
        open: true,
        labels: ['corrective-action', 'security'],
        repository: 'SouthernGentlemen/wizardgang-architecture-demo',
      },
      ordering: [
        { field: 'updatedAt', direction: 'desc' },
        { field: 'id', direction: 'desc' },
      ],
    }, secret);
    expect(decoded).toEqual({
      position: { lastIdentity: 'issue:41', offset: 100, page: 2 },
      provider: { provider: 'github', data: { cursor: 'provider-private-continuation', page: 2 } },
    });
  });

  it('cannot be reused for another collection', async () => {
    const cursor = await encodeReportingCursor(context, continuation, secret);
    await expectCursorFailure(
      decodeReportingCursor(cursor, { ...context, collection: 'retained-reports' }, secret),
      'reporting_cursor_mismatch',
      'collection',
    );
  });

  it('cannot be reused for another source', async () => {
    const cursor = await encodeReportingCursor(context, continuation, secret);
    await expectCursorFailure(
      decodeReportingCursor(cursor, { ...context, source: 'github.pull-requests' }, secret),
      'reporting_cursor_mismatch',
      'source',
    );
  });

  it('cannot be reused with another normalized filter set', async () => {
    const cursor = await encodeReportingCursor(context, continuation, secret);
    await expectCursorFailure(
      decodeReportingCursor(cursor, { ...context, filters: { ...context.filters, open: false } }, secret),
      'reporting_cursor_mismatch',
      'filters',
    );
  });

  it('cannot be reused under another ordering contract', async () => {
    const cursor = await encodeReportingCursor(context, continuation, secret);
    await expectCursorFailure(
      decodeReportingCursor(cursor, { ...context, ordering: [{ field: 'updatedAt', direction: 'asc' }] }, secret),
      'reporting_cursor_mismatch',
      'ordering',
    );
  });

  it('rejects stale schema versions without treating them as authorization state', async () => {
    const cursor = await encodeReportingCursor(context, continuation, secret);
    await expectCursorFailure(
      decodeReportingCursor(cursor, { ...context, schemaVersion: 2 }, secret),
      'reporting_cursor_stale',
      'schemaVersion',
    );
  });

  it('rejects unknown cursor versions consistently', async () => {
    await expectCursorFailure(
      decodeReportingCursor('rpc999.opaque', context, secret),
      'reporting_cursor_unknown',
    );
  });

  it('rejects malformed, tampered, and wrong-key cursors consistently', async () => {
    await expectCursorFailure(decodeReportingCursor('not-a-cursor', context, secret), 'reporting_cursor_malformed');
    const cursor = await encodeReportingCursor(context, continuation, secret);
    await expectCursorFailure(decodeReportingCursor(tamper(cursor), context, secret), 'reporting_cursor_malformed');
    await expectCursorFailure(decodeReportingCursor(cursor, context, 'different-DEMO-176-secret'), 'reporting_cursor_malformed');
  });

  it('decodes continuation state only and never grants authorization', async () => {
    const cursor = await encodeReportingCursor(context, continuation, secret);
    const decoded = await decodeReportingCursor(cursor, context, secret);
    const serialized = JSON.stringify(decoded);
    expect(serialized).not.toMatch(/principal|permission|authorization|authenticated|role/i);
    expect(decoded).toHaveProperty('position');
    expect(decoded).toHaveProperty('provider');
  });
});
