import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

fs.mkdirSync('artifacts/evidence', { recursive: true });
const run = (command, args) => execFileSync(command, args, { encoding: 'utf8' }).trim();
const evidence = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  commit: run('git', ['rev-parse', 'HEAD']),
  branch: run('git', ['branch', '--show-current']),
  node: process.version,
  package: JSON.parse(fs.readFileSync('package.json', 'utf8')).version,
  routeCount: JSON.parse(fs.readFileSync('docs/route-manifest.json', 'utf8')).length,
  checks: ['lint', 'typecheck', 'unit/integration tests', 'contracts', 'localization', 'migrations', 'dependency audit', 'Worker dry-run build'],
  qualification: 'Validation evidence supports this source state; it is not a certification claim.',
};
fs.writeFileSync('artifacts/evidence/validation.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Evidence generated for ${evidence.commit}.`);
