import { allocateControlledIdentity } from '../scripts/lib/controlled-identity-allocation.ts';
import { describe, expect, it } from 'vitest';
import { validateControlledPullRequestIdentity } from '../scripts/lib/controlled-pr-identity.ts';
import { validateLiveReleaseIdentity } from '../scripts/lib/live-release-identity.ts';

const task = (id: string) => `### ${id} — [BUILD] Queued change\n\n- Dependency: none.\n`;
const plan = `# Implementation plan\n\n## Open tasks\n\n${task('DEMO-391')}\n${task('DEMO-392')}\n${task('DEMO-395')}`;
const title = '[DEMO-393] [BUILD] Demonstrate v0.29.0 release lifecycle';
const body = `Change:\nVersion metadata.\n\nReason:\nLive lifecycle.\n\nImpact:\nPackage metadata.\n\nRisk:\nMedium\n\nControls:\n- Four checks.\n\nValidation:\n- CI.\n\nEvidence:\n- package.json.\n\nSource:\ndirect.\n\nRelease:\nv0.29.0\n\nLive-Release: true\n`;
const beforePackage = { name: 'demo', version: '0.28.0', scripts: { check: 'node check.mjs' } };
const afterPackage = { ...beforePackage, version: '0.29.0' };
const beforeLock = { name: 'demo', version: '0.28.0', packages: { '': { name: 'demo', version: '0.28.0' }, dep: { version: '1.0.0' } } };
const afterLock = { ...beforeLock, version: '0.29.0', packages: { ...beforeLock.packages, '': { ...beforeLock.packages[''], version: '0.29.0' } } };
const release = (overrides: Partial<Parameters<typeof validateLiveReleaseIdentity>[0]> = {}) => ({
  title, body, branchName: 'demo-393-live-v0-29-0-123e4567',
  changedFiles: ['package-lock.json', 'package.json'],
  beforePackage: JSON.stringify(beforePackage), afterPackage: JSON.stringify(afterPackage),
  beforeLock: JSON.stringify(beforeLock), afterLock: JSON.stringify(afterLock),
  basePlanMarkdown: plan, headPlanMarkdown: plan,
  baseAcceptedIds: new Set(['DEMO-390']),
  ...overrides,
});

describe('DEMO-391 narrow live release identity', () => {
  it('allocates an unassigned ID after accepted history while skipping queued and open PR IDs', () => {
    expect(allocateControlledIdentity({ subjects: ['[DEMO-390] [FIX] Accepted'], planMarkdown: plan, openPullRequests: [
      { title: '[DEMO-393] [FIX] Open', headRefName: 'demo-393-open' },
      { title: 'Draft', headRefName: 'demo-394-reserved' },
    ] })).toBe('DEMO-396');
  });

  it('accepts a one-commit version-only live PR without retiring the queued task', () => {
    const liveReleaseErrors = validateLiveReleaseIdentity(release());
    expect(liveReleaseErrors).toEqual([]);
    expect(validateControlledPullRequestIdentity({
      branchName: release().branchName,
      title,
      headSubject: title,
      headBody: body,
      rangeSubjects: [title],
      basePlanMarkdown: plan,
      headPlanMarkdown: plan,
      baseAcceptedIds: new Set(['DEMO-390']),
      liveReleaseErrors,
    })).toEqual([]);
  });

  it('rejects missing marker, non-version edits, queued IDs, and malformed branch', () => {
    expect(validateLiveReleaseIdentity(release({ body: body.replace('Live-Release: true', '') }))).toContain('Live release requires Live-Release: true.');
    expect(validateLiveReleaseIdentity(release({ afterPackage: JSON.stringify({ ...afterPackage, scripts: { check: 'exit 0' } }) }))).toContain('package.json may change only version metadata.');
    expect(validateLiveReleaseIdentity(release({ changedFiles: [...release().changedFiles, 'src/index.ts'] }))).toContain('Live release may change only package.json and package-lock.json.');
    expect(validateLiveReleaseIdentity(release({ title: title.replace('393', '392'), branchName: 'demo-392-live-v0-29-0-123e4567' }))).toContain('Live release ID must not be queued or already accepted.');
    expect(validateLiveReleaseIdentity(release({ branchName: 'demo-393-live-v0.29.0-123e4567' }))).toContain('Live release branch must bind its DEMO ID and hyphenated target version to the title.');
  });
});
