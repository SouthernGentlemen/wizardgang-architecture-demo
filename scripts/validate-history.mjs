import { execFileSync } from 'node:child_process';

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
]);
const controlled = [];
const failures = [];
const exceptionsUsed = [];
const earlyMaintenance = new Set();

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
  controlled.push({ sha, parents: parents.trim().split(/\s+/).filter(Boolean), id: Number(match[1]), body });
}

let expected = 0;
const delivered = new Set();
controlled.forEach(({ sha, parents, id, body }) => {
  const continuationException = publishedContinuationExceptions.get(sha);
  const boundedRecovery = parents.length === 1 ? boundedRecoveryContinuations.get(parents[0]) : null;
  const isBoundedRecovery = boundedRecovery
    && boundedRecovery.id === id
    && body.split('\n').some((line) => line.trim() === boundedRecovery.marker);
  if (continuationException) {
    exceptionsUsed.push(`${sha.slice(0, 12)}: ${continuationException}`);
  } else if (isBoundedRecovery) {
    exceptionsUsed.push(`${sha.slice(0, 12)}: ${boundedRecovery.reason}`);
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
    while (earlyMaintenance.has(expected) || (expected === 362 && delivered.has(362)) || expected === 363) expected += 1;
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
