import { parseControlledSubject, parsePlanTasks, validateQueueDelivery, validateMaintenanceQueue } from './controlled-pr-identity.ts';
import { LIVE_RELEASE_MARKER, validateLiveReleaseIdentity } from './live-release-identity.ts';

export const ACCEPTED_HISTORY_BOUNDARY = Object.freeze({
  checkpoint: '9223eb09974d44a526171a6fe1a7389dc6f9173e',
  sequentialFloor: 498,
  consumedAboveFloor: Object.freeze([]),
});

// The accepted checkpoint is an immutable ancestor, never a movable head/branch alias.
export function validateCheckpointAncestry(runGit, head = 'HEAD', boundary = ACCEPTED_HISTORY_BOUNDARY) {
  try {
    runGit(['cat-file', '-e', boundary.checkpoint + '^{commit}']);
  } catch {
    return ['Accepted history checkpoint is missing: ' + boundary.checkpoint + '.'];
  }
  try {
    runGit(['merge-base', '--is-ancestor', boundary.checkpoint, head]);
  } catch {
    return ['Accepted history checkpoint is not an ancestor of ' + head + ': ' + boundary.checkpoint + '.'];
  }
  return [];
}

export function validateForwardRecords({
  records,
  acceptedBefore = new Set(),
  boundary = ACCEPTED_HISTORY_BOUNDARY,
  commitInputs = () => null,
}) {
  const errors = [];
  const accepted = new Set(acceptedBefore);
  const consumed = new Set(boundary.consumedAboveFloor);
  let next = boundary.sequentialFloor + 1;
  for (const id of consumed) accepted.add('DEMO-' + String(id).padStart(3, '0'));
  let validated = 0;

  for (const record of records) {
    const label = String(record.sha || '').slice(0, 12);
    const identity = parseControlledSubject(record.subject);
    if (!identity) {
      errors.push(label + ' has an invalid forward controlled title: ' + record.subject);
      continue;
    }
    if (record.parents.length !== 1) {
      errors.push(label + ' has an unsupported forward merge topology.');
      continue;
    }
    const id = identity.id;
    const number = identity.number;
    if (number <= boundary.sequentialFloor || accepted.has(id) || consumed.has(number)) {
      errors.push(label + ' reuses an accepted or reserved history identity ' + id + '.');
      continue;
    }
    const body = record.body || '';
    if (/^Post-Merge-Recovery:/m.test(body)) errors.push(id + ' must use a new controlled identity, not Post-Merge-Recovery.');
    for (const section of ['Change', 'Reason', 'Risk', 'Validation', 'Source', 'Release']) {
      if (!new RegExp('(?:^|\\n)' + section + ':', 'm').test(body)) {
        errors.push(id + ' is missing ' + section + ':');
      }
    }
    if (!/(?:^|\n)Risk:\s*(?:\n\s*)?(?:Low|Medium|High)\b/m.test(body)) {
      errors.push(id + ' has no Low, Medium, or High risk');
    }

    const maintenance = /^Portfolio-Plan-Maintenance:\s*true$/m.test(body);
    const live = body.split('\n').some((line) => line.trim() === LIVE_RELEASE_MARKER);
    if (maintenance && live) errors.push(id + ' cannot be both maintenance and live release.');
    if (live) {
      const inputs = commitInputs(record);
      if (!inputs) errors.push(id + ' is missing live release diff and package evidence.');
      else errors.push(...validateLiveReleaseIdentity({
        ...inputs, title: record.subject, body,
        basePlanMarkdown: record.basePlanMarkdown,
        headPlanMarkdown: record.headPlanMarkdown,
        baseAcceptedIds: accepted,
      }).map((error) => id + ': ' + error));
    } else if (maintenance) {
      errors.push(...validateMaintenanceQueue({
        id, basePlanMarkdown: record.basePlanMarkdown,
        headPlanMarkdown: record.headPlanMarkdown, baseAcceptedIds: accepted,
      }));
    } else {
      errors.push(...validateQueueDelivery({
        id, type: identity.type,
        basePlanMarkdown: record.basePlanMarkdown,
        headPlanMarkdown: record.headPlanMarkdown, baseAcceptedIds: accepted,
      }));
    }
    if (number !== next && !(maintenance || live)) {
      errors.push(label + ' uses ' + id + '; expected DEMO-' + String(next).padStart(3, '0') + '.');
    }
    if (number === next) {
      next++;
      while (consumed.has(next)) next++;
    } else {
      consumed.add(number);
    }
    accepted.add(id);
    validated++;
  }
  return { errors, validated, next, accepted };
}

// Read old history only as raw accepted identities, never as old structured bodies.
export function rawAcceptedIds(subjects) {
  const ids = new Set();
  for (const subject of subjects) {
    const match = /^\[DEMO-(\d{3,})\]/.exec(subject);
    if (match) ids.add('DEMO-' + match[1]);
  }
  return ids;
}
