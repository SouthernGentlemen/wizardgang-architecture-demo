import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { stopCheckoutOwnedDevelopmentProcesses } from '../scripts/lib/dev-process-cleanup.mjs';
import { isCheckoutOwnedDevelopmentProcess } from '../scripts/lib/dev-process-identity.mjs';

const checkoutRoot = '/work/wizardgang-architecture-demo';
const owner = { pid: 4100, parentPid: 4000, startToken: 'owner-start', cwd: checkoutRoot };
const vite = { pid: 4200, parentPid: owner.pid, startToken: 'vite-start' };
const wrangler = { pid: 4300, parentPid: owner.pid, startToken: 'wrangler-start' };
const workerd = { pid: 4400, parentPid: wrangler.pid, startToken: 'workerd-start' };

function run(snapshots, options = {}) {
  let index = 0;
  const observe = vi.fn(() => snapshots[Math.min(index++, snapshots.length - 1)]);
  const signalProcess = vi.fn();
  const decideOwned = vi.fn(isCheckoutOwnedDevelopmentProcess);
  const signaled = stopCheckoutOwnedDevelopmentProcesses({
    checkoutRoot,
    owner,
    roots: [vite, wrangler],
    observe,
    readCheckoutRoot: () => checkoutRoot,
    signalProcess,
    decideOwned,
    ...options,
  });
  return { signaled, observe, signalProcess, decideOwned };
}

describe('DEMO-356 checkout-owned process-tree cleanup', () => {
  it('stops owned descendants before direct Vite/Wrangler children using fresh ownership decisions', () => {
    const snapshot = [owner, vite, wrangler, workerd];
    const result = run([snapshot], { signal: 'SIGINT' });
    expect(result.signaled).toEqual([workerd.pid, vite.pid, wrangler.pid]);
    expect(result.signalProcess.mock.calls).toEqual([
      [workerd.pid, 'SIGINT'],
      [vite.pid, 'SIGINT'],
      [wrangler.pid, 'SIGINT'],
    ]);
    expect(result.decideOwned).toHaveBeenCalledTimes(3);
    expect(result.observe).toHaveBeenCalledTimes(4);
  });

  it('also stops an owned sibling tree after startup or child failure', () => {
    const snapshot = [owner, wrangler, workerd];
    const result = run([snapshot], { signal: 'SIGTERM' });
    expect(result.signaled).toEqual([workerd.pid, wrangler.pid]);
    expect(result.signalProcess.mock.calls).toEqual([
      [workerd.pid, 'SIGTERM'],
      [wrangler.pid, 'SIGTERM'],
    ]);
  });

  it('never signals a reused target PID whose fresh start token changed', () => {
    const reused = { ...workerd, startToken: 'foreign-reuse' };
    const result = run([[owner, wrangler, workerd], [owner, wrangler, reused], [owner, wrangler, reused]]);
    expect(result.signaled).toEqual([wrangler.pid]);
    expect(result.signalProcess).not.toHaveBeenCalledWith(workerd.pid, expect.anything());
  });

  it('never signals when the stored direct-root start identity has changed', () => {
    const reusedRoot = { ...wrangler, startToken: 'other-root' };
    const result = run([[owner, wrangler, workerd], [owner, reusedRoot, workerd]]);
    expect(result.signaled).toEqual([]);
  });

  it('does not signal foreign trees or a different checkout coordinator', () => {
    const foreign = { pid: 5400, parentPid: 5300, startToken: 'foreign' };
    const foreignParent = { pid: 5300, parentPid: 1, startToken: 'foreign-parent' };
    expect(run([[owner, foreignParent, foreign]]).signaled).toEqual([]);
    expect(run([[owner, vite]], { readCheckoutRoot: () => '/work/other-checkout' }).signaled).toEqual([]);
    expect(run([[owner, vite]], { owner: { ...owner, cwd: '/work/other-checkout' } }).signaled).toEqual([]);
  });

  it('fails closed on missing, contradictory, duplicate, and cyclic lineage evidence', () => {
    const missingParent = { ...workerd, parentPid: 9999 };
    const contradictoryRoot = { ...wrangler, parentPid: 9999 };
    const cyclicRoot = { ...wrangler, parentPid: workerd.pid };
    const cyclicChild = { ...workerd, parentPid: wrangler.pid };
    for (const snapshot of [
      [owner, wrangler, missingParent],
      [owner, contradictoryRoot, workerd],
      [owner, wrangler, wrangler, workerd],
      [owner, cyclicRoot, cyclicChild],
    ]) {
      const result = run([snapshot]);
      expect(result.signaled.every((pid) => pid === wrangler.pid)).toBe(true);
      expect(result.signalProcess).not.toHaveBeenCalledWith(workerd.pid, expect.anything());
    }
  });

  it('does not signal after fresh target or coordinator evidence changes before the decision', () => {
    const changedParent = { ...workerd, parentPid: 9999 };
    const changedOwner = { ...owner, startToken: 'new-coordinator' };
    for (const fresh of [
      [owner, wrangler, changedParent],
      [changedOwner, wrangler, workerd],
      [owner, wrangler],
    ]) {
      const result = run([[owner, wrangler, workerd], fresh, fresh]);
      expect(result.signalProcess).not.toHaveBeenCalledWith(workerd.pid, expect.anything());
    }
  });

  it('does not trust discovery alone or use generic port/process-name termination', () => {
    const result = run([[owner, vite], [owner, { ...vite, startToken: 'changed' }]]);
    expect(result.signaled).toEqual([]);
    expect(result.decideOwned).not.toHaveBeenCalled();
    const dev = fs.readFileSync('scripts/dev.mjs', 'utf8');
    expect(dev).toContain('stopCheckoutOwnedDevelopmentProcesses');
    expect(dev).toContain("['SIGINT', 'SIGTERM']");
    expect(dev).toContain("child.on('error'");
    expect(dev).toContain("child.on('exit'");
    expect(dev).not.toContain('child.kill(');
    expect(dev).not.toContain('pkill');
    expect(dev).not.toContain('killall');
  });
});
