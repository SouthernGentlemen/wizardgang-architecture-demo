import { parsePlanTasks, validateQueueDelivery } from './controlled-pr-identity.ts';

export interface Reservations {
  subjects: string[];
  planMarkdown: string;
  openPullRequests: Array<{ title: string; headRefName: string }>;
  branches?: string[];
}
const numberOf = (value: string): number | null => {
  const match = /^(?:\[DEMO-|demo-)(\d{3,})(?:\]|-)/.exec(value);
  return match ? Number(match[1]) : null;
};
const idFor = (value: number): string => `DEMO-${String(value).padStart(3, '0')}`;
export function reservedControlledNumbers(input: Reservations): Set<number> {
  return new Set([
    ...input.subjects.map(numberOf),
    ...parsePlanTasks(input.planMarkdown).map((task) => task.number),
    ...input.openPullRequests.flatMap((pr) => [numberOf(pr.title), numberOf(pr.headRefName)]),
    ...(input.branches ?? []).map(numberOf),
  ].filter((value): value is number => value !== null));
}
export function allocateControlledIdentity(input: Reservations): string {
  const accepted = input.subjects.map(numberOf).filter((value): value is number => value !== null);
  const reserved = reservedControlledNumbers(input);
  let candidate = Math.max(0, ...accepted) + 1;
  while (reserved.has(candidate)) candidate++;
  return idFor(candidate);
}

// Pure planning only: the reservation is published by an ordinary protected plan-only PR.
export function allocatePlanIdentities(input: Reservations, tasks: Array<{ type: string; title: string }>) {
  const maintenanceId = allocateControlledIdentity(input);
  const reserved = reservedControlledNumbers(input);
  reserved.add(Number(maintenanceId.slice(5)));
  let candidate = Math.max(Number(maintenanceId.slice(5)), ...parsePlanTasks(input.planMarkdown).map((task) => task.number));
  return { maintenanceId, tasks: tasks.map((task) => {
    do { candidate++; } while (reserved.has(candidate));
    reserved.add(candidate);
    return { ...task, id: idFor(candidate) };
  }) };
}

export function selectQueuedIdentity(input: Reservations): string {
  const first = parsePlanTasks(input.planMarkdown)[0];
  if (!first) throw new Error('The queue is empty; reserve a plan-only change before implementation.');
  const accepted = new Set(input.subjects.map(numberOf).filter((value) => value !== null).map(idFor));
  const headings = [...input.planMarkdown.matchAll(/^### DEMO-/gm)];
  const rest = input.planMarkdown.slice(0, headings[0].index) + input.planMarkdown.slice(headings[1]?.index ?? input.planMarkdown.length);
  const errors = validateQueueDelivery({ id: first.id, type: first.type, basePlanMarkdown: input.planMarkdown, headPlanMarkdown: rest, baseAcceptedIds: accepted });
  const publication = [...input.openPullRequests.flatMap((pr) => [numberOf(pr.title), numberOf(pr.headRefName)]), ...(input.branches ?? []).map(numberOf)];
  if (publication.includes(first.number)) errors.push(`${first.id} already has published work; reconcile it without renumbering.`);
  if (errors.length) throw new Error(errors.join('\n'));
  return first.id;
}

export function reconcileUnpublishedIdentity(previous: string, current: Reservations, published: boolean): string {
  if (!reservedControlledNumbers(current).has(Number(previous.slice(5)))) return previous;
  if (published) throw new Error(`${previous} is already published or collided; never silently renumber published work.`);
  return allocateControlledIdentity(current);
}
