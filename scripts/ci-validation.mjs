import path from 'node:path';
import process from 'node:process';
import { runDiagnosticCommands } from './lib/ci-diagnostics.mjs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const diagnosticsDir = process.env.CI_DIAGNOSTICS_DIR || '.ci-diagnostics';
const baseSha = process.env.BASE_SHA;
if (baseSha && !/^[0-9a-f]{7,40}$/i.test(baseSha)) throw new Error('BASE_SHA must be a Git commit SHA.');

const commands = [
  { label: 'Validate pinned Node/npm toolchain', file: process.execPath, args: ['scripts/validate-toolchain.mjs'] },
  { label: 'Install locked dependencies', file: npm, args: ['ci'] },
  { label: 'Validate generated-artifact parity', file: npm, args: ['run', 'validate:generated-artifacts'], env: { CI_DIAGNOSTICS_DIR: diagnosticsDir } },
  { label: 'Full repository check', file: npm, args: ['run', 'check'] },
  { label: 'Apply D1 migrations to a clean local database', file: npm, args: ['run', 'validate:migrations'] },
  { label: 'Verify Chromium runtime', file: npm, args: ['run', 'verify:chromium'] },
  { label: 'Site-wide browser accessibility and localization audit', file: npm, args: ['run', 'test:site-accessibility'] },
  { label: 'Audit dependencies', file: npm, args: ['run', 'security:dependencies'] },
  { label: 'Validate Worker build', file: npm, args: ['run', 'build'] },
  { label: 'Validate patch whitespace', file: 'git', args: baseSha ? ['diff', '--check', `${baseSha}...HEAD`] : ['diff', '--check'] },
];

const report = await runDiagnosticCommands({
  commands,
  cwd: process.cwd(),
  diagnosticsDir: path.normalize(diagnosticsDir),
  environment: process.env,
});
process.exitCode = report.failure?.exitCode || 0;
