import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const javascriptExtension = /\.(?:js|mjs|cjs)$/i;
const authoredSourcePrefixes = ['src/', 'scripts/', 'tests/', '.github/workflows/'];

export const explicitNonExecutableJavaScriptFixtures = new Set<string>();

export function loadPinnedPlatformJavaScript(rootDirectory: string = root): Set<string> {
  const lock = JSON.parse(readFileSync(path.join(rootDirectory, 'platform/vendor.lock.json'), 'utf8'));
  return new Set(
    Object.keys(lock.files ?? {})
      .filter((name) => javascriptExtension.test(name))
      .map((name) => 'platform/' + name),
  );
}

function isAuthoredSourcePath(file: string): boolean {
  return authoredSourcePrefixes.some((prefix) => file.startsWith(prefix));
}

export function findAuthoredExecutableJavaScript(
  files: string[],
  pinnedPlatformJavaScript: Set<string>,
  nonExecutableFixtures: Set<string> = explicitNonExecutableJavaScriptFixtures,
): string[] {
  return files
    .filter((file) => javascriptExtension.test(file))
    .filter((file) => {
      if (pinnedPlatformJavaScript.has(file)) return false;
      if (file.startsWith('tests/fixtures/') && nonExecutableFixtures.has(file)) return false;
      return file.startsWith('platform/') || isAuthoredSourcePath(file);
    })
    .sort();
}

export function trackedRepositoryFiles(rootDirectory: string = root): string[] {
  return execFileSync('git', ['ls-files', '-z'], { cwd: rootDirectory, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tracked = trackedRepositoryFiles();
  const violations = findAuthoredExecutableJavaScript(tracked, loadPinnedPlatformJavaScript());

  if (violations.length) {
    console.error('TypeScript authored-source boundary failed: tracked executable JavaScript is not allowed.');
    for (const file of violations) console.error('- ' + file);
    console.error('Port authored executable source to TypeScript or document an exact non-executable fixture exemption.');
    process.exitCode = 1;
  } else {
    console.log('TypeScript authored-source boundary OK across tracked application, script, test, workflow, and pinned platform paths.');
  }
}
