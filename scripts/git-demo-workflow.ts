import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';
import { liveIntentRecord, packageVersion, planLiveReleaseStart } from './lib/git-demo-workflow.ts';
import { batchReleaseReadiness, renderReadinessSummary } from './lib/release-intent.ts';
import { deliverProtectedPull, openControlledPull, readReservations, git } from './lib/controlled-delivery-provider.ts';

function env(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is required.`);
  return value;
}

function run(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: 'utf8' });
}

function writeOutputs(values: Record<string, string>): void {
  fs.appendFileSync(env('GITHUB_OUTPUT'), Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''));
}

const [operation] = process.argv.slice(2);
switch (operation) {
  case 'start': {
    const bump = env('BUMP');
    if (bump !== 'patch' && bump !== 'minor' && bump !== 'major') throw new Error('bump must be patch, minor, or major');
    const start = planLiveReleaseStart({
      packageJson: fs.readFileSync('package.json', 'utf8'),
      bump,
      requestId: env('REQUEST_ID'),
      ...readReservations(),
      existingTag: (tag) => run('git', ['tag', '--list', tag]).trim() !== '',
    });
    writeOutputs({ ...start });
    break;
  }
  case 'publish': {
    const reservations = readReservations();
    if (git(['rev-parse', 'HEAD']) !== reservations.mainSha) throw new Error('Main moved before live branch publication.');
    const bump = env('BUMP');
    if (!['patch', 'minor', 'major'].includes(bump)) throw new Error('Invalid release bump.');
    const start = planLiveReleaseStart({
      packageJson: git(['show', `${reservations.mainSha}:package.json`]),
      bump: bump as 'patch' | 'minor' | 'major', requestId: env('REQUEST_ID'), ...reservations,
      existingTag: (tag) => git(['tag', '--list', tag]) !== '',
    });
    if (start.version !== env('VERSION')) throw new Error('Version intent changed before publication.');
    const commits = fs.readFileSync(env('COMMITS_FILE'), 'utf8').trim();
    const record = liveIntentRecord({ id: start.change_id, version: start.version, requestId: env('REQUEST_ID'), previousTag: env('LAST_TAG'), commits });
    // After merge the cutter applies this same readiness to the accepted main commit.
    const readiness = batchReleaseReadiness({ version: start.version, planMarkdown: reservations.planMarkdown, intent: start.version });
    fs.appendFileSync(env('GITHUB_STEP_SUMMARY'), renderReadinessSummary(readiness, [`Previous release: ${env('LAST_TAG')}`, `Commits since ${env('LAST_TAG')}:\n${commits}`]));
    git(['switch', '-c', start.branch]);
    git(['add', 'package.json', 'package-lock.json']);
    execFileSync('git', ['commit', '-F', '-'], { input: record.commit, stdio: ['pipe', 'inherit', 'inherit'] });
    git(['push', '--set-upstream', 'origin', start.branch]);
    const pr = openControlledPull(git(['rev-parse', 'HEAD']), reservations.mainSha);
    writeOutputs({ ...start, pull_request: String(pr.number) });
    break;
  }
  case 'merge': {
    const number = Number(env('PULL_REQUEST'));
    if (!Number.isInteger(number) || number <= 0) throw new Error('Invalid pull request number.');
    // Capture the reviewed head once; the common path independently re-reads all mutable inputs.
    const { api } = await import('./lib/controlled-delivery-provider.ts');
    const pr = api(`pulls/${number}`);
    const result = await deliverProtectedPull(number, pr.head.sha, pr.base.sha, true, env('REQUEST_ID'));
    writeOutputs({ sha: result.sha!, base: pr.base.sha, head: pr.head.sha });
    break;
  }
  case 'package-version':
    console.log(packageVersion(fs.readFileSync(0, 'utf8')));
    break;
  default:
    console.error(`Unknown live Git demo operation: ${operation ?? '(none)'}`);
    process.exitCode = 64;
}
