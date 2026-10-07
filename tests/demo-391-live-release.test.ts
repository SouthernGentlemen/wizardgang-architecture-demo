import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateControlledPullRequestIdentity } from '../scripts/lib/controlled-pr-identity.ts';
import { nextLiveReleaseId, validateLiveReleaseIdentity } from '../scripts/lib/live-release-identity.ts';

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
    expect(nextLiveReleaseId(['[DEMO-390] [FIX] Accepted'], plan, [
      { title: '[DEMO-393] [FIX] Open', headRefName: 'demo-393-open' },
      { title: 'Draft', headRefName: 'demo-394-reserved' },
    ])).toBe('DEMO-396');
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

describe('DEMO-391 workflow protection', () => {
  const workflow = readFileSync(new URL('../.github/workflows/git-demo.yml', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../scripts/git-demo-workflow.ts', import.meta.url), 'utf8');
  const lib = readFileSync(new URL('../scripts/lib/git-demo-workflow.ts', import.meta.url), 'utf8');
  it('uses exact-head squash, all required CI checks, and no bypass or merge commit', () => {
    expect(workflow).toContain('--match-head-commit "$SHA"');
    expect(workflow).toContain('--squash');
    expect(workflow).toContain('node scripts/git-demo-workflow.ts require-checks');
    expect(lib).toContain("['validate', 'change-id', 'security', 'secrets']");
    expect(workflow).toContain('node scripts/git-demo-workflow.ts recheck-base');
    expect(lib).toContain('pr.base.sha !== mainSha');
    expect(workflow).not.toMatch(/\s--merge\s*\\/);
    expect(workflow).not.toContain('--admin');
  });
  it('allocates against the queue and open PRs and presents the release range before confirmation', () => {
    expect(workflow).toContain('node scripts/git-demo-workflow.ts start');
    expect(lib).toContain('nextLiveReleaseId(subjects, planMarkdown, openPullRequests)');
    expect(script).toContain("fs.readFileSync('implementation_plan.md'");
    expect(script).toContain("'--state', 'open'");
    expect(lib).toContain("version.replaceAll('.', '-')");
    expect(workflow).toContain('Show release preflight before merge confirmation');
    expect(workflow).toContain('git log --format=');
  });
  it('keeps workflow application logic in typed scripts instead of inline Node programs', () => {
    expect(workflow).not.toMatch(/<<'?NODE'?/);
    expect(workflow).not.toMatch(/\bnode (?:-p|-e|--eval|--print|--input-type)\b/);
    expect(workflow).not.toMatch(/\bnode\s*<</);
    expect(workflow).not.toContain('git checkout --detach "$SHA"');
  });
});
