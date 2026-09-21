import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(root, 'IMPLEMENTATION_PLAN.md');
const taskPattern = /^### (DEMO-\d{3,}) — \[(INIT|FEAT|FIX|SEC|API|A11Y|I18N|AI|DB|OPS|TEST|DOCS|REFACTOR|PERF|BUILD|REVERT|CHORE)\] ([^\n]+)$/gm;
const fields = ['Dependency', 'Why', 'Scope', 'Non-goals', 'Acceptance', 'Validation', 'Authorities'];

export function validateImplementationPlan(markdown, acceptedIds = new Set()) {
  const errors = [];
  const headings = [...markdown.matchAll(/^### .+$/gm)];
  const tasks = [...markdown.matchAll(taskPattern)];
  if (!tasks.length) errors.push('An active implementation plan must have open tasks; delete it when exhausted.');
  if (headings.length !== tasks.length) errors.push('Every task heading must be ### DEMO-### — [TYPE] Imperative title.');
  if (/^#{1,6} (?:Done|Completed|History|Retrospective|Release notes)\b/gim.test(markdown)) {
    errors.push('An active plan cannot retain completed work or historical sections.');
  }

  let previous = 0;
  for (const [index, task] of tasks.entries()) {
    const id = task[1];
    const number = Number(id.slice(5));
    if (number <= previous) errors.push(`${id}: tasks must have unique ascending IDs.`);
    previous = number;
    if (acceptedIds.has(id)) errors.push(`${id}: an accepted controlled change cannot remain in the active plan; retire it in the delivering PR.`);
    const section = markdown.slice(task.index + task[0].length, tasks[index + 1]?.index ?? markdown.length);
    for (const field of fields) {
      if (!new RegExp(`^- ${field}:\\s*\\S`, 'm').test(section)) errors.push(`${id}: missing non-empty ${field} field.`);
    }
    if (/^\s*- (?:Status|Merged|Completed|PR|Merge SHA):/im.test(section)) {
      errors.push(`${id}: completed-task or merge metadata belongs in Git/GitHub, not the active plan.`);
    }
  }
  return errors;
}

function acceptedControlledIds() {
  const titles = execFileSync('git', ['log', '--format=%s', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return new Set([...titles.matchAll(/^\[(DEMO-\d{3,})\] /gm)].map((match) => match[1]));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!existsSync(planPath)) {
    console.log('No active implementation plan; a fresh planning pass is the next operation when the queue is exhausted.');
  } else {
    const errors = validateImplementationPlan(readFileSync(planPath, 'utf8'), acceptedControlledIds());
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
    } else console.log('Active implementation plan contains only structured future tasks.');
  }
}
