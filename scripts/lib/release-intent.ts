import { parsePlanTasks } from './controlled-pr-identity.ts';

// One explicit owner-authorized batch release. The intent travels in the planning record that sets the
// package version; an empty queue alone never authorizes a release.
export const RELEASE_INTENT_PATTERN = /^Release-Intent: v(\d+\.\d+\.\d+)$/m;
const semantic = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export type ReleaseBump = 'patch' | 'minor' | 'major';

export function releaseIntentVersion(body = ''): string | null {
  const matches = [...body.matchAll(new RegExp(RELEASE_INTENT_PATTERN, 'gm'))];
  return matches.length === 1 ? matches[0][1] : null;
}

export function nextSemanticVersion(current: string, bump: ReleaseBump): string {
  if (!semantic.test(current)) throw new Error(`Invalid package version: ${current}`);
  const [major, minor, patch] = current.split('.').map(Number);
  return bump === 'major' ? `${major + 1}.0.0` : bump === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
}

export function advancesVersion(current: string, target: string): boolean {
  if (!semantic.test(current) || !semantic.test(target)) return false;
  const before = current.split('.').map(Number);
  const after = target.split('.').map(Number);
  return after.some((part, index) => part > before[index] && after.slice(0, index).every((value, position) => value === before[position]));
}

export interface BatchReleaseRequest {
  version: string;
  authorizedBy: string;
}

// Planning input: the owner names the target version and who authorized it.
export function validateBatchReleaseRequest(release: BatchReleaseRequest, currentVersion: string): string[] {
  const errors: string[] = [];
  if (!release || typeof release.authorizedBy !== 'string' || !release.authorizedBy.trim()) errors.push('Release intent requires an explicit authorizedBy owner.');
  if (!advancesVersion(currentVersion, release?.version)) errors.push(`Release intent v${release?.version} must advance current package version ${currentVersion}.`);
  return errors;
}

function json(value: string | null | undefined, label: string, errors: string[]) {
  try { return JSON.parse(value ?? ''); } catch { errors.push(`${label} is not valid JSON.`); return null; }
}

function sameExceptVersion(before, after, label: string, errors: string[], lock = false): void {
  const normalized = structuredClone(after);
  normalized.version = before.version;
  if (lock) {
    if (after.packages?.['']?.version !== after.version) errors.push('package-lock.json root package version must match its top-level version.');
    if (normalized.packages?.['']) normalized.packages[''].version = before.packages?.['']?.version;
  }
  if (JSON.stringify(before) !== JSON.stringify(normalized)) errors.push(`${label} may change only version metadata in a release-intent change.`);
}

// Package version metadata changes only in a maintenance record carrying the matching intent.
export function validateReleaseIntentChange({ body = '', beforePackage, afterPackage, beforeLock, afterLock }: {
  body?: string;
  beforePackage: string | null;
  afterPackage: string | null;
  beforeLock: string | null;
  afterLock: string | null;
}): string[] {
  const errors: string[] = [];
  const intent = releaseIntentVersion(body);
  if (RELEASE_INTENT_PATTERN.test(body) && !intent) errors.push('A controlled record may carry only one Release-Intent.');
  const oldPackage = json(beforePackage, 'Base package.json', errors);
  const newPackage = json(afterPackage, 'Head package.json', errors);
  const oldLock = json(beforeLock, 'Base package-lock.json', errors);
  const newLock = json(afterLock, 'Head package-lock.json', errors);
  if (!oldPackage || !newPackage || !oldLock || !newLock) return errors;
  const changed = oldPackage.version !== newPackage.version || oldLock.version !== newLock.version
    || oldLock.packages?.['']?.version !== newLock.packages?.['']?.version;
  if (!changed) {
    if (intent) errors.push(`Release-Intent v${intent} must set the package and lockfile version.`);
    return errors;
  }
  if (!intent) return [...errors, 'Package version may change only through an authorized batch Release-Intent.'];
  if (!/^Portfolio-Plan-Maintenance: true$/m.test(body)) errors.push('Release-Intent belongs to a plan-maintenance record.');
  if (!new RegExp(`^Release:\\s*\\n?v${intent.replaceAll('.', '\\.')}\\b`, 'm').test(body)) errors.push(`Release section must name v${intent}.`);
  if (newPackage.version !== intent || newLock.version !== intent) errors.push(`Package and lockfile versions must equal Release-Intent v${intent}.`);
  if (!advancesVersion(oldPackage.version, intent)) errors.push(`Release-Intent v${intent} must advance the base version ${oldPackage.version}.`);
  sameExceptVersion(oldPackage, newPackage, 'package.json', errors);
  sameExceptVersion(oldLock, newLock, 'package-lock.json', errors, true);
  return errors;
}

// Newest package.json-changing record that carries an intent; PR/history validation guarantees that record set the version.
export function latestReleaseIntent(commits: Array<{ sha: string; message: string }>): { sha: string; version: string } | null {
  for (const commit of commits) {
    const version = releaseIntentVersion(commit.message);
    if (version) return { sha: commit.sha, version };
  }
  return null;
}

export interface ReleaseReadiness {
  ready: boolean;
  reason: string;
  version: string;
  openTasks: string[];
  intent: string | null;
}

// Shared by the cutter, the Release dispatch boundary and the live controller summary.
export function batchReleaseReadiness({ version, planMarkdown, intent }: { version: string; planMarkdown: string | null; intent: string | null }): ReleaseReadiness {
  const openTasks = parsePlanTasks(planMarkdown ?? '').map((task) => task.id);
  const result = (ready: boolean, reason: string): ReleaseReadiness => ({ ready, reason, version, openTasks, intent });
  if (!semantic.test(version ?? '')) throw new Error('Current package version is not semantic.');
  if (planMarkdown === null) return result(false, 'implementation_plan.md is missing');
  if (intent !== version) return result(false, `no authorized Release-Intent for v${version}`);
  if (openTasks.length) return result(false, `authorized v${version} waits for the queue to empty (${openTasks.join(', ')})`);
  return result(true, `authorized v${version} batch is complete`);
}

export function renderReadinessSummary(readiness: ReleaseReadiness, extra: string[] = []): string {
  return [
    '### Batch release readiness',
    `- Package version: v${readiness.version}`,
    `- Authorized intent: ${readiness.intent ? `v${readiness.intent}` : 'none'}`,
    `- Open queue: ${readiness.openTasks.length ? readiness.openTasks.join(', ') : 'empty'}`,
    ...extra.map((line) => `- ${line}`),
    `- Decision: ${readiness.ready ? 'ready' : 'not ready'} — ${readiness.reason}`,
    '',
  ].join('\n');
}
