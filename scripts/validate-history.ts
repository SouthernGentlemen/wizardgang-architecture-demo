import { execFileSync } from 'node:child_process';
import { LIVE_RELEASE_MARKER, validateLiveReleaseIdentity } from './lib/live-release-identity.ts';

const raw = execFileSync('git', ['log', '--reverse', '--format=%H%x1f%P%x1f%s%x1f%b%x1e'], { encoding: 'utf8' });
const records = raw.split('\x1e').map((record) => record.trim()).filter(Boolean);
const titlePattern = /^\[DEMO-(\d{3,})\] \[(INIT|FEAT|FIX|SEC|API|A11Y|I18N|AI|DB|OPS|TEST|DOCS|REFACTOR|PERF|BUILD|REVERT|CHORE)\] .+/;
const requiredSections = ['Change', 'Reason', 'Risk', 'Validation', 'Source', 'Release'];
const inheritedBodyExceptions = new Map([
  [
    '207fd4e146054bd3c9da236c615753df9f927610',
    'DEMO-125 was published on main with a valid controlled title but without the required structured body sections; published history is intentionally not rewritten.',
  ],
  [
    '80590b8c367e8d927c2861902182e79eccd41dda',
    'DEMO-359 was squash-merged with a valid controlled title but its squash body omitted the required structured sections; merged main is preserved and the post-merge failure is recorded instead of rewriting history.',
  ],
  [
    '4ec192c10dfefd9d119ac223ae599b7db948524c',
    'DEMO-366 was squash-merged with a valid controlled title but its squash body omitted Reason, Risk, and Source; merged main is preserved and post-merge CI #1370 is recorded instead of rewriting history.',
  ],
  [
    '68968b6d0419cf3de6abc410b9a0a264097fe136',
    'DEMO-422 was squash-merged with a valid controlled title but its squash body omitted the required structured sections; merged main is preserved and post-merge CI #1504 is recorded instead of rewriting history.',
  ],
]);
const publishedContinuationExceptions = new Map([
  [
    '45f2ff42d2b92ea1f820e037306f07104480f8b5',
    'This follow-up was published with DEMO-175 in error, but its body and pull-request topology identify it as the completion of DEMO-174; it does not consume a new sequential change ID.',
  ],
  [
    'e79f108224612ff48946c2905318010ad5b14a91',
    'DEMO-225 was merged after DEMO-225 through DEMO-228 had already shipped; the late-merged presentation commit retains its published identity but does not consume another sequential change ID.',
  ],
]);
const boundedRecoveryContinuations = new Map([
  [
    '4ec192c10dfefd9d119ac223ae599b7db948524c',
    {
      id: 366,
      marker: 'Post-Merge-Recovery: 4ec192c10dfefd9d119ac223ae599b7db948524c',
      reason: 'The one direct child of the immutable malformed DEMO-366 squash commit is its bounded post-merge history-metadata recovery and does not consume DEMO-367.',
    },
  ],
  [
    '68968b6d0419cf3de6abc410b9a0a264097fe136',
    {
      id: 422,
      marker: 'Post-Merge-Recovery: 68968b6d0419cf3de6abc410b9a0a264097fe136',
      reason: 'The one direct child of the immutable malformed DEMO-422 squash commit is its bounded post-merge history-metadata recovery and does not consume DEMO-423.',
    },
  ],
  [
    '52404a848a52dd012012b23b30fcd88ab9e54ed5',
    {
      id: 478,
      marker: 'Post-Merge-Recovery: 52404a848a52dd012012b23b30fcd88ab9e54ed5',
      reason: 'The one direct child of the immutable DEMO-478 live release squash commit is its bounded post-merge history-metadata recovery and does not consume DEMO-479.',
    },
  ],
]);
// A live release squash-merged with GitHub's " (#N)" pull-request suffix on its subject. Only that exact suffix is
// stripped before the live-release title check; every other live-release rule still applies to the commit.
const liveReleaseSquashSuffixExceptions = new Map([
  [
    '52404a848a52dd012012b23b30fcd88ab9e54ed5',
    {
      suffix: ' (#409)',
      reason: 'DEMO-478 (v0.30.0) was squash-merged with the " (#409)" pull-request suffix on its live release title; merged main is preserved and post-merge CI 37385592520 is recorded instead of rewriting history.',
    },
  ],
]);
// Plan changes that renumbered queued, never-delivered IDs, which are therefore never consumed:
// DEMO-460 moved the platform tasks ahead of the remaining TypeScript port, renumbering DEMO-435..442 to DEMO-461..468
// and DEMO-444..452 to DEMO-469..477 and dropping DEMO-443. DEMO-481 moved the usage-reporting fix and the deployment
// records ahead of the rest of the port, renumbering DEMO-474..477 to DEMO-484..487. DEMO-488 moved Durable Objects reporting ahead of
// the remaining port, renumbering never-delivered DEMO-485..487 to DEMO-490..492.
const renumberedQueues = [
  {
    sha: 'ecc557aaa0a5e8c766c0020d5aa59357f27ef81e',
    first: 435,
    last: 452,
    reason: 'DEMO-460 renumbered the never-delivered queued DEMO-435..452 (DEMO-443 dropped); those IDs are never consumed.',
  },
  {
    sha: 'd2b939fc512c9cd1c569b625c2c0d58722836577',
    first: 474,
    last: 477,
    reason: 'DEMO-481 renumbered the never-delivered queued DEMO-474..477 to DEMO-484..487; those IDs are never consumed.',
  },
  {
    sha: 'f6ff2665a643719c9b84da8ed7ea8e94b644c4b2',
    first: 485,
    last: 487,
    reason: 'DEMO-488 renumbered the never-delivered queued DEMO-485..487 to DEMO-490..492; those IDs are never consumed.',
  },
];
const controlled = [];
const failures = [];
const exceptionsUsed = [];
const earlyMaintenance = new Set();
const earlyLiveReleases = new Set();

for (const record of records) {
  const [sha = '', parents = '', subject = '', body = ''] = record.split('\x1f');
  if (parents.trim().split(/\s+/).filter(Boolean).length > 1) continue;
  // GitHub synthesizes one temporary merge commit for a pull-request workflow.
  if (process.env.GITHUB_EVENT_NAME === 'pull_request' && /^Merge [0-9a-f]+ into [0-9a-f]+$/.test(subject)) continue;
  const match = titlePattern.exec(subject);
  if (!match) {
    failures.push(`${sha.slice(0, 12)} has an invalid controlled title: ${subject}`);
    continue;
  }
  controlled.push({ sha, parents: parents.trim().split(/\s+/).filter(Boolean), id: Number(match[1]), subject, body });
}

let expected = 0;
const renumberedQueuesSeen: typeof renumberedQueues = [];
const delivered = new Set();
controlled.forEach(({ sha, parents, id, subject, body }) => {
  const renumbered = renumberedQueues.find((queue) => queue.sha === sha);
  if (renumbered) {
    renumberedQueuesSeen.push(renumbered);
    exceptionsUsed.push(`${sha.slice(0, 12)}: ${renumbered.reason}`);
  }
  const continuationException = publishedContinuationExceptions.get(sha);
  const boundedRecovery = parents.length === 1 ? boundedRecoveryContinuations.get(parents[0]) : null;
  const squashSuffix = liveReleaseSquashSuffixExceptions.get(sha);
  const liveTitle = squashSuffix && subject.endsWith(squashSuffix.suffix) ? subject.slice(0, -squashSuffix.suffix.length) : subject;
  const isLiveRelease = body.split('\n').some((line) => line.trim() === LIVE_RELEASE_MARKER)
    || (id >= 391 && /^\[DEMO-\d+\] \[BUILD\] Demonstrate v\d+\.\d+\.\d+ release lifecycle$/.test(liveTitle));
  const isBoundedRecovery = boundedRecovery
    && boundedRecovery.id === id
    && body.split('\n').some((line) => line.trim() === boundedRecovery.marker);
  if (continuationException) {
    exceptionsUsed.push(`${sha.slice(0, 12)}: ${continuationException}`);
  } else if (isBoundedRecovery) {
    exceptionsUsed.push(`${sha.slice(0, 12)}: ${boundedRecovery.reason}`);
  } else if (isLiveRelease && parents.length === 1) {
    const parent = parents[0];
    const gitFile = (revision, file) => execFileSync('git', ['show', `${revision}:${file}`], { encoding: 'utf8' });
    if (squashSuffix && liveTitle !== subject) exceptionsUsed.push(`${sha.slice(0, 12)}: ${squashSuffix.reason}`);
    const liveErrors = validateLiveReleaseIdentity({
      title: liveTitle,
      body,
      changedFiles: execFileSync('git', ['diff', '--name-only', parent, sha], { encoding: 'utf8' }).trim().split('\n').filter(Boolean),
      beforePackage: gitFile(parent, 'package.json'),
      afterPackage: gitFile(sha, 'package.json'),
      beforeLock: gitFile(parent, 'package-lock.json'),
      afterLock: gitFile(sha, 'package-lock.json'),
      basePlanMarkdown: gitFile(parent, 'implementation_plan.md'),
      headPlanMarkdown: gitFile(sha, 'implementation_plan.md'),
      baseAcceptedIds: new Set([...delivered].map((value) => `DEMO-${String(value).padStart(3, '0')}`)),
    });
    if (liveErrors.length || delivered.has(id) || id <= expected) {
      failures.push(`${sha.slice(0, 12)} has an invalid live release: ${[...liveErrors, ...(delivered.has(id) || id <= expected ? ['DEMO ID must be unassigned.'] : [])].join(' ')}`);
    } else {
      if (id === expected + 1) expected = id;
      else earlyLiveReleases.add(id);
      delivered.add(id);
    }
  } else if (id === 362 && expected === 357 && !delivered.has(362)) {
    // The authorized portfolio policy transition is delivered before the
    // unrelated DEMO-358..361 work. Their existing IDs remain reserved.
    delivered.add(362);
    exceptionsUsed.push(`${sha.slice(0, 12)}: DEMO-362 is the portfolio settings transition ahead of reserved DEMO-358..361.`);
  } else if (/^Portfolio-Plan-Maintenance: true$/m.test(body) && id > expected + 1) {
    earlyMaintenance.add(id);
    delivered.add(id);
  } else {
    expected += 1;
    while (earlyMaintenance.has(expected) || earlyLiveReleases.has(expected) || (expected === 362 && delivered.has(362)) || expected === 363
      || renumberedQueuesSeen.some((queue) => expected >= queue.first && expected <= queue.last && !delivered.has(expected))) expected += 1;
    if (id !== expected) failures.push(`${sha.slice(0, 12)} uses DEMO-${String(id).padStart(3, '0')}; expected DEMO-${String(expected).padStart(3, '0')}`);
    delivered.add(id);
  }

  const inheritedException = inheritedBodyExceptions.get(sha);
  if (inheritedException) {
    exceptionsUsed.push(`${sha.slice(0, 12)}: ${inheritedException}`);
    return;
  }

  for (const section of requiredSections) {
    if (!new RegExp(`(?:^|\\n)${section}:`, 'm').test(body)) failures.push(`DEMO-${String(id).padStart(3, '0')} is missing ${section}:`);
  }
  if (!/(?:^|\n)Risk:\s*(?:\n\s*)?(?:Low|Medium|High)\b/m.test(body)) failures.push(`DEMO-${String(id).padStart(3, '0')} has no Low, Medium, or High risk`);
});

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  if (exceptionsUsed.length) process.stdout.write(`Accepted ${exceptionsUsed.length} immutable published-history exception:\n${exceptionsUsed.join('\n')}\n`);
  process.stdout.write(`Validated ${expected} sequential controlled changes.\n`);
}
