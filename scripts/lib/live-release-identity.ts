import { parseControlledSubject, parsePlanTasks } from './controlled-pr-identity.ts';

export const LIVE_RELEASE_MARKER = 'Live-Release: true';
export const LIVE_RELEASE_FILES = ['package-lock.json', 'package.json'];
const titlePattern = /^\[DEMO-(\d{3,})\] \[BUILD\] Demonstrate v(\d+\.\d+\.\d+) release lifecycle$/;
const branchPattern = /^demo-(\d{3,})-live-v(\d+)-(\d+)-(\d+)-([0-9a-f]{8})$/;
const sections = ['Change', 'Reason', 'Impact', 'Risk', 'Controls', 'Validation', 'Evidence', 'Source', 'Release'];

export function nextLiveReleaseId(
  subjects: string[],
  planMarkdown: string,
  openPullRequests: Array<{ title: string; headRefName?: string }> = [],
): string {
  const accepted = subjects.map(parseControlledSubject).filter(Boolean).map((item) => item.number);
  const reserved = new Set(parsePlanTasks(planMarkdown).map((item) => item.number));
  for (const pr of openPullRequests) {
    const title = parseControlledSubject(pr.title);
    if (title) reserved.add(title.number);
    const branch = /^demo-(\d{3,})-/.exec(pr.headRefName || '');
    if (branch) reserved.add(Number(branch[1]));
  }
  let candidate = Math.max(0, ...accepted) + 1;
  while (reserved.has(candidate)) candidate += 1;
  return `DEMO-${String(candidate).padStart(3, '0')}`;
}

function json(value, label, errors) {
  try { return JSON.parse(value); } catch { errors.push(`${label} is not valid JSON.`); return null; }
}

function sameExceptVersion(before, after, label, errors, lock = false) {
  if (!before || !after || typeof before.version !== 'string' || typeof after.version !== 'string') {
    errors.push(`${label} must contain a version.`);
    return;
  }
  const oldVersion = before.version;
  const newVersion = after.version;
  if (oldVersion === newVersion) errors.push(`${label} version must change.`);
  const normalized = structuredClone(after);
  normalized.version = oldVersion;
  if (lock) {
    if (before.packages?.['']?.version !== oldVersion || after.packages?.['']?.version !== newVersion) {
      errors.push('package-lock.json root package version must match its top-level version.');
    }
    if (normalized.packages?.['']) normalized.packages[''].version = oldVersion;
  }
  if (JSON.stringify(before) !== JSON.stringify(normalized)) errors.push(`${label} may change only version metadata.`);
}

export function validateLiveReleaseIdentity({
  title, body = '', branchName = null, changedFiles = [],
  beforePackage, afterPackage, beforeLock, afterLock,
  basePlanMarkdown = null, headPlanMarkdown = null, baseAcceptedIds = new Set(),
}) {
  const errors = [];
  const match = titlePattern.exec(title || '');
  if (!match) errors.push('Live release title must be [DEMO-NNN] [BUILD] Demonstrate vX.Y.Z release lifecycle.');
  if (!new RegExp(`(?:^|\\n)${LIVE_RELEASE_MARKER}$`, 'm').test(body)) errors.push(`Live release requires ${LIVE_RELEASE_MARKER}.`);
  for (const section of sections) {
    if (!new RegExp(`(?:^|\\n)${section}:`, 'm').test(body)) errors.push(`Live release is missing ${section}:`);
  }
  if (!/(?:^|\n)Risk:\s*(?:\n\s*)?(?:Low|Medium|High)\b/m.test(body)) errors.push('Live release requires a Low, Medium, or High risk.');
  if (match && !new RegExp(`(?:^|\\n)Release:\\s*v${match[2].replaceAll('.', '\\.')}\\s*(?:\\n|$)`).test(body)) errors.push('Live release body must name its target version.');
  if (branchName !== null) {
    const branch = branchPattern.exec(branchName);
    if (!branch || !match || branch[1] !== match[1] || `${branch[2]}.${branch[3]}.${branch[4]}` !== match[2]) {
      errors.push('Live release branch must bind its DEMO ID and hyphenated target version to the title.');
    }
  }
  const files = [...changedFiles].sort();
  if (JSON.stringify(files) !== JSON.stringify(LIVE_RELEASE_FILES)) errors.push('Live release may change only package.json and package-lock.json.');
  const oldPackage = json(beforePackage, 'Base package.json', errors);
  const newPackage = json(afterPackage, 'Release package.json', errors);
  const oldLock = json(beforeLock, 'Base package-lock.json', errors);
  const newLock = json(afterLock, 'Release package-lock.json', errors);
  if (oldPackage && newPackage) sameExceptVersion(oldPackage, newPackage, 'package.json', errors);
  if (oldLock && newLock) sameExceptVersion(oldLock, newLock, 'package-lock.json', errors, true);
  if (match && newPackage?.version !== match[2]) errors.push('Package version must equal the live release title version.');
  if (oldPackage && newPackage) {
    const oldParts = /^\d+\.\d+\.\d+$/.test(oldPackage.version) ? oldPackage.version.split('.').map(Number) : null;
    const newParts = /^\d+\.\d+\.\d+$/.test(newPackage.version) ? newPackage.version.split('.').map(Number) : null;
    if (!oldParts || !newParts || !newParts.some((part, index) => part > oldParts[index] && newParts.slice(0, index).every((value, position) => value === oldParts[position]))) {
      errors.push('Live release version must advance the semantic version.');
    }
  }
  if (newPackage && newLock && newPackage.version !== newLock.version) errors.push('Package and lockfile versions must match.');
  if (oldPackage && oldLock && oldPackage.version !== oldLock.version) errors.push('Base package and lockfile versions must match.');
  if (basePlanMarkdown !== null) {
    if (headPlanMarkdown === null) errors.push('Live release must retain implementation_plan.md.');
    const baseTasks = parsePlanTasks(basePlanMarkdown).map((item) => item.id);
    const headTasks = parsePlanTasks(headPlanMarkdown ?? '').map((item) => item.id);
    if (JSON.stringify(baseTasks) !== JSON.stringify(headTasks)) errors.push('Live release must preserve the implementation queue.');
    if (match && (baseTasks.includes(`DEMO-${match[1]}`) || baseAcceptedIds.has(`DEMO-${match[1]}`))) {
      errors.push('Live release ID must not be queued or already accepted.');
    }
  }
  return errors;
}
