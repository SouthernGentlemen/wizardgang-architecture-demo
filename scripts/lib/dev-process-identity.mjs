function hasProcessIdentity(value) {
  return Number.isSafeInteger(value?.pid)
    && value.pid > 0
    && typeof value.startToken === 'string'
    && value.startToken.length > 0;
}

function sameProcessIdentity(expected, observed) {
  return hasProcessIdentity(expected)
    && hasProcessIdentity(observed)
    && expected.pid === observed.pid
    && expected.startToken === observed.startToken;
}

function hasObservedParent(value) {
  return sameProcessIdentity(value, value)
    && Number.isSafeInteger(value.parentPid)
    && value.parentPid >= 0;
}

/**
 * Proves that an observed target still belongs to this checkout's development
 * process tree. Callers supply already-canonicalized checkout paths and
 * side-effect-free process evidence. The lineage is ordered target -> parent ->
 * ... -> development coordinator.
 */
export function isCheckoutOwnedDevelopmentProcess({
  checkoutRoot,
  owner,
  expectedTarget,
  lineage,
}) {
  if (typeof checkoutRoot !== 'string' || checkoutRoot.length === 0) return false;
  if (!hasProcessIdentity(owner) || owner.cwd !== checkoutRoot) return false;
  if (!hasProcessIdentity(expectedTarget)) return false;
  if (!Array.isArray(lineage) || lineage.length < 2) return false;
  if (!sameProcessIdentity(expectedTarget, lineage[0])) return false;
  if (lineage[0].pid === owner.pid) return false;
  if (!sameProcessIdentity(owner, lineage.at(-1))) return false;

  const seenPids = new Set();
  for (let index = 0; index < lineage.length; index += 1) {
    const current = lineage[index];
    if (!hasObservedParent(current) || seenPids.has(current.pid)) return false;
    seenPids.add(current.pid);

    const parent = lineage[index + 1];
    if (parent && current.parentPid !== parent.pid) return false;
  }

  return true;
}
