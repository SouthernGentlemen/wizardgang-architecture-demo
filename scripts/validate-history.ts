import { execFileSync } from 'node:child_process';
import {
  ACCEPTED_HISTORY_BOUNDARY,
  validateCheckpointAncestry,
  validateForwardRecords,
  rawAcceptedIds,
} from './lib/forward-history.ts';

const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const boundary = ACCEPTED_HISTORY_BOUNDARY;
const errors = validateCheckpointAncestry(git);
if (errors.length) {
  process.stderr.write(errors.join('\n') + '\n');
  process.exitCode = 1;
} else {
  const rawSubjects = git(['log', '--format=%s', boundary.checkpoint]).split('\n').filter(Boolean);
  const acceptedBefore = rawAcceptedIds(rawSubjects);
  // Only commits after the fixed boundary have their bodies read and validated.
  const output = git(['log', '--reverse', '--format=%H%x1f%P%x1f%s%x1f%b%x1e', boundary.checkpoint + '..HEAD']);
  const records = output.split('\x1e').map((item) => item.trim()).filter(Boolean).map((item) => {
    const [sha = '', parents = '', subject = '', body = ''] = item.split('\x1f');
    return { sha, parents: parents.split(/\s+/).filter(Boolean), subject, body };
  }).filter((record) => !(process.env.GITHUB_EVENT_NAME === 'pull_request'
    && /^Merge [0-9a-f]+ into [0-9a-f]+$/.test(record.subject)
    && record.parents.length === 2));

  const gitFile = (sha, path) => {
    try { return git(['show', sha + ':' + path]); } catch { return null; }
  };
  const enriched = records.map((record) => ({
    ...record,
    basePlanMarkdown: gitFile(record.parents[0], 'implementation_plan.md'),
    headPlanMarkdown: gitFile(record.sha, 'implementation_plan.md'),
  }));
  const result = validateForwardRecords({
    records: enriched,
    acceptedBefore,
    commitInputs: (record) => ({
      changedFiles: git(['diff', '--name-only', record.parents[0], record.sha]).split('\n').filter(Boolean),
      beforePackage: gitFile(record.parents[0], 'package.json'),
      afterPackage: gitFile(record.sha, 'package.json'),
      beforeLock: gitFile(record.parents[0], 'package-lock.json'),
      afterLock: gitFile(record.sha, 'package-lock.json'),
    }),
  });
  if (result.errors.length) {
    process.stderr.write(result.errors.join('\n') + '\n');
    process.exitCode = 1;
  } else {
    process.stdout.write('Validated ' + result.validated + ' forward controlled change(s) after fixed checkpoint ' + boundary.checkpoint + '.\n');
  }
}
