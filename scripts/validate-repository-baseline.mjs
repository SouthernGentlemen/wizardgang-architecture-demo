/** WG-ARCH-001 §27: copy this file to scripts/ in another product repository.
 * No project-specific paths, IDs, or imports are needed. Run from package.json's
 * check script; the repository root is resolved from this file, not the shell cwd.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function validateRepositoryBaseline(root = DEFAULT_ROOT) {
  const failures = [];
  const read = (name) => {
    const file = path.join(root, name);
    if (!existsSync(file)) { failures.push(`missing ${name}`); return ''; }
    return readFileSync(file, 'utf8');
  };
  const required = ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'SECURITY.md', 'LICENSE', '.gitignore', '.node-version', '.npmrc', 'package.json', 'package-lock.json', 'tsconfig.json', 'wrangler.jsonc', '.github/workflows/ci.yml', '.github/workflows/release.yml'];
  for (const file of required) read(file);
  for (const retired of ['CHANGELOG.md']) if (existsSync(path.join(root, retired))) failures.push(`retire ${retired}; tags and GitHub Releases hold release history`);
  let pkg = {};
  let lock = {};
  let tsconfig = {};
  try { pkg = JSON.parse(read('package.json')); } catch { failures.push('package.json must be JSON'); }
  try { lock = JSON.parse(read('package-lock.json')); } catch { failures.push('package-lock.json must be JSON'); }
  try { tsconfig = JSON.parse(read('tsconfig.json')); } catch { failures.push('tsconfig.json must be JSON'); }
  const node = read('.node-version').trim();
  if (!/^26\.\d+\.\d+$/.test(node) || pkg.engines?.node !== '26.x') failures.push('pin exact Node 26 in .node-version and engines.node 26.x');
  if (!/^npm@11\.\d+\.\d+$/.test(pkg.packageManager ?? '') || pkg.engines?.npm !== '11.x') failures.push('pin exact npm 11 in packageManager and engines.npm 11.x');
  const npmrc = read('.npmrc');
  if (!/^engine-strict=true\s*$/m.test(npmrc)) failures.push('.npmrc must set engine-strict=true');
  if (!pkg.allowScripts || Array.isArray(pkg.allowScripts) || typeof pkg.allowScripts !== 'object') failures.push('package.json must declare approved dependency install scripts in allowScripts');
  if (pkg.type !== 'module') failures.push('package.json must use type: module');
  if (lock.lockfileVersion < 3 || lock.packages?.['']?.version !== pkg.version) failures.push('package-lock.json must be a current npm lockfile for the package');
  const major = (name) => Number(String(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? '').match(/\d+/)?.[0]);
  for (const [name, version] of [['typescript', 7], ['wrangler', 4], ['vite', 8], ['vitest', 5], ['react', 19], ['react-dom', 19]]) {
    if (major(name) !== version) failures.push(`pin ${name} major ${version}`);
  }
  if (tsconfig.compilerOptions?.strict !== true) failures.push('TypeScript strict mode required');
  const scripts = pkg.scripts ?? {};
  for (const name of ['dev', 'build', 'typecheck', 'test', 'check']) if (!scripts[name]) failures.push(`missing npm run ${name}`);
  if (!/\btsc\b/.test(scripts.typecheck ?? '')) failures.push('typecheck must invoke tsc');
  if (!/\bvitest\b/.test(scripts.test ?? '')) failures.push('test must invoke Vitest');
  if (!/\bvalidate:repository-baseline\b/.test(scripts.check ?? '')) failures.push('check must invoke validate:repository-baseline');
  if (!/\bvalidate:history\b/.test(scripts.check ?? '')) failures.push('check must validate sequential controlled history');
  if (/\b(?:deploy|publish)\b|--env\s+production/.test(`${scripts.dev ?? ''} ${scripts.build ?? ''}`)) failures.push('dev and build cannot deploy');
  const wrangler = read('wrangler.jsonc');
  if (!/"main"\s*:\s*"src\//.test(wrangler) || !/"assets"\s*:\s*\{/.test(wrangler)) failures.push('Wrangler must configure a Worker with Static Assets');
  const vite = read('vite.config.ts');
  if (!vite.includes('assets/[name]-[hash]')) failures.push('Vite must emit content-hashed browser assets');
  const ci = read('.github/workflows/ci.yml');
  if (!/pull_request:/.test(ci) || !/branches:\s*\[main\]/.test(ci)) failures.push('CI must run on pull requests and main');
  if (!/node-version-file:\s*\.node-version/.test(ci)) failures.push('CI must use the pinned Node version');
  // A wrapper is fine if its local module graph proves that it runs npm ci and npm run check.
  const readLocalModuleGraph = (entry, seen = new Set()) => {
    if (seen.has(entry)) return '';
    seen.add(entry);
    const source = read(entry);
    const directory = path.posix.dirname(entry);
    const imports = [...source.matchAll(/\bfrom\s+['"]((?:\.\.?\/)[^'"]+)['"]/g)]
      .map(([, specifier]) => path.posix.normalize(path.posix.join(directory, specifier)));
    return [source, ...imports.map((specifier) => readLocalModuleGraph(specifier, seen))].join('\n');
  };
  const ciCommand = /npm run validate:ci/.test(ci) ? readLocalModuleGraph('scripts/ci-validation.mjs') : ci;
  if (!/npm\s+ci|args:\s*\['ci'\]/.test(ciCommand) || !/npm run check|\['run', 'check'\]/.test(ciCommand)) failures.push('CI must install with npm ci and run check');
  const release = read('.github/workflows/release.yml');
  if (!/tags:\s*\['v\*'\]/.test(release) || !/npm ci/.test(release) || !/npm run check/.test(release)) failures.push('release workflow must reproduce tagged releases with npm ci and check');
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = validateRepositoryBaseline();
  if (failures.length) {
    for (const failure of failures) console.error(failure);
    process.exitCode = 1;
  } else console.log('WG-ARCH-001 repository baseline OK.');
}
