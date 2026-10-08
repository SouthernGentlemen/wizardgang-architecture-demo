export function commandSequence(script) {
  if (typeof script !== 'string') throw new TypeError('Expected a package script string.');
  return script.split('&&').map((command) => command.trim()).filter(Boolean);
}

export function npmRunSequence(script) {
  return commandSequence(script).flatMap((command) => {
    const match = /^npm run ([A-Za-z0-9:_-]+)(?:\s|$)/.exec(command);
    return match ? [match[1]] : [];
  });
}

// Expand transitive npm-run ownership without executing checkout validators.
export function expandedNpmRunSequence(scripts, name, ancestors = []) {
  if (ancestors.includes(name)) throw new Error(`Cyclic npm script ownership: ${[...ancestors, name].join(' -> ')}`);
  const script = scripts?.[name];
  if (typeof script !== 'string' || !script.trim()) throw new Error(`Missing npm script owner: ${name}`);
  const path = [...ancestors, name];
  return [name, ...npmRunSequence(script).flatMap((child) => expandedNpmRunSequence(scripts, child, path))];
}

export function npmRunName(command) {
  return command?.args?.[0] === 'run' && typeof command.args?.[1] === 'string'
    ? command.args[1]
    : null;
}

// Accepted outputs of the existing full check, for a future same-head browser-job handoff.
// These paths are metadata only; they do not upload, cache, copy, or rebuild anything.
export const acceptedBuildOutputPaths = Object.freeze({
  clientAssets: 'dist/client',
  workerBundle: 'dist/worker',
  workerEntry: 'src/worker-entry.mjs',
});

export function createCiValidationCommands({ nodeExecutable, npmExecutable, checkEnvironment }) {
  if (!nodeExecutable || !npmExecutable) throw new TypeError('CI command planning requires Node and npm executables.');
  return [
    { id: 'toolchain', label: 'Validate pinned Node/npm toolchain', file: nodeExecutable, args: ['scripts/validate-toolchain.ts'] },
    { id: 'install', label: 'Install locked dependencies', file: npmExecutable, args: ['ci'] },
    { id: 'check', label: 'Full repository check', file: npmExecutable, args: ['run', 'check'], env: checkEnvironment, acceptedBuildOutputPaths },
    { id: 'patch-whitespace', label: 'Validate committed patch whitespace', file: npmExecutable, args: ['run', 'validate:patch-whitespace'] },
  ];
}
