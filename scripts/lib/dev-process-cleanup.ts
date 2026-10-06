import { execFileSync } from 'node:child_process';
import { isCheckoutOwnedDevelopmentProcess } from './dev-process-identity.ts';
import type { DevelopmentOwner, ObservedProcess } from './dev-process-identity.ts';

export function observeDevelopmentProcesses(): ObservedProcess[] {
  const output = execFileSync('ps', ['-axo', 'pid=,ppid=,lstart='], {
    encoding: 'utf8',
    timeout: 5_000,
    maxBuffer: 5 * 1024 * 1024,
  });
  return output.split('\n').flatMap((line) => {
    const match = /^\s*(\d+)\s+(\d+)\s+(.\S.*?)\s*$/.exec(line);
    if (!match) return [];
    return [{ pid: Number(match[1]), parentPid: Number(match[2]), startToken: match[3] }];
  });
}

function processIndex(processes: any): Map<number, ObservedProcess> | null {
  if (!Array.isArray(processes)) return null;
  const byPid = new Map<number, ObservedProcess>();
  for (const process of processes) {
    if (!Number.isSafeInteger(process?.pid) || process.pid <= 0 || byPid.has(process.pid)) return null;
    byPid.set(process.pid, process);
  }
  return byPid;
}

function lineageToOwner(
  target: ObservedProcess,
  byPid: Map<number, ObservedProcess>,
  ownerPid: number,
): ObservedProcess[] | null {
  const lineage: ObservedProcess[] = [];
  const visited = new Set<number>();
  let current: ObservedProcess | undefined = target;
  while (current && !visited.has(current.pid)) {
    visited.add(current.pid);
    lineage.push(current);
    if (current.pid === ownerPid) return lineage;
    current = byPid.get(current.parentPid);
  }
  return null;
}

function containsStoredRoot(
  lineage: ObservedProcess[],
  roots: ObservedProcess[],
  owner: DevelopmentOwner,
): boolean {
  return lineage.some((observed) => roots.some((root) =>
    root.pid === observed.pid
      && root.startToken === observed.startToken
      && root.parentPid === owner.pid
      && observed.parentPid === owner.pid
  ));
}

/**
 * Discovery never grants signal authority. Each candidate is re-observed and
 * checked against the pure DEMO-355 ownership decision immediately before use.
 */
export function stopCheckoutOwnedDevelopmentProcesses({
  checkoutRoot,
  owner,
  roots,
  observe = observeDevelopmentProcesses,
  readCheckoutRoot,
  signalProcess,
  signal = 'SIGTERM',
  decideOwned = isCheckoutOwnedDevelopmentProcess,
}: {
  checkoutRoot: string;
  owner: DevelopmentOwner;
  roots: ObservedProcess[];
  observe?: () => ObservedProcess[];
  readCheckoutRoot: () => string;
  signalProcess: (pid: number, signal: NodeJS.Signals) => void;
  signal?: NodeJS.Signals;
  decideOwned?: typeof isCheckoutOwnedDevelopmentProcess;
}): number[] {
  if (typeof checkoutRoot !== 'string' || !checkoutRoot || !Array.isArray(roots) || !roots.length) return [];
  if (typeof readCheckoutRoot !== 'function' || typeof signalProcess !== 'function') return [];
  if (readCheckoutRoot() !== checkoutRoot || owner?.cwd !== checkoutRoot) return [];

  const discovered = processIndex(observe());
  if (!discovered) return [];
  const candidates: { target: ObservedProcess; depth: number }[] = [];
  for (const target of discovered.values()) {
    if (target.pid === owner.pid) continue;
    const lineage = lineageToOwner(target, discovered, owner.pid);
    if (lineage && containsStoredRoot(lineage, roots, owner)) {
      candidates.push({ target, depth: lineage.length });
    }
  }
  candidates.sort((left, right) => right.depth - left.depth);

  const signaled: number[] = [];
  for (const { target } of candidates) {
    if (readCheckoutRoot() !== checkoutRoot) continue;
    const fresh = processIndex(observe());
    if (!fresh) continue;
    const current = fresh.get(target.pid);
    const lineage = current && lineageToOwner(current, fresh, owner.pid);
    if (!lineage || !containsStoredRoot(lineage, roots, owner)) continue;
    if (!decideOwned({ checkoutRoot, owner, expectedTarget: target, lineage })) continue;
    try {
      signalProcess(target.pid, signal);
      signaled.push(target.pid);
    } catch (error: any) {
      if (error?.code !== 'ESRCH') throw error;
    }
  }
  return signaled;
}
