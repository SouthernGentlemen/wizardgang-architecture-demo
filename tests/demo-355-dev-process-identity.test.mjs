import { describe, expect, it, vi } from 'vitest';
import { isCheckoutOwnedDevelopmentProcess } from '../scripts/lib/dev-process-identity.mjs';

const checkoutRoot = '/work/wizardgang-architecture-demo';
const owner = Object.freeze({
  pid: 4100,
  parentPid: 4000,
  startToken: 'owner-start-001',
  cwd: checkoutRoot,
});

function observed(pid, parentPid, startToken) {
  return Object.freeze({ pid, parentPid, startToken });
}

describe('DEMO-355 checkout-owned development process identity', () => {
  it('accepts an owned direct development child', () => {
    const target = observed(4200, owner.pid, 'vite-start-001');
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot,
      owner,
      expectedTarget: target,
      lineage: [target, owner],
    })).toBe(true);
  });

  it('accepts a proven descendant whose complete lineage reaches the owner', () => {
    const target = observed(4400, 4300, 'workerd-start-001');
    const parent = observed(4300, owner.pid, 'wrangler-start-001');
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot,
      owner,
      expectedTarget: target,
      lineage: [target, parent, owner],
    })).toBe(true);
  });

  it('rejects PID reuse when the current start identity differs from the stored target', () => {
    const expectedTarget = observed(4200, owner.pid, 'vite-start-001');
    const reusedPid = observed(4200, owner.pid, 'unrelated-start-999');
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot,
      owner,
      expectedTarget,
      lineage: [reusedPid, owner],
    })).toBe(false);
  });

  it('rejects a foreign process tree', () => {
    const target = observed(5200, 5100, 'foreign-child');
    const foreignParent = observed(5100, 5000, 'foreign-parent');
    const foreignOwner = observed(5000, 1, 'foreign-owner');
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot,
      owner,
      expectedTarget: target,
      lineage: [target, foreignParent, foreignOwner],
    })).toBe(false);
  });

  it('rejects an otherwise matching owner identity from another checkout root', () => {
    const target = observed(4200, owner.pid, 'vite-start-001');
    const otherCheckoutOwner = Object.freeze({ ...owner, cwd: '/work/another-checkout' });
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot,
      owner: otherCheckoutOwner,
      expectedTarget: target,
      lineage: [target, otherCheckoutOwner],
    })).toBe(false);
  });

  it('fails closed on missing or incomplete identity evidence', () => {
    const target = observed(4200, owner.pid, 'vite-start-001');
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot,
      owner,
      expectedTarget: target,
      lineage: [target],
    })).toBe(false);
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot,
      owner,
      expectedTarget: { pid: 4200, startToken: '' },
      lineage: [target, owner],
    })).toBe(false);
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot: '',
      owner,
      expectedTarget: target,
      lineage: [target, owner],
    })).toBe(false);
  });

  it('fails closed when parent evidence contradicts the supplied lineage', () => {
    const target = observed(4400, 9999, 'workerd-start-001');
    const parent = observed(4300, owner.pid, 'wrangler-start-001');
    expect(isCheckoutOwnedDevelopmentProcess({
      checkoutRoot,
      owner,
      expectedTarget: target,
      lineage: [target, parent, owner],
    })).toBe(false);
  });

  it('is a pure decision that neither signals nor mutates supplied evidence', () => {
    const target = observed(4200, owner.pid, 'vite-start-001');
    const lineage = Object.freeze([target, owner]);
    const before = JSON.stringify({ owner, target, lineage });
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('process identity must not signal');
    });
    try {
      expect(isCheckoutOwnedDevelopmentProcess({
        checkoutRoot,
        owner,
        expectedTarget: target,
        lineage,
      })).toBe(true);
      expect(kill).not.toHaveBeenCalled();
      expect(JSON.stringify({ owner, target, lineage })).toBe(before);
    } finally {
      kill.mockRestore();
    }
  });
});
