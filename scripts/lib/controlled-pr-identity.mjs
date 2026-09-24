const TYPES = 'INIT|FEAT|FIX|SEC|API|A11Y|I18N|AI|DB|OPS|TEST|DOCS|REFACTOR|PERF|BUILD|REVERT|CHORE';
const controlledSubjectPattern = new RegExp(`^\\[DEMO-(\\d{3,})\\] \\[(${TYPES})\\] (.+)$`);
const branchPattern = /^demo-(\d{3,})-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const taskPattern = new RegExp(`^### (DEMO-(\\d{3,})) — \\[(${TYPES})\\] ([^\\n]+)$`, 'gm');

export function parseControlledSubject(value) {
  const match = controlledSubjectPattern.exec(value || '');
  if (!match) return null;
  return {
    id: `DEMO-${match[1]}`,
    number: Number(match[1]),
    type: match[2],
    summary: match[3],
  };
}

export function acceptedControlledIds(subjects = []) {
  return new Set(subjects.map(parseControlledSubject).filter(Boolean).map((entry) => entry.id));
}

export function parsePlanTasks(markdown = '') {
  const matches = [...markdown.matchAll(taskPattern)];
  const tasks = matches.map((match, index) => {
    const section = markdown.slice(match.index + match[0].length, matches[index + 1]?.index ?? markdown.length);
    const dependency = /^- Dependency:\s*(.+)$/m.exec(section)?.[1]?.trim() || '';
    return {
      id: match[1],
      number: Number(match[2]),
      type: match[3],
      title: match[4],
      dependency,
      dependencies: [...new Set([...dependency.matchAll(/DEMO-\d{3,}/g)].map((item) => item[0]))],
    };
  });
  return tasks;
}

function validatePlanOrder(tasks, errors, label) {
  let previous = 0;
  const seen = new Set();
  for (const task of tasks) {
    if (seen.has(task.id) || task.number <= previous) {
      errors.push(`${label} task IDs must be unique and strictly ascending; found ${task.id} out of sequence.`);
      return;
    }
    seen.add(task.id);
    previous = task.number;
  }
}

function futureIdsPreserved(baseTasks, headTasks, errors) {
  const expected = baseTasks.slice(1).map((task) => task.id);
  const actual = headTasks.map((task) => task.id);
  let cursor = 0;
  for (const id of actual) {
    if (id === expected[cursor]) cursor += 1;
  }
  if (cursor !== expected.length) {
    const missing = expected.filter((id) => !actual.includes(id));
    errors.push(`Future queued tasks must remain after delivery; missing ${missing.join(', ') || 'required task order'}.`);
  }
}

export function validateControlledPullRequestIdentity({
  branchName,
  title,
  headSubject,
  headBody = '',
  rangeSubjects = [],
  basePlanMarkdown = null,
  headPlanMarkdown = null,
  baseAcceptedIds = new Set(),
}) {
  const errors = [];
  const titleIdentity = parseControlledSubject(title);
  const headIdentity = parseControlledSubject(headSubject);
  const branchMatch = branchPattern.exec(branchName || '');
  const maintenance = /^Portfolio-Plan-Maintenance:\s*true$/m.test(headBody);

  if (!titleIdentity) errors.push('PR title must match [DEMO-###] [TYPE] <imperative summary>.');
  if (!headIdentity) errors.push('Exact head commit subject must match [DEMO-###] [TYPE] <imperative summary>.');
  if (!branchMatch) errors.push('Branch must match demo-NNN-lowercase-hyphenated-summary.');

  if (titleIdentity && branchMatch && titleIdentity.id !== `DEMO-${branchMatch[1]}`) {
    errors.push(`Branch identifies DEMO-${branchMatch[1]} but PR title identifies ${titleIdentity.id}.`);
  }
  if (titleIdentity && headIdentity && (titleIdentity.id !== headIdentity.id || titleIdentity.type !== headIdentity.type)) {
    errors.push(`PR title identity ${titleIdentity.id} [${titleIdentity.type}] does not match exact head ${headIdentity.id} [${headIdentity.type}].`);
  }
  if (titleIdentity && headIdentity && title !== headSubject) {
    errors.push('PR title must exactly equal the controlled head commit subject.');
  }

  if (rangeSubjects.length !== 1) {
    errors.push(`PR range must contain exactly one commit; found ${rangeSubjects.length}.`);
  }
  const controlledRange = rangeSubjects.map(parseControlledSubject).filter(Boolean);
  if (controlledRange.length !== 1) {
    errors.push(`PR range must contain exactly one controlled DEMO commit; found ${controlledRange.length}.`);
  }
  if (headIdentity && controlledRange.length === 1 && controlledRange[0].id !== headIdentity.id) {
    errors.push(`PR range controlled commit ${controlledRange[0].id} does not match exact head ${headIdentity.id}.`);
  }

  if (!maintenance) {
    if (basePlanMarkdown === null) {
      errors.push('A non-maintenance controlled PR requires an active implementation plan on its base.');
      return errors;
    }

    const baseTasks = parsePlanTasks(basePlanMarkdown);
    if (!baseTasks.length) {
      errors.push('Base implementation plan has no open task to select.');
      return errors;
    }
    validatePlanOrder(baseTasks, errors, 'Base plan');

    const first = baseTasks[0];
    if (baseAcceptedIds.has(first.id)) {
      errors.push(`First open task ${first.id} is already accepted on the PR base and must be retired before selecting work.`);
    }
    const missingDependencies = first.dependencies.filter((id) => !baseAcceptedIds.has(id));
    if (missingDependencies.length) {
      errors.push(`First open task ${first.id} is blocked by unmet controlled dependency: ${missingDependencies.join(', ')}.`);
    } else if (first.dependency && !/^none\b/i.test(first.dependency) && first.dependencies.length === 0) {
      errors.push(`First open task ${first.id} is blocked by unresolved dependency: ${first.dependency}`);
    }

    if (titleIdentity && titleIdentity.id !== first.id) {
      errors.push(`Selected ${titleIdentity.id} skips first open task ${first.id}.`);
    }
    if (titleIdentity && titleIdentity.id === first.id && titleIdentity.type !== first.type) {
      errors.push(`Selected ${titleIdentity.id} must use plan type [${first.type}], not [${titleIdentity.type}].`);
    }

    if (headPlanMarkdown === null) {
      if (baseTasks.length > 1) {
        errors.push(`Active plan cannot be deleted while future tasks remain after ${first.id}.`);
      }
    } else {
      const headTasks = parsePlanTasks(headPlanMarkdown);
      validatePlanOrder(headTasks, errors, 'Head plan');
      if (headTasks.some((task) => task.id === first.id)) {
        errors.push(`${first.id} must be retired from IMPLEMENTATION_PLAN.md in the same delivery.`);
      }
      futureIdsPreserved(baseTasks, headTasks, errors);
    }
  }

  return errors;
}
