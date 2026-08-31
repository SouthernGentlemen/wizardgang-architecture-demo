import { execFileSync } from 'node:child_process';

const raw = execFileSync('git', ['log', '--reverse', '--format=%H%x1f%P%x1f%s%x1f%b%x1e'], { encoding: 'utf8' });
const records = raw.split('\x1e').map((record) => record.trim()).filter(Boolean);
const titlePattern = /^\[DEMO-(\d{3,})\] \[(INIT|FEAT|FIX|SEC|API|A11Y|I18N|AI|DB|OPS|TEST|DOCS|REFACTOR|PERF|BUILD|REVERT|CHORE)\] .+/;
const requiredSections = ['Change', 'Reason', 'Risk', 'Validation', 'Source', 'Release'];
const controlled = [];
const failures = [];

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

controlled.forEach(({ sha, id, body }, index) => {
  const expected = index + 1;
  if (id !== expected) failures.push(`${sha.slice(0, 12)} uses DEMO-${String(id).padStart(3, '0')}; expected DEMO-${String(expected).padStart(3, '0')}`);
  for (const section of requiredSections) {
    if (!new RegExp(`(?:^|\\n)${section}:`, 'm').test(body)) failures.push(`DEMO-${String(id).padStart(3, '0')} is missing ${section}:`);
  }
  if (!/(?:^|\n)Risk:\s*(?:\n\s*)?(?:Low|Medium|High)\b/m.test(body)) failures.push(`DEMO-${String(id).padStart(3, '0')} has no Low, Medium, or High risk`);
});

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Validated ${controlled.length} sequential controlled changes.\n`);
}
