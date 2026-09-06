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
]);
const publishedContinuationExceptions = new Map([
  [
    '45f2ff42d2b92ea1f820e037306f07104480f8b5',
    'This follow-up was published with DEMO-175 in error, but its body and pull-request topology identify it as the completion of DEMO-174; it does not consume a new sequential change ID.',
  ],
]);
const controlled = [];
const failures = [];
const exceptionsUsed = [];

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
  controlled.push({ sha, id: Number(match[1]), body });
}

let expected = 0;
controlled.forEach(({ sha, id, body }) => {
  const continuationException = publishedContinuationExceptions.get(sha);
  if (continuationException) {
    exceptionsUsed.push(`${sha.slice(0, 12)}: ${continuationException}`);
  } else {
    expected += 1;
    if (id !== expected) failures.push(`${sha.slice(0, 12)} uses DEMO-${String(id).padStart(3, '0')}; expected DEMO-${String(expected).padStart(3, '0')}`);
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
