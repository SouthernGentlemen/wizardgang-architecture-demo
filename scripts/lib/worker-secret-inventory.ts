// Keep Worker secret comparisons pure so mismatch/rejection fixtures do not launch checkout validation.
export function uniqueWorkerSecretNames(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export function workerSecretNameDifferences(actual: readonly string[], expected: readonly string[]) {
  const names = uniqueWorkerSecretNames(actual);
  const required = uniqueWorkerSecretNames(expected);
  return {
    missing: required.filter((name) => !names.includes(name)),
    extra: names.filter((name) => !required.includes(name)),
  };
}

export function forbiddenWorkerSecretVars(
  committedVars: readonly string[],
  inventoryNames: readonly string[],
  registryNames: readonly string[],
  secretsStoreNames: readonly string[],
): string[] {
  const protectedNames = new Set([...inventoryNames, ...registryNames, ...secretsStoreNames]);
  return committedVars.filter((name) => protectedNames.has(name));
}
