import fs from 'node:fs';
import { parseControlledSubject } from './lib/controlled-pr-identity.ts';
import { allocateControlledIdentity, allocatePlanIdentities, selectQueuedIdentity } from './lib/controlled-identity-allocation.ts';
import { renderControlledRecord } from './lib/controlled-record.ts';
import { deliverProtectedPull, git, openControlledPull, readReservations } from './lib/controlled-delivery-provider.ts';

const [operation, ...args] = process.argv.slice(2);
switch (operation) {
  case 'begin': {
    const first = readReservations();
    const selected = selectQueuedIdentity(first);
    const current = readReservations();
    if (current.mainSha !== first.mainSha || selectQueuedIdentity(current) !== selected) throw new Error('Queue or reservations moved before branch creation.');
    if (git(['status', '--porcelain'])) throw new Error('Preserve local changes before starting controlled delivery.');
    git(['switch', '-c', `demo-${selected.slice(5)}-controlled-delivery`, current.mainSha]);
    console.log(selected);
    break;
  }
  case 'select':
    console.log(selectQueuedIdentity(readReservations()));
    break;
  case 'allocate':
    console.log(allocateControlledIdentity(readReservations()));
    break;
  case 'plan': {
    // Input: { "tasks": [{ "type", "title" }], "release"?: { "version", "authorizedBy" } }.
    const input = JSON.parse(fs.readFileSync(args[0], 'utf8'));
    const tasks = input?.tasks;
    if (!Array.isArray(tasks) || tasks.some((task) => !parseControlledSubject(`[DEMO-001] [${task.type}] ${task.title}`))) throw new Error('Plan input requires ordered typed task titles.');
    const reservations = readReservations();
    const release = input.release ? { ...input.release, currentVersion: JSON.parse(git(['show', `${reservations.mainSha}:package.json`])).version } : undefined;
    console.log(JSON.stringify(allocatePlanIdentities(reservations, tasks, release), null, 2));
    break;
  }
  case 'record': {
    const record = renderControlledRecord(JSON.parse(fs.readFileSync(args[0], 'utf8')));
    fs.writeFileSync(args[1], record.commit);
    break;
  }
  case 'open':
    console.log(openControlledPull(args[0], args[1]).html_url);
    break;
  case 'merge':
    if (!/^\d+$/.test(args[0]) || !/^[a-f0-9]{40}$/.test(args[1]) || !/^[a-f0-9]{40}$/.test(args[2])) throw new Error('merge requires PR number, validated head and base SHAs; --apply is explicit.');
    console.log(JSON.stringify(await deliverProtectedPull(Number(args[0]), args[1], args[2], args.includes('--apply')), null, 2));
    break;
  default:
    throw new Error(`Unknown controlled delivery operation: ${operation}`);
}
