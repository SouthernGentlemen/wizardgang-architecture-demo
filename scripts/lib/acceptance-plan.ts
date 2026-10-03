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

export function npmRunName(command) {
  return command?.args?.[0] === 'run' && typeof command.args?.[1] === 'string'
    ? command.args[1]
    : null;
}

export function createCiValidationCommands({ nodeExecutable, npmExecutable, checkEnvironment }) {
  if (!nodeExecutable || !npmExecutable) throw new TypeError('CI command planning requires Node and npm executables.');
  return [
    { id: 'toolchain', label: 'Validate pinned Node/npm toolchain', file: nodeExecutable, args: ['scripts/validate-toolchain.mjs'] },
    { id: 'install', label: 'Install locked dependencies', file: npmExecutable, args: ['ci'] },
    { id: 'check', label: 'Full repository check', file: npmExecutable, args: ['run', 'check'], env: checkEnvironment },
    { id: 'dependency-advisories', label: 'Query dependency advisories (network required)', file: npmExecutable, args: ['run', 'security:dependency-advisories'] },
    { id: 'patch-whitespace', label: 'Validate committed patch whitespace', file: npmExecutable, args: ['run', 'validate:patch-whitespace'] },
  ];
}
