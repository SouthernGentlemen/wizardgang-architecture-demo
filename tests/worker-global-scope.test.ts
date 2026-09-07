import { describe, expect, it, vi } from 'vitest';

describe('Cloudflare Worker global-scope safety', () => {
  it('defers the reporting cursor fallback secret until request-time use', async () => {
    vi.resetModules();
    const getRandomValues = vi.spyOn(globalThis.crypto, 'getRandomValues');

    try {
      const { reportingCursorSecret } = await import('../src/reporting/query');
      expect(getRandomValues).not.toHaveBeenCalled();

      const first = reportingCursorSecret();
      const second = reportingCursorSecret();
      expect(first).toBeInstanceOf(Uint8Array);
      expect(second).toBe(first);
      expect(getRandomValues).toHaveBeenCalledTimes(1);
    } finally {
      getRandomValues.mockRestore();
    }
  });
});
