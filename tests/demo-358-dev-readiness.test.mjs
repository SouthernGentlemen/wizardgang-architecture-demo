import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  DEVELOPMENT_URL,
  browserOpenCommand,
  openDevelopmentBrowser,
  resolveDevelopmentOptions,
  waitForDevelopmentReady,
} from '../scripts/lib/dev-readiness.mjs';

describe('DEMO-358 shared local-development entry point', () => {
  it('keeps the default lifecycle headless-safe while exposing an explicit browser opt-in', () => {
    expect(resolveDevelopmentOptions([])).toEqual({
      openBrowser: false,
      url: DEVELOPMENT_URL,
    });
    expect(resolveDevelopmentOptions(['--open'])).toEqual({
      openBrowser: true,
      url: DEVELOPMENT_URL,
    });
  });

  it('reports readiness after a bounded retry sequence', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new Error('not listening'))
      .mockRejectedValueOnce(new Error('still starting'))
      .mockResolvedValue({ body: null });
    const sleep = vi.fn(async () => undefined);

    await expect(waitForDevelopmentReady({
      attempts: 3,
      intervalMs: 0,
      request,
      sleep,
    })).resolves.toBe(DEVELOPMENT_URL);
    expect(request).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('fails with the deterministic URL after the bounded readiness window expires', async () => {
    const request = vi.fn(async () => {
      throw new Error('not listening');
    });
    await expect(waitForDevelopmentReady({
      attempts: 2,
      intervalMs: 0,
      request,
      sleep: async () => undefined,
    })).rejects.toThrow(`Development server did not become ready at ${DEVELOPMENT_URL} after 2 attempts.`);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('stops polling when checkout-owned shutdown begins', async () => {
    const request = vi.fn(async () => ({ body: null }));
    await expect(waitForDevelopmentReady({
      request,
      isCancelled: () => true,
    })).resolves.toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it('uses platform-native browser openers and treats unavailable opening as harmless', async () => {
    expect(browserOpenCommand(DEVELOPMENT_URL, 'darwin')).toEqual({
      command: 'open',
      args: [DEVELOPMENT_URL],
    });
    expect(browserOpenCommand(DEVELOPMENT_URL, 'linux')).toEqual({
      command: 'xdg-open',
      args: [DEVELOPMENT_URL],
    });
    expect(browserOpenCommand(DEVELOPMENT_URL, 'plan9')).toBeNull();

    const unavailable = vi.fn((_command, _args, _options, callback) => {
      callback(Object.assign(new Error('missing opener'), { code: 'ENOENT' }));
    });
    await expect(openDevelopmentBrowser(DEVELOPMENT_URL, {
      platform: 'linux',
      execFileImpl: unavailable,
    })).resolves.toBe(false);

    const available = vi.fn((_command, _args, _options, callback) => callback(null));
    await expect(openDevelopmentBrowser(DEVELOPMENT_URL, {
      platform: 'linux',
      execFileImpl: available,
    })).resolves.toBe(true);
  });

  it('keeps readiness and cleanup in the same checkout-owned coordinator', () => {
    const source = fs.readFileSync('scripts/dev.mjs', 'utf8');
    expect(source).toContain('waitForDevelopmentReady');
    expect(source).toContain('Development ready:');
    expect(source).toContain('openDevelopmentBrowser');
    expect(source).toContain("'--ip'");
    expect(source).toContain("'--port'");
    expect(source).toContain('stopCheckoutOwnedDevelopmentProcesses');
    expect(source).toContain("['SIGINT', 'SIGTERM']");
  });
});
